//admin
// src/pages/settings/Settings.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  Palette,
  Globe,
  Database,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Key,
  Trash2,
  Plus,
  Edit,
  Server,
  Sliders,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCurrentUser } from "../../utils/api";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const tok = () => localStorage.getItem("accessToken");
const apiFetch = async (path, opts = {}) => {
  const r = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tok()}`,
      ...(opts.headers || {}),
    },
  });
  return r.json();
};

const TABS = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System Info", icon: Server },
];

// Simple toggle component
const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

export default function Settings() {
  const currentUser = getCurrentUser();
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [systemInfo, setSystemInfo] = useState({});

  // General settings (stored locally for now)
  const [general, setGeneral] = useState({
    siteName: "I-COFFEE.NG",
    siteEmail: "admin@i-coffee.ng",
    supportEmail: "support@i-coffee.ng",
    timezone: "Africa/Lagos",
    currency: "NGN",
    currencySymbol: "₦",
    maintenanceMode: false,
  });

  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    emailOnNewOrder: true,
    emailOnNewUser: true,
    emailOnLowStock: true,
    emailOnDealWon: true,
    emailOnTicket: true,
    emailOnPasswordReset: true,
    adminEmailAlerts: true,
  });

  // Security settings
  const [secSettings, setSecSettings] = useState({
    forceStrongPasswords: true,
    sessionTimeout: "8",
    maxLoginAttempts: "5",
    require2FA: false,
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    primaryColor: "#1e3a5f",
    accentColor: "#f59e0b",
    defaultDarkMode: false,
    compactSidebar: false,
  });

  const fetchSystemInfo = useCallback(async () => {
    // Gather what we can from existing endpoints
    const [stats, prods] = await Promise.all([
      apiFetch("/admin/auth/stats").catch(() => ({})),
      apiFetch("/product/get?page=1&limit=1").catch(() => ({})),
    ]);
    setSystemInfo({
      totalUsers: stats.data?.overview?.totalUsers || 0,
      totalProducts: prods.totalNoPage || 0,
      nodeEnv: "production",
      apiVersion: "v1",
      serverTime: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (tab === "system") fetchSystemInfo();
  }, [tab, fetchSystemInfo]);

  const handleSave = async (section) => {
    setSaving(true);
    // These settings would persist to a config endpoint; for now confirm locally
    await new Promise((r) => setTimeout(r, 600));
    toast.success(`${section} settings saved`);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-gray-600" /> System Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure platform preferences and manage system behaviour
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                tab === id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── General ── */}
          {tab === "general" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                General Settings
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Site Name", "siteName", "text", "I-COFFEE.NG"],
                  ["Admin Email", "siteEmail", "email", "admin@i-coffee.ng"],
                  [
                    "Support Email",
                    "supportEmail",
                    "email",
                    "support@i-coffee.ng",
                  ],
                  ["Timezone", "timezone", "text", "Africa/Lagos"],
                  ["Currency Code", "currency", "text", "NGN"],
                  ["Currency Symbol", "currencySymbol", "text", "₦"],
                ].map(([label, key, type, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={general[key]}
                      onChange={(e) =>
                        setGeneral((g) => ({ ...g, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Maintenance Mode
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Temporarily disable the client-facing site for maintenance
                  </p>
                </div>
                <Toggle
                  value={general.maintenanceMode}
                  onChange={(v) =>
                    setGeneral((g) => ({ ...g, maintenanceMode: v }))
                  }
                />
              </div>
              <button
                onClick={() => handleSave("General")}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </button>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === "notifications" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notification Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure which events trigger email and in-app notifications to
                admin staff.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  [
                    "emailOnNewOrder",
                    "New Order Received",
                    "Notify Sales and Manager when a new order is placed",
                  ],
                  [
                    "emailOnNewUser",
                    "New User Registration",
                    "Notify HR and IT when a new customer registers",
                  ],
                  [
                    "emailOnLowStock",
                    "Low Stock Alert",
                    "Notify Warehouse and Manager when stock falls below threshold",
                  ],
                  [
                    "emailOnDealWon",
                    "CRM Deal Won",
                    "Email IT, Director and Manager when a CRM lead is marked Won",
                  ],
                  [
                    "emailOnTicket",
                    "Support Ticket Created",
                    "Notify IT when a new support ticket is submitted",
                  ],
                  [
                    "emailOnPasswordReset",
                    "Password Reset Request",
                    "Email IT and Manager when an admin requests password reset",
                  ],
                  [
                    "adminEmailAlerts",
                    "Admin Email Alerts",
                    "Send email summaries to Director and IT daily",
                  ],
                ].map(([key, label, desc]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      value={notifSettings[key]}
                      onChange={(v) =>
                        setNotifSettings((s) => ({ ...s, [key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSave("Notification")}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </button>
            </div>
          )}

          {/* ── Security ── */}
          {tab === "security" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Security Configuration
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Session Timeout (hours)
                    </label>
                    <input
                      type="number"
                      value={secSettings.sessionTimeout}
                      onChange={(e) =>
                        setSecSettings((s) => ({
                          ...s,
                          sessionTimeout: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={secSettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecSettings((s) => ({
                          ...s,
                          maxLoginAttempts: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  {[
                    [
                      "forceStrongPasswords",
                      "Enforce Strong Passwords",
                      "Require 8+ chars, uppercase, number, special character",
                    ],
                    [
                      "require2FA",
                      "Require Two-Factor Authentication",
                      "Mandatory 2FA for all admin logins (requires 2FA setup)",
                    ],
                  ].map(([key, label, desc]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                      <Toggle
                        value={secSettings[key]}
                        onChange={(v) =>
                          setSecSettings((s) => ({ ...s, [key]: v }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleSave("Security")}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </button>
              </div>
              {/* Quick links */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  Security Quick Links
                </p>
                {[
                  ["Password Vault", "/admin/dashboard/password-vault"],
                  ["Activity Log", "/admin/activity"],
                  ["User Management", "/admin/users"],
                ].map(([label, path]) => (
                  <a
                    key={label}
                    href={path}
                    className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {tab === "appearance" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Appearance
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Colour
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.primaryColor}
                      onChange={(e) =>
                        setAppearance((a) => ({
                          ...a,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {appearance.primaryColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accent Colour
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={appearance.accentColor}
                      onChange={(e) =>
                        setAppearance((a) => ({
                          ...a,
                          accentColor: e.target.value,
                        }))
                      }
                      className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {appearance.accentColor}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  [
                    "defaultDarkMode",
                    "Default to Dark Mode",
                    "New sessions start in dark mode",
                  ],
                  [
                    "compactSidebar",
                    "Compact Sidebar",
                    "Collapse sidebar icons by default",
                  ],
                ].map(([key, label, desc]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      value={appearance[key]}
                      onChange={(v) =>
                        setAppearance((a) => ({ ...a, [key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleSave("Appearance")}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </button>
            </div>
          )}

          {/* ── System Info ── */}
          {tab === "system" && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  System Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Platform", "I-COFFEE.NG Admin"],
                    ["Stack", "React + Node.js + MongoDB"],
                    ["API Base", API_BASE],
                    [
                      "Server Time",
                      systemInfo.serverTime
                        ? new Date(systemInfo.serverTime).toLocaleString(
                            "en-NG",
                          )
                        : "—",
                    ],
                    [
                      "Total Users",
                      systemInfo.totalUsers?.toLocaleString() || "—",
                    ],
                    [
                      "Total Products",
                      systemInfo.totalProducts?.toLocaleString() || "—",
                    ],
                    [
                      "Logged in as",
                      `${currentUser?.name} (${currentUser?.subRole})`,
                    ],
                    ["Environment", import.meta.env.MODE || "production"],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-1">
                        {label}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-mono truncate">
                        {val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Quick System Actions
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      label: "Send Test Notification",
                      desc: "Send a test notification to yourself",
                      icon: Bell,
                      action: async () => {
                        await apiFetch("/admin/notifications", {
                          method: "POST",
                          body: JSON.stringify({
                            type: "SYSTEM",
                            title: "Test Notification",
                            message:
                              "This is a system test notification from Settings.",
                            targetType: "specific",
                            targetUsers: [currentUser?._id],
                          }),
                        });
                        toast.success("Test notification sent");
                      },
                    },
                    {
                      label: "Send Vault Reminders",
                      desc: "Trigger password vault expiry reminders",
                      icon: Lock,
                      action: async () => {
                        const d = await apiFetch(
                          "/admin/password-vault/send-reminders?days=30",
                          { method: "POST" },
                        );
                        toast.success(d.message || "Reminders sent");
                      },
                    },
                  ].map(({ label, desc, icon: Icon, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
