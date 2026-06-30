//admin
// src/pages/auth/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee, Eye, EyeOff, Shield, Mail, Lock, User, Loader2,
  HelpCircle, CheckCircle, ArrowLeft, Send,
} from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { authAPI, setAuthData, getCurrentUser, isTokenValid } from "../../utils/api";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

// All sub-roles that can log in — identical to ADMIN_SUBROLES in user.model.js
// FOREIGN_ADMIN removed: it was never a real role.
const ADMIN_SUBROLES = [
  { value: "IT",            label: "IT Department" },
  { value: "DIRECTOR",      label: "Director" },
  { value: "MANAGER",       label: "Manager" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES",         label: "Sales Department" },
  { value: "HR",            label: "Human Resources" },
  { value: "WAREHOUSE",     label: "Warehouse" },
  { value: "ACCOUNTANT",    label: "Accounting" },
  { value: "LOGISTICS",     label: "Logistics" },
  { value: "GRAPHICS",      label: "Graphics Design" },
  { value: "EDITOR",        label: "Content Editor" },
];

const AdminLogin = () => {
  const { t } = useAdminTranslation();
  const [formData, setFormData]     = useState({ email: "", password: "", subRole: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");
  const [mode, setMode]             = useState("login"); // 'login' | 'forgot'
  const [forgotEmail,     setForgotEmail]     = useState("");
  const [forgotSubRole,   setForgotSubRole]   = useState("");
  const [forgotSent,      setForgotSent]      = useState(false);
  const [forgotLoading,   setForgotLoading]   = useState(false);
  const [forgotError,     setForgotError]     = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token    = localStorage.getItem("accessToken");
    const userData = getCurrentUser();
    if (token && isTokenValid() && userData?.role === "ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim())  { setError("Please enter your email address"); return; }
    if (!formData.password)      { setError("Please enter your password"); return; }
    if (!formData.subRole)       { setError("Please select your department"); return; }

    setIsLoading(true);
    setError("");
    try {
      const response = await authAPI.login(formData);
      if (response.success || response.data) {
        const { accessToken, refreshToken, user } = response.data || response;
        setAuthData(accessToken, refreshToken, user);
        navigate("/admin", { replace: true });
      } else {
        setError(response.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError("Please enter your email address"); return; }
    if (!forgotSubRole)      { setForgotError("Please select your department"); return; }

    setForgotLoading(true);
    setForgotError("");
    try {
      const res  = await fetch(`${API_BASE}/admin/profile/forgot-password-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), subRole: forgotSubRole }),
      });
      const data = await res.json();
      if (data.success) setForgotSent(true);
      else setForgotError(data.message || "Something went wrong. Please try again.");
    } catch {
      setForgotError("Connection error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const SelectField = ({ value, onChange, disabled }) => (
    <div className="relative">
      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <select
        name="subRole" required
        value={value} onChange={onChange} disabled={disabled}
        className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white disabled:opacity-50 appearance-none"
      >
        <option value="">{t("auth.selectDepartment")}</option>
        {ADMIN_SUBROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">I-COFFEE.NG</h1>
          <p className="text-gray-500 text-sm mt-1">{t("auth.title")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Admin Sign In</h2>
                  <p className="text-xs text-gray-500">Authorized personnel only</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="email" type="email" required
                      value={formData.email} onChange={handleInputChange} disabled={isLoading}
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-gray-50 focus:bg-white disabled:opacity-50 transition-all"
                      placeholder={t("auth.email")}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="password" type={showPassword ? "text" : "password"} required
                      value={formData.password} onChange={handleInputChange} disabled={isLoading}
                      className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-gray-50 focus:bg-white disabled:opacity-50 transition-all"
                      placeholder="Enter your password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <SelectField value={formData.subRole} onChange={handleInputChange} disabled={isLoading} />
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50">
                  {isLoading
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing In...</span>
                    : "Sign In to Dashboard"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <button
                  onClick={() => { setMode("forgot"); setForgotEmail(formData.email); setForgotSubRole(formData.subRole); setForgotError(""); setForgotSent(false); }}
                  className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 mx-auto font-medium">
                  <HelpCircle className="h-4 w-4" /> Forgot your password?
                </button>
                <p className="text-xs text-gray-400 mt-2">{t("auth.itTeamNote")}</p>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === "forgot" && (
            <div className="p-8">
              {!forgotSent ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setMode("login")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Forgot Password?</h2>
                      <p className="text-xs text-gray-500">Notify IT & Manager to reset your access</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-800">
                      Submitting this form will alert your <strong>IT team and Manager</strong> who will reset your password through the admin panel.
                    </p>
                  </div>
                  {forgotError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{forgotError}</p>
                    </div>
                  )}
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                          disabled={forgotLoading} placeholder={t("auth.email")}
                          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 bg-gray-50 focus:bg-white disabled:opacity-50" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Department</label>
                      <SelectField
                        value={forgotSubRole}
                        onChange={e => setForgotSubRole(e.target.value)}
                        disabled={forgotLoading}
                      />
                    </div>
                    <button type="submit" disabled={forgotLoading}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium disabled:opacity-50">
                      {forgotLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Notifying...</> : <><Send className="h-4 w-4" /> Notify IT & Manager</>}
                    </button>
                  </form>
                  <button onClick={() => setMode("login")} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 text-center">
                    ← Back to Sign In
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                  <p className="text-gray-600 text-sm mb-6">Your IT team and Manager have been notified.</p>
                  <button onClick={() => { setMode("login"); setForgotSent(false); }}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700">
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">Authorized personnel only. All access is monitored and logged.</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">{t("auth.systemOnline")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
