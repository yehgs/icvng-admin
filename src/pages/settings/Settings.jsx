import React from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Palette,
} from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full mb-6 shadow-lg">
          <SettingsIcon className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          System Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Configure system preferences, security settings, and user permissions.
          Advanced settings coming soon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <User className="h-8 w-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Profile Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage personal information and preferences
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <Shield className="h-8 w-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Security
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Password, 2FA, and security configurations
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <Bell className="h-8 w-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email and system notification preferences
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <Palette className="h-8 w-8 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Appearance
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Theme, layout, and display preferences
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
            Basic Settings Available
          </h4>
          <p className="text-gray-800 dark:text-gray-300 text-sm">
            Advanced configuration options are being developed for future
            releases.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
