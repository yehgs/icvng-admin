//admin
// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
  Edit3,
  Key,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { getCurrentUser, clearAuthData } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  return res.json();
}

const ROLE_COLORS = {
  DIRECTOR: "bg-purple-100 text-purple-700 border-purple-200",
  IT: "bg-blue-100 text-blue-700 border-blue-200",
  MANAGER: "bg-indigo-100 text-indigo-700 border-indigo-200",
  SALES: "bg-green-100 text-green-700 border-green-200",
  HR: "bg-pink-100 text-pink-700 border-pink-200",
  EDITOR: "bg-amber-100 text-amber-700 border-amber-200",
  ACCOUNTANT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  WAREHOUSE: "bg-orange-100 text-orange-700 border-orange-200",
  LOGISTICS: "bg-cyan-100 text-cyan-700 border-cyan-200",
  DESIGNER: "bg-rose-100 text-rose-700 border-rose-200",
};

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const colors = [
    "bg-red-400",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-green-500",
  ];
  const labels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-gray-200 dark:bg-gray-700"}`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${score <= 2 ? "text-red-500" : score === 3 ? "text-yellow-500" : "text-green-500"}`}
      >
        {labels[score]}
      </p>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div
            key={c.label}
            className={`text-xs flex items-center gap-1 ${c.pass ? "text-green-600" : "text-gray-400"}`}
          >
            <CheckCircle
              className={`h-3 w-3 ${c.pass ? "text-green-500" : "text-gray-300"}`}
            />{" "}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useAdminTranslation();
  const avatarInputRef = useRef();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    mobile: "",
    bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const d = await apiFetch("/admin/profile/me");
      if (d.success) {
        setProfile(d.data);
        setProfileForm({
          name: d.data.name || "",
          mobile: d.data.mobile || "",
          bio: d.data.bio || "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem("accessToken");
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/admin/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (d.success) {
        setProfile((p) => ({ ...p, avatar: d.data.avatar }));
        // Update localStorage user data
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...stored, avatar: d.data.avatar }),
        );
        toast.success("Avatar updated!");
      } else toast.error(d.message || "Failed to upload");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingProfile(true);
    try {
      const d = await apiFetch("/admin/profile/update", {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      if (d.success) {
        setProfile((p) => ({ ...p, ...profileForm }));
        // Sync localStorage
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            name: profileForm.name,
            mobile: profileForm.mobile,
          }),
        );
        toast.success("Profile updated!");
      } else toast.error(d.message || t("orders.statuses.FAILED"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !pwForm.currentPassword ||
      !pwForm.newPassword ||
      !pwForm.confirmPassword
    ) {
      toast.error("All fields required");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      const d = await apiFetch("/admin/profile/change-password", {
        method: "PUT",
        body: JSON.stringify(pwForm),
      });
      if (d.success) {
        toast.success("Password changed! Signing you out...");
        setTimeout(() => {
          clearAuthData();
          navigate("/login");
        }, 2000);
      } else toast.error(d.message || t("orders.statuses.FAILED"));
    } finally {
      setSavingPw(false);
    }
  };

  const togglePw = (field) =>
    setShowPasswords((p) => ({ ...p, [field]: !p[field] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const roleColor =
    ROLE_COLORS[profile?.subRole] ||
    "bg-gray-100 text-gray-700 border-gray-200";
  const initials =
    profile?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Hero banner ── */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative px-8 py-8 flex items-end gap-6">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="h-24 w-24 rounded-2xl ring-4 ring-white/30 overflow-hidden shadow-2xl">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              {uploadingAvatar ? (
                <RefreshCw className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          {/* Identity */}
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
            <p className="text-white/70 text-sm mt-0.5">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleColor}`}
              >
                {profile?.role} — {profile?.subRole}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile?.status === t("common.active") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {profile?.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "security", label: "Change Password", icon: Lock },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center transition-colors ${
              activeTab === id
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit form */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-blue-500" /> Edit Profile
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full pl-9 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={profile?.email || ""}
                  disabled
                  className="w-full pl-9 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Email can only be changed by IT or Director
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={profileForm.mobile}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, mobile: e.target.value }))
                  }
                  placeholder="+234..."
                  className="w-full pl-9 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio / About
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, bio: e.target.value }))
                }
                rows={3}
                placeholder="Tell us a bit about yourself..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {savingProfile ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingProfile ? "Saving..." : t("settings.save")}
            </button>
          </div>

          {/* Info card */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Account Details
              </h3>
              {[
                { label: "Role", value: profile?.role, icon: Shield },
                {
                  label: "Department",
                  value: profile?.subRole,
                  icon: Building2,
                },
                { label: t("common.status"), value: profile?.status, icon: CheckCircle },
                {
                  label: "Last Login",
                  value: profile?.last_login_date
                    ? new Date(profile.last_login_date).toLocaleDateString(
                        "en-NG",
                        { day: "numeric", month: "short", year: "numeric" },
                      )
                    : "N/A",
                  icon: Calendar,
                },
                {
                  label: "Member Since",
                  value: profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A",
                  icon: Calendar,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Icon className="h-4 w-4" /> {label}
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {value || "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Avatar tip */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> Update your avatar
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">
                Hover over your profile photo and click to upload a new image
                (JPG, PNG — max 5MB).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Security tab ── */}
      {activeTab === "security" && (
        <div className="max-w-lg">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-blue-500" /> Change Password
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                After changing your password you will be signed out
                automatically.
              </p>
            </div>

            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      currentPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter your current password"
                  className="w-full pl-9 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={() => togglePw("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password"
                  className="w-full pl-9 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={() => togglePw("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordStrength password={pwForm.newPassword} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={pwForm.confirmPassword}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={() => togglePw("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {pwForm.confirmPassword &&
                pwForm.newPassword !== pwForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
              {pwForm.confirmPassword &&
                pwForm.newPassword === pwForm.confirmPassword &&
                pwForm.newPassword && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Passwords match
                  </p>
                )}
            </div>

            <button
              onClick={handleChangePassword}
              disabled={
                savingPw ||
                pwForm.newPassword !== pwForm.confirmPassword ||
                !pwForm.currentPassword
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingPw ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              {savingPw ? "Changing Password..." : "Change Password & Sign Out"}
            </button>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Changing your password will immediately sign you out of all
                sessions. You will need to log in again with your new password.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
