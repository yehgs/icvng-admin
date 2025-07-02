// components/stock/StockMovements.jsx
import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowRight,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  Plus,
  Minus,
  Truck,
  Warehouse,
  Globe,
  Monitor,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stockAPI } from '../../utils/api';

const StockMovements = ({ batches, loading, onRefresh }) => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [moveForm, setMoveForm] = useState({
    quantity: '',
    fromLocation: 'offline',
    toLocation: 'online',
    reason: '',
    notes: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    type: 'ADD',
    reason: '',
    notes: '',
  });

  const locationOptions = [
    { value: 'online', label: 'Online Store', icon: Globe },
    { value: 'offline', label: 'Offline Store', icon: Monitor },
    { value: 'warehouse', label: 'Warehouse', icon: Warehouse },
  ];

  const movementTypes = {
    RECEIVED: { icon: Package, color: 'blue' },
    QUALITY_CHECK: { icon: ArrowUpDown, color: 'yellow' },
    ALLOCATED: { icon: ArrowRight, color: 'purple' },
    MOVED: { icon: Truck, color: 'green' },
    ADJUSTED: { icon: Plus, color: 'orange' },
    EXPIRED: { icon: AlertCircle, color: 'red' },
    DAMAGED: { icon: Minus, color: 'gray' },
  };

  const availableBatches = batches.filter(
    (batch) =>
      batch.status === 'AVAILABLE' || batch.status === 'PARTIALLY_ALLOCATED'
  );

  const handleMoveStock = (batch) => {
    setSelectedBatch(batch);
    setMoveForm({
      quantity: '',
      fromLocation: batch.onlineStock > 0 ? 'online' : 'offline',
      toLocation: batch.onlineStock > 0 ? 'offline' : 'online',
      reason: '',
      notes: '',
    });
    setShowMoveModal(true);
  };

  const handleAdjustStock = (batch) => {
    setSelectedBatch(batch);
    setAdjustForm({
      quantity: '',
      type: 'ADD',
      reason: '',
      notes: '',
    });
    setShowAdjustModal(true);
  };

  const submitMoveStock = async () => {
    if (!moveForm.quantity || moveForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (moveForm.quantity > selectedBatch.availableQuantity) {
      toast.error('Quantity exceeds available stock');
      return;
    }

    setSubmitting(true);
    try {
      const data = await stockAPI.moveStock(selectedBatch._id, moveForm);

      if (data.success) {
        toast.success('Stock moved successfully!');
        setShowMoveModal(false);
        setSelectedBatch(null);
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to move stock');
      }
    } catch (error) {
      console.error('Error moving stock:', error);
      toast.error('Failed to move stock');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdjustStock = async () => {
    if (!adjustForm.quantity || adjustForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (
      adjustForm.type === 'REMOVE' &&
      adjustForm.quantity > selectedBatch.currentQuantity
    ) {
      toast.error('Cannot remove more than current quantity');
      return;
    }

    setSubmitting(true);
    try {
      const data = await stockAPI.adjustStock(selectedBatch._id, {
        ...adjustForm,
        quantity: parseInt(adjustForm.quantity),
      });
      if (data.success) {
        toast.success('Stock adjusted successfully!');
        setShowAdjustModal(false);
        setSelectedBatch(null);
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const getMovementIcon = (type) => {
    const movement = movementTypes[type];
    if (!movement) return Package;
    return movement.icon;
  };

  const getMovementColor = (type) => {
    const movement = movementTypes[type];
    if (!movement) return 'gray';
    return movement.color;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading stock movements...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stock Movements & Adjustments
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Move stock between locations and adjust quantities
          </p>
        </div>
      </div>

      {/* Available Batches for Movement */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Available Batches ({availableBatches.length})
        </h4>

        {availableBatches.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No available batches for movement or adjustment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {availableBatches.map((batch) => (
              <div
                key={batch._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                {/* Batch Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {batch.batchNumber}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {batch.product?.name}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                    {batch.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Stock Distribution */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Available:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {batch.availableQuantity}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Online:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {batch.onlineStock}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Offline:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {batch.offlineStock}
                    </span>
                  </div>
                  {batch.reservedQuantity > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Reserved:
                      </span>
                      <span className="text-orange-600">
                        {batch.reservedQuantity}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleMoveStock(batch)}
                    disabled={batch.availableQuantity === 0}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    Move
                  </button>
                  <button
                    onClick={() => handleAdjustStock(batch)}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Adjust
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Movement History */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Recent Movement History
        </h4>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {batches
              .filter(
                (batch) =>
                  batch.movementHistory && batch.movementHistory.length > 0
              )
              .slice(0, 10)
              .map((batch) =>
                batch.movementHistory
                  .slice(-3) // Show last 3 movements per batch
                  .map((movement, index) => {
                    const Icon = getMovementIcon(movement.type);
                    const color = getMovementColor(movement.type);

                    return (
                      <div
                        key={`${batch._id}-${index}`}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}
                          >
                            <Icon
                              className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {movement.type.replace('_', ' ')} -{' '}
                                {batch.batchNumber}
                              </p>
                              <time className="text-xs text-gray-500">
                                {new Date(movement.date).toLocaleDateString()}
                              </time>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {batch.product?.name} • Quantity:{' '}
                              {movement.quantity}
                            </p>

                            {movement.fromLocation && movement.toLocation && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {movement.fromLocation} → {movement.toLocation}
                              </div>
                            )}

                            {movement.reason && (
                              <p className="text-xs text-gray-500 mt-1">
                                {movement.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
          </div>
        </div>
      </div>

      {/* Move Stock Modal */}
      {showMoveModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Move Stock
              </h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedBatch.batchNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Stock: {selectedBatch.currentQuantity} units
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Action Type
                  </label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) =>
                      setAdjustForm((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="ADD">Add Stock</option>
                    <option value="REMOVE">Remove Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={
                      adjustForm.type === 'REMOVE'
                        ? selectedBatch.currentQuantity
                        : undefined
                    }
                    value={adjustForm.quantity}
                    onChange={(e) =>
                      setAdjustForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select reason...</option>
                  <option value="Damaged goods">Damaged goods</option>
                  <option value="Lost inventory">Lost inventory</option>
                  <option value="Found inventory">Found inventory</option>
                  <option value="Quality issue">Quality issue</option>
                  <option value="Expired products">Expired products</option>
                  <option value="Theft/Shrinkage">Theft/Shrinkage</option>
                  <option value="Returns processing">Returns processing</option>
                  <option value="Cycle count correction">
                    Cycle count correction
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Required)
                </label>
                <textarea
                  rows={3}
                  value={adjustForm.notes}
                  onChange={(e) =>
                    setAdjustForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Detailed explanation for the stock adjustment..."
                  required
                />
              </div>

              {adjustForm.type && adjustForm.quantity && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    New stock level will be:{' '}
                    {adjustForm.type === 'ADD'
                      ? selectedBatch.currentQuantity +
                        parseInt(adjustForm.quantity || 0)
                      : selectedBatch.currentQuantity -
                        parseInt(adjustForm.quantity || 0)}{' '}
                    units
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAdjustStock}
                  disabled={
                    submitting ||
                    !adjustForm.quantity ||
                    !adjustForm.notes.trim()
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Adjust Stock
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

export default StockMovements;
