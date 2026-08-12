// src/pages/settings/CountryManagement.jsx
//
// PHASE 6 — HQ country onboarding UI. A DIRECTOR/IT (countries.manage) can
// create a new market, configure currency/language/domain/payments, and
// activate it — the acceptance test for the whole program (onboard Ghana with
// no code deploy). Gated by the RBAC capability system.

import React, { useEffect, useState } from "react";
import { countryAPI } from "../../utils/api";
import FlagIcon from "../../components/FlagIcon.jsx";
import { useCapabilities, Can } from "../../contexts/CapabilitiesContext";

const EMPTY = {
  code: "",
  name: "",
  status: "COMING_SOON",
  domain: "",
  // Additional domains that should also resolve to this country (besides
  // the primary `domain` above) — e.g. a legacy/alias domain.
  domains: [],
  // The admin-panel login domain for this market (app.i-coffee.XX) — used
  // by admin_auth.controller.js's domain-restricted login check and shown
  // in its error message when someone tries to log in from the wrong
  // country's portal. Previously not editable here at all.
  adminDomain: "",
  currency: { code: "", symbol: "", name: "", decimals: 2 },
  language: { default: "en", supported: ["en"], locale: "" },
  timezone: "",
  phonePrefix: "",
  flagEmoji: "",
  payments: { paystack: false, stripe: false },
  // Was already in this default object but had no form fields at all —
  // silently unreachable from the UI.
  tax: { enabled: false, rate: 0, label: "VAT", inclusive: false },
  // The following were entirely missing from both this default object and
  // the form below, even though the backend (countryManagement.controller.js)
  // already accepts them generically via req.body spread.
  shipping: { freeThreshold: "", defaultFee: 0 },
  branding: { logo: "", primaryColor: "" },
  seo: { siteName: "", tld: "" },
  invoiceSeries: { prefix: "INV", nextNumber: 1 },
  featureFlags: {},
  // Content management (header preheader + footer contact details) — reflects
  // on the storefront for this country's domain as soon as it's saved here.
  contacts: { email: "", phone: "", whatsapp: "", address: "" },
  content: { preheaderMessage: "" },
  tawk: { propertyId: "", widgetId: "" },
};

const STATUS_COLORS = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-700",
  COMING_SOON: "bg-amber-100 text-amber-800",
};

