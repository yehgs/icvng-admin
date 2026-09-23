// pages/settings/PaymentGatewaySettings.jsx
//
// Country-scoped indigenous payment gateway settings (CinetPay for Togo/
// Benin today). Modeled directly on BankTransferSettings.jsx, with one
// deliberate difference: this page is NOT IT/DIRECTOR-only. A country-scoped
// MANAGER sees it too (see AdminSidebar.jsx's allowedSubRoles for this
// entry) and can add/edit ONLY their own country's row — the server
// (route/paymentGateway.route.js) enforces that; this page just reflects it
// by locking the country selector to useAdminCountry()'s countryScope
// instead of offering every country in a dropdown.
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { paymentGatewayAPI } from "../../utils/api";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import toast from "react-hot-toast";

const emptyForm = {
  countryCode: "",
  isActive: true,
  isDefault: true,
  mode: "PRODUCTION",
  apiKey: "",
  siteId: "",
};

const PaymentGatewaySettings = () => {
  const { countryScope, isGlobalAdmin } = useAdminCountry();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingExisting, setEditingExisting] = useState(false);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await paymentGatewayAPI.getAllCinetPay();
      setRows(res?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load payment gateway settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const openEdit = (row) => {
    setForm({
      countryCode: row.countryCode,
      isActive: row.setting?.isActive ?? true,
      isDefault: row.setting?.isDefault ?? true,
      mode: row.setting?.mode || "PRODUCTION",
      apiKey: "",
      siteId: "",
    });
    setEditingExisting(!!row.configured);
    setShowSecrets(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingExisting && (!form.apiKey.trim() || !form.siteId.trim())) {
      toast.error("API key and Site ID are required when configuring CinetPay for the first time");
      return;
    }
    setSaving(true);
    try {
      await paymentGatewayAPI.upsertCinetPay(form);
      toast.success(`CinetPay settings saved for ${form.countryCode}`);
      setShowModal(false);
      loadRows();
    } catch (err) {
      toast.error(err?.message || "Failed to save CinetPay settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (countryCode) => {
    if (
      !window.confirm(
        `Remove CinetPay settings for ${countryCode}? Checkout for that country will fall back to Stripe only.`,
      )
    ) {
      return;
    }
    try {
      await paymentGatewayAPI.removeCinetPay(countryCode);
      toast.success(`Removed CinetPay settings for ${countryCode}`);
      loadRows();
    } catch (err) {
      toast.error(err?.message || "Failed to remove CinetPay settings");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2 dark:text-white">
            <CreditCard className="w-6 h-6" />
            Payment Gateway — CinetPay
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
            {isGlobalAdmin
              ? "Country-scoped indigenous gateway keys. A country with no active CinetPay row here — and no CINETPAY_API_KEY_/CINETPAY_SITE_ID_ environment variables set on the server — falls back to Stripe at checkout."
              : `Your CinetPay keys for ${countryScope}. Once active, CinetPay is the default payment method at checkout for ${countryScope} — Stripe remains available for shoppers paying in a foreign currency.`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Credentials</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.countryCode}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {row.countryName} ({row.countryCode})
                  </td>
                  <td className="px-4 py-3">
                    {row.configured && row.setting?.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs dark:bg-green-900/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active — default at checkout
                      </span>
                    ) : row.activeViaEnv ? (
                      <span
                        className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs dark:bg-green-900/20"
                        title="Configured via CINETPAY_API_KEY_/CINETPAY_SITE_ID_ environment variables on the server — adding a row here will take over from those."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active via environment variables
                      </span>
                    ) : row.configured ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs dark:bg-amber-900/20">
                        <XCircle className="w-3.5 h-3.5" /> Disabled — Stripe only
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs dark:bg-gray-700 dark:text-gray-400">
                        <XCircle className="w-3.5 h-3.5" /> Not set — Stripe only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {row.setting?.mode || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {row.setting
                      ? `API key ${row.setting.hasApiKey ? "set" : "missing"} · Site ID ${row.setting.hasSiteId ? "set" : "missing"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {row.configured ? <Edit className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {row.configured ? "Edit" : "Add"}
                    </button>
                    {row.configured && (
                      <button
                        onClick={() => handleRemove(row.countryCode)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium dark:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No countries to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md dark:bg-gray-800">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  CinetPay — {form.countryCode}
                </h2>
                <button type="button" onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active — offer CinetPay at checkout for this country
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Preselect CinetPay by default at checkout (Stripe stays available for
                  foreign-currency shoppers either way)
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                    Mode
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  >
                    <option value="PRODUCTION">Production</option>
                    <option value="TEST">Test (verify against CinetPay's sandbox first)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                      API Key {editingExisting && "(leave blank to keep current)"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSecrets((s) => !s)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showSecrets ? "text" : "password"}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder={editingExisting ? "••••••••" : ""}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-400">
                    Site ID {editingExisting && "(leave blank to keep current)"}
                  </label>
                  <input
                    type={showSecrets ? "text" : "password"}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={form.siteId}
                    onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                    placeholder={editingExisting ? "••••••••" : ""}
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Find these under Integrations in your CinetPay merchant dashboard.
                  Once saved, credentials are encrypted — this page will never show
                  their actual value again, only whether one is set.
                </p>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:hover:text-white dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentGatewaySettings;
