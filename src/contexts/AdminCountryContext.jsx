/**
 * admin/src/contexts/AdminCountryContext.jsx
 *
 * Multi-country hub for the admin panel.
 *
 * The only thing that drives country scoping is:
 *   user.scope === "GLOBAL"  → isGlobalAdmin = true, countryScope = null
 *   user.scope === "COUNTRY" → isGlobalAdmin = false, countryScope = user.assignedCountry
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
} from "../i18n/index.js";
import { getCurrentUser } from "../utils/api.js";

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
      headers: { Authorization: `Bearer ${token}` },
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
  // isGlobalAdmin: user sees all countries (scope === "GLOBAL")
  // countryScope:  null for global, country code for country-scoped
  const isGlobalAdmin = !!(user && user.scope === "GLOBAL");
  const countryScope = useMemo(() => {
    if (!user) return null;
    if (user.scope === "COUNTRY" && user.assignedCountry)
      return user.assignedCountry;
    return null;
  }, [user?.scope, user?.assignedCountry]);

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
  }, [user?.preferredLanguage, activeCountry, loading]);

  const setLanguage = useCallback((lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    setLanguageState(lang);
    saveLanguage(lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
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
