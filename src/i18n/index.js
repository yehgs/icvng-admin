/**
 * admin/src/i18n/index.js
 *
 * Lightweight zero-dependency i18n for the admin panel.
 * Same engine as the client — deep-merge, interpolation, pluralization,
 * localStorage persistence.
 */

import en from "./locales/en.js";
import fr from "./locales/fr.js";
import it from "./locales/it.js";
import es from "./locales/es.js";
import pt from "./locales/pt.js";
import nl from "./locales/nl.js";
import ar from "./locales/ar.js";
import hi from "./locales/hi.js";
import zh from "./locales/zh.js";

const LOCALES = { en, fr, it, es, pt, nl, ar, hi, zh };
const LS_KEY = "icvng_admin_language";

export const SUPPORTED_LANGUAGES = ["en", "fr", "it", "es", "pt", "nl", "ar", "hi", "zh"];
export const LANGUAGE_NAMES = {
  en: "English",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  pt: "Português",
  nl: "Nederlands",
  ar: "العربية",
  hi: "हिन्दी",
  zh: "中文",
};
export const RTL_LANGUAGES = ["ar"];

// Deep merge: override on top of base
function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === "object" && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

const MERGED = Object.fromEntries(
  Object.entries(LOCALES).map(([code, locale]) => [
    code,
    code === "en" ? locale : deepMerge(en, locale),
  ])
);

// ── DB overrides overlay ────────────────────────────────────────────────
//
// EFFECTIVE starts as a clone of the bundled static MERGED locales (always
// available synchronously — no flash of untranslated content, works
// offline/if the API is unreachable) and gets overlaid with whatever
// GET /api/ui-translations/merged?app=admin&language=<lang> returns, via
// applyDbOverrides() below. That endpoint is populated by
// scripts/seedUiTranslations.js and edited live from
// admin/src/pages/settings/UiTranslationsManagement.jsx — see PRD §8a.
// Static files remain the source of truth for what keys EXIST (structure);
// the DB is the source of truth for what a given key currently SAYS, once
// it's been fetched.
const EFFECTIVE = Object.fromEntries(
  Object.entries(MERGED).map(([code, locale]) => [code, locale]),
);

let revision = 0;
const revisionListeners = new Set();

function notifyRevision() {
  revision += 1;
  revisionListeners.forEach((cb) => {
    try {
      cb(revision);
    } catch {
      /* a listener throwing shouldn't break the others */
    }
  });
}

/** Subscribe to "the effective locale for some language changed" (i.e. DB
 * overrides finished loading/were re-applied). Returns an unsubscribe fn.
 * Consumed by AdminCountryContext.jsx to force a re-render of `t()` output
 * once overrides for the active language arrive. */
export function subscribeI18nRevision(cb) {
  revisionListeners.add(cb);
  return () => revisionListeners.delete(cb);
}

function setPath(target, keyPath, value) {
  const parts = keyPath.split(".");
  let node = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node[parts[i]] || typeof node[parts[i]] !== "object") node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
}

/** Apply a flat { "common.save": "Enregistrer", ... } map (as returned by
 * GET /api/ui-translations/merged) on top of the bundled locale for `lang`.
 * Always rebuilt fresh from the static MERGED[lang] base rather than
 * patched incrementally, so a key removed from the DB (reverted) falls
 * back to the bundled value rather than staying stuck on a stale override. */
export function applyDbOverrides(lang, flatOverrides) {
  if (!MERGED[lang] && lang !== "en") return; // unknown language code, nothing to overlay onto
  const base = MERGED[lang] || MERGED.en;
  const clone = JSON.parse(JSON.stringify(base));
  for (const [key, value] of Object.entries(flatOverrides || {})) {
    if (value) setPath(clone, key, value);
  }
  EFFECTIVE[lang] = clone;
  notifyRevision();
}

/** Fetches DB overrides for one language and applies them. Safe to call
 * repeatedly (e.g. on every language switch) — failures are swallowed so a
 * network hiccup just means "keep showing the bundled static strings"
 * rather than breaking the UI. */
export async function loadUiTranslationOverrides(lang, apiBase) {
  try {
    const base = apiBase || import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
    const res = await fetch(`${base}/ui-translations/merged?app=admin&language=${encodeURIComponent(lang)}`);
    const json = await res.json();
    if (json?.success) applyDbOverrides(lang, json.data || {});
  } catch (e) {
    console.warn(`[admin i18n] Failed to load DB overrides for '${lang}' — using bundled strings.`, e);
  }
}

function interpolate(str, params = {}) {
  if (!params || Object.keys(params).length === 0) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{{${k}}}`
  );
}

function resolve(locale, keyPath, params) {
  const parts = keyPath.split(".");
  let node = locale;

  // Pluralization
  const last = parts[parts.length - 1];
  if (params?.count !== undefined && params.count !== 1) {
    const pluralKey = [...parts.slice(0, -1), last + "_plural"].join(".");
    const r = resolve(locale, pluralKey, null);
    if (r !== null) return interpolate(r, params);
  }

  for (const part of parts) {
    if (node && typeof node === "object" && part in node) node = node[part];
    else return null;
  }
  return typeof node === "string" ? interpolate(node, params) : null;
}

export function translate(lang, key, params) {
  const locale = EFFECTIVE[lang] || EFFECTIVE.en;
  const result = resolve(locale, key, params);
  if (result !== null) return result;
  if (lang !== "en") {
    const en = resolve(EFFECTIVE.en, key, params);
    if (en !== null) return en;
  }
  console.warn(`[admin i18n] Missing: ${key} (${lang})`);
  return key;
}

export function detectLanguage(defaultLang = "en") {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  if (SUPPORTED_LANGUAGES.includes(defaultLang)) return defaultLang;
  const browser = (navigator.language || "en").split("-")[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browser) ? browser : "en";
}

export function saveLanguage(lang) {
  if (SUPPORTED_LANGUAGES.includes(lang)) localStorage.setItem(LS_KEY, lang);
}

export default MERGED;
