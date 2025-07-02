// components/stock/QualityControl.jsx (Simplified)
import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Package,
  User,
  Calendar,
  FileText,
  Save,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stockAPI } from '../../utils/api';

const QualityControl = ({ batches, loading, onRefresh }) => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showQualityForm, setShowQualityForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qualityForm, setQualityForm] = useState({
    items: [], // Array of { productId, qualityStatus, quantity, notes }
    generalNotes: '',
  });

  // Simplified quality status options
  const qualityStatusOptions = [
    { value: 'PENDING', label: 'Pending', icon: Clock, color: 'yellow' },
    { value: 'PASSED', label: 'Passed', icon: CheckCircle, color: 'green' },
    {
      value: 'REFURBISHED',
      label: 'Refurbished',
      icon: RotateCcw,
      color: 'blue',
    },
    { value: 'DAMAGED', label: 'Damaged', icon: XCircle, color: 'red' },
    {
      value: 'EXPIRED',
      label: 'Expired',
      icon: AlertTriangle,
      color: 'orange',
    },
  ];

  const handleStartQualityCheck = (batch) => {
    setSelectedBatch(batch);

    // Initialize quality form with batch items
    const initialItems =
      batch.items?.map((item) => ({
        productId: item.product._id,
        productName: item.product.name,
        originalQuantity: item.quantity,
        qualityStatus: 'PENDING',
        passedQuantity: item.quantity,
        refurbishedQuantity: 0,
        damagedQuantity: 0,
        expiredQuantity: 0,
        notes: '',
      })) || [];

    setQualityForm({
      items: initialItems,
      generalNotes: '',
    });
    setShowQualityForm(true);
  };

  const handleItemQualityChange = (index, field, value) => {
    setQualityForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleQuantityChange = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    const item = qualityForm.items[index];
    const newItem = { ...item, [field]: numValue };

    // Ensure total doesn't exceed original quantity
    const total =
      newItem.passedQuantity +
      newItem.refurbishedQuantity +
      newItem.damagedQuantity +
      newItem.expiredQuantity;

    if (total <= item.originalQuantity) {
      handleItemQualityChange(index, field, numValue);
    }
  };

  const validateForm = () => {
    for (const item of qualityForm.items) {
      const total =
        item.passedQuantity +
        item.refurbishedQuantity +
        item.damagedQuantity +
        item.expiredQuantity;

      if (total !== item.originalQuantity) {
        toast.error(
          `Total quantity for ${item.productName} must equal original quantity (${item.originalQuantity})`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmitQualityCheck = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const qualityData = {
        items: qualityForm.items.map((item) => ({
          productId: item.productId,
          passedQuantity: item.passedQuantity,
          refurbishedQuantity: item.refurbishedQuantity,
          damagedQuantity: item.damagedQuantity,
          expiredQuantity: item.expiredQuantity,
          notes: item.notes,
        })),
        generalNotes: qualityForm.generalNotes,
      };

      const data = await stockAPI.performQualityCheck(
        selectedBatch._id,
        qualityData
      );

      if (data.success) {
        toast.success('Quality check completed successfully!');
        setShowQualityForm(false);
        setSelectedBatch(null);
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to complete quality check');
      }
    } catch (error) {
      console.error('Error completing quality check:', error);
      toast.error('Failed to complete quality check');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading quality control batches...
        </span>
      </div>
    );
  }

  const pendingBatches = batches.filter(
    (batch) => batch.qualityStatus === 'PENDING'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quality Control Queue
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pendingBatches.length} batch(es) pending quality inspection
          </p>
        </div>
      </div>

      {/* Pending Batches */}
      {pendingBatches.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No batches pending quality inspection at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingBatches.map((batch) => (
            <div
              key={batch._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Batch Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {batch.batchNumber}
                    </h4>
                    <p className="text-sm text-gray-500">
                      From PO: {batch.purchaseOrder?.orderNumber}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-medium">
                  PENDING
                </span>
              </div>

              {/* Batch Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Supplier: {batch.supplier?.name || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Received:{' '}
                    {new Date(batch.receivedDate).toLocaleDateString()}
                  </span>
                </div>

                {/* Items Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Items ({batch.items?.length || 0}):
                  </div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {batch.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.product?.name}
                        </span>
                        <span className="text-gray-500">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleStartQualityCheck(batch)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Start Quality Check
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quality Check Modal */}
      {showQualityForm && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quality Control: {selectedBatch.batchNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  From PO: {selectedBatch.purchaseOrder?.orderNumber} -{' '}
                  {selectedBatch.supplier?.name}
                </p>
              </div>
              <button
                onClick={() => setShowQualityForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Items Quality Check */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Quality Assessment by Item
                </h4>

                <div className="space-y-4">
                  {qualityForm.items.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          Total: {item.originalQuantity} units
                        </span>
                      </div>

                      {/* Quantity Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-green-600 dark:text-green-400 mb-1">
                            ✓ Passed
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.originalQuantity}
                            value={item.passedQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                'passedQuantity',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-blue-600 dark:text-blue-400 mb-1">
                            ↻ Refurbished
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.originalQuantity}
                            value={item.refurbishedQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                'refurbishedQuantity',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-red-600 dark:text-red-400 mb-1">
                            ✗ Damaged
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.originalQuantity}
                            value={item.damagedQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                'damagedQuantity',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-orange-600 dark:text-orange-400 mb-1">
                            ⚠ Expired
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.originalQuantity}
                            value={item.expiredQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                'expiredQuantity',
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Quantity Validation */}
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                        <div className="flex justify-between">
                          <span>Total Checked:</span>
                          <span
                            className={
                              item.passedQuantity +
                                item.refurbishedQuantity +
                                item.damagedQuantity +
                                item.expiredQuantity ===
                              item.originalQuantity
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {item.passedQuantity +
                              item.refurbishedQuantity +
                              item.damagedQuantity +
                              item.expiredQuantity}{' '}
                            / {item.originalQuantity}
                          </span>
                        </div>
                      </div>

                      {/* Item Notes */}
                      <div className="mt-3">
                        <textarea
                          rows={2}
                          value={item.notes}
                          onChange={(e) =>
                            handleItemQualityChange(
                              index,
                              'notes',
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                          placeholder={`Notes for ${item.productName}...`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  General Quality Control Notes
                </label>
                <textarea
                  rows={3}
                  value={qualityForm.generalNotes}
                  onChange={(e) =>
                    setQualityForm((prev) => ({
                      ...prev,
                      generalNotes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Overall observations, recommendations, or additional notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowQualityForm(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitQualityCheck}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Complete Quality Check
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControl;
