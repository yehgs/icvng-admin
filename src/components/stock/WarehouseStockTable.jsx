import React from 'react';
import {
  Package,
  Edit,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
  Scale,
} from 'lucide-react';

const WarehouseStockTable = ({
  loading,
  filteredProducts,
  canEdit,
  onEditStock,
  onEditWeight,
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

  const formatWeight = (weight) => {
    return weight ? `${weight} kg` : 'Not set';
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
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {filteredProducts.map((product) => {
          const stock = product.warehouseStock || {};
          const finalStock = stock.finalStock || 0;

          return (
            <div
              key={product._id}
              className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
            >
              {/* Product Header */}
              <div className="flex items-center gap-3 mb-3">
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
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.sku}
                  </p>
                  <div className="mt-1">{getStockStatusBadge(finalStock)}</div>
                </div>
              </div>

              {/* Weight */}
              <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Weight:
                  </span>
                  <span className="text-sm font-medium">
                    {formatWeight(product.weight)}
                  </span>
                </div>
              </div>

              {/* Stock Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Final Stock
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(finalStock)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    On Arrival
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(stock.stockOnArrival)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Online
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatNumber(stock.onlineStock)}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    Offline
                  </div>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {formatNumber(stock.offlineStock)}
                  </div>
                </div>
              </div>

              {/* Quality Issues (if any) */}
              {(stock.damagedQty > 0 ||
                stock.expiredQty > 0 ||
                stock.refurbishedQty > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Damaged
                    </div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      {formatNumber(stock.damagedQty)}
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Expired
                    </div>
                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {formatNumber(stock.expiredQty)}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Refurbished
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {formatNumber(stock.refurbishedQty)}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onEditWeight(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20 transition-colors"
                >
                  <Scale className="w-4 h-4" />
                  Weight
                </button>
                <button
                  onClick={() => onEditStock(product)}
                  disabled={!canEdit}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    canEdit
                      ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {canEdit ? 'Edit' : 'Locked'}
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-900/20 transition-colors">
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Weight
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
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gray-400" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatWeight(product.weight)}
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
                        onClick={() => onEditWeight(product)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20 transition-colors"
                        title="Edit product weight"
                      >
                        <Scale className="w-4 h-4" />
                        Weight
                      </button>

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
      </div>

      {/* Last Updated Info */}
      <div className="px-4 md:px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
          <span>{filteredProducts.length} products displayed</span>
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </>
  );
};

export default WarehouseStockTable;
