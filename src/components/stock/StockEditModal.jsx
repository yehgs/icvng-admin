// admin/src/components/stock/StockEditModal.jsx
// COMPLETE FILE — replace your existing StockEditModal.jsx with this

import React, { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Info } from "lucide-react";
import toast from "react-hot-toast";

const StockEditModal = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    stockOnArrival: 0,
    stockInHouse: 0,
    damagedQty: 0,
    expiredQty: 0,
    refurbishedQty: 0,
    finalStock: 0,
    onlineStock: 0,
    offlineStock: 0,
    notes: "",
    unit: "",
    packaging: "",
    supplierName: "",
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      const stock = product.warehouseStock || {};
      setFormData({
        stockOnArrival: stock.stockOnArrival || 0,
        stockInHouse: stock.stockInHouse || 0,
        damagedQty: stock.damagedQty || 0,
        expiredQty: stock.expiredQty || 0,
        refurbishedQty: stock.refurbishedQty || 0,
        finalStock: stock.finalStock || product.stock || 0,
        onlineStock: stock.onlineStock || 0,
        offlineStock: stock.offlineStock || 0,
        notes: stock.notes || "",
        unit: product.unit || "",
        packaging: product.packaging || "",
        supplierName: product.supplier?.name || "",
      });
      setValidationErrors([]);
    }
  }, [product]);

  // FIX: Accept currentData param — avoids stale React state when called after setState
  const validateStock = (currentData = formData) => {
    const errors = [];

    const stockInHouse = parseFloat(currentData.stockInHouse) || 0;
    const damagedQty = parseFloat(currentData.damagedQty) || 0;
    const expiredQty = parseFloat(currentData.expiredQty) || 0;
    const refurbishedQty = parseFloat(currentData.refurbishedQty) || 0;
    const finalStock = parseFloat(currentData.finalStock) || 0;
    const onlineStock = parseFloat(currentData.onlineStock) || 0;
    const offlineStock = parseFloat(currentData.offlineStock) || 0;

    // Rule 1: Non-negative
    const quantities = [
      { name: "Stock In House", value: stockInHouse },
      { name: "Damaged Qty", value: damagedQty },
      { name: "Expired Qty", value: expiredQty },
      { name: "Refurbished Qty", value: refurbishedQty },
      { name: "Final Stock", value: finalStock },
      { name: "Online Stock", value: onlineStock },
      { name: "Offline Stock", value: offlineStock },
    ];
    quantities.forEach(({ name, value }) => {
      if (value < 0) errors.push(`${name} cannot be negative`);
    });

    // Rule 2: Final Stock ≤ Stock In House
    if (finalStock > stockInHouse) {
      errors.push(
        `Final Stock (${finalStock}) cannot exceed Stock In House (${stockInHouse})`,
      );
    }

    // Rule 3: Online + Offline ≤ Final Stock
    if (onlineStock + offlineStock > finalStock) {
      errors.push(
        `Online Stock (${onlineStock}) + Offline Stock (${offlineStock}) = ${onlineStock + offlineStock} exceeds Final Stock (${finalStock})`,
      );
    }

    // Rule 4: Stock In House = Damaged + Expired + Refurbished + Final Stock
    // Use Math.round(*100) to avoid floating point precision issues
    const calculatedStockInHouse =
      damagedQty + expiredQty + refurbishedQty + finalStock;
    if (
      Math.round(stockInHouse * 100) !==
      Math.round(calculatedStockInHouse * 100)
    ) {
      errors.push(
        `Stock In House (${stockInHouse}) must equal Damaged (${damagedQty}) + Expired (${expiredQty}) + Refurbished (${refurbishedQty}) + Final Stock (${finalStock}) = ${calculatedStockInHouse}`,
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // FIX: Build updatedData inline and pass to validateStock to avoid stale state
  const handleChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    const updatedData = { ...formData, [field]: numValue };
    setFormData(updatedData);
    validateStock(updatedData); // validate with fresh data
  };

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!validateStock(formData)) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setSaving(true);
    try {
      await onSave(product._id, formData);
    } catch (error) {
      console.error("Save error:", error);

      // FIX: Read precise backend validation errors from error.response.data.errors
      const backendErrors = error?.response?.data?.errors;
      const backendMessage = error?.response?.data?.message;

      if (backendErrors && backendErrors.length > 0) {
        // Show exact backend errors in the red error box inside the modal
        setValidationErrors(backendErrors);
      } else {
        setValidationErrors([
          backendMessage || error.message || "Failed to save",
        ]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Live calculation values for the preview panel
  const calculated = {
    stockInHouseSum:
      (parseFloat(formData.damagedQty) || 0) +
      (parseFloat(formData.expiredQty) || 0) +
      (parseFloat(formData.refurbishedQty) || 0) +
      (parseFloat(formData.finalStock) || 0),
    onlineOfflineSum:
      (parseFloat(formData.onlineStock) || 0) +
      (parseFloat(formData.offlineStock) || 0),
  };
  const stockInHouseMatch =
    Math.round(calculated.stockInHouseSum * 100) ===
    Math.round((parseFloat(formData.stockInHouse) || 0) * 100);
  const onlineOfflineOk =
    calculated.onlineOfflineSum <= (parseFloat(formData.finalStock) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Stock Quantities
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {product?.name} ({product?.sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Validation Errors — shows both frontend AND backend errors */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Validation Errors
                  </h4>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="list-disc list-inside">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Rules Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Validation Rules
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• All quantities ≥ 0</li>
              <li>• Final Stock ≤ Stock In House</li>
              <li>• Online + Offline ≤ Final Stock</li>
              <li>
                •{" "}
                <strong>
                  Stock In House = Damaged + Expired + Refurbished + Final Stock
                </strong>
              </li>
              <li className="text-green-700 dark:text-green-400">
                • Stock on Arrival, Supplier, Unit, Packaging are informational
                only (not validated)
              </li>
            </ul>
          </div>

          {/* Informational Fields */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Product Information{" "}
              <span className="text-xs text-gray-400 font-normal">
                (no validation)
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) =>
                    handleTextChange("supplierName", e.target.value)
                  }
                  placeholder="Enter supplier name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Auto-creates if new
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleTextChange("unit", e.target.value)}
                  placeholder="e.g., pieces, boxes"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Packaging
                </label>
                <input
                  type="text"
                  value={formData.packaging}
                  onChange={(e) =>
                    handleTextChange("packaging", e.target.value)
                  }
                  placeholder="e.g., carton, pallet"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Stock on Arrival — informational only, NOT validated */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stock on Arrival{" "}
              <span className="text-xs text-gray-400 font-normal">
                (informational only)
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.stockOnArrival}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                setFormData((prev) => ({ ...prev, stockOnArrival: numValue }));
              }}
              className="w-full md:w-1/4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Core Validated Stock Fields */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Stock Quantities{" "}
              <span className="text-xs text-gray-400 font-normal">
                (validated)
              </span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Stock In House */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock In House <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stockInHouse}
                  onChange={(e) => handleChange("stockInHouse", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Damaged */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Damaged Qty
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.damagedQty}
                  onChange={(e) => handleChange("damagedQty", e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Expired */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expired Qty
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.expiredQty}
                  onChange={(e) => handleChange("expiredQty", e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-md focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Refurbished */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Refurbished Qty
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.refurbishedQty}
                  onChange={(e) =>
                    handleChange("refurbishedQty", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Final Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Final Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.finalStock}
                  onChange={(e) => handleChange("finalStock", e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white font-semibold"
                />
              </div>

              {/* Online Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Online Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.onlineStock}
                  onChange={(e) => handleChange("onlineStock", e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Offline Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Offline Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.offlineStock}
                  onChange={(e) => handleChange("offlineStock", e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Live Calculation Check
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Damaged + Expired + Refurbished + Final Stock
                </span>
                <span
                  className={
                    stockInHouseMatch
                      ? "text-green-600 dark:text-green-400 font-semibold"
                      : "text-red-600 dark:text-red-400 font-semibold"
                  }
                >
                  = {calculated.stockInHouseSum}{" "}
                  {stockInHouseMatch
                    ? `✓ matches Stock In House (${formData.stockInHouse})`
                    : `✗ must equal Stock In House (${formData.stockInHouse})`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Online + Offline
                </span>
                <span
                  className={
                    onlineOfflineOk
                      ? "text-green-600 dark:text-green-400 font-semibold"
                      : "text-red-600 dark:text-red-400 font-semibold"
                  }
                >
                  = {calculated.onlineOfflineSum}{" "}
                  {onlineOfflineOk
                    ? `✓ within Final Stock (${formData.finalStock})`
                    : `✗ exceeds Final Stock (${formData.finalStock})`}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleTextChange("notes", e.target.value)}
              rows={3}
              placeholder="Add notes about this stock update..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || validationErrors.length > 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockEditModal;
