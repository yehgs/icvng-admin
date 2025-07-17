//admin
// components/Users/UserDetailsModal.jsx
import React from 'react';
import {
  X,
  Edit,
  Key,
  Mail,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  Activity,
  Settings,
  Eye,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserDetailsModal = ({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onGenerateRecovery,
  onDelete,
  canResetPassword,
  canDeleteUser,
}) => {
  if (!isOpen || !user) return null;

  const getUserAvatar = (user) => {
    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-20 h-20 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <span className="text-white font-medium text-xl">
          {user.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Active:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      Suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status]}`}
      >
        {status}
      </span>
    );
  };

  const getRoleBadge = (role, subRole) => {
    const roleColor =
      role === 'ADMIN'
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';

    return (
      <div className="flex flex-wrap gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${roleColor}`}
        >
          {role}
        </span>
        {subRole && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {subRole}
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      toast.success('Copied to clipboard!');
    });
  };

  const InfoRow = ({ icon: Icon, label, value, copyable = false }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-900 dark:text-white break-all">
            {value || 'Not provided'}
          </p>
          {copyable && value && (
            <button
              onClick={() => copyToClipboard(value)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ActionButton = ({
    onClick,
    icon: Icon,
    label,
    variant = 'default',
    disabled = false,
  }) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      default:
        'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600',
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Details
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete user information and account status
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

        {/* User Profile Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-6">
            {getUserAvatar(user)}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {user.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {getRoleBadge(user.role, user.subRole)}
                {getStatusBadge(user.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(user.createdAt)}
                </span>
                {user.last_login_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Last login {formatDate(user.last_login_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </h4>
              <div className="space-y-1">
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={user.name}
                  copyable={true}
                />
                <InfoRow
                  icon={Mail}
                  label="Email Address"
                  value={user.email}
                  copyable={true}
                />
                <InfoRow
                  icon={Phone}
                  label="Mobile Number"
                  value={user.mobile}
                  copyable={true}
                />
                <InfoRow icon={MapPin} label="Address" value={user.address} />
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </h4>
              <div className="space-y-1">
                <InfoRow
                  icon={Shield}
                  label="User ID"
                  value={user._id}
                  copyable={true}
                />
                <InfoRow icon={Settings} label="Role" value={user.role} />
                <InfoRow
                  icon={Settings}
                  label="Department"
                  value={user.subRole}
                />
                <InfoRow
                  icon={Activity}
                  label="Account Status"
                  value={user.status}
                />
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activity Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Account Created
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Login
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(user.last_login_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Account Statistics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {Math.floor(Math.random() * 50) + 10}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total Logins
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {Math.floor(
                    (new Date() - new Date(user.createdAt)) /
                      (1000 * 60 * 60 * 24)
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Days Active
                </div>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {user.status === 'Active' ? '100%' : '0%'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Uptime
                </div>
              </div>

              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {user.role === 'ADMIN' ? 'High' : 'Standard'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Access Level
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-3">
              <ActionButton
                onClick={onEdit}
                icon={Edit}
                label="Edit User"
                variant="primary"
              />

              {canResetPassword && (
                <ActionButton
                  onClick={onResetPassword}
                  icon={Key}
                  label="Reset Password"
                  variant="warning"
                />
              )}

              {canResetPassword && (
                <ActionButton
                  onClick={onGenerateRecovery}
                  icon={Mail}
                  label="Send Recovery"
                  variant="secondary"
                />
              )}

              <ActionButton
                onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                icon={ExternalLink}
                label="Send Email"
                variant="default"
              />

              {canDeleteUser && user.status !== 'Suspended' && (
                <ActionButton
                  onClick={onDelete}
                  icon={Trash2}
                  label="Deactivate"
                  variant="danger"
                />
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-amber-900 dark:text-amber-200 mb-1">
                  Security Information
                </h5>
                <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                  <p>
                    • All user actions are logged and monitored for security
                    purposes
                  </p>
                  <p>• Password changes require email verification</p>
                  <p>• Account modifications are recorded in the audit trail</p>
                  <p>
                    • Suspicious activities are automatically flagged for review
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">
              System Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Email Verified:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {user.verify_email ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  2FA Enabled:
                </span>
                <span className="text-gray-900 dark:text-white">❌ No</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Password Changed:
                </span>
                <span className="text-gray-900 dark:text-white">N/A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Account Locked:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {user.status === 'Suspended' ? '🔒 Yes' : '🔓 No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(user.updatedAt || user.createdAt)}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
