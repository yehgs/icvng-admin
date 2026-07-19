// admin/src/pages/content/SitePagesManagement.jsx
//
// CRUD editor for the SitePage CMS — About Us, Our Story, Partner With Us,
// Contact Us, FAQ, Shipping Policy, Returns & Refunds, Terms & Conditions,
// Privacy Policy — and any future page, since nothing here is hardcoded to
// a particular page's shape. Content is a flat "key -> value" dictionary
// where a value can be a string, number, or a nested array/object; the
// <ValueEditor> below renders (and lets an editor grow) any of that without
// a schema change, which is what makes "add their own content" possible.
//
// Three axes an editor works across, matching the request this page exists
// to satisfy:
//   • PAGE    — which static page (slug)
//   • COUNTRY — GLOBAL (HQ master copy) or a specific market's override
//   • LANGUAGE — a translation of whichever content wins (GLOBAL or the
//                country's own override) for that page/country
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText, Globe2, Languages, Save, RotateCcw, Plus, Trash2, ChevronDown,
  ChevronRight, RefreshCw, Bot, PenLine, AlertCircle, Eye, EyeOff, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError } from "../../utils/api";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

// ── Known pages (slug -> label). New pages can be added by typing a new
// slug in the "custom slug" box below — nothing here is a hard limit. ─────
const KNOWN_PAGES = [
  { slug: "about-us", label: "About Us" },
  { slug: "our-story", label: "Our Story" },
  { slug: "partner-with-us", label: "Partner With Us" },
  { slug: "contact-us", label: "Contact Us" },
  { slug: "faq", label: "FAQ" },
  { slug: "shipping-policy", label: "Shipping Policy" },
  { slug: "return-policy", label: "Returns & Refunds" },
  { slug: "terms-conditions", label: "Terms & Conditions" },
  { slug: "privacy-policy", label: "Privacy Policy" },
];

const ALL_NON_EN = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

// ── Generic deep clone / helpers ────────────────────────────────────────
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

function humanizeKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// ─────────────────────────────────────────────────────────────────────────
// ValueEditor — recursively renders an editable control for ANY value
// (string, number, boolean, array, object). This single component is what
// makes the CRUD "dynamic": it never assumes a page's shape in advance.
// ─────────────────────────────────────────────────────────────────────────
function ValueEditor({ value, onChange, depth = 0 }) {
  if (typeof value === "string") {
    const long = value.length > 60 || value.includes("\n");
    return long ? (
      <textarea
        className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
        rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        type="text"
        className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (typeof value === "number") {
    return (
      <input
        type="text"
        className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
        value={value}
        onChange={(e) => {
          const n = e.target.value;
          onChange(n === "" || isNaN(Number(n)) ? n : Number(n));
        }}
      />
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {value ? "true" : "false"}
      </label>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-xs text-gray-400 mt-2 w-5 shrink-0">#{idx + 1}</span>
            <div className="flex-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2">
              <ValueEditor
                value={item}
                onChange={(next) => {
                  const copy = clone(value);
                  copy[idx] = next;
                  onChange(copy);
                }}
                depth={depth + 1}
              />
            </div>
            <button
              type="button"
              className="text-red-500 hover:text-red-700 mt-2"
              title="Remove item"
              onClick={() => {
                const copy = clone(value);
                copy.splice(idx, 1);
                onChange(copy);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1"
          onClick={() => {
            const template = value.length
              ? typeof value[0] === "object" && value[0] !== null
                ? Object.fromEntries(Object.keys(value[0]).map((k) => [k, typeof value[0][k] === "string" ? "" : value[0][k]]))
                : ""
              : "";
            onChange([...value, template]);
          }}
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      </div>
    );
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    return (
      <div className={depth > 0 ? "space-y-3" : "space-y-4"}>
        {keys.map((k) => (
          <div key={k}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {humanizeKey(k)}
              </label>
              <button
                type="button"
                className="text-gray-300 hover:text-red-500"
                title={`Remove "${k}"`}
                onClick={() => {
                  const copy = clone(value);
                  delete copy[k];
                  onChange(copy);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <ValueEditor
              value={value[k]}
              onChange={(next) => {
                const copy = clone(value);
                copy[k] = next;
                onChange(copy);
              }}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    );
  }

  // null / undefined leaf — treat as an empty string field
  return (
    <input
      type="text"
      className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
      value=""
      placeholder="(empty)"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TopLevelFieldCard — one content key at the page's root, collapsible, with
// an "Inherited from HQ" badge when the country doc hasn't overridden it.
// ─────────────────────────────────────────────────────────────────────────
function TopLevelFieldCard({ fieldKey, value, onChange, onDelete, isOverride, isInherited }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60">
        <button type="button" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {humanizeKey(fieldKey)}
        </button>
        <div className="flex items-center gap-2">
          {isInherited && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
              Inherited from HQ
            </span>
          )}
          {isOverride && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
              Overridden here
            </span>
          )}
          <button type="button" className="text-gray-300 hover:text-red-500" title="Delete this field" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="p-3">
          <ValueEditor value={value} onChange={onChange} depth={1} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────
export default function SitePagesManagement() {
  const { isGlobalAdmin, countryScope, allCountries } = useAdminCountry();

  const [slug, setSlug] = useState(KNOWN_PAGES[0].slug);
  const [customSlug, setCustomSlug] = useState("");
  const [countryCode, setCountryCode] = useState(isGlobalAdmin ? "GLOBAL" : countryScope || "GLOBAL");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState(null); // raw country doc, or null if not overridden yet
  const [globalContent, setGlobalContent] = useState({});
  const [globalSeo, setGlobalSeo] = useState({});
  const [content, setContent] = useState({});
  const [seo, setSeo] = useState({ title: "", description: "" });
  const [isPublished, setIsPublished] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");

  // Translation panel state
  const [translations, setTranslations] = useState({});
  const [translatingLang, setTranslatingLang] = useState(null);
  const [activeLangTab, setActiveLangTab] = useState(null); // null = editing the base content
  const [langDraft, setLangDraft] = useState(null);
  const [langSaving, setLangSaving] = useState(false);

  useEffect(() => {
    if (!isGlobalAdmin && countryScope) setCountryCode(countryScope);
  }, [isGlobalAdmin, countryScope]);

  const isOverrideDoc = countryCode !== "GLOBAL" && !!doc;
  const canEditGlobal = isGlobalAdmin;
  const canEditThisCountry = countryCode === "GLOBAL" ? canEditGlobal : isGlobalAdmin || countryScope === countryCode;

  const countryOptions = useMemo(() => {
    const base = [{ code: "GLOBAL", name: "HQ / Global default", flagEmoji: "🌐" }];
    if (isGlobalAdmin) return [...base, ...allCountries];
    const mine = allCountries.find((c) => c.code === countryScope);
    return mine ? [...base, mine] : base;
  }, [isGlobalAdmin, allCountries, countryScope]);

  const selectedCountryLanguages = useMemo(() => {
    if (countryCode === "GLOBAL") return ALL_NON_EN; // HQ content can be translated into any market language
    const conf = allCountries.find((c) => c.code === countryCode);
    const supported = conf?.language?.supported || [];
    return ALL_NON_EN.filter((l) => supported.includes(l.code));
  }, [countryCode, allCountries]);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    setActiveLangTab(null);
    try {
      const res = await apiCall(`/site-pages/admin/${slug}/${countryCode}`);
      if (res.success) {
        setDoc(res.data.doc);
        setGlobalContent(res.data.globalContent || {});
        setGlobalSeo(res.data.globalSeo || {});
        const base = res.data.doc?.content || (countryCode === "GLOBAL" ? {} : res.data.globalContent || {});
        setContent(clone(base));
        setSeo(res.data.doc?.seo || (countryCode === "GLOBAL" ? { title: "", description: "" } : clone(res.data.globalSeo || {})));
        setIsPublished(res.data.doc?.isPublished !== false);
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to load page content"));
    } finally {
      setLoading(false);
    }
  }, [slug, countryCode]);

  const fetchTranslations = useCallback(async () => {
    try {
      const res = await apiCall(`/site-pages/admin/${slug}/${countryCode}/translations`);
      if (res.success) {
        const map = {};
        for (const t of res.data) map[t.language] = t;
        setTranslations(map);
      }
    } catch {
      // non-fatal
    }
  }, [slug, countryCode]);

  useEffect(() => {
    fetchDoc();
    fetchTranslations();
  }, [fetchDoc, fetchTranslations]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiCall(`/site-pages/admin/${slug}/${countryCode}`, {
        method: "PUT",
        body: { content, seo, isPublished, inherit: true },
      });
      if (res.success) {
        toast.success("Saved");
        fetchDoc();
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToHQ = async () => {
    if (!window.confirm(`Remove ${countryCode}'s override for "${slug}"? It will go back to inheriting HQ's content.`)) return;
    try {
      const res = await apiCall(`/site-pages/admin/${slug}/${countryCode}`, { method: "DELETE" });
      if (res.success) {
        toast.success(res.message || "Reverted to HQ content");
        fetchDoc();
        fetchTranslations();
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to reset"));
    }
  };

  const handleAddKey = () => {
    const key = newKeyName.trim().replace(/\s+/g, "");
    if (!key) return;
    if (content[key] !== undefined) {
      toast.error("That key already exists");
      return;
    }
    setContent({ ...content, [key]: "" });
    setNewKeyName("");
  };

  const triggerTranslate = async (langCode) => {
    setTranslatingLang(langCode);
    try {
      const res = await apiCall(`/site-pages/admin/${slug}/${countryCode}/translate`, {
        method: "POST",
        body: { targetLangs: [langCode] },
      });
      if (res.success) {
        toast.success("Translation queued — refreshing shortly");
        setTimeout(fetchTranslations, 3000);
      }
    } catch (err) {
      toast.error(handleApiError(err, "Save this page/country before translating"));
    } finally {
      setTranslatingLang(null);
    }
  };

  const openLangTab = (langCode) => {
    const existing = translations[langCode];
    setLangDraft(clone(existing?.fields?.content || content));
    setActiveLangTab(langCode);
  };

  const saveLangDraft = async () => {
    setLangSaving(true);
    try {
      const res = await apiCall(`/site-pages/admin/${slug}/${countryCode}/translations/${activeLangTab}`, {
        method: "PUT",
        body: { content: langDraft, seo: translations[activeLangTab]?.fields?.seo || {} },
      });
      if (res.success) {
        toast.success("Translation saved");
        fetchTranslations();
      }
    } catch (err) {
      toast.error(handleApiError(err, "Failed to save translation"));
    } finally {
      setLangSaving(false);
    }
  };

  const rootKeys = Object.keys(content);
  const readOnly = !canEditThisCountry;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-amber-600" />
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Site Pages</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Edit the copy on About Us, Our Story, Contact Us, FAQ, Shipping Policy, Returns & Refunds,
        Terms & Conditions, Privacy Policy, and Partner With Us — per country and language. HQ's
        content is the default every market falls back to until it creates its own override.
      </p>

      {/* Page + country selectors */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="min-w-[220px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Page</label>
          <select
            className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={KNOWN_PAGES.some((p) => p.slug === slug) ? slug : "__custom__"}
            onChange={(e) => {
              if (e.target.value === "__custom__") return;
              setSlug(e.target.value);
            }}
          >
            {KNOWN_PAGES.map((p) => (
              <option key={p.slug} value={p.slug}>{p.label}</option>
            ))}
            <option value="__custom__">Custom slug…</option>
          </select>
        </div>

        {!KNOWN_PAGES.some((p) => p.slug === slug) && (
          <div className="min-w-[220px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Custom slug</label>
            <div className="flex gap-2">
              <input
                className="border rounded-md px-2 py-1.5 text-sm flex-1 dark:bg-gray-800 dark:border-gray-600"
                placeholder="e.g. careers"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
              />
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => customSlug.trim() && setSlug(customSlug.trim().toLowerCase().replace(/\s+/g, "-"))}
              >
                Use
              </button>
            </div>
          </div>
        )}

        <div className="min-w-[220px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Country</label>
          <select
            className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji ? `${c.flagEmoji} ` : ""}{c.name}{c.code !== "GLOBAL" ? ` (${c.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={fetchDoc}
            className="text-xs px-3 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 inline-flex items-center gap-1 dark:border-gray-600 dark:text-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
        </div>
      </div>

      {countryCode !== "GLOBAL" && (
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-md p-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
          <span>
            {doc
              ? `${countryCode} has its own content for this page. Fields marked "Inherited from HQ" below are still coming from the master copy — only the fields you edit here get overridden.`
              : `${countryCode} has no override yet — this page currently shows HQ's content as-is. Editing and saving below will create a ${countryCode}-specific override; unedited fields stay inherited.`}
          </span>
        </div>
      )}

      {readOnly && (
        <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> You don't have permission to edit {countryCode === "GLOBAL" ? "the HQ master copy" : countryCode}. Viewing read-only.
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          {/* Tabs: base content vs a translation */}
          <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            <button
              type="button"
              onClick={() => setActiveLangTab(null)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                activeLangTab === null ? "bg-amber-600 text-white border-amber-600" : "border-gray-300 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 inline mr-1" /> Base content
            </button>
            {selectedCountryLanguages.map((l) => {
              const state = translations[l.code];
              const isMissing = !state;
              const isManual = state && state.autoTranslated === false;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => openLangTab(l.code)}
                  className={`text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1 ${
                    activeLangTab === l.code ? "bg-amber-600 text-white border-amber-600" : "border-gray-300 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {l.flag} {l.label}
                  {isMissing && <AlertCircle className="w-3 h-3 text-red-400" />}
                  {isManual && <PenLine className="w-3 h-3 text-green-400" />}
                  {!isMissing && !isManual && <Bot className="w-3 h-3 text-amber-300" />}
                </button>
              );
            })}
          </div>

          {activeLangTab === null ? (
            <>
              {/* SEO */}
              <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">SEO</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Page title</label>
                    <input
                      className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
                      value={seo.title || ""}
                      placeholder={globalSeo.title}
                      onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Meta description</label>
                    <input
                      className="w-full border rounded-md px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
                      value={seo.description || ""}
                      placeholder={globalSeo.description}
                      onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Publish toggle */}
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => !readOnly && setIsPublished((p) => !p)}
                  className={`text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1 ${
                    isPublished ? "bg-green-50 text-green-700 border-green-300" : "bg-gray-100 text-gray-500 border-gray-300"
                  }`}
                >
                  {isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {isPublished ? "Published" : "Unpublished (falls back to HQ)"}
                </button>
              </div>

              {/* Content fields */}
              <div className="space-y-3">
                {rootKeys.map((key) => {
                  const isOverride = doc && doc.content && doc.content[key] !== undefined;
                  const isInherited = countryCode !== "GLOBAL" && !isOverride;
                  return (
                    <fieldset key={key} disabled={readOnly}>
                      <TopLevelFieldCard
                        fieldKey={key}
                        value={content[key]}
                        onChange={(next) => setContent({ ...content, [key]: next })}
                        onDelete={() => {
                          const copy = { ...content };
                          delete copy[key];
                          setContent(copy);
                        }}
                        isOverride={isOverride}
                        isInherited={isInherited}
                      />
                    </fieldset>
                  );
                })}
              </div>

              {/* Add new key */}
              {!readOnly && (
                <div className="mt-4 flex items-center gap-2">
                  <input
                    className="border rounded-md px-2 py-1.5 text-sm flex-1 max-w-xs dark:bg-gray-800 dark:border-gray-600"
                    placeholder="newFieldKey"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddKey()}
                  />
                  <button
                    type="button"
                    onClick={handleAddKey}
                    className="text-xs px-3 py-1.5 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add field
                  </button>
                </div>
              )}

              {/* Save / reset */}
              {!readOnly && (
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                  </button>
                  {isOverrideDoc && (
                    <button
                      type="button"
                      onClick={handleResetToHQ}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm inline-flex items-center gap-2 dark:border-gray-600 dark:text-gray-300"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset to HQ default
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            // ── Translation editor for the selected language ──────────────
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Editing the <strong>{ALL_NON_EN.find((l) => l.code === activeLangTab)?.label}</strong> translation of{" "}
                  {countryCode === "GLOBAL" ? "HQ's" : `${countryCode}'s`} content for this page.
                </div>
                <button
                  type="button"
                  onClick={() => triggerTranslate(activeLangTab)}
                  disabled={translatingLang === activeLangTab}
                  className="text-xs px-3 py-1.5 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5" /> {translatingLang === activeLangTab ? "Translating…" : "Auto-translate all"}
                </button>
              </div>

              {langDraft && (
                <>
                  <div className="space-y-3">
                    {Object.keys(langDraft).map((key) => (
                      <TopLevelFieldCard
                        key={key}
                        fieldKey={key}
                        value={langDraft[key]}
                        onChange={(next) => setLangDraft({ ...langDraft, [key]: next })}
                        onDelete={() => {
                          const copy = { ...langDraft };
                          delete copy[key];
                          setLangDraft(copy);
                        }}
                        isOverride={false}
                        isInherited={false}
                      />
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={saveLangDraft}
                      disabled={langSaving}
                      className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {langSaving ? "Saving…" : "Save translation"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
