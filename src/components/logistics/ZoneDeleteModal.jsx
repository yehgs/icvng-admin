// admin/src/components/logistics/ZoneDeleteModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Package,
  Loader2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { logisticsAPI } from '../../utils/api.js';

const ZoneDeleteModal = ({ isOpen, onClose, onConfirm, zone, loading }) => {
  const [dependencies, setDependencies] = useState(null);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen && zone) {
      fetchDependencies();
    }
  }, [isOpen, zone]);

  const fetchDependencies = async () => {
    try {
      setLoadingDeps(true);
      const result = await logisticsAPI.getZoneDependencies(zone._id);

      if (result.success) {
        setDependencies(result.data);
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      // Show error to user
      setDependencies({
        hasDependencies: false,
        dependentMethods: [],
        error: true,
      });
    } finally {
      setLoadingDeps(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(zone._id, cascadeDelete);
    handleClose();
  };

  const handleClose = () => {
    setCascadeDelete(false);
    setConfirmText('');
    onClose();
  };

  const isConfirmationValid =
    confirmText.toLowerCase() === 'delete' ||
    (cascadeDelete && confirmText.toLowerCase() === 'delete all');

  if (!isOpen || !zone) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Shipping Zone
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Zone: {zone.name} ({zone.code})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loadingDeps ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Checking dependencies...
              </span>
            </div>
          ) : dependencies ? (
            <>
              {dependencies.hasDependencies ? (
                <>
                  {/* Warning Message */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                          Zone Has Dependencies
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                          This zone is currently being used by{' '}
                          {dependencies.dependentMethods.length} shipping
                          method(s). You must decide how to handle them.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dependent Methods List */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dependent Shipping Methods:
                    </h4>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-200 dark:divide-gray-600 max-h-60 overflow-y-auto">
                      {dependencies.dependentMethods.map((method) => (
                        <div
                          key={method._id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {method.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Code: {method.code} • Type:{' '}
                                  {method.type.replace('_', ' ').toUpperCase()}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                method.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {method.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cascade Delete Option */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cascadeDelete}
                        onChange={(e) => setCascadeDelete(e.target.checked)}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 dark:bg-gray-700"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-red-900 dark:text-red-200">
                          Delete zone and all dependent shipping methods
                        </span>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                          This will permanently delete the zone and all{' '}
                          {dependencies.dependentMethods.length} shipping
                          method(s) listed above. This action cannot be undone.
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-800 dark:text-green-300">
                      This zone has no dependencies and can be safely deleted.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmation Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type{' '}
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {cascadeDelete ? 'DELETE ALL' : 'DELETE'}
                  </span>{' '}
                  to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={cascadeDelete ? 'DELETE ALL' : 'DELETE'}
                />
              </div>

              {/* Warning Message */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Warning:</strong> This action is permanent and cannot
                  be undone. All data associated with{' '}
                  {cascadeDelete
                    ? 'the zone and its dependent methods'
                    : 'this zone'}{' '}
                  will be permanently deleted.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Failed to load zone dependencies. Please try again.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !isConfirmationValid || loadingDeps}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {cascadeDelete ? 'Delete Zone & Methods' : 'Delete Zone'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneDeleteModal;
