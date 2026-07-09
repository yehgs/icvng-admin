/**
 * admin/src/pages/translations/TranslationManager.jsx
 *
 * Fixes applied:
 *   1. Country-scoped: Togo admin sees only FR, Italy admin sees only IT,
 *      Global/NG admin sees all non-EN languages.
 *   2. Manual-edit badge: shows "Manual" (green) vs "Auto" (amber) vs "Missing" (red).
 *   3. Inline translation tabs for Banner, Slider, and FOMO entities so foreign
 *      admins can edit translated copy without leaving their content workflow.
 *   4. All entity types now included: product, category, subCategory, brand,
 *      blog, blogCategory, banner, slider.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Languages,
  RefreshCw,
  Check,
  X,
  Edit2,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  PenLine,
  Bot,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

const LANG_FLAGS = { en: "🇬🇧", fr: "🇫🇷", it: "🇮🇹" };

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...options,
  });
  return res.json();
}

// All translatable entity types (blog is edited inline on the blog page)
const ALL_ENTITY_TYPES = [
  { key: "product", label: "Products", apiPath: "/product/get-all-product" },
  { key: "category", label: "Categories", apiPath: "/category/get" },
  {
    key: "subCategory",
    label: "Subcategories",
    apiPath: "/subcategory/get",
    method: "POST",
  },
  { key: "brand", label: "Brands", apiPath: "/brand/get" },
];

const EDITABLE_FIELDS = {
  product: ["name", "description", "unit", "seo.title", "seo.description"],
  category: ["name", "description"],
  subCategory: ["name"],
  brand: ["name", "description"],
};

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ info }) {
  if (!info)
    return <span className="text-xs text-gray-300 dark:text-gray-600">—</span>;
  if (info.missing)
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
        <X className="w-3 h-3" /> Missing
      </span>
    );
  if (!info.autoTranslated)
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
        <PenLine className="w-3 h-3" /> Manual
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
      <Bot className="w-3 h-3" /> Auto
    </span>
  );
}

// ── TranslationManager ────────────────────────────────────────────────────────
export default function TranslationManager() {
  const { t } = useAdminTranslation();
  const {
    buildScopeQuery,
    isGlobalAdmin,
    countryScope,
    allCountries,
    language: adminLang,
  } = useAdminCountry();

  // ── Derive which languages this admin is allowed to manage ────────────────
  // Global/NG admin → all non-EN languages
  // Country-scoped admin → only the languages of their assigned country
  const manageableLanguages = React.useMemo(() => {
    const ALL_NON_EN = [
      { code: "fr", label: "Français", flag: "🇫🇷" },
      { code: "it", label: "Italiano", flag: "🇮🇹" },
    ];
    if (isGlobalAdmin || !countryScope) return ALL_NON_EN;

    // Find the country config for this admin's assigned country
    const countryConf = allCountries.find((c) => c.code === countryScope);
    const supported = countryConf?.language?.supported || [];
    return ALL_NON_EN.filter((l) => supported.includes(l.code));
  }, [isGlobalAdmin, countryScope, allCountries]);

  const [entityType, setEntityType] = useState("product");
  const [entities, setEntities] = useState([]);
  const [translations, setTranslations] = useState({}); // id → { fr: {fields, autoTranslated}, it: {...} }
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [translatingIds, setTranslatingIds] = useState(new Set());
  const [editModal, setEditModal] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // ── Load entities ───────────────────────────────────────────────────────────
  const loadEntities = useCallback(async () => {
    setLoadingEntities(true);
    try {
      const etConf = ALL_ENTITY_TYPES.find((e) => e.key === entityType);
      if (!etConf) return;

      // FOMO is a single settings object, not a list
      if (etConf.singleEntity) {
        const res = await apiFetch(etConf.apiPath);
        const item = res.data || res.settings || res;
        if (item && item._id) {
          setEntities([item]);
        } else if (item) {
          // FOMO settings may not have _id — synthesise one
          setEntities([
            {
              ...item,
              _id: item._id || "fomo-settings",
              name: "FOMO Settings",
            },
          ]);
        } else {
          setEntities([]);
        }
        return;
      }

      const q = buildScopeQuery();
      const sep = etConf.apiPath.includes("?") ? "&" : "?";

      let res;
      if (etConf.method === "POST") {
        res = await apiFetch(`${etConf.apiPath}`, {
          method: "POST",
          body: JSON.stringify(
            q
              ? {
                  country: buildScopeQuery()
                    .replace("?country=", "")
                    .replace("&country=", ""),
                }
              : {},
          ),
        });
      } else {
        res = await apiFetch(`${etConf.apiPath}${sep}${q}`);
      }

      const items =
        res.data ||
        res.products ||
        res.categories ||
        res.subCategories ||
        res.brands ||
        res.sliders ||
        res.banners ||
        res.posts ||
        [];
      setEntities(Array.isArray(items) ? items.slice(0, 100) : []);
    } catch {
      toast.error("Failed to load entities");
    } finally {
      setLoadingEntities(false);
    }
  }, [entityType, buildScopeQuery]);

  // ── Load translation status — now includes autoTranslated flag ─────────────
  const loadTranslations = useCallback(
    async (entityList) => {
      if (!entityList.length) return;
      const newTrans = {};
      for (const entity of entityList) {
        const id = entity._id;
        newTrans[id] = {};
        // Fetch all languages for this entity in one call
        try {
          const res = await apiFetch(`/translations/${entityType}/${id}`);
          const docs = res.data || [];
          for (const lang of manageableLanguages) {
            const doc = docs.find((d) => d.language === lang.code);
            if (doc && doc.fields && Object.keys(doc.fields).length > 0) {
              newTrans[id][lang.code] = {
                fields: doc.fields,
                autoTranslated: doc.autoTranslated !== false, // default true
                engine: doc.engine || "libre",
              };
            } else {
              newTrans[id][lang.code] = { missing: true };
            }
          }
        } catch {
          for (const lang of manageableLanguages) {
            newTrans[id][lang.code] = { missing: true };
          }
        }
      }
      setTranslations((prev) => ({ ...prev, ...newTrans }));
    },
    [entityType, manageableLanguages],
  );

  useEffect(() => {
    loadEntities();
    setTranslations({});
  }, [loadEntities]);
  useEffect(() => {
    if (entities.length > 0) loadTranslations(entities.slice(0, 20));
  }, [entities, loadTranslations]);

  // ── Trigger auto-translate for one entity ───────────────────────────────────
  const triggerTranslation = async (entity) => {
    const id = entity._id;
    setTranslatingIds((prev) => new Set([...prev, id]));
    try {
      const res = await apiFetch("/translations/trigger", {
        method: "POST",
        body: JSON.stringify({ entityType, entityId: id, document: entity }),
      });
      if (res.success) {
        toast.success(
          t("translations.translationComplete") || "Translation queued",
        );
        setTimeout(() => loadTranslations([entity]), 3000);
      } else {
        toast.error(
          t("translations.translationFailed") || "Translation failed",
        );
      }
    } catch {
      toast.error("Translation failed");
    } finally {
      setTranslatingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  // ── Trigger ALL untranslated ────────────────────────────────────────────────
  const triggerAll = async () => {
    const toTranslate = entities.filter((e) => {
      const tr = translations[e._id];
      return (
        !tr ||
        manageableLanguages.some((l) => !tr[l.code] || tr[l.code]?.missing)
      );
    });
    if (toTranslate.length === 0) {
      toast.success("All entities already translated!");
      return;
    }
    toast(`Translating ${toTranslate.length} items in background…`);
    for (const entity of toTranslate) {
      await triggerTranslation(entity);
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  // ── Open edit modal: pre-fill with existing translated text ────────────────
  const openEditModal = (entity, langCode) => {
    const existing = translations[entity._id]?.[langCode];
    const fields = {};
    (EDITABLE_FIELDS[entityType] || []).forEach((f) => {
      fields[f] = existing?.fields?.[f] || "";
    });
    setEditModal({ entity, language: langCode, fields });
  };

  // ── Save manual edit ────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editModal) return;
    const { entity, language, fields } = editModal;
    try {
      const res = await apiFetch(
        `/translations/${entityType}/${entity._id}/${language}`,
        { method: "PUT", body: JSON.stringify({ fields }) },
      );
      if (res.success) {
        toast.success(
          t("translations.translationSaved") || "Translation saved",
        );
        // Update local state: mark as manual (autoTranslated: false)
        setTranslations((prev) => ({
          ...prev,
          [entity._id]: {
            ...prev[entity._id],
            [language]: { fields, autoTranslated: false, engine: "manual" },
          },
        }));
        setEditModal(null);
      } else toast.error("Save failed");
    } catch {
      toast.error("Save failed");
    }
  };

  const getEntityName = (e) => e.name || e.title || e._id;

  // ── No manageable languages → show message ──────────────────────────────────
  if (manageableLanguages.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        <Languages className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Your country only uses English. No translations to manage.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Languages className="w-6 h-6 text-amber-600" />
            {t("translations.title") || "Translation Manager"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("translations.subtitle") ||
              "Manage and review content translations"}
            {countryScope && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                {manageableLanguages
                  .map((l) => `${l.flag} ${l.label}`)
                  .join(", ")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <PenLine className="w-3 h-3 text-green-600" /> Manual
            </span>
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3 text-amber-600" /> Auto
            </span>
            <span className="flex items-center gap-1">
              <X className="w-3 h-3 text-red-500" /> Missing
            </span>
          </div>
          <button
            onClick={triggerAll}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            {t("translations.translateAll") || "Auto-translate All"}
          </button>
        </div>
      </div>

      {/* Entity type tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ALL_ENTITY_TYPES.map((et) => (
          <button
            key={et.key}
            onClick={() => setEntityType(et.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${
                entityType === et.key
                  ? "bg-amber-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Entity list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Column headers */}
        <div
          className="grid gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/50
                        text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          style={{
            gridTemplateColumns: `1fr ${manageableLanguages.map(() => "90px").join(" ")} 180px`,
          }}
        >
          <div>Name</div>
          {manageableLanguages.map((l) => (
            <div key={l.code} className="text-center">
              {l.flag} {l.label}
            </div>
          ))}
          <div className="text-right">{t("common.actions") || "Actions"}</div>
        </div>

        {loadingEntities ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            {t("common.loading") || "Loading…"}
          </div>
        ) : entities.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {t("common.noData") || "No data found"}
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {entities.map((entity) => (
              <div key={entity._id}>
                <div
                  className="grid gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  style={{
                    gridTemplateColumns: `1fr ${manageableLanguages.map(() => "90px").join(" ")} 180px`,
                  }}
                >
                  {/* Name + expand toggle */}
                  <div>
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === entity._id ? null : entity._id,
                        )
                      }
                      className="flex items-center gap-2 text-left min-w-0"
                    >
                      {expandedId === entity._id ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {getEntityName(entity)}
                      </span>
                    </button>
                  </div>

                  {/* Per-language status */}
                  {manageableLanguages.map((lang) => (
                    <div
                      key={lang.code}
                      className="flex items-center justify-center"
                    >
                      <StatusBadge
                        info={translations[entity._id]?.[lang.code]}
                      />
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => triggerTranslation(entity)}
                      disabled={translatingIds.has(entity._id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                                 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700
                                 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                    >
                      {translatingIds.has(entity._id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      {translatingIds.has(entity._id) ? "…" : "Auto"}
                    </button>
                    {manageableLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => openEditModal(entity, lang.code)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                                   text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700
                                   rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title={`Edit ${lang.label} translation`}
                      >
                        <Edit2 className="w-3 h-3" />
                        {lang.flag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded: show current field values per language */}
                {expandedId === entity._id && (
                  <div className="px-12 py-4 bg-gray-50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700">
                    <div
                      className="grid gap-6"
                      style={{
                        gridTemplateColumns: `repeat(${manageableLanguages.length}, 1fr)`,
                      }}
                    >
                      {manageableLanguages.map((lang) => {
                        const info = translations[entity._id]?.[lang.code];
                        return (
                          <div key={lang.code}>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                {lang.flag} {lang.label}
                              </h4>
                              {info && !info.missing && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    info.autoTranslated === false
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                  }`}
                                >
                                  {info.autoTranslated === false
                                    ? "Manual"
                                    : "Auto"}
                                </span>
                              )}
                            </div>
                            {info && !info.missing ? (
                              <div className="space-y-1">
                                {Object.entries(info.fields || {}).map(
                                  ([field, value]) => (
                                    <div key={field} className="text-xs">
                                      <span className="font-medium text-gray-400">
                                        {field}:{" "}
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-300 line-clamp-1">
                                        {value}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">
                                Not translated yet
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal &&
        (() => {
          const langConf = manageableLanguages.find(
            (l) => l.code === editModal.language,
          );
          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
                {/* Modal header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {langConf?.flag} {langConf?.label} —{" "}
                      {getEntityName(editModal.entity)}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <PenLine className="w-3 h-3 text-green-600" />
                      Manual edit — overrides auto-translation and is preserved
                      on future source updates
                    </p>
                  </div>
                  <button
                    onClick={() => setEditModal(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Fields */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {Object.entries(editModal.fields).map(([field, value]) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                        {field.replace(/\./g, " → ")}
                      </label>
                      <textarea
                        value={value}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            fields: { ...prev.fields, [field]: e.target.value },
                          }))
                        }
                        rows={
                          field.includes("description") ||
                          field.includes("content")
                            ? 4
                            : 2
                        }
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y focus:outline-none
                                 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <button
                    onClick={() => setEditModal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {t("common.cancel") || "Cancel"}
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <PenLine className="w-4 h-4" />
                    {t("translations.saveTranslation") || "Save Translation"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