export default function CountryManagement() {
  const { can } = useCapabilities();
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState(["en", "fr", "it"]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingCode, setEditingCode] = useState(null);
  const [msg, setMsg] = useState(null);
  const [featureFlagsText, setFeatureFlagsText] = useState("{}");
  const [featureFlagsError, setFeatureFlagsError] = useState(null);

  const canManage = can("countries.manage");

  async function load() {
    setLoading(true);
    try {
      const [list, langs] = await Promise.all([
        countryAPI.list(),
        countryAPI.languages().catch(() => null),
      ]);
      if (list?.success) setCountries(list.data || []);
      if (langs?.success) setLanguages(langs.data || languages);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to load countries" });
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
    setEditingCode(null);
    setFeatureFlagsText("{}");
    setFeatureFlagsError(null);
  }

  async function save() {
    setMsg(null);
    if (featureFlagsError) {
      setMsg({ type: "error", text: "Fix the Feature flags JSON before saving." });
      return;
    }
    try {
      if (editingCode) {
        const res = await countryAPI.update(editingCode, form);
        if (!res?.success) throw new Error(res?.message);
        setMsg({ type: "success", text: `Updated ${editingCode}` });
      } else {
        const res = await countryAPI.create(form);
        if (!res?.success) throw new Error(res?.message);
        setMsg({ type: "success", text: `Created ${form.code}` });
      }
      resetForm();
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Save failed" });
    }
  }

  async function changeStatus(code, status) {
    try {
      const res = await countryAPI.setStatus(code, status);
      if (!res?.success) throw new Error(res?.message);
      load();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Status change failed" });
    }
  }

  function editCountry(c) {
    setEditingCode(c.code);
    setForm({
      ...EMPTY,
      ...c,
      currency: { ...EMPTY.currency, ...(c.currency || {}) },
      language: { ...EMPTY.language, ...(c.language || {}) },
      payments: { ...EMPTY.payments, ...(c.payments || {}) },
      tax: { ...EMPTY.tax, ...(c.tax || {}) },
      shipping: { ...EMPTY.shipping, ...(c.shipping || {}) },
      branding: { ...EMPTY.branding, ...(c.branding || {}) },
      seo: { ...EMPTY.seo, ...(c.seo || {}) },
      invoiceSeries: { ...EMPTY.invoiceSeries, ...(c.invoiceSeries || {}) },
      featureFlags: { ...(c.featureFlags || {}) },
      contacts: { ...EMPTY.contacts, ...(c.contacts || {}) },
      content: { ...EMPTY.content, ...(c.content || {}) },
      tawk: { ...EMPTY.tawk, ...(c.tawk || {}) },
    });
    setFeatureFlagsText(JSON.stringify(c.featureFlags || {}, null, 2));
    setFeatureFlagsError(null);
  }

  const set = (path, value) => {
    setForm((f) => {
      const next = { ...f };
      const parts = path.split(".");
      if (parts.length === 1) next[parts[0]] = value;
      else next[parts[0]] = { ...next[parts[0]], [parts[1]]: value };
      return next;
    });
  };

  // Comma-separated text <-> string array, for `domains` and
  // `language.supported`.
  const listToText = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
  const textToList = (text) =>
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const onFeatureFlagsChange = (text) => {
    setFeatureFlagsText(text);
    try {
      const parsed = text.trim() === "" ? {} : JSON.parse(text);
      setForm((f) => ({ ...f, featureFlags: parsed }));
      setFeatureFlagsError(null);
    } catch {
      setFeatureFlagsError("Invalid JSON");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Countries</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Onboard and manage markets. Nigeria is Headquarters.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            msg.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Country list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8 dark:bg-gray-800 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Country</th>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Currency</th>
              <th className="text-left px-4 py-3">Domain</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : (
              countries.map((c) => (
                <tr key={c.code} className="border-t border-gray-100 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <FlagIcon code={c.code} className="w-5 h-4 rounded-sm" />
                      {c.name}
                    </span>
                    {c.isHQ && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                        HQ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.code}</td>
                  <td className="px-4 py-3">{c.currency?.code}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.domain}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[c.status] || ""
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Can permission="countries.manage">
                      <button
                        onClick={() => editCountry(c)}
                        className="text-blue-600 hover:underline mr-3 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      {!c.isHQ &&
                        (c.status === "ACTIVE" ? (
                          <button
                            onClick={() => changeStatus(c.code, "INACTIVE")}
                            className="text-gray-500 hover:underline dark:text-gray-400"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => changeStatus(c.code, "ACTIVE")}
                            className="text-green-600 hover:underline dark:text-green-400"
                          >
                            Activate
                          </button>
                        ))}
                    </Can>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / edit form */}
      {canManage ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">
            {editingCode ? `Edit ${editingCode}` : "Add a country"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Code (e.g. GH)">
              <input
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={form.code}
                disabled={!!editingCode}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Name (e.g. Ghana)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Flag emoji (fallback only — most of the UI now renders an actual flag icon instead; this value isn't required to look right)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.flagEmoji} onChange={(e) => set("flagEmoji", e.target.value)} />
            </Field>
            <Field label="Domain (e.g. i-coffee.gh)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.domain} onChange={(e) => set("domain", e.target.value)} />
            </Field>
            <Field label="Additional domains (comma-separated aliases)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={listToText(form.domains)} onChange={(e) => set("domains", textToList(e.target.value))} placeholder="www.i-coffee.gh" />
            </Field>
            <Field label="Admin login domain (app.i-coffee.gh)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.adminDomain} onChange={(e) => set("adminDomain", e.target.value)} placeholder="app.i-coffee.gh" />
            </Field>
            <Field label="Currency code (e.g. GHS)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.currency.code} onChange={(e) => set("currency.code", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Currency symbol">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.currency.symbol} onChange={(e) => set("currency.symbol", e.target.value)} />
            </Field>
            <Field label="Currency name (e.g. Ghanaian Cedi)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.currency.name} onChange={(e) => set("currency.name", e.target.value)} />
            </Field>
            <Field label="Currency decimal places">
              <input type="number" min="0" max="4" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.currency.decimals} onChange={(e) => set("currency.decimals", Number(e.target.value))} />
            </Field>
            <Field label="Default language">
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.language.default} onChange={(e) => set("language.default", e.target.value)}>
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Supported languages (comma-separated codes)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={listToText(form.language.supported)} onChange={(e) => set("language.supported", textToList(e.target.value))} placeholder="en, fr" />
            </Field>
            <Field label="Locale (e.g. en-GH)">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.language.locale} onChange={(e) => set("language.locale", e.target.value)} placeholder="en-GH" />
            </Field>
            <Field label="Timezone">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Africa/Accra" />
            </Field>
            <Field label="Phone prefix">
              <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.phonePrefix} onChange={(e) => set("phonePrefix", e.target.value)} placeholder="+233" />
            </Field>
          </div>

          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.payments.paystack} onChange={(e) => set("payments.paystack", e.target.checked)} />
              Paystack
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.payments.stripe} onChange={(e) => set("payments.stripe", e.target.checked)} />
              Stripe
            </label>
          </div>

          {/* Tax — was already in this file's default form object but had no
              UI to edit it at all; the fields existed on the model
              (country.model.js) and were completely unreachable. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Tax
            </h3>
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.tax.enabled} onChange={(e) => set("tax.enabled", e.target.checked)} />
                Tax enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.tax.inclusive} onChange={(e) => set("tax.inclusive", e.target.checked)} />
                Prices are tax-inclusive
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Tax rate (%)">
                <input type="number" min="0" max="100" step="0.1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.tax.rate} onChange={(e) => set("tax.rate", Number(e.target.value))} />
              </Field>
              <Field label="Tax label (e.g. VAT, GST)">
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.tax.label} onChange={(e) => set("tax.label", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Shipping defaults — model field existed, no form UI. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Shipping defaults
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Free-shipping threshold (blank = disabled)">
                <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.shipping.freeThreshold ?? ""} onChange={(e) => set("shipping.freeThreshold", e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
              <Field label="Default shipping fee">
                <input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.shipping.defaultFee} onChange={(e) => set("shipping.defaultFee", Number(e.target.value))} />
              </Field>
            </div>
          </div>

          {/* Branding — model field existed, no form UI. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Branding
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Logo URL (blank falls back to HQ logo)">
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.branding.logo} onChange={(e) => set("branding.logo", e.target.value)} />
              </Field>
              <Field label="Primary color (hex, e.g. #6F4E37)">
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.branding.primaryColor} onChange={(e) => set("branding.primaryColor", e.target.value)} placeholder="#6F4E37" />
              </Field>
            </div>
          </div>

          {/* SEO — model field existed, no form UI. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              SEO
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Site name (used in page titles)">
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.seo.siteName} onChange={(e) => set("seo.siteName", e.target.value)} />
              </Field>
              <Field label="TLD (e.g. .gh)">
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.seo.tld} onChange={(e) => set("seo.tld", e.target.value)} placeholder=".gh" />
              </Field>
            </div>
          </div>

          {/* Invoice numbering — model field existed, no form UI. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Invoice numbering
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Invoice prefix">
                <input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.invoiceSeries.prefix} onChange={(e) => set("invoiceSeries.prefix", e.target.value)} />
              </Field>
              <Field label="Next invoice number">
                <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" value={form.invoiceSeries.nextNumber} onChange={(e) => set("invoiceSeries.nextNumber", Number(e.target.value))} />
              </Field>
            </div>
          </div>

          {/* Feature flags — Mixed/JSON on the model, no form UI at all. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Feature flags (JSON)
            </h3>
            <textarea
              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${featureFlagsError ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`}
              rows={4}
              value={featureFlagsText}
              onChange={(e) => onFeatureFlagsChange(e.target.value)}
              placeholder={`{\n  "enableWishlist": true\n}`}
            />
            {featureFlagsError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{featureFlagsError}</p>
            )}
            <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
              Per-country feature flags — enable/disable modules for this market without a code deploy.
            </p>
          </div>

          {/* Content management — preheader promo + storefront contact details.
              These replace the hardcoded Nigeria-only text in the header/footer
              and reflect on this country's domain as soon as they're saved.
              Non-English wording for these fields is edited in
              Translations → Countries. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Storefront content
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Header preheader message (e.g. free-shipping banner)">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.content.preheaderMessage}
                  onChange={(e) => set("content.preheaderMessage", e.target.value)}
                  placeholder="Free shipping on orders over ₦100,000 within Lagos!"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Contact address (footer)">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.contacts.address}
                  onChange={(e) => set("contacts.address", e.target.value)}
                  placeholder="3 Kaffi Street, Alausa, Ikeja, Lagos, Nigeria"
                />
              </Field>
              <Field label="Contact phone">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.contacts.phone}
                  onChange={(e) => set("contacts.phone", e.target.value)}
                  placeholder="+234 805 242 3935"
                />
              </Field>
              <Field label="Contact email">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.contacts.email}
                  onChange={(e) => set("contacts.email", e.target.value)}
                  placeholder="customercare@i-coffee.ng"
                />
              </Field>
              <Field label="WhatsApp number">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.contacts.whatsapp}
                  onChange={(e) => set("contacts.whatsapp", e.target.value)}
                  placeholder="+234 805 242 3935"
                />
              </Field>
            </div>
          </div>

          {/* Tawk.to — each country can run its own agent queue instead of
              sharing one hardcoded widget across every domain. Leave blank to
              fall back to the default (Nigeria) widget. */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">
              Tawk.to live chat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property ID">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.tawk.propertyId}
                  onChange={(e) => set("tawk.propertyId", e.target.value)}
                  placeholder="69319adcb76a89198199fe66"
                />
              </Field>
              <Field label="Widget ID">
                <input
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  value={form.tawk.widgetId}
                  onChange={(e) => set("tawk.widgetId", e.target.value)}
                  placeholder="1jbks9rel"
                />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={save} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              {editingCode ? "Save changes" : "Create country"}
            </button>
            {editingCode && (
              <button onClick={resetForm} className="px-5 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600">
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 dark:text-gray-500">
            New countries start as “Coming Soon”. Configure everything, then Activate to go live — no deployment needed.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500">
          You don’t have permission to manage countries.
        </p>
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
