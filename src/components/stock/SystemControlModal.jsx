import React, { useState } from 'react';
import {
  X,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { warehouseAPI } from '../../utils/api';

const SystemControlModal = ({
  isOpen,
  onClose,
  systemEnabled,
  systemSettings,
  onToggleSystem,
  onUpdateSettings,
}) => {
  const [localSettings, setLocalSettings] = useState(systemSettings);
  const [saving, setSaving] = useState(false);

  const handleToggleSystem = async (enabled) => {
    setSaving(true);
    try {
      // Just call the parent function, don't make API calls here
      if (onToggleSystem) {
        await onToggleSystem(enabled);
      }
    } catch (error) {
      toast.error(
        error.message || `Failed to ${enabled ? 'enable' : 'disable'} system`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Just call the parent function, don't make API calls here
      if (onUpdateSettings) {
        await onUpdateSettings(localSettings);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  System Control
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage warehouse stock system settings
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* System Status */}
          <div className="mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    systemEnabled
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-red-100 dark:bg-red-900'
                  }`}
                >
                  {systemEnabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Warehouse Stock System
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {systemEnabled ? 'Currently enabled' : 'Currently disabled'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleSystem(false)}
                  disabled={saving || !systemEnabled}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    !systemEnabled
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-800 dark:bg-gray-700 dark:text-gray-300'
                  } disabled:opacity-50`}
                >
                  Disable
                </button>
                <button
                  onClick={() => handleToggleSystem(true)}
                  disabled={saving || systemEnabled}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    systemEnabled
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800 dark:bg-gray-700 dark:text-gray-300'
                  } disabled:opacity-50`}
                >
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                System Settings
              </h4>

              <div className="space-y-4">
                {/* Auto Sync Setting */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto Sync with Purchase Orders
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically update stock when purchase orders are
                      delivered
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoSyncEnabled}
                    onChange={(e) =>
                      handleSettingChange('autoSyncEnabled', e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={localSettings.lowStockThreshold}
                    onChange={(e) =>
                      handleSettingChange(
                        'lowStockThreshold',
                        parseInt(e.target.value) || 10
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Items below this quantity will be marked as low stock
                  </p>
                </div>

                {/* Critical Stock Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Critical Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={localSettings.lowStockThreshold}
                    value={localSettings.criticalStockThreshold}
                    onChange={(e) =>
                      handleSettingChange(
                        'criticalStockThreshold',
                        parseInt(e.target.value) || 5
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Items below this quantity will be marked as critical stock
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Permission Requirements
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>
                  • Only DIRECTOR and IT roles can enable/disable the system
                </p>
                <p>
                  • Only WAREHOUSE role can edit stock quantities when enabled
                </p>
                <p>• All stock updates are logged for audit purposes</p>
              </div>
            </div>

            {/* Warning */}
            {systemEnabled && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important Notice
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  When the system is enabled, warehouse staff can manually
                  override stock quantities. This should be used carefully and
                  all changes will be tracked.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemControlModal;
