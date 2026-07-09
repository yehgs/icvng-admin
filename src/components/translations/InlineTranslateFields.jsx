/**
 * admin/src/components/translations/InlineTranslateFields.jsx
 *
 * A compact, embeddable version of the Translation Manager's per-entity
 * translation controls — meant to live INSIDE a content item's own edit
 * modal (banner, slider, blog post, FOMO settings) instead of a separate
 * top-level "Translations" tab. Editors manage a piece of content and its
 * translations in one place.
 *
 * Uses the exact same backend endpoints as the main Translation Manager, so
 * anything translated here shows up there too (and vice versa) — this is
 * just a different entry point into the same data.
 *
 * Usage:
 *   <InlineTranslateFields
 *     entityType="banner"
 *     entity={bannerDoc}                 // must have _id
 *     fields={["title", "subtitle", "linkText"]}
 *     fieldLabels={{ title: "Title", subtitle: "Subtitle", linkText: "Button text" }}
 *   />
 *
 * Renders nothing (returns null) until `entity._id` exists — i.e. while
 * creating a brand-new item, save it first, then translations become
 * available on the next edit.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Languages, RefreshCw, PenLine, Bot, Check, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

const ALL_NON_EN = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...options,
  });
  return res.json();
}

export default function InlineTranslateFields({ entityType, entity, fields, fieldLabels = {} }) {
  const { isGlobalAdmin, countryScope, allCountries } = useAdminCountry();

  const manageableLanguages = React.useMemo(() => {
    if (isGlobalAdmin || !countryScope) return ALL_NON_EN;
    const countryConf = allCountries.find((c) => c.code === countryScope);
    const supported = countryConf?.language?.supported || [];
    return ALL_NON_EN.filter((l) => supported.includes(l.code));
  }, [isGlobalAdmin, countryScope, allCountries]);

  const [translations, setTranslations] = useState({}); // lang → { fields, autoTranslated } | { missing: true }
  const [loading, setLoading] = useState(false);
  const [translatingLang, setTranslatingLang] = useState(null);
  const [editingLang, setEditingLang] = useState(null);
  const [draftFields, setDraftFields] = useState({});
  const [saving, setSaving] = useState(false);

  const entityId = entity?._id;

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/translations/${entityType}/${entityId}`);
      const docs = res.data || [];
      const next = {};
      for (const lang of manageableLanguages) {
        const doc = docs.find((d) => d.language === lang.code);
        next[lang.code] =
          doc && doc.fields && Object.keys(doc.fields).length > 0
            ? { fields: doc.fields, autoTranslated: doc.autoTranslated !== false }
            : { missing: true };
      }
      setTranslations(next);
    } catch {
      // leave as missing — non-fatal, editor can still retry via the button
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, manageableLanguages]);

  useEffect(() => {
    load();
  }, [load]);

  if (!entityId) {
    return (
      <div className="text-xs text-gray-500 italic mt-1">
        Save this item first — translations become available once it has been created.
      </div>
    );
  }

  if (manageableLanguages.length === 0) return null;

  const triggerAutoTranslate = async (langCode) => {
    setTranslatingLang(langCode);
    try {
      const res = await apiFetch("/translations/trigger", {
        method: "POST",
        body: JSON.stringify({ entityType, entityId, document: entity }),
      });
      if (res.success) {
        toast.success("Translation queued");
        setTimeout(load, 2500);
      } else {
        toast.error("Translation failed");
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setTranslatingLang(null);
    }
  };

  const openEdit = (langCode) => {
    const existing = translations[langCode];
    const draft = {};
    fields.forEach((f) => {
      draft[f] = existing?.fields?.[f] || "";
    });
    setDraftFields(draft);
    setEditingLang(langCode);
  };

  const saveEdit = async () => {
    if (!editingLang) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/translations/${entityType}/${entityId}/${editingLang}`, {
        method: "PUT",
        body: JSON.stringify({ fields: draftFields }),
      });
      if (res.success) {
        toast.success("Translation saved");
        setTranslations((prev) => ({
          ...prev,
          [editingLang]: { fields: draftFields, autoTranslated: false },
        }));
        setEditingLang(null);
      } else {
        toast.error("Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
        <Languages className="w-3.5 h-3.5" />
        Translations
        {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
      </div>

      <div className="space-y-2">
        {manageableLanguages.map((lang) => {
          const state = translations[lang.code];
          const isMissing = !state || state.missing;
          const isManual = state && !state.missing && state.autoTranslated === false;
          return (
            <div key={lang.code} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 w-24 shrink-0">
                <span>{lang.flag}</span>
                <span className="text-gray-700 dark:text-gray-200">{lang.label}</span>
              </span>

              {isMissing ? (
                <span className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" /> Missing
                </span>
              ) : isManual ? (
                <span className="flex items-center gap-1 text-green-600 text-xs">
                  <PenLine className="w-3 h-3" /> Manual
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 text-xs">
                  <Bot className="w-3 h-3" /> Auto
                </span>
              )}

              <span className="flex-1" />

              <button
                type="button"
                onClick={() => triggerAutoTranslate(lang.code)}
                disabled={translatingLang === lang.code}
                className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              >
                {translatingLang === lang.code ? "…" : "Auto"}
              </button>
              <button
                type="button"
                onClick={() => openEdit(lang.code)}
                className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      {editingLang && (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Editing {ALL_NON_EN.find((l) => l.code === editingLang)?.label}
          </div>
          {fields.map((f) => (
            <div key={f}>
              <label className="text-xs text-gray-500 block mb-0.5">
                {fieldLabels[f] || f}
              </label>
              <textarea
                rows={f.toLowerCase().includes("description") || f.toLowerCase().includes("message") ? 2 : 1}
                value={draftFields[f] || ""}
                onChange={(e) => setDraftFields((p) => ({ ...p, [f]: e.target.value }))}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900"
              />
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              type="button"
              onClick={() => setEditingLang(null)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
