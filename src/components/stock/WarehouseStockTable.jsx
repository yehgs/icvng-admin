import React from 'react';
import {
  Package,
  Edit,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';

const WarehouseStockTable = ({
  loading,
  filteredProducts,
  canEdit,
  onEditStock,
  systemSettings,
}) => {
  const getStockStatusBadge = (finalStock) => {
    if (finalStock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          <AlertTriangle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    } else if (finalStock <= systemSettings.criticalStockThreshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </span>
      );
    } else if (finalStock <= systemSettings.lowStockThreshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          <AlertTriangle className="w-3 h-3" />
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="w-3 h-3" />
          In Stock
        </span>
      );
    }
  };

  const formatNumber = (number) => {
    return Number(number || 0).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading products...
        </span>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No products found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stock on Arrival
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Damaged
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Expired
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Refurbished
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Final Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Online
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Offline
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProducts.map((product) => {
            const stock = product.warehouseStock || {};
            const finalStock = stock.finalStock || 0;

            return (
              <tr
                key={product._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {product.image && product.image[0] ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={product.image[0]}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {product.sku}
                      </div>
                      <div className="text-xs text-gray-400">
                        {product.brand?.map((b) => b.name).join(', ')} •{' '}
                        {product.productType}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(stock.stockOnArrival)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {formatNumber(stock.damagedQty)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {formatNumber(stock.expiredQty)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {formatNumber(stock.refurbishedQty)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(finalStock)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Total available
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {formatNumber(stock.onlineStock)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Online sales
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {formatNumber(stock.offlineStock)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Offline sales
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {getStockStatusBadge(finalStock)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEditStock(product)}
                      disabled={!canEdit}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        canEdit
                          ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        canEdit
                          ? 'Edit stock quantities'
                          : 'Stock editing is disabled'
                      }
                    >
                      <Edit className="w-4 h-4" />
                      {canEdit ? 'Edit' : 'Locked'}
                    </button>

                    <button
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/20 transition-colors"
                      title="View product details"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Last Updated Info */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{filteredProducts.length} products displayed</span>
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default WarehouseStockTable;
