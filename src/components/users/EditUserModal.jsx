// admin
// components/Users/EditUserModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  User,
  Shield,
} from 'lucide-react';

const EditUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  canCreateUser,
  loading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    subRole: '',
    mobile: '',
    address: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const adminSubRoles = [
    'IT',
    'DIRECTOR',
    'SALES',
    'HR',
    'MANAGER',
    'WAREHOUSE',
    'ACCOUNTANT',
    'GRAPHICS',
    'EDITOR',
  ];
  const userSubRoles = ['BTC', 'BTB'];
  const statusOptions = ['Active', 'Inactive', 'Suspended'];

  const getAvailableSubRoles = (role) => {
    return role === 'ADMIN' ? adminSubRoles : userSubRoles;
  };

  // Initialize form with user data
  useEffect(() => {
    if (user && isOpen) {
      const initialData = {
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'USER',
        subRole: user.subRole || '',
        mobile: user.mobile || '',
        address: user.address || '',
        status: user.status || 'Active',
      };
      setFormData(initialData);
      setErrors({});
      setHasChanges(false);
    }
  }, [user, isOpen]);

  // Check for changes
  useEffect(() => {
    if (!user) return;

    const hasDataChanged =
      formData.name !== (user.name || '') ||
      formData.email !== (user.email || '') ||
      formData.role !== (user.role || 'USER') ||
      formData.subRole !== (user.subRole || '') ||
      formData.mobile !== (user.mobile || '') ||
      formData.address !== (user.address || '') ||
      formData.status !== (user.status || 'Active');

    setHasChanges(hasDataChanged);
  }, [formData, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.subRole) {
      newErrors.subRole = 'Department/Sub-role is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (formData.mobile && !/^\+?[\d\s\-\(\)]+$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    // Check permissions for role/subRole changes
    if (
      user &&
      (formData.role !== user.role || formData.subRole !== user.subRole)
    ) {
      if (!canCreateUser(formData.role, formData.subRole)) {
        newErrors.permission =
          'You do not have permission to assign this role/department';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || !hasChanges) {
      return;
    }

    setSubmitting(true);

    try {
      // Only send changed fields
      const changedData = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== (user[key] || '')) {
          changedData[key] = formData[key];
        }
      });

      const result = await onSubmit(changedData);

      if (result.success) {
        setErrors({});
        setHasChanges(false);
        onClose();

        // Show success message
        // alert(result.message || 'User updated successfully!');
        toast.success(result.message || 'User updated successfully!');
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to update user' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset subRole when role changes
      ...(field === 'role' ? { subRole: '' } : {}),
    }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleReset = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'USER',
        subRole: user.subRole || '',
        mobile: user.mobile || '',
        address: user.address || '',
        status: user.status || 'Active',
      });
      setErrors({});
      setHasChanges(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit User
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update user information and permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info Header */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-medium">
                {user.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {user.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  }`}
                >
                  {user.role}
                </span>
                {user.subRole && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-medium">
                    {user.subRole}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                <Shield className="h-4 w-4" />
                <span className="text-sm">{errors.permission}</span>
              </div>
            </div>
          )}

          {/* Has Changes Indicator */}
          {hasChanges && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">You have unsaved changes</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.name
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
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
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.email
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.mobile
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., +234-801-234-5678"
                />
                {errors.mobile && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.mobile}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.role
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
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
                  onChange={(e) => handleInputChange('subRole', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.subRole
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
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

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.status
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.status}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
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
                    You don't have permission to assign this role/department
                    combination.
                  </span>
                </div>
              </div>
            )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={hasChanges ? handleReset : onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {hasChanges ? 'Reset Changes' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                !hasChanges ||
                !canCreateUser(formData.role, formData.subRole)
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update User
                </>
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <div className="text-blue-700 dark:text-blue-400">
              <strong>Note:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                <li>Changes will be applied immediately upon saving</li>
                <li>User will be notified of role/status changes via email</li>
                <li>Some changes may require the user to log in again</li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
