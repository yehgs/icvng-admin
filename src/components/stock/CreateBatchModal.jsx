// components/stock/CreateBatchModal.jsx (Simplified)
import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Building2,
  Calendar,
  MapPin,
  Save,
  Loader2,
  FileText,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stockAPI, purchaseOrderAPI } from '../../utils/api';

const CreateBatchModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    warehouseLocation: {
      zone: 'A',
      aisle: '01',
      shelf: '01',
      bin: '01',
    },
    notes: '',
  });

  const warehouseZones = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    if (isOpen) {
      fetchDeliveredPurchaseOrders();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.purchaseOrderId) {
      fetchPODetails(formData.purchaseOrderId);
    }
  }, [formData.purchaseOrderId]);

  const fetchDeliveredPurchaseOrders = async () => {
    setLoading(true);
    try {
      const data = await purchaseOrderAPI.getPurchaseOrders({
        status: 'DELIVERED',
        hasBatch: false,
      });

      if (data.success) {
        setPurchaseOrders(data.data);
      } else {
        toast.error('Failed to fetch delivered purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPODetails = async (poId) => {
    try {
      const data = await purchaseOrderAPI.getPurchaseOrder(poId);
      if (data.success) {
        setSelectedPO(data.data);
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.purchaseOrderId) {
      newErrors.purchaseOrderId = 'Purchase order is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Create batch with all items from the purchase order
      const batchData = {
        purchaseOrderId: formData.purchaseOrderId,
        items: selectedPO.items.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
          expiryDate: item.product.isPerishable
            ? new Date(
                Date.now() +
                  (item.product.shelfLifeDays || 365) * 24 * 60 * 60 * 1000
              )
            : null,
        })),
        warehouseLocation: formData.warehouseLocation,
        notes: formData.notes,
      };

      const data = await stockAPI.createStockBatch(batchData);

      if (data.success) {
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to create stock batch');
      }
    } catch (error) {
      console.error('Error creating stock batch:', error);
      toast.error('Failed to create stock batch');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      purchaseOrderId: '',
      warehouseLocation: {
        zone: 'A',
        aisle: '01',
        shelf: '01',
        bin: '01',
      },
      notes: '',
    });
    setSelectedPO(null);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Stock Batch
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create batch from delivered purchase orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading purchase orders...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Purchase Order Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Order *
              </label>
              <select
                value={formData.purchaseOrderId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchaseOrderId: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.purchaseOrderId
                    ? 'border-red-300'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select Purchase Order</option>
                {purchaseOrders.map((po) => (
                  <option key={po._id} value={po._id}>
                    {po.orderNumber} - {po.supplier?.name} (
                    {new Date(po.orderDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {errors.purchaseOrderId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.purchaseOrderId}
                </p>
              )}
            </div>

            {/* Purchase Order Details */}
            {selectedPO && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Purchase Order Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Order Number:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedPO.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Supplier:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedPO.supplier?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Items:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedPO.items?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivery Date:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(selectedPO.deliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Items to be batched:
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedPO.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border"
                      >
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {item.product?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity}
                          </span>
                          {item.product?.isPerishable && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded text-xs">
                              Perishable
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Warehouse Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Warehouse Location
              </label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Zone
                  </label>
                  <select
                    value={formData.warehouseLocation.zone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warehouseLocation: {
                          ...prev.warehouseLocation,
                          zone: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  >
                    {warehouseZones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Aisle
                  </label>
                  <input
                    type="text"
                    value={formData.warehouseLocation.aisle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warehouseLocation: {
                          ...prev.warehouseLocation,
                          aisle: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="01"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Shelf
                  </label>
                  <input
                    type="text"
                    value={formData.warehouseLocation.shelf}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warehouseLocation: {
                          ...prev.warehouseLocation,
                          shelf: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="01"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Bin
                  </label>
                  <input
                    type="text"
                    value={formData.warehouseLocation.bin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        warehouseLocation: {
                          ...prev.warehouseLocation,
                          bin: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="01"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-1" />
                Location: {formData.warehouseLocation.zone}-
                {formData.warehouseLocation.aisle}-
                {formData.warehouseLocation.shelf}-
                {formData.warehouseLocation.bin}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Any additional notes about this batch..."
              />
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Batch
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateBatchModal;
