// components/stock/StockEditModal.jsx - FIXED to handle all quality fields
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Package,
  AlertTriangle,
  Calculator,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';

const StockEditModal = ({ isOpen, onClose, product, onSave }) => {
  const [stockData, setStockData] = useState({
    stockOnArrival: 0,
    damagedQty: 0,
    expiredQty: 0,
    refurbishedQty: 0,
    finalStock: 0,
    onlineStock: 0,
    offlineStock: 0,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);

  useEffect(() => {
    if (product && isOpen) {
      const stock = product.warehouseStock || {};
      setStockData({
        stockOnArrival: stock.stockOnArrival || 0,
        damagedQty: stock.damagedQty || 0,
        expiredQty: stock.expiredQty || 0,
        refurbishedQty: stock.refurbishedQty || 0,
        finalStock: stock.finalStock || 0,
        onlineStock: stock.onlineStock || 0,
        offlineStock: stock.offlineStock || 0,
        notes: stock.notes || '',
      });
      setErrors({});
    }
  }, [product, isOpen]);

  // FIXED: Calculate final stock based on quality breakdown
  const calculateFinalStock = (arrival, damaged, expired, refurbished) => {
    return Math.max(0, arrival - damaged - expired + refurbished);
  };

  // FIXED: Auto-calculate remaining quantities when one is changed
  const handleQualityChange = (field, value) => {
    const numValue = parseInt(value) || 0;

    setStockData((prev) => {
      const updated = { ...prev, [field]: numValue };

      if (autoCalculate && field !== 'finalStock') {
        // When changing quality breakdown, auto-calculate finalStock
        if (
          [
            'stockOnArrival',
            'damagedQty',
            'expiredQty',
            'refurbishedQty',
          ].includes(field)
        ) {
          const newFinalStock = calculateFinalStock(
            field === 'stockOnArrival' ? numValue : updated.stockOnArrival,
            field === 'damagedQty' ? numValue : updated.damagedQty,
            field === 'expiredQty' ? numValue : updated.expiredQty,
            field === 'refurbishedQty' ? numValue : updated.refurbishedQty
          );

          updated.finalStock = newFinalStock;

          // Ensure distribution doesn't exceed final stock
          const totalDistribution = updated.onlineStock + updated.offlineStock;
          if (totalDistribution > newFinalStock) {
            // Proportionally reduce distribution
            const ratio = newFinalStock / totalDistribution;
            updated.onlineStock = Math.floor(updated.onlineStock * ratio);
            updated.offlineStock = newFinalStock - updated.onlineStock;
          }
        }
      }

      return updated;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // FIXED: Handle distribution changes
  const handleDistributionChange = (field, value) => {
    const numValue = parseInt(value) || 0;

    setStockData((prev) => {
      const updated = { ...prev };

      if (field === 'onlineStock') {
        updated.onlineStock = numValue;
        // Auto-adjust offline stock if auto-calculate is enabled
        if (autoCalculate) {
          updated.offlineStock = Math.max(0, updated.finalStock - numValue);
        }
      } else if (field === 'offlineStock') {
        updated.offlineStock = numValue;
        // Auto-adjust online stock if auto-calculate is enabled
        if (autoCalculate) {
          updated.onlineStock = Math.max(0, updated.finalStock - numValue);
        }
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // FIXED: Comprehensive validation
  const validateData = () => {
    const newErrors = {};

    // Basic validations
    if (stockData.stockOnArrival < 0) {
      newErrors.stockOnArrival = 'Cannot be negative';
    }

    if (stockData.damagedQty < 0) {
      newErrors.damagedQty = 'Cannot be negative';
    }

    if (stockData.expiredQty < 0) {
      newErrors.expiredQty = 'Cannot be negative';
    }

    if (stockData.refurbishedQty < 0) {
      newErrors.refurbishedQty = 'Cannot be negative';
    }

    if (stockData.finalStock < 0) {
      newErrors.finalStock = 'Cannot be negative';
    }

    // FIXED: Quality breakdown validation
    const qualityTotal =
      stockData.damagedQty +
      stockData.expiredQty +
      stockData.refurbishedQty +
      stockData.finalStock;
    if (qualityTotal !== stockData.stockOnArrival) {
      newErrors.qualityBreakdown = `Quality breakdown (${qualityTotal}) must equal stock on arrival (${stockData.stockOnArrival})`;
    }

    // FIXED: Distribution validation
    const totalDistribution = stockData.onlineStock + stockData.offlineStock;
    if (totalDistribution > stockData.finalStock) {
      newErrors.distribution = `Total distribution (${totalDistribution}) cannot exceed final stock (${stockData.finalStock})`;
    }

    if (stockData.onlineStock < 0) {
      newErrors.onlineStock = 'Cannot be negative';
    }

    if (stockData.offlineStock < 0) {
      newErrors.offlineStock = 'Cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateData()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(product._id, stockData);
    } catch (error) {
      console.error('Error saving stock:', error);
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Calculate available for distribution
  const calculateAvailableForDistribution = () => {
    return (
      stockData.finalStock - stockData.onlineStock - stockData.offlineStock
    );
  };

  // FIXED: Auto-balance quality breakdown
  const autoBalanceQuality = () => {
    const remaining =
      stockData.stockOnArrival -
      stockData.damagedQty -
      stockData.expiredQty -
      stockData.refurbishedQty;
    setStockData((prev) => ({
      ...prev,
      finalStock: Math.max(0, remaining),
    }));
  };

  // FIXED: Auto-balance distribution
  const autoBalanceDistribution = () => {
    const remaining = stockData.finalStock - stockData.onlineStock;
    setStockData((prev) => ({
      ...prev,
      offlineStock: Math.max(0, remaining),
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

        <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit Stock Quantities
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {product?.name} • {product?.sku}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                  className="rounded border-gray-300 mr-2"
                />
                Auto-calculate
              </label>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Stock on Arrival */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Initial Stock Receipt
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock on Arrival
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockData.stockOnArrival}
                  onChange={(e) =>
                    handleQualityChange('stockOnArrival', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.stockOnArrival
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Enter total quantity received"
                />
                {errors.stockOnArrival && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.stockOnArrival}
                  </p>
                )}
              </div>
            </div>

            {/* Quality Control Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Quality Control Breakdown
                </h4>
                <button
                  onClick={autoBalanceQuality}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Calculator className="w-3 h-3" />
                  Auto-balance
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                    <XCircle className="w-4 h-4 mr-1" />
                    Damaged
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={stockData.stockOnArrival}
                    value={stockData.damagedQty}
                    onChange={(e) =>
                      handleQualityChange('damagedQty', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.damagedQty
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.damagedQty && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.damagedQty}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    Expired
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={stockData.stockOnArrival}
                    value={stockData.expiredQty}
                    onChange={(e) =>
                      handleQualityChange('expiredQty', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.expiredQty
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.expiredQty && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.expiredQty}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Refurbished
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockData.refurbishedQty}
                    onChange={(e) =>
                      handleQualityChange('refurbishedQty', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.refurbishedQty
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.refurbishedQty && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.refurbishedQty}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Final Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockData.finalStock}
                    onChange={(e) =>
                      handleQualityChange('finalStock', e.target.value)
                    }
                    disabled={autoCalculate}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.finalStock
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.finalStock && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.finalStock}
                    </p>
                  )}
                </div>
              </div>

              {/* Quality Breakdown Validation */}
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Quality Breakdown Total:
                  </span>
                  <span
                    className={
                      stockData.damagedQty +
                        stockData.expiredQty +
                        stockData.refurbishedQty +
                        stockData.finalStock ===
                      stockData.stockOnArrival
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {stockData.damagedQty +
                      stockData.expiredQty +
                      stockData.refurbishedQty +
                      stockData.finalStock}{' '}
                    / {stockData.stockOnArrival}
                  </span>
                </div>
                {errors.qualityBreakdown && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.qualityBreakdown}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Distribution Section */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Stock Distribution
                </h4>
                <button
                  onClick={autoBalanceDistribution}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <Calculator className="w-3 h-3" />
                  Auto-balance
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                    Online Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={stockData.finalStock}
                    value={stockData.onlineStock}
                    onChange={(e) =>
                      handleDistributionChange('onlineStock', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.onlineStock
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  {errors.onlineStock && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.onlineStock}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    Offline Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={stockData.finalStock}
                    value={stockData.offlineStock}
                    onChange={(e) =>
                      handleDistributionChange('offlineStock', e.target.value)
                    }
                    disabled={autoCalculate}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.offlineStock
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.offlineStock && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.offlineStock}
                    </p>
                  )}
                </div>
              </div>

              {/* Distribution Summary */}
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Total Distributed
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stockData.onlineStock + stockData.offlineStock}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Available
                    </div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {calculateAvailableForDistribution()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Final Stock
                    </div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {stockData.finalStock}
                    </div>
                  </div>
                </div>
                {errors.distribution && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
                    {errors.distribution}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={stockData.notes}
                onChange={(e) =>
                  setStockData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add any notes about this stock update..."
              />
            </div>

            {/* Validation Warnings */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Please fix the following issues:
                  </span>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Stock Update Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-blue-800 dark:text-blue-300">
                <div>
                  <div>Stock on Arrival: {stockData.stockOnArrival}</div>
                  <div>
                    Quality Issues:{' '}
                    {stockData.damagedQty + stockData.expiredQty}
                  </div>
                  <div>Refurbished: {stockData.refurbishedQty}</div>
                </div>
                <div>
                  <div>Final Stock: {stockData.finalStock}</div>
                  <div>Online: {stockData.onlineStock}</div>
                  <div>Offline: {stockData.offlineStock}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(errors).length > 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockEditModal;
