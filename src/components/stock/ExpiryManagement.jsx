// components/stock/ExpiryManagement.jsx
import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Package,
  Clock,
  XCircle,
  CheckCircle,
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Building2,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExpiryManagement = ({ expiringBatches, loading, onRefresh }) => {
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [filterDays, setFilterDays] = useState(30);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [sortBy, setSortBy] = useState('expiryDate');

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate)
      return {
        status: 'no-expiry',
        days: null,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
      };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        days: Math.abs(daysUntilExpiry),
        color: 'text-red-700',
        bgColor: 'bg-red-100 dark:bg-red-900',
        icon: XCircle,
      };
    } else if (daysUntilExpiry === 0) {
      return {
        status: 'expires-today',
        days: 0,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: AlertTriangle,
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: 'critical',
        days: daysUntilExpiry,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: AlertTriangle,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'warning',
        days: daysUntilExpiry,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: Clock,
      };
    }

    return {
      status: 'normal',
      days: daysUntilExpiry,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: CheckCircle,
    };
  };

  const getUrgencyBadge = (status) => {
    const badges = {
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'expires-today':
        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      critical:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      normal:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    const labels = {
      expired: 'EXPIRED',
      'expires-today': 'EXPIRES TODAY',
      critical: 'CRITICAL',
      warning: 'WARNING',
      normal: 'NORMAL',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          badges[status] || badges.normal
        }`}
      >
        {labels[status] || 'NORMAL'}
      </span>
    );
  };

  const filteredBatches = expiringBatches
    .filter((batch) => {
      const expiryStatus = getExpiryStatus(batch.expiryDate);
      if (showExpiredOnly) {
        return expiryStatus.status === 'expired';
      }
      return expiryStatus.days !== null && expiryStatus.days <= filterDays;
    })
    .sort((a, b) => {
      if (sortBy === 'expiryDate') {
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      } else if (sortBy === 'quantity') {
        return b.currentQuantity - a.currentQuantity;
      } else if (sortBy === 'product') {
        return (a.product?.name || '').localeCompare(b.product?.name || '');
      }
      return 0;
    });

  const handleBulkAction = async (action) => {
    if (selectedBatches.length === 0) {
      toast.error('Please select batches first');
      return;
    }

    const actionMessages = {
      dispose: 'Are you sure you want to mark these batches as disposed?',
      extend:
        'Are you sure you want to extend the expiry date for these batches?',
      discount:
        'Are you sure you want to mark these batches for discount pricing?',
    };

    if (!confirm(actionMessages[action])) return;

    try {
      // Implement bulk action API calls here
      toast.success(
        `${action} action completed for ${selectedBatches.length} batches`
      );
      setSelectedBatches([]);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to perform ${action} action`);
    }
  };

  const exportExpiryReport = () => {
    const csvContent = [
      [
        'Batch Number',
        'Product',
        'Supplier',
        'Current Quantity',
        'Expiry Date',
        'Days Until Expiry',
        'Status',
        'Location',
      ],
      ...filteredBatches.map((batch) => {
        const expiryStatus = getExpiryStatus(batch.expiryDate);
        return [
          batch.batchNumber,
          batch.product?.name || '',
          batch.supplier?.name || '',
          batch.currentQuantity,
          batch.expiryDate
            ? new Date(batch.expiryDate).toLocaleDateString()
            : '',
          expiryStatus.days !== null ? expiryStatus.days : '',
          expiryStatus.status,
          batch.warehouseLocation
            ? `${batch.warehouseLocation.zone}-${batch.warehouseLocation.aisle}-${batch.warehouseLocation.shelf}`
            : '',
        ];
      }),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expiry-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getExpiryStats = () => {
    const expired = filteredBatches.filter(
      (b) => getExpiryStatus(b.expiryDate).status === 'expired'
    ).length;
    const critical = filteredBatches.filter(
      (b) => getExpiryStatus(b.expiryDate).status === 'critical'
    ).length;
    const warning = filteredBatches.filter(
      (b) => getExpiryStatus(b.expiryDate).status === 'warning'
    ).length;
    const expiresToday = filteredBatches.filter(
      (b) => getExpiryStatus(b.expiryDate).status === 'expires-today'
    ).length;

    return { expired, critical, warning, expiresToday };
  };

  const stats = getExpiryStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                {stats.expired}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Expired
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                {stats.expiresToday}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Expires Today
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                {stats.critical}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Critical (≤7 days)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                {stats.warning}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                Warning (≤30 days)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="expired-only"
              checked={showExpiredOnly}
              onChange={(e) => setShowExpiredOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label
              htmlFor="expired-only"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Show expired only
            </label>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="expiryDate">Sort by Expiry Date</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="product">Sort by Product</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportExpiryReport}
            className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBatches.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 dark:text-blue-300">
              {selectedBatches.length} batch(es) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('discount')}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Mark for Discount
              </button>
              <button
                onClick={() => handleBulkAction('dispose')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Mark as Disposed
              </button>
              <button
                onClick={() => setSelectedBatches([])}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batches List */}
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading expiry data...
          </p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Expiring Items
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showExpiredOnly
              ? 'No expired batches found.'
              : `No batches expiring in the next ${filterDays} days.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBatches.map((batch) => {
            const expiryStatus = getExpiryStatus(batch.expiryDate);
            const Icon = expiryStatus.icon || AlertTriangle;

            return (
              <div
                key={batch._id}
                className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                  expiryStatus.status === 'expired'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : expiryStatus.status === 'critical'
                    ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20'
                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedBatches.includes(batch._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBatches([...selectedBatches, batch._id]);
                        } else {
                          setSelectedBatches(
                            selectedBatches.filter((id) => id !== batch._id)
                          );
                        }
                      }}
                      className="rounded border-gray-300 mr-3"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {batch.batchNumber}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {batch.product?.name}
                      </p>
                    </div>
                  </div>
                  {getUrgencyBadge(expiryStatus.status)}
                </div>

                {/* Expiry Info */}
                <div className="flex items-center mb-3">
                  <Icon className={`h-5 w-5 mr-2 ${expiryStatus.color}`} />
                  <div>
                    <div
                      className={`text-sm font-medium ${expiryStatus.color}`}
                    >
                      {expiryStatus.status === 'expired'
                        ? `Expired ${expiryStatus.days} days ago`
                        : expiryStatus.status === 'expires-today'
                        ? 'Expires today'
                        : `${expiryStatus.days} days remaining`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires: {new Date(batch.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Quantity:{' '}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {batch.currentQuantity}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {batch.supplier?.name || 'N/A'}
                    </span>
                  </div>

                  {batch.warehouseLocation && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {batch.warehouseLocation.zone}-
                        {batch.warehouseLocation.aisle}-
                        {batch.warehouseLocation.shelf}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <button
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    title="View Details"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </button>

                  {expiryStatus.status !== 'expired' && (
                    <button
                      className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                      title="Mark for Discount"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Discount
                    </button>
                  )}

                  <button
                    className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    title="Mark as Disposed"
                  >
                    <Trash2 className="h-3 w-3" />
                    Dispose
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExpiryManagement;
