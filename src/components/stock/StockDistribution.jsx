// components/stock/StockDistribution.jsx (New Component)
import React, { useState } from 'react';
import {
  Globe,
  Monitor,
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  FileText,
  Save,
  Loader2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stockAPI } from '../../utils/api';

const StockDistribution = ({ batches, loading, onRefresh, currentUser }) => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    distributions: [], // Array of { productId, onlineQuantity, offlineQuantity }
    reason: '',
    notes: '',
  });

  // User roles that can approve distributions
  const approvalRoles = ['Director', 'IT', 'Manager'];
  const canApprove = approvalRoles.includes(currentUser?.role);

  const handleStartDistribution = (batch) => {
    setSelectedBatch(batch);

    // Initialize distribution form with batch items that passed/refurbished
    const initialDistributions =
      batch.items
        ?.map((item) => ({
          productId: item.product._id,
          productName: item.product.name,
          availableQuantity: item.passedQuantity + item.refurbishedQuantity,
          onlineQuantity: 0,
          offlineQuantity: item.passedQuantity + item.refurbishedQuantity, // Default to offline
          notes: '',
        }))
        .filter((item) => item.availableQuantity > 0) || [];

    setDistributionForm({
      distributions: initialDistributions,
      reason: '',
      notes: '',
    });
    setShowDistributionModal(true);
  };

  const handleDistributionChange = (index, field, value) => {
    setDistributionForm((prev) => ({
      ...prev,
      distributions: prev.distributions.map((dist, i) =>
        i === index ? { ...dist, [field]: value } : dist
      ),
    }));
  };

  const handleQuantityChange = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    const distribution = distributionForm.distributions[index];

    if (field === 'onlineQuantity') {
      const offlineQuantity = distribution.availableQuantity - numValue;
      if (offlineQuantity >= 0) {
        handleDistributionChange(index, 'onlineQuantity', numValue);
        handleDistributionChange(index, 'offlineQuantity', offlineQuantity);
      }
    } else if (field === 'offlineQuantity') {
      const onlineQuantity = distribution.availableQuantity - numValue;
      if (onlineQuantity >= 0) {
        handleDistributionChange(index, 'offlineQuantity', numValue);
        handleDistributionChange(index, 'onlineQuantity', onlineQuantity);
      }
    }
  };

  const validateForm = () => {
    for (const dist of distributionForm.distributions) {
      const total = dist.onlineQuantity + dist.offlineQuantity;
      if (total !== dist.availableQuantity) {
        toast.error(
          `Total distribution for ${dist.productName} must equal available quantity (${dist.availableQuantity})`
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmitDistribution = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const distributionData = {
        distributions: distributionForm.distributions.map((dist) => ({
          productId: dist.productId,
          onlineQuantity: dist.onlineQuantity,
          offlineQuantity: dist.offlineQuantity,
          notes: dist.notes,
        })),
        reason: distributionForm.reason,
        notes: distributionForm.notes,
      };

      const data = await stockAPI.distributeStock(
        selectedBatch._id,
        distributionData
      );

      if (data.success) {
        toast.success('Stock distribution submitted for approval!');
        setShowDistributionModal(false);
        setSelectedBatch(null);
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to submit distribution');
      }
    } catch (error) {
      console.error('Error submitting distribution:', error);
      toast.error('Failed to submit distribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDistribution = async (batchId) => {
    try {
      const data = await stockAPI.approveDistribution(batchId, {
        approved: true,
        approverNotes: '',
      });

      if (data.success) {
        toast.success('Distribution approved successfully!');
        onRefresh();
      } else {
        toast.error(data.message || 'Failed to approve distribution');
      }
    } catch (error) {
      console.error('Error approving distribution:', error);
      toast.error('Failed to approve distribution');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading stock distribution...
        </span>
      </div>
    );
  }

  // Filter batches that have passed quality check but not yet distributed
  const readyForDistribution = batches.filter(
    (batch) =>
      batch.qualityStatus === 'COMPLETED' &&
      batch.distributionStatus === 'PENDING'
  );

  // Filter batches pending approval
  const pendingApproval = batches.filter(
    (batch) => batch.distributionStatus === 'AWAITING_APPROVAL'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stock Distribution & Approval
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distribute quality-checked stock between online and offline channels
          </p>
        </div>
      </div>

      {/* Ready for Distribution */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Ready for Distribution ({readyForDistribution.length})
        </h4>

        {readyForDistribution.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No batches ready for distribution
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {readyForDistribution.map((batch) => (
              <div
                key={batch._id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {batch.batchNumber}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      PO: {batch.purchaseOrder?.orderNumber}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                    READY
                  </span>
                </div>

                {/* Available Items */}
                <div className="space-y-2 mb-4">
                  {batch.items
                    ?.filter(
                      (item) =>
                        item.passedQuantity + item.refurbishedQuantity > 0
                    )
                    .map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.product?.name}
                        </span>
                        <span className="text-green-600 font-medium">
                          {item.passedQuantity + item.refurbishedQuantity}{' '}
                          available
                        </span>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => handleStartDistribution(batch)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  Distribute Stock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approval */}
      {canApprove && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Pending Approval ({pendingApproval.length})
          </h4>

          {pendingApproval.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No distributions pending approval
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingApproval.map((batch) => (
                <div
                  key={batch._id}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {batch.batchNumber}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submitted by: {batch.distributionSubmittedBy?.name}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-medium">
                      PENDING
                    </span>
                  </div>

                  {/* Distribution Summary */}
                  <div className="space-y-2 mb-4">
                    {batch.distributionPlan?.map((dist, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {dist.productName}
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Online: {dist.onlineQuantity}</span>
                          <span>Offline: {dist.offlineQuantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleApproveDistribution(batch._id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Distribution
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Distribution Modal */}
      {showDistributionModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Stock Distribution: {selectedBatch.batchNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Distribute stock between online and offline channels
                </p>
              </div>
              <button
                onClick={() => setShowDistributionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Distribution by Item */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Distribution by Item
                </h4>

                <div className="space-y-4">
                  {distributionForm.distributions.map((dist, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dist.productName}
                        </span>
                        <span className="text-sm text-gray-500">
                          Available: {dist.availableQuantity} units
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="flex items-center text-sm text-blue-600 dark:text-blue-400 mb-1">
                            <Globe className="h-4 w-4 mr-1" />
                            Online Store
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={dist.availableQuantity}
                            value={dist.onlineQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                'onlineQuantity',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="flex items-center text-sm text-green-600 dark:text-green-400 mb-1">
                            <Monitor className="h-4 w-4 mr-1" />
                            Offline Store
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={dist.availableQuantity}
                            value={dist.offlineQuantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                'offlineQuantity',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Distribution Validation */}
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                        <div className="flex justify-between">
                          <span>Total Distributed:</span>
                          <span
                            className={
                              dist.onlineQuantity + dist.offlineQuantity ===
                              dist.availableQuantity
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {dist.onlineQuantity + dist.offlineQuantity} /{' '}
                            {dist.availableQuantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribution Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Distribution Reason
                </label>
                <select
                  value={distributionForm.reason}
                  onChange={(e) =>
                    setDistributionForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select reason...</option>
                  <option value="Standard distribution">
                    Standard distribution
                  </option>
                  <option value="High demand online">High demand online</option>
                  <option value="High demand offline">
                    High demand offline
                  </option>
                  <option value="Seasonal adjustment">
                    Seasonal adjustment
                  </option>
                  <option value="Inventory rebalancing">
                    Inventory rebalancing
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Distribution Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Distribution Notes
                </label>
                <textarea
                  rows={3}
                  value={distributionForm.notes}
                  onChange={(e) =>
                    setDistributionForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Additional notes about this distribution..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDistributionModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDistribution}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Submit for Approval
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

export default StockDistribution;
