// admin/src/components/stock/StockEditModal.jsx
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

  const validateStock = () => {
    const errors = [];
    const {
      stockInHouse,
      damagedQty,
      expiredQty,
      refurbishedQty,
      finalStock,
      onlineStock,
      offlineStock,
    } = formData;

    // Validation 1: Online + Offline cannot exceed Final Stock
    if (onlineStock + offlineStock > finalStock) {
      errors.push(
        `Distribution error: Online (${onlineStock}) + Offline (${offlineStock}) = ${onlineStock + offlineStock} exceeds Final Stock (${finalStock})`,
      );
    }

    // Validation 2: Final Stock cannot exceed Stock In House
    if (finalStock > stockInHouse) {
      errors.push(
        `Final Stock (${finalStock}) cannot exceed Stock In House (${stockInHouse})`,
      );
    }

    // Validation 3: Stock In House should equal Damaged + Expired + Refurbished + Final Stock
    const calculatedStockInHouse =
      damagedQty + expiredQty + refurbishedQty + finalStock;
    if (Math.abs(stockInHouse - calculatedStockInHouse) > 0.01) {
      errors.push(
        `Stock In House (${stockInHouse}) must equal Damaged (${damagedQty}) + Expired (${expiredQty}) + Refurbished (${refurbishedQty}) + Final Stock (${finalStock}) = ${calculatedStockInHouse}`,
      );
    }

    // Validation 4: All quantities must be non-negative
    const quantities = [
      { name: "Stock In House", value: stockInHouse },
      { name: "Damaged", value: damagedQty },
      { name: "Expired", value: expiredQty },
      { name: "Refurbished", value: refurbishedQty },
      { name: "Final Stock", value: finalStock },
      { name: "Online Stock", value: onlineStock },
      { name: "Offline Stock", value: offlineStock },
    ];

    quantities.forEach(({ name, value }) => {
      if (value < 0) {
        errors.push(`${name} cannot be negative`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!validateStock()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setSaving(true);
    try {
      await onSave(product._id, formData);
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
          {/* Validation Errors */}
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

          {/* Validation Rules Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Validation Rules
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• All quantities must be ≥ 0</li>
              <li>• Final Stock ≤ Stock In House</li>
              <li>• Online + Offline ≤ Final Stock</li>
              <li>
                • Stock In House = Damaged + Expired + Refurbished + Final Stock
              </li>
            </ul>
          </div>

          {/* Product Details Section */}
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
                onChange={(e) => handleTextChange("packaging", e.target.value)}
                placeholder="e.g., carton, pallet"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Stock Quantities Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock on Arrival
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.stockOnArrival}
                onChange={(e) => handleChange("stockOnArrival", e.target.value)}
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock In House
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.stockInHouse}
                onChange={(e) => handleChange("stockInHouse", e.target.value)}
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

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
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

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
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refurbished Qty
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.refurbishedQty}
                onChange={(e) => handleChange("refurbishedQty", e.target.value)}
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Final Stock
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.finalStock}
                onChange={(e) => handleChange("finalStock", e.target.value)}
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white font-semibold"
              />
            </div>

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
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

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
                onBlur={validateStock}
                className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
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

          {/* Action Buttons */}
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
