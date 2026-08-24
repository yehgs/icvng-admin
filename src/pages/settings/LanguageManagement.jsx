// src/pages/settings/LanguageManagement.jsx
//
// CRUD for the platform's "language lib" (server/models/language.model.js).
// Previously the set of languages the platform offers only existed as
// hardcoded arrays baked into source across several files (some limited to
// just French/Italian — see PRD §10/§12) and static i18n locale files
// (admin/src/i18n/index.js, client/src/i18n/index.js). This page manages
// the DB-backed metadata layer instead: add/rename/reorder/activate a
// language without a code deploy. Gated on translations.manage (same
// permission that already governs the rest of the content-translation
// system — EDITOR/MANAGER/IT/DIRECTOR all hold it; hqOnly server-side).

import React, { useEffect, useState } from "react";
import { languageAPI } from "../../utils/api";
import { useCapabilities, Can } from "../../contexts/CapabilitiesContext";

const EMPTY = {
  code: "",
  name: "",
  nativeName: "",
  flagEmoji: "",
  isRTL: false,
  isActive: true,
  sortOrder: 0,
};

export default function LanguageManagement() {
  const { can } = useCapabilities();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const canManage = can("translations.manage");

  async function load() {
    setLoading(true);
    try {
      const res = await languageAPI.list();
      if (res?.success) setLanguages(res.data || []);
      else setMsg({ type: "error", text: res?.message || "Failed to load languages" });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to load languages" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
  }

  function editLanguage(lang) {
    setEditingId(lang._id);
    setForm({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flagEmoji: lang.flagEmoji || "",
      isRTL: !!lang.isRTL,
      isActive: lang.isActive !== false,
      sortOrder: lang.sortOrder || 0,
    });
    setShowForm(true);
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      if (editingId) {
        // code is immutable once created — every Translation document and
        // the AI pipeline key off it, so it's intentionally not editable
        // here (only metadata: name/nativeName/flag/RTL/active/sortOrder).
        const { code: _code, ...updatable } = form;
        const res = await languageAPI.update(editingId, updatable);
        if (!res?.success) throw new Error(res?.message);
        setMsg({ type: "success", text: `Updated ${form.code}` });
      } else {
        const res = await languageAPI.create(form);
        if (!res?.success) throw new Error(res?.message);
        setMsg({ type: "success", text: `Added ${form.code}` });
      }
      resetForm();
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(lang) {
    setMsg(null);
    try {
      const res = await languageAPI.update(lang._id, { isActive: !lang.isActive });
      if (!res?.success) throw new Error(res?.message);
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Update failed" });
    }
  }

  async function remove(lang) {
    if (
      !window.confirm(
        `Delete ${lang.nativeName} (${lang.code})? Existing translations into this language are kept but orphaned — this only removes it from the lib.`,
      )
    )
      return;
    setMsg(null);
    try {
      const res = await languageAPI.delete(lang._id);
      if (!res?.success) throw new Error(res?.message);
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Delete failed" });
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Languages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The language lib — every language the storefront/admin UI and content
            translation pipeline can offer. English is the master content language
            and can't be deactivated or deleted.
          </p>
        </div>
        <Can permission="translations.manage">
          {!showForm && (
            <button
              onClick={() => {
                setForm(EMPTY);
                setEditingId(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add language
            </button>
          )}
        </Can>
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

      {canManage && showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 dark:text-gray-300">
            {editingId ? `Edit ${form.code}` : "Add a language"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Code (ISO 639-1, e.g. 'de')">
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-60"
                value={form.code}
                disabled={!!editingId}
                onChange={(e) => set("code", e.target.value.toLowerCase())}
                placeholder="de"
              />
            </Field>
            <Field label="English name">
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="German"
              />
            </Field>
            <Field label="Native name">
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={form.nativeName}
                onChange={(e) => set("nativeName", e.target.value)}
                placeholder="Deutsch"
              />
            </Field>
            <Field label="Flag emoji">
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={form.flagEmoji}
                onChange={(e) => set("flagEmoji", e.target.value)}
                placeholder="🇩🇪"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              />
            </Field>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isRTL}
                  onChange={(e) => set("isRTL", e.target.checked)}
                />
                Right-to-left
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  disabled={form.code === "en"}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={save}
              disabled={saving || !form.code || !form.name || !form.nativeName}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add language"}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Language</th>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Direction</th>
              <th className="text-left px-4 py-3">Status</th>
              {canManage && <th className="text-right px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : languages.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  No languages yet — run <code>node scripts/seedLanguages.js</code> or add one above.
                </td>
              </tr>
            ) : (
              languages.map((lang) => (
                <tr key={lang._id} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base">{lang.flagEmoji}</span>
                      {lang.nativeName}
                      <span className="text-gray-400 dark:text-gray-500 font-normal">({lang.name})</span>
                      {lang.code === "en" && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                          Master
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{lang.code}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{lang.isRTL ? "RTL" : "LTR"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        lang.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {lang.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => editLanguage(lang)}
                        className="text-blue-600 hover:underline mr-3 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {lang.code !== "en" && (
                        <button
                          onClick={() => toggleActive(lang)}
                          className="text-amber-600 hover:underline mr-3 dark:text-amber-400"
                        >
                          {lang.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                      {lang.code !== "en" && (
                        <button
                          onClick={() => remove(lang)}
                          className="text-red-600 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4 dark:text-gray-500">
        Adding a language here makes it selectable in language switchers, but existing
        product/category/subcategory/blog/etc. content isn't translated into it
        automatically — run{" "}
        <code>node scripts/bulkTranslateContent.js --languages=&lt;code&gt;</code> on the
        server to backfill existing content once you've added it here.
      </p>
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
