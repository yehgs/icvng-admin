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

const LOCALES = { en, fr, it };
const LS_KEY = "icvng_admin_language";

export const SUPPORTED_LANGUAGES = ["en", "fr", "it"];
export const LANGUAGE_NAMES = { en: "English", fr: "Français", it: "Italiano" };

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
  const locale = MERGED[lang] || MERGED.en;
  const result = resolve(locale, key, params);
  if (result !== null) return result;
  if (lang !== "en") {
    const en = resolve(MERGED.en, key, params);
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
