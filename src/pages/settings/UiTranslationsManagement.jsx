// src/pages/settings/UiTranslationsManagement.jsx
//
// CRUD for the hardcoded UI-copy locale files (nav labels, buttons, empty
// states — everything in admin/src/i18n/locales/*.js and
// client/src/i18n/locales/*.js). This is a DIFFERENT translation system
// from InlineTranslateFields.jsx / the "Translations" tab on products,
// categories, blog posts, etc. — that one translates database CONTENT
// (product names, blog bodies); this one translates static UI CHROME
// (button labels, nav items, form field labels) baked into the React apps.
// See server/models/uiTranslation.model.js and PRD §8a/§8b for the full
// writeup of how the two systems relate and why they're kept separate.
//
// Before this page, changing one of these strings meant editing the
// locale .js file in the repo and redeploying. This edits the DB-backed
// override layer that both live apps read on top of their bundled static
// files (i18n/index.js's applyDbOverrides/EFFECTIVE in both admin and
// client) — changes here take effect on next language load, no deploy.

import React, { useEffect, useState, useCallback } from "react";
import { uiTranslationAPI } from "../../utils/api";
import { useCapabilities, Can } from "../../contexts/CapabilitiesContext";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "../../i18n/index.js";

const NON_EN_LANGUAGES = SUPPORTED_LANGUAGES.filter((c) => c !== "en");
const PAGE_SIZE = 25;

export default function UiTranslationsManagement() {
  const { can } = useCapabilities();
  const canManage = can("translations.manage");

  const [app, setApp] = useState("admin");
  const [language, setLanguage] = useState(NON_EN_LANGUAGES[0] || "fr");
  const [namespaces, setNamespaces] = useState([]);
  const [namespace, setNamespace] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({}); // key -> in-progress edited value
  const [savingKey, setSavingKey] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await uiTranslationAPI.list({ app, language, search, namespace, page, limit: PAGE_SIZE });
      if (res?.success) {
        setRows(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      } else {
        setMsg({ type: "error", text: res?.message || "Failed to load" });
      }
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to load" });
    } finally {
      setLoading(false);
    }
  }, [app, language, search, namespace, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    uiTranslationAPI
      .namespaces(app)
      .then((res) => {
        if (res?.success) setNamespaces(res.data || []);
      })
      .catch(() => {});
    setNamespace("");
    setPage(1);
  }, [app]);

  useEffect(() => {
    setPage(1);
  }, [language, search, namespace]);

  useEffect(() => {
    setDrafts({});
  }, [app, language, page, search, namespace]);

  async function saveRow(row) {
    const value = drafts[row.key];
    if (value === undefined || value === row.value) return; // nothing changed
    setSavingKey(row.key);
    setMsg(null);
    try {
      const res = await uiTranslationAPI.save({ app, key: row.key, language, value });
      if (!res?.success) throw new Error(res?.message);
      setRows((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, value, isEdited: true } : r)),
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[row.key];
        return next;
      });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Save failed" });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">UI Copy Translations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nav labels, buttons, empty states — the static text baked into the admin and
          storefront apps. Editing here takes effect on next page/language load, no
          deploy needed. This is separate from the "Translations" tab on products,
          categories, blog posts, etc. — that one translates database content, not app
          chrome.
        </p>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-4 items-end dark:bg-gray-800 dark:border-gray-700">
        <Field label="App">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            value={app}
            onChange={(e) => setApp(e.target.value)}
          >
            <option value="admin">Admin panel</option>
            <option value="client">Storefront</option>
          </select>
        </Field>
        <Field label="Language">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {NON_EN_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code] || code}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Section">
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
          >
            <option value="">All sections</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Search key or English text">
          <input
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-64 dark:bg-gray-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. 'save' or 'common.save'"
          />
        </Field>
        <div className="text-xs text-gray-400 dark:text-gray-500 pb-2">
          {total} key{total === 1 ? "" : "s"}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 w-1/4">Key</th>
              <th className="text-left px-4 py-3 w-1/3">English (reference)</th>
              <th className="text-left px-4 py-3">
                {LANGUAGE_NAMES[language] || language}
              </th>
              {canManage && <th className="px-4 py-3 w-20" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  No keys found — run <code>node scripts/seedUiTranslations.js</code> on the
                  server first, or adjust the filters above.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const draft = drafts[row.key];
                const value = draft !== undefined ? draft : row.value;
                const dirty = draft !== undefined && draft !== row.value;
                return (
                  <tr key={row.key} className="border-t border-gray-100 dark:border-gray-700 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                      {row.key}
                      {row.isEdited && (
                        <span className="ml-2 inline-block text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded dark:bg-amber-900/30 dark:text-amber-300">
                          edited
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.en}</td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <textarea
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white resize-y"
                          rows={row.en.length > 60 ? 3 : 1}
                          value={value}
                          placeholder={row.en}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [row.key]: e.target.value }))
                          }
                        />
                      ) : (
                        <span>{value || <em className="text-gray-400">(using English fallback)</em>}</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => saveRow(row)}
                          disabled={!dirty || savingKey === row.key}
                          className="text-blue-600 hover:underline text-xs disabled:text-gray-300 disabled:no-underline dark:text-blue-400 dark:disabled:text-gray-600"
                        >
                          {savingKey === row.key ? "Saving…" : "Save"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 dark:text-gray-400">{label}</label>
      {children}
    </div>
  );
}
