// pages/settings/BankTransferSettings.jsx
//
// IT/DIRECTOR-only settings page: add/edit/update the Direct Bank Transfer
// receiving-account details for each country. If a country has no active
// setting here, that country's storefront checkout only offers Stripe
// (see controllers/bankTransferSettings.controller.js#getAvailablePaymentMethods
// and DirectBankTransferOrderController on the server).
import React, { useState, useEffect } from "react";
import {
  Landmark,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { bankTransferSettingsAPI } from "../../utils/api";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const emptyForm = {
  countryCode: "",
  isActive: true,
  bankName: "",
  accountName: "",
  accountNumber: "",
  sortCode: "",
  currencyCode: "",
  instructions: "",
};

const BankTransferSettings = () => {
  const { t } = useAdminTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await bankTransferSettingsAPI.getAll();
      setRows(res?.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load bank transfer settings");
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
      bankName: row.setting?.bankName || "",
      accountName: row.setting?.accountName || "",
      accountNumber: row.setting?.accountNumber || "",
      sortCode: row.setting?.sortCode || "",
      currencyCode: row.setting?.currencyCode || row.currencyCode || "",
      instructions: row.setting?.instructions || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.bankName.trim() || !form.accountName.trim() || !form.accountNumber.trim()) {
      toast.error("Bank name, account name, and account number are required");
      return;
    }
    setSaving(true);
    try {
      await bankTransferSettingsAPI.upsert(form);
      toast.success(`Bank transfer settings saved for ${form.countryCode}`);
      setShowModal(false);
      loadRows();
    } catch (err) {
      toast.error(err?.message || "Failed to save bank transfer settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (countryCode) => {
    if (!window.confirm(`Remove bank transfer settings for ${countryCode}? Checkout for that country will fall back to Stripe only.`)) {
      return;
    }
    try {
      await bankTransferSettingsAPI.remove(countryCode);
      toast.success(`Removed bank transfer settings for ${countryCode}`);
      loadRows();
    } catch (err) {
      toast.error(err?.message || "Failed to remove bank transfer settings");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6" />
            Direct Bank Transfer Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Country-scoped receiving-account details. A country with no
            active setting here only offers Stripe at checkout.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Bank / Account</th>
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.countryCode}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.countryName} ({row.countryCode})
                  </td>
                  <td className="px-4 py-3">
                    {row.configured && row.setting?.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active — Bank Transfer offered
                      </span>
                    ) : row.configured ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Disabled — Stripe only
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                        <XCircle className="w-3.5 h-3.5" /> Not set — Stripe only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.setting
                      ? `${row.setting.bankName} — ${row.setting.accountName} (${row.setting.accountNumber})`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {row.setting?.currencyCode || row.currencyCode}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      {row.configured ? <Edit className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {row.configured ? "Edit" : "Add"}
                    </button>
                    {row.configured && (
                      <button
                        onClick={() => handleRemove(row.countryCode)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Bank Transfer — {form.countryCode}
                </h2>
                <button type="button" onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active — offer Bank Transfer at checkout for this country
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name *</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Account Name *</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Account Number / IBAN *</label>
                  <input
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sort Code (optional)</label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={form.sortCode}
                      onChange={(e) => setForm({ ...form, sortCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Currency *</label>
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      value={form.currencyCode}
                      onChange={(e) => setForm({ ...form, currencyCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Instructions shown to customer (optional)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    rows={3}
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
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

export default BankTransferSettings;
