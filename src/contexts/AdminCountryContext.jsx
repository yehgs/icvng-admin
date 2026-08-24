/**
 * admin/src/contexts/AdminCountryContext.jsx
 *
 * Multi-country hub for the admin panel.
 *
 * The only thing that drives country scoping is:
 *   user.scope === "GLOBAL"  → isGlobalAdmin = true, countryScope = null
 *   user.scope === "COUNTRY" → isGlobalAdmin = false, countryScope = user.assignedCountry
 *
 * ...with one correction layered on top: HQ_ONLY_SUBROLES (IT, DIRECTOR,
 * ACCOUNTANT, WAREHOUSE, EDITOR) are ALWAYS global, regardless of what
 * `user.scope` says. The backend already treats them this way everywhere
 * that matters (countryScope middleware, /me/capabilities), self-healing on
 * every request even if the stored record is stale — but `user` here comes
 * from the cached object saved to localStorage at login. If a session was
 * established before that self-heal was deployed (or before this account
 * was corrected), the cached copy can still say `scope: "COUNTRY"` (or be
 * missing scope entirely) until the next login, which made Site Pages,
 * Country Management, and anything else gated on `isGlobalAdmin` show as
 * read-only for an IT/DIRECTOR account that should have full access.
 * Mirroring the same HQ-only list here closes that gap immediately,
 * without needing a re-login.
 *
 * Permissions (which pages/routes the user can visit) are still determined
 * entirely by user.subRole — same as before, unchanged.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  translate,
  detectLanguage,
  saveLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  RTL_LANGUAGES,
  loadUiTranslationOverrides,
  subscribeI18nRevision,
} from "../i18n/index.js";
import { getCurrentUser } from "../utils/api.js";

// Mirrors HQ_ONLY_SUBROLES in server/config/roles.js — keep in sync. These
// subRoles are never country-scoped; an account with one of these always
// behaves as a GLOBAL admin no matter what's cached for user.scope.
const HQ_ONLY_SUBROLES = ["IT", "DIRECTOR", "ACCOUNTANT", "WAREHOUSE", "EDITOR"];

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

const DEFAULT_COUNTRY = {
  code: "NG",
  name: "Nigeria",
  domain: "i-coffee.ng",
  flagEmoji: "🇳🇬",
  currency: { code: "NGN", symbol: "₦", decimals: 2 },
  language: { default: "en", supported: ["en"], locale: "en-NG" },
};

const AdminCountryContext = createContext(null);

/**
 * Item #3 — resolve a country purely from window.location.hostname against
 * each country's `adminDomain` (e.g. "app.i-coffee.tg", "app.i-coffee.it").
 * This is what makes the login page itself (before any user/token exists,
 * so nothing else here has country info yet) show the right default
 * language for the domain it's being viewed on.
 */
function detectCountryFromHostname(countries) {
  if (typeof window === "undefined" || !Array.isArray(countries)) return null;
  const host = window.location.hostname.replace(/^www\./i, "").toLowerCase();
  return (
    countries.find((c) => (c.adminDomain || "").toLowerCase() === host) ||
    // Fall back to the storefront domain(s) in case adminDomain isn't set
    // for a given country yet — better than silently defaulting to NG.
    countries.find(
      (c) =>
        (c.domain || "").toLowerCase() === host ||
        (Array.isArray(c.domains) && c.domains.some((d) => (d || "").toLowerCase() === host))
    ) ||
    null
  );
}

