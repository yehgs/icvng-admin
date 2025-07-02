// components/stock/BatchList.jsx
import React, { useState } from 'react';
import {
  Package,
  Building2,
  Calendar,
  MapPin,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';

const BatchList = ({
  batches,
  loading,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onRefresh,
}) => {
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'IN_QUALITY_CHECK', label: 'In Quality Check' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'PARTIALLY_ALLOCATED', label: 'Partially Allocated' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'DAMAGED', label: 'Damaged' },
  ];

  const qualityStatusOptions = [
    { value: '', label: 'All Quality Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PASSED', label: 'Passed' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'REFURBISHED', label: 'Refurbished' },
  ];

  const getStatusBadge = (status) => {
    const statusClasses = {
      RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      IN_QUALITY_CHECK:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      AVAILABLE:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      PARTIALLY_ALLOCATED:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      ALLOCATED:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      DAMAGED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getQualityBadge = (qualityStatus) => {
    const qualityClasses = {
      PENDING:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      PASSED:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      REFURBISHED:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };

    const qualityIcons = {
      PENDING: Clock,
      PASSED: CheckCircle,
      FAILED: XCircle,
      REFURBISHED: ArrowUpDown,
    };

    const Icon = qualityIcons[qualityStatus] || Clock;

    return (
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            qualityClasses[qualityStatus] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {qualityStatus}
        </span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        days: Math.abs(daysUntilExpiry),
        color: 'text-red-600',
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: 'critical',
        days: daysUntilExpiry,
        color: 'text-red-600',
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'warning',
        days: daysUntilExpiry,
        color: 'text-yellow-600',
      };
    }
    return { status: 'normal', days: daysUntilExpiry, color: 'text-green-600' };
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setShowBatchDetails(true);
  };

  const handleBulkAction = (action) => {
    if (selectedBatches.length === 0) {
      toast.error('Please select batches first');
      return;
    }
    // Implement bulk actions here
    console.log(`Performing ${action} on`, selectedBatches);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading batches...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search batches..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({ ...filters, status: e.target.value })
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filters.qualityStatus}
          onChange={(e) =>
            onFiltersChange({ ...filters, qualityStatus: e.target.value })
          }
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {qualityStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={() =>
            onFiltersChange({
              status: '',
              qualityStatus: '',
              product: '',
              supplier: '',
            })
          }
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Clear Filters
        </button>
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
                onClick={() => handleBulkAction('move')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Move Stock
              </button>
              <button
                onClick={() => handleBulkAction('adjust')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Adjust Stock
              </button>
              <button
                onClick={() => setSelectedBatches([])}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBatches(batches.map((b) => b._id));
                    } else {
                      setSelectedBatches([]);
                    }
                  }}
                  checked={
                    selectedBatches.length === batches.length &&
                    batches.length > 0
                  }
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Batch Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location & Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Expiry
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {batches.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No batches found
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const expiryStatus = getExpiryStatus(batch.expiryDate);

                return (
                  <tr
                    key={batch._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
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
                        className="rounded border-gray-300"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {batch.batchNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          PO: {batch.purchaseOrder?.orderNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {batch.supplier?.name || 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {batch.product?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {batch.product?.sku || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getStatusBadge(batch.status)}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div>Total: {batch.currentQuantity}</div>
                          <div>Available: {batch.availableQuantity}</div>
                          {batch.reservedQuantity > 0 && (
                            <div>Reserved: {batch.reservedQuantity}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getQualityBadge(batch.qualityStatus)}
                        {batch.qualityStatus !== 'PENDING' && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {batch.goodQuantity > 0 && (
                              <div>Good: {batch.goodQuantity}</div>
                            )}
                            {batch.refurbishedQuantity > 0 && (
                              <div>Refurb: {batch.refurbishedQuantity}</div>
                            )}
                            {batch.damagedQuantity > 0 && (
                              <div>Damaged: {batch.damagedQuantity}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <MapPin className="h-3 w-3 mr-1" />
                          {batch.warehouseLocation
                            ? `${batch.warehouseLocation.zone}-${batch.warehouseLocation.aisle}-${batch.warehouseLocation.shelf}`
                            : 'N/A'}
                        </div>
                        <div className="flex items-center text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Received: {formatDate(batch.receivedDate)}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {batch.expiryDate ? (
                        <div className="text-sm">
                          <div className={`font-medium ${expiryStatus.color}`}>
                            {expiryStatus.status === 'expired'
                              ? 'Expired'
                              : `${expiryStatus.days}d`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(batch.expiryDate)}
                          </div>
                          {expiryStatus.status !== 'normal' && (
                            <AlertTriangle className="h-3 w-3 text-red-500 mt-1" />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No expiry</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewBatch(batch)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Batch Details Modal would go here */}
      {showBatchDetails && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal content would go here */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Batch Details: {selectedBatch.batchNumber}
              </h3>
              <button
                onClick={() => setShowBatchDetails(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchList;
