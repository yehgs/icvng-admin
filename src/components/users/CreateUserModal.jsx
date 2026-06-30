//admin
import React, { useState } from "react";
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const CreateUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  canCreateUser,
  loading,
}) => {
  const { t } = useAdminTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    userMode: "",
    subRole: "",
    mobile: "",
    address: "",
    scope: "GLOBAL",
    assignedCountry: "",
    preferredLanguage: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const adminSubRoles = [
    "IT",
    "DIRECTOR",
    "SALES",
    "HR",
    "MANAGER",
    "WAREHOUSE",
    "ACCOUNTANT",
    "LOGISTICS",
    "GRAPHICS",
    "EDITOR",
  ];
  const userSubRoles = ["BTC", "BTB"];

  const getAvailableSubRoles = (role) => {
    return role === "ADMIN" ? adminSubRoles : userSubRoles;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (!formData.subRole) {
      newErrors.subRole = "Department/Sub-role is required";
    }

    if (
      formData.role === "ADMIN" &&
      formData.subRole === "SALES" &&
      !formData.userMode
    ) {
      newErrors.userMode = "Sales mode is required for ADMIN > SALES users";
    }

    if (formData.mobile && !/^\+?[\d\s\-()]+$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid mobile number";
    }

    // Check permissions
    // COUNTRY scope requires an assigned country
    if (formData.role === "ADMIN" && formData.scope === "COUNTRY" && !formData.assignedCountry) {
      newErrors.assignedCountry = "Please select an assigned country for country-scoped admins";
    }

    // IT, DIRECTOR, LOGISTICS cannot be country-scoped
    if (["IT", "DIRECTOR", "LOGISTICS"].includes(formData.subRole) && formData.scope === "COUNTRY") {
      newErrors.scope = "IT, Director and Logistics must always have global access";
    }

    if (!canCreateUser(formData.role, formData.subRole)) {
      newErrors.permission =
        "You do not have permission to create this type of user";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSubmit(formData);

      if (result.success) {
        // Reset form and close modal
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "USER",
          subRole: "",
          mobile: "",
          address: "",
        });
        setErrors({});
        onClose();

        // Show success message
        toast.success(result.message || "User created successfully!");
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: error.message || "Failed to create user" });
      toast.error(error.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset subRole when role changes
      ...(field === "role" ? { subRole: "", scope: "GLOBAL", assignedCountry: "" } : {}),
      ...(field === "scope" && value === "GLOBAL" ? { assignedCountry: "" } : {}),
      ...(field === "subRole" && ["IT", "DIRECTOR", "LOGISTICS"].includes(value) ? { scope: "GLOBAL", assignedCountry: "" } : {}),
    }));

    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "role" ? { subRole: "", userMode: "" } : {}),
      ...(field === "subRole" && value !== "SALES" ? { userMode: "" } : {}),
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
    setShowPassword(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New User
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Permission Error */}
          {errors.permission && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.permission}</span>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.name
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.email
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Temporary Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={`w-full px-3 py-2 pr-20 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.password
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Enter temporary password"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3">
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  title="Generate Password"
                >
                  Gen
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              User will receive this password via email and should change it on
              first login.
            </p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.role
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {/* <option value="USER">User</option> */}
              <option value="ADMIN">{t("userManagement.admin")}</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.role}
              </p>
            )}
          </div>

          {/* Sub-Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department/Sub-Role *
            </label>
            <select
              value={formData.subRole}
              onChange={(e) => handleInputChange("subRole", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.subRole
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="">Select department...</option>
              {getAvailableSubRoles(formData.role).map((subRole) => (
                <option key={subRole} value={subRole}>
                  {subRole}
                </option>
              ))}
            </select>
            {errors.subRole && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.subRole}
              </p>
            )}
          </div>

          {/* Sales Mode */}
          {/* Country Scope — only for ADMIN users who are not IT/DIRECTOR/LOGISTICS */}
          {formData.role === "ADMIN" && !["IT", "DIRECTOR", "LOGISTICS"].includes(formData.subRole) && formData.subRole && (
            <div className="border border-blue-100 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Country Admin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Restrict this user to a specific country's data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.scope === "COUNTRY"}
                    onChange={e => {
                      const isCountry = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        scope: isCountry ? "COUNTRY" : "GLOBAL",
                        assignedCountry: isCountry ? prev.assignedCountry : "",
                      }));
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
              {formData.scope === "COUNTRY" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.assignedCountry}
                    onChange={e => handleInputChange("assignedCountry", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white ${errors.assignedCountry ? "border-red-300" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    <option value="">Select country…</option>
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="TG">🇹🇬 Togo</option>
                    <option value="BJ">🇧🇯 Benin</option>
                    <option value="IT">🇮🇹 Italy</option>
                  </select>
                  {errors.assignedCountry && <p className="mt-1 text-xs text-red-600">{errors.assignedCountry}</p>}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Language</label>
                    <select
                      value={formData.preferredLanguage}
                      onChange={e => handleInputChange("preferredLanguage", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="it">Italiano</option>
                    </select>
                  </div>
                </div>
              )}
              {errors.scope && <p className="text-xs text-red-600 mt-1">{errors.scope}</p>}
            </div>
          )}

          {formData.role === "ADMIN" && formData.subRole === "SALES" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sales Mode *
              </label>
              <select
                value={formData.userMode}
                onChange={(e) => handleInputChange("userMode", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.userMode
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Select sales mode...</option>
                <option value="ONLINE">{t("customer.online")}</option>
                <option value="OFFLINE">{t("customer.offline")}</option>
              </select>
              {errors.userMode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.userMode}
                </p>
              )}
            </div>
          )}

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.mobile
                  ? "border-red-300 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="e.g., +234-801-234-5678"
            />
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.mobile}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter address"
            />
          </div>

          {/* Permission Notice */}
          {formData.role &&
            formData.subRole &&
            !canCreateUser(formData.role, formData.subRole) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    You don't have permission to create this type of user.
                    Please contact your administrator.
                  </span>
                </div>
              </div>
            )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                !canCreateUser(formData.role, formData.subRole)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Create User
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <div className="text-blue-700 dark:text-blue-400">
              <strong>What happens next:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                <li>
                  User will receive a welcome email with login credentials
                </li>
                <li>
                  They'll be prompted to change their password on first login
                </li>
                <li>Account will be activated and ready to use immediately</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
