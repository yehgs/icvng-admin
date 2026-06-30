/**
 * admin/src/pages/foreign-admins/ForeignAdminManagement.jsx
 *
 * Accessible to DIRECTOR, IT, and MANAGER subRoles.
 * Full CRUD for FOREIGN_ADMIN accounts with multi-subrole assignment.
 *
 * Key changes:
 *  - MANAGER can also create / update (not delete)
 *  - Multi-subrole checkboxes (foreignSubRoles)
 *  - LOGISTICS is never shown as an option
 *  - Promote existing admin to FOREIGN_ADMIN
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, RefreshCw, Globe, User,
  Shield, CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  ChevronDown, ArrowUpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { getCurrentUser } from "../../utils/api.js";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

// Sub-roles that CAN be granted to FOREIGN_ADMIN (never LOGISTICS)
const EXPOSABLE_SUBROLES = [
  { value: "SALES",        label: "Sales" },
  { value: "SALES_MANAGER",label: "Sales Manager" },
  { value: "EDITOR",       label: "Content Editor" },
  { value: "ACCOUNTANT",   label: "Accounting" },
  { value: "HR",           label: "Human Resources" },
  { value: "WAREHOUSE",    label: "Warehouse" },
  { value: "MANAGER",      label: "Manager" },
];

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...options,
  });
  return res.json();
}

const LANG_FLAGS = { en: "🇬🇧", fr: "🇫🇷", it: "🇮🇹" };
const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-700",
  Suspended: "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  name: "", email: "", password: "",
  assignedCountry: "", preferredLanguage: "en", status: "Active",
  foreignSubRoles: [],
};

export default function ForeignAdminManagement() {
  const { t } = useAdminTranslation();
  const { allCountries } = useAdminCountry();
  const currentUser = getCurrentUser();

  // Permission flags
  const canDelete = ["DIRECTOR", "IT"].includes(currentUser?.subRole);
  const canCreate = ["DIRECTOR", "IT", "MANAGER"].includes(currentUser?.subRole);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSubRolePanel, setShowSubRolePanel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filterCountry ? `?countryCode=${filterCountry}` : "";
      const res = await apiFetch(`/admin/foreign-admins${q}`);
      if (res.success) setAdmins(res.data);
      else toast.error(res.message || "Failed to load");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [filterCountry]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowSubRolePanel(false);
    setShowModal(true);
  };

  const openEdit = (admin) => {
    setEditTarget(admin);
    setForm({
      name: admin.name,
      email: admin.email,
      password: "",
      assignedCountry: admin.assignedCountry || "",
      preferredLanguage: admin.preferredLanguage || "en",
      status: admin.status || "Active",
      foreignSubRoles: admin.foreignSubRoles || [],
    });
    setShowSubRolePanel((admin.foreignSubRoles || []).length > 0);
    setShowModal(true);
  };

  const toggleForeignSubRole = (role) => {
    setForm(p => {
      const current = p.foreignSubRoles || [];
      if (current.includes(role)) {
        return { ...p, foreignSubRoles: current.filter(r => r !== role) };
      }
      return { ...p, foreignSubRoles: [...current, role] };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.assignedCountry) {
      toast.error("Name, email and country are required");
      return;
    }
    if (!editTarget && !form.password) {
      toast.error("Password is required for new accounts");
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        const body = {
          assignedCountry: form.assignedCountry,
          preferredLanguage: form.preferredLanguage,
          status: form.status,
          foreignSubRoles: form.foreignSubRoles,
        };
        const res = await apiFetch(`/admin/foreign-admins/${editTarget._id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        if (res.success) {
          toast.success("Foreign admin updated");
          setShowModal(false);
          load();
        } else {
          toast.error(res.message || "Update failed");
        }
      } else {
        const res = await apiFetch("/admin/foreign-admins", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            assignedCountry: form.assignedCountry,
            preferredLanguage: form.preferredLanguage,
            foreignSubRoles: form.foreignSubRoles,
          }),
        });
        if (res.success) {
          toast.success("Foreign admin created successfully");
          setShowModal(false);
          load();
        } else {
          toast.error(res.message || "Creation failed");
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/admin/foreign-admins/${deleteTarget._id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Foreign admin deleted");
        setDeleteTarget(null);
        load();
      } else {
        toast.error(res.message || "Delete failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const getCountryMeta = (code) => allCountries.find(c => c.code === code);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="h-6 w-6 text-sky-600" /> Country Admin Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage foreign admin accounts. Assign countries and additional role access.
            <span className="text-red-500 font-medium"> Logistics access is never permitted for country admins.</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </button>
          {canCreate && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" /> Add Country Admin
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="">All Countries</option>
          {allCountries.map(c => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No country admins found. Click "Add Country Admin" to create one.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {["Name", "Email", "Country", "Extra Roles", "Lang", "Status", "Actions"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {admins.map(admin => {
                const country = getCountryMeta(admin.assignedCountry);
                return (
                  <tr key={admin._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-sky-600" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">{admin.email}</td>
                    <td className="px-6 py-4">
                      {country ? (
                        <span className="flex items-center gap-1.5">
                          <span>{country.flagEmoji}</span>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{country.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">{admin.assignedCountry}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {admin.foreignSubRoles?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {admin.foreignSubRoles.map(r => (
                            <span key={r} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">{r}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Base only</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{LANG_FLAGS[admin.preferredLanguage] || "🌐"} {admin.preferredLanguage?.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[admin.status] || STATUS_COLORS.Active}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canCreate && (
                          <button onClick={() => openEdit(admin)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteTarget(admin)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-sky-600" />
                {editTarget ? "Edit Country Admin" : "Create Country Admin"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Logistics access is permanently restricted for country admins.</p>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  disabled={!!editTarget}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                  required />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  disabled={!!editTarget}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                  required />
              </div>

              {/* Password (create only) */}
              {!editTarget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temporary Password *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Country *</label>
                <select value={form.assignedCountry}
                  onChange={e => setForm(p => ({ ...p, assignedCountry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required>
                  <option value="">— Select country —</option>
                  {allCountries.map(c => <option key={c.code} value={c.code}>{c.flagEmoji} {c.name}</option>)}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Language</label>
                <select value={form.preferredLanguage}
                  onChange={e => setForm(p => ({ ...p, preferredLanguage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="en">🇬🇧 English</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
              </div>

              {/* Status (edit only) */}
              {editTarget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              )}

              {/* ── Additional Sub-Roles ───────────────────────────────────── */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                <button type="button"
                  onClick={() => setShowSubRolePanel(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Additional Role Access
                    {form.foreignSubRoles.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                        {form.foreignSubRoles.length}
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showSubRolePanel ? "rotate-180" : ""}`} />
                </button>
                {showSubRolePanel && (
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Grant additional module access to this country admin. They will only see data for their assigned country in all these sections.
                      <strong className="text-red-500"> Logistics is permanently blocked.</strong>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {EXPOSABLE_SUBROLES.map(sr => (
                        <label key={sr.value}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.foreignSubRoles.includes(sr.value) ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                          <input type="checkbox"
                            checked={form.foreignSubRoles.includes(sr.value)}
                            onChange={() => toggleForeignSubRole(sr.value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{sr.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="p-2.5 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        Logistics — permanently blocked for all country admins
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-60 transition-colors">
                  {saving ? "Saving…" : (editTarget ? "Update" : "Create Admin")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Country Admin?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{deleteTarget.name}</p>
            <p className="text-gray-400 text-xs mb-6">This cannot be undone. The admin will lose all access immediately.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
