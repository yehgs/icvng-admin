// admin/src/components/stock/WarehouseStockTable.jsx
import React from "react";
import {
  Package,
  Edit,
  AlertTriangle,
  CheckCircle,
  Globe,
  Monitor,
  Scale,
  Box,
  Ruler,
  Building2,
} from "lucide-react";

const WarehouseStockTable = ({
  loading,
  filteredProducts,
  canEdit,
  onEditStock,
  onEditWeight,
  systemSettings,
}) => {
  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Returns an object containing the stock status label, color, background color, and icon
   * based on the final stock quantity.
   *
   * @param {number} finalStock The final stock quantity.
   * @returns {object} An object containing the stock status label, color, background color, and icon.
   */
  /*******  a05179fa-8a4a-40ab-b8bf-5775768316f4  *******/ const getStockStatus =
    (finalStock) => {
      if (finalStock === 0) {
        return {
          label: "Out of Stock",
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          icon: AlertTriangle,
        };
      } else if (finalStock <= systemSettings.criticalStockThreshold) {
        return {
          label: "Critical",
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          icon: AlertTriangle,
        };
      } else if (finalStock <= systemSettings.lowStockThreshold) {
        return {
          label: "Low Stock",
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          icon: AlertTriangle,
        };
      } else {
        return {
          label: "In Stock",
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
          icon: CheckCircle,
        };
      }
    };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Package className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Supplier
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Weight
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Packaging
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stock In House
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Damaged
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Expired
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Refurb
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Final Stock
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Online
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Offline
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredProducts.map((product) => {
            const stock = product.warehouseStock || {};
            const finalStock = stock.finalStock || 0;
            const status = getStockStatus(finalStock);
            const StatusIcon = status.icon;

            return (
              <tr
                key={product._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Product Info */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      SKU: {product.sku}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category?.name || "No category"}
                    </span>
                  </div>
                </td>

                {/* Supplier */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {product.supplier?.name || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Weight */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {product.weight ? (
                        `${product.weight} kg`
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          Not set
                        </span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Unit */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {product.unit || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Packaging */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {product.packaging || (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Stock In House */}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {stock.stockInHouse || 0}
                  </span>
                </td>

                {/* Damaged */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-sm ${
                      (stock.damagedQty || 0) > 0
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {stock.damagedQty || 0}
                  </span>
                </td>

                {/* Expired */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-sm ${
                      (stock.expiredQty || 0) > 0
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {stock.expiredQty || 0}
                  </span>
                </td>

                {/* Refurbished */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-sm ${
                      (stock.refurbishedQty || 0) > 0
                        ? "text-yellow-600 dark:text-yellow-400 font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {stock.refurbishedQty || 0}
                  </span>
                </td>

                {/* Final Stock */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`text-sm font-bold ${
                      finalStock === 0
                        ? "text-red-600 dark:text-red-400"
                        : finalStock <= systemSettings.lowStockThreshold
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {finalStock}
                  </span>
                </td>

                {/* Online Stock */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Globe className="h-3 w-3 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {stock.onlineStock || 0}
                    </span>
                  </div>
                </td>

                {/* Offline Stock */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Monitor className="h-3 w-3 text-purple-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {stock.offlineStock || 0}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEditStock(product)}
                      disabled={!canEdit}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        canEdit
                          ? "Edit stock quantities"
                          : "Stock editing disabled"
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditWeight(product)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                      title="Edit product weight"
                    >
                      <Scale className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WarehouseStockTable;