export function useAdminCountry() {
  const ctx = useContext(AdminCountryContext);
  if (!ctx)
    throw new Error("useAdminCountry must be used within AdminCountryProvider");
  return ctx;
}

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken");
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Same as api.js: the server can only see its own API hostname,
        // never the admin panel's — send the real one explicitly.
        ...(typeof window !== "undefined" && window.location?.hostname
          ? { "x-storefront-host": window.location.hostname }
          : {}),
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function AdminCountryProvider({ children }) {
  const [allCountries, setAllCountries] = useState([]);
  const [activeCountry, setActiveCountry] = useState(DEFAULT_COUNTRY);
  const [language, setLanguageState] = useState("en");
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();

  // ── Derived state from user.scope ─────────────────────────────────────────
  // isGlobalAdmin: user sees all countries (scope === "GLOBAL", or an
  // HQ-only subRole overriding a stale cached scope — see file header).
  // countryScope:  null for global, country code for country-scoped
  const isGlobalAdmin = !!(
    user &&
    (user.scope === "GLOBAL" || HQ_ONLY_SUBROLES.includes(user.subRole))
  );
  const countryScope = useMemo(() => {
    if (!user) return null;
    if (HQ_ONLY_SUBROLES.includes(user.subRole)) return null; // always global
    if (user.scope === "COUNTRY" && user.assignedCountry)
      return user.assignedCountry;
    return null;
  }, [user?.scope, user?.assignedCountry, user?.subRole]);

  // ── Bootstrap: fetch country list, set active country ────────────────────
  useEffect(() => {
    async function boot() {
      try {
        const data = await apiFetch("/country/all");
        if (data?.success && Array.isArray(data.data)) {
          setAllCountries(data.data);
          if (countryScope) {
            const match = data.data.find((c) => c.code === countryScope);
            if (match) setActiveCountry(match);
          } else {
            // Item #3: no COUNTRY-scoped user to key off (either nobody's
            // logged in yet — the login page itself — or this is a GLOBAL
            // admin who hasn't explicitly switched). Fall back to whichever
            // country's adminDomain matches the hostname we're actually
            // being viewed on, instead of silently defaulting to Nigeria.
            const domainMatch = detectCountryFromHostname(data.data);
            if (domainMatch) setActiveCountry(domainMatch);
          }
        }
      } catch (e) {
        console.warn("[AdminCountryProvider] boot error:", e.message);
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, [countryScope]);

  // ── Language ──────────────────────────────────────────────────────────────
  // Priority: explicit user.preferredLanguage > country's default language
  // (once loaded) > previously saved choice > browser language.
  // Previously this ran detectLanguage() with no argument, which never
  // considered the admin's assigned country at all — a Togo manager would
  // always land on English instead of French.
  useEffect(() => {
    if (loading) return; // wait for activeCountry to resolve from /country/all
    const lang = user?.preferredLanguage
      ? user.preferredLanguage
      : detectLanguage(activeCountry?.language?.default || "en");
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  }, [user?.preferredLanguage, activeCountry, loading]);

  const setLanguage = useCallback((lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    setLanguageState(lang);
    saveLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
  }, []);

  // DB-backed UI-copy overrides (see i18n/index.js's applyDbOverrides /
  // EFFECTIVE) — fetched per language, since each is a separate GET. Fires
  // on mount and on every language switch. `i18nRevision` is bumped by
  // applyDbOverrides() (via subscribeI18nRevision) once the fetch resolves
  // and merges in, which is what makes `t` below re-render already-visible
  // strings with the override applied instead of only affecting strings
  // rendered after the fetch completes.
  const [i18nRevision, setI18nRevision] = useState(0);
  useEffect(() => {
    if (!language) return;
    loadUiTranslationOverrides(language);
  }, [language]);
  useEffect(() => subscribeI18nRevision(setI18nRevision), []);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, i18nRevision],
  );

  // ── Currency formatter ────────────────────────────────────────────────────
  const formatPrice = useCallback(
    (amount, overrideCountry) => {
      const c = overrideCountry || activeCountry;
      if (!c?.currency) return String(amount ?? 0);
      try {
        return new Intl.NumberFormat(c.language?.locale || "en", {
          style: "currency",
          currency: c.currency.code,
          minimumFractionDigits: c.currency.decimals ?? 2,
          maximumFractionDigits: c.currency.decimals ?? 2,
        }).format(amount ?? 0);
      } catch {
        return `${c.currency.symbol}${(amount ?? 0).toFixed(c.currency.decimals ?? 2)}`;
      }
    },
    [activeCountry],
  );

  /**
   * buildScopeQuery(existing)
   *
   * Appends ?country=XX to a URL string when the user is country-scoped.
   * GLOBAL admins: returns the string unchanged.
   *
   * Usage:
   *   const url = buildScopeQuery("/api/admin/orders/list?page=1");
   *   // → "/api/admin/orders/list?page=1&country=TG"  (if scoped)
   *   // → "/api/admin/orders/list?page=1"              (if global)
   */
  const buildScopeQuery = useCallback(
    (existing = "") => {
      if (!countryScope) return existing;
      const sep = existing.includes("?") ? "&" : "?";
      return `${existing}${sep}country=${countryScope}`;
    },
    [countryScope],
  );

  const value = useMemo(
    () => ({
      // Country
      allCountries,
      activeCountry,
      countryScope, // null | "NG" | "TG" | "BJ" | "IT"
      isGlobalAdmin, // true when scope = "GLOBAL"

      // i18n
      language,
      setLanguage,
      t,
      SUPPORTED_LANGUAGES,
      LANGUAGE_NAMES,
      supportedLanguages: SUPPORTED_LANGUAGES,
      languageNames: LANGUAGE_NAMES,

      // Currency
      formatPrice,
      buildScopeQuery,

      loading,
    }),
    [
      allCountries,
      activeCountry,
      countryScope,
      isGlobalAdmin,
      language,
      setLanguage,
      t,
      formatPrice,
      buildScopeQuery,
      loading,
    ],
  );

  return (
    <AdminCountryContext.Provider value={value}>
      {children}
    </AdminCountryContext.Provider>
  );
}

export default AdminCountryContext;
