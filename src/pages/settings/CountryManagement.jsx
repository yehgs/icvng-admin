// src/pages/settings/CountryManagement.jsx
//
// PHASE 6 — HQ country onboarding UI. A DIRECTOR/IT (countries.manage) can
// create a new market, configure currency/language/domain/payments, and
// activate it — the acceptance test for the whole program (onboard Ghana with
// no code deploy). Gated by the RBAC capability system.

import React, { useEffect, useState } from "react";
import { countryAPI } from "../../utils/api";
import { useCapabilities, Can } from "../../contexts/CapabilitiesContext";

const EMPTY = {
  code: "",
  name: "",
  status: "COMING_SOON",
  domain: "",
  currency: { code: "", symbol: "", name: "", decimals: 2 },
  language: { default: "en", supported: ["en"] },
  timezone: "",
  phonePrefix: "",
  flagEmoji: "",
  payments: { paystack: false, stripe: false },
  tax: { enabled: false, rate: 0, label: "VAT" },
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
  }

  async function save() {
    setMsg(null);
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
      contacts: { ...EMPTY.contacts, ...(c.contacts || {}) },
      content: { ...EMPTY.content, ...(c.content || {}) },
      tawk: { ...EMPTY.tawk, ...(c.tawk || {}) },
    });
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Countries</h1>
          <p className="text-sm text-gray-500">
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : (
              countries.map((c) => (
                <tr key={c.code} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">
                    {c.flagEmoji} {c.name}
                    {c.isHQ && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        HQ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.code}</td>
                  <td className="px-4 py-3">{c.currency?.code}</td>
                  <td className="px-4 py-3 text-gray-500">{c.domain}</td>
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
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                      {!c.isHQ &&
                        (c.status === "ACTIVE" ? (
                          <button
                            onClick={() => changeStatus(c.code, "INACTIVE")}
                            className="text-gray-500 hover:underline"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => changeStatus(c.code, "ACTIVE")}
                            className="text-green-600 hover:underline"
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCode ? `Edit ${editingCode}` : "Add a country"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Code (e.g. GH)">
              <input
                className="input"
                value={form.code}
                disabled={!!editingCode}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Name (e.g. Ghana)">
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Flag emoji">
              <input className="input" value={form.flagEmoji} onChange={(e) => set("flagEmoji", e.target.value)} />
            </Field>
            <Field label="Domain (e.g. i-coffee.gh)">
              <input className="input" value={form.domain} onChange={(e) => set("domain", e.target.value)} />
            </Field>
            <Field label="Currency code (e.g. GHS)">
              <input className="input" value={form.currency.code} onChange={(e) => set("currency.code", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Currency symbol">
              <input className="input" value={form.currency.symbol} onChange={(e) => set("currency.symbol", e.target.value)} />
            </Field>
            <Field label="Default language">
              <select className="input" value={form.language.default} onChange={(e) => set("language.default", e.target.value)}>
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Timezone">
              <input className="input" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Africa/Accra" />
            </Field>
            <Field label="Phone prefix">
              <input className="input" value={form.phonePrefix} onChange={(e) => set("phonePrefix", e.target.value)} placeholder="+233" />
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

          {/* Content management — preheader promo + storefront contact details.
              These replace the hardcoded Nigeria-only text in the header/footer
              and reflect on this country's domain as soon as they're saved.
              Non-English wording for these fields is edited in
              Translations → Countries. */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Storefront content
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Header preheader message (e.g. free-shipping banner)">
                <input
                  className="input"
                  value={form.content.preheaderMessage}
                  onChange={(e) => set("content.preheaderMessage", e.target.value)}
                  placeholder="Free shipping on orders over ₦100,000 within Lagos!"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Contact address (footer)">
                <input
                  className="input"
                  value={form.contacts.address}
                  onChange={(e) => set("contacts.address", e.target.value)}
                  placeholder="3 Kaffi Street, Alausa, Ikeja, Lagos, Nigeria"
                />
              </Field>
              <Field label="Contact phone">
                <input
                  className="input"
                  value={form.contacts.phone}
                  onChange={(e) => set("contacts.phone", e.target.value)}
                  placeholder="+234 805 242 3935"
                />
              </Field>
              <Field label="Contact email">
                <input
                  className="input"
                  value={form.contacts.email}
                  onChange={(e) => set("contacts.email", e.target.value)}
                  placeholder="customercare@i-coffee.ng"
                />
              </Field>
              <Field label="WhatsApp number">
                <input
                  className="input"
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
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Tawk.to live chat
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Property ID">
                <input
                  className="input"
                  value={form.tawk.propertyId}
                  onChange={(e) => set("tawk.propertyId", e.target.value)}
                  placeholder="69319adcb76a89198199fe66"
                />
              </Field>
              <Field label="Widget ID">
                <input
                  className="input"
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
              <button onClick={resetForm} className="px-5 py-2 rounded-lg text-sm border border-gray-300">
                Cancel
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            New countries start as “Coming Soon”. Configure everything, then Activate to go live — no deployment needed.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          You don’t have permission to manage countries.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
