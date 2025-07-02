// components/stock/StockOverview.jsx (Fixed)
import React from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  ArrowRight,
} from 'lucide-react';

const StockOverview = ({
  stockSummary = [],
  expiringBatches = [],
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading stock overview...
        </span>
      </div>
    );
  }

  const getStockStatusColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 75) return 'text-green-600';
    if (percentage > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getExpiryUrgency = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 7) return 'urgent';
    if (daysUntilExpiry <= 30) return 'warning';
    return 'normal';
  };

  return (
    <div className="space-y-6">
      {/* Stock Summary Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Stock Summary
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {stockSummary.length} products
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Distribution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quality Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stockSummary.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No stock data available
                  </td>
                </tr>
              ) : (
                stockSummary.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.product?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.product?.sku || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.totalQuantity?.toLocaleString() || '0'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.batchCount || 0} batch
                        {(item.batchCount || 0) !== 1 ? 'es' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white">
                          Online: {item.onlineStock?.toLocaleString() || '0'}
                        </div>
                        <div className="text-gray-500">
                          Offline: {item.offlineStock?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {(item.damagedQuantity || 0) > 0 && (
                          <div className="flex items-center">
                            <XCircle className="h-3 w-3 text-red-500 mr-1" />
                            <span className="text-xs text-red-600">
                              Damaged: {item.damagedQuantity.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {(item.expiredQuantity || 0) > 0 && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 text-orange-500 mr-1" />
                            <span className="text-xs text-orange-600">
                              Expired: {item.expiredQuantity.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {(item.damagedQuantity || 0) === 0 &&
                          (item.expiredQuantity || 0) === 0 && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs text-green-600">
                                All Good
                              </span>
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Expiring Items */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <h4 className="text-lg font-medium text-red-900 dark:text-red-200">
                Expiring Items
              </h4>
            </div>
            <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full text-sm font-medium">
              {expiringBatches.length}
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expiringBatches.length === 0 ? (
              <p className="text-red-700 dark:text-red-300 text-sm">
                No items expiring in the next 30 days
              </p>
            ) : (
              expiringBatches.slice(0, 5).map((batch) => (
                <div
                  key={batch._id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {batch.product?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Batch: {batch.batchNumber || 'N/A'} • Qty:{' '}
                      {batch.currentQuantity || 0}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        getExpiryUrgency(batch.daysUntilExpiry || 0) ===
                        'urgent'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {(batch.daysUntilExpiry || 0) > 0
                        ? `${batch.daysUntilExpiry} days`
                        : 'Expired'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {batch.expiryDate
                        ? new Date(batch.expiryDate).toLocaleDateString()
                        : 'No date'}
                    </div>
                  </div>
                </div>
              ))
            )}
            {expiringBatches.length > 5 && (
              <div className="text-center pt-2">
                <button className="text-red-600 dark:text-red-400 text-sm hover:underline flex items-center justify-center w-full">
                  View all {expiringBatches.length} expiring items
                  <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <div className="flex items-center mb-2">
              <Package className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900 dark:text-white">
                Create Stock Batch
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add new inventory from purchase orders
            </p>
          </button>

          <button className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-gray-900 dark:text-white">
                Quality Check
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Perform quality control on pending batches
            </p>
          </button>

          <button className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium text-gray-900 dark:text-white">
                Handle Expiries
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage expiring and expired inventory
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockOverview;
