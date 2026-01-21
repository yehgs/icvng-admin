// admin/src/components/stock/ActivityLogModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  Calendar,
  User,
  Package,
  Filter,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { warehouseAPI } from "../../utils/api";

const ActivityLogModal = ({ isOpen, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const [filters, setFilters] = useState({
    dateRange: "7",
    action: "",
    userId: "",
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
      fetchUsers();
    }
  }, [isOpen, filters]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        dateRange: filters.dateRange === "all" ? undefined : filters.dateRange,
        action: filters.action || undefined,
        userId: filters.userId || undefined,
      };

      const response = await warehouseAPI.getActivityLog(params);

      if (response.success) {
        setActivities(response.data);
        setPagination({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalCount: response.totalCount,
        });
      } else {
        throw new Error(response.message || "Failed to fetch activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error(error.message || "Failed to fetch activity log");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await warehouseAPI.getWarehouseUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const getActionBadge = (action) => {
    const actionConfig = {
      STOCK_UPDATE: {
        label: "Stock Update",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        icon: Package,
      },
      WEIGHT_UPDATE: {
        label: "Weight Update",
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        icon: Package,
      },
      SYSTEM_ENABLED: {
        label: "System Enabled",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        icon: Activity,
      },
      SYSTEM_DISABLED: {
        label: "System Disabled",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        icon: Activity,
      },
      BULK_STOCK_UPDATE: {
        label: "Bulk Update",
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        icon: Package,
      },
      WAREHOUSE_OVERRIDE_DISABLED: {
        label: "Override Disabled",
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        icon: Activity,
      },
      BULK_STOCK_SYNC: {
        label: "Bulk Sync",
        color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
        icon: Activity,
      },
      STOCK_RECONCILIATION: {
        label: "Reconciliation",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        icon: Package,
      },
      SETTINGS_UPDATE: {
        label: "Settings Update",
        color:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
        icon: Activity,
      },
    };

    const config = actionConfig[action] || actionConfig.STOCK_UPDATE;
    const IconComponent = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "Less than 1 hour ago";
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {Object.entries(changes).map(([field, change]) => (
          <div key={field} className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium capitalize">
              {field.replace(/([A-Z])/g, " $1").trim()}:
            </span>
            <span className="text-red-600 dark:text-red-400 ml-1">
              {change.from}
            </span>
            <span className="mx-1">→</span>
            <span className="text-green-600 dark:text-green-400">
              {change.to}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const exportFilters = {
        dateRange: filters.dateRange === "all" ? undefined : filters.dateRange,
        action: filters.action || undefined,
        userId: filters.userId || undefined,
      };

      const response = await warehouseAPI.exportActivityLog(exportFilters);
      toast.success("Activity log exported successfully");
    } catch (error) {
      console.error("Error exporting activity log:", error);
      toast.error("Failed to export activity log");
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
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

        <div className="inline-block w-full max-w-6xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Activity Log
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track all warehouse stock management activities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={loading || exporting}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    handleFilterChange("dateRange", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action Type
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange("action", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Actions</option>
                  <option value="STOCK_UPDATE">Stock Updates</option>
                  <option value="WEIGHT_UPDATE">Weight Updates</option>
                  <option value="SYSTEM_ENABLED">System Enabled</option>
                  <option value="SYSTEM_DISABLED">System Disabled</option>
                  <option value="BULK_STOCK_UPDATE">Bulk Updates</option>
                  <option value="STOCK_RECONCILIATION">Reconciliations</option>
                  <option value="SETTINGS_UPDATE">Settings Updates</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User
                </label>
                <select
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.subRole || user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading activities...
                </span>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activities found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No activities match your current filters
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getActionBadge(activity.action)}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {activity.user.avatar ? (
                            <img
                              src={activity.user.avatar}
                              alt={activity.user.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {activity.user.name}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                            {activity.user.role}
                          </span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {activity.target.name}
                        </h4>
                        {activity.target.sku && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {activity.target.sku}
                          </p>
                        )}
                      </div>

                      {activity.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.notes}
                        </p>
                      )}

                      {renderChanges(activity.changes)}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page {pagination.currentPage} of {pagination.totalPages}{" "}
                ({pagination.totalCount} total activities)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;
