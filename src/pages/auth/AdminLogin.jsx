//admin
// src/pages/auth/AdminLogin.jsx  (UPDATED — adds forgot password request)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coffee,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Lock,
  User,
  Loader2,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  Send,
} from "lucide-react";
import {
  authAPI,
  setAuthData,
  getCurrentUser,
  isTokenValid,
} from "../../utils/api";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    subRole: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // 'login' | 'forgot'
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubRole, setForgotSubRole] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userData = getCurrentUser();
    if (token && isTokenValid() && userData && userData.role === "ADMIN") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const adminSubRoles = [
    { value: "IT", label: "IT Department" },
    { value: "DIRECTOR", label: "Director" },
    { value: "MANAGER", label: "Manager" },
    { value: "SALES_MANAGER", label: "Sales Manager" },
    { value: "SALES", label: "Sales Department" },
    { value: "HR", label: "Human Resources" },
    { value: "WAREHOUSE", label: "Warehouse" },
    { value: "ACCOUNTANT", label: "Accounting" },
    { value: "LOGISTICS", label: "Logistics" },
    { value: "GRAPHICS", label: "Graphics Design" },
    { value: "EDITOR", label: "Content Editor" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!formData.password) {
      setError("Please enter your password");
      return;
    }
    if (!formData.subRole) {
      setError("Please select your department");
      return;
    }

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
      setError(
        err?.response?.data?.message || "Connection error. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address");
      return;
    }
    if (!forgotSubRole) {
      setForgotError("Please select your department");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    try {
      const res = await fetch(
        `${API_BASE}/admin/profile/forgot-password-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotEmail.trim(),
            subRole: forgotSubRole,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setForgotSent(true);
      } else {
        setForgotError(
          data.message || "Something went wrong. Please try again.",
        );
      }
    } catch {
      setForgotError("Connection error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">I-COFFEE.NG</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Management System</p>
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
                  <h2 className="text-lg font-bold text-gray-900">
                    Admin Sign In
                  </h2>
                  <p className="text-xs text-gray-500">
                    Authorized personnel only
                  </p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white disabled:opacity-50 transition-all"
                      placeholder="Enter your admin email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white disabled:opacity-50 transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      name="subRole"
                      required
                      value={formData.subRole}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white disabled:opacity-50 appearance-none transition-all"
                    >
                      <option value="">Select your department</option>
                      {adminSubRoles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                    </span>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </button>
              </form>

              {/* Forgot password link */}
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <button
                  onClick={() => {
                    setMode("forgot");
                    setForgotEmail(formData.email);
                    setForgotSubRole(formData.subRole);
                    setForgotError("");
                    setForgotSent(false);
                  }}
                  className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 mx-auto font-medium"
                >
                  <HelpCircle className="h-4 w-4" /> Forgot your password?
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  IT and Manager will be notified to assist you
                </p>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD FLOW ── */}
          {mode === "forgot" && (
            <div className="p-8">
              {!forgotSent ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => setMode("login")}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        Forgot Password?
                      </h2>
                      <p className="text-xs text-gray-500">
                        Notify IT & Manager to reset your access
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-800">
                      Since admin accounts don't use email-based self-reset,
                      submitting this form will send an alert to your{" "}
                      <strong>IT team and Manager</strong> with your details.
                      They will contact you and reset your password through the
                      admin panel.
                    </p>
                  </div>

                  {forgotError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{forgotError}</p>
                    </div>
                  )}

                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          disabled={forgotLoading}
                          placeholder="Enter your admin email"
                          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Department
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          required
                          value={forgotSubRole}
                          onChange={(e) => setForgotSubRole(e.target.value)}
                          disabled={forgotLoading}
                          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white disabled:opacity-50 appearance-none"
                        >
                          <option value="">Select your department</option>
                          {adminSubRoles.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />{" "}
                          Notifying...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" /> Notify IT & Manager
                        </>
                      )}
                    </button>
                  </form>

                  <button
                    onClick={() => setMode("login")}
                    className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 text-center"
                  >
                    ← Back to Sign In
                  </button>
                </>
              ) : (
                /* ── Success state ── */
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Request Sent!
                  </h3>
                  <p className="text-gray-600 text-sm mb-6">
                    Your IT team and Manager have been notified via email with
                    your details. They will reset your password and contact you
                    shortly.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      What happens next
                    </p>
                    {[
                      "IT or Manager receives the email notification",
                      "They verify your identity and reset your password",
                      "You receive your new credentials via email or direct contact",
                    ].map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setMode("login");
                      setForgotSent(false);
                    }}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">
            Authorized personnel only. All access is monitored and logged.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
