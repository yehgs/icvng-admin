// admin/src/components/logistics/UpdateTrackingModal.jsx
import React, { useState } from 'react';
import { X, MapPin, Calendar, Package } from 'lucide-react';

const UpdateTrackingModal = ({
  isOpen,
  onClose,
  onSubmit,
  tracking,
  loading,
}) => {
  const [formData, setFormData] = useState({
    status: tracking?.status || 'PENDING',
    description: '',
    location: {
      city: '',
      state: '',
      country: 'Nigeria',
      facility: '',
    },
    estimatedDelivery: tracking?.estimatedDelivery
      ? new Date(tracking.estimatedDelivery).toISOString().split('T')[0]
      : '',
    isCustomerVisible: true,
  });

  const [errors, setErrors] = useState({});
  const [applyToGroup, setApplyToGroup] = useState(true);

  const statusOptions = [
    {
      value: 'PENDING',
      label: 'Pending',
      description: 'Order received, preparing for shipment',
    },
    {
      value: 'PROCESSING',
      label: 'Processing',
      description: 'Package being prepared',
    },
    {
      value: 'PICKED_UP',
      label: 'Picked Up',
      description: 'Package picked up by carrier',
    },
    {
      value: 'IN_TRANSIT',
      label: 'In Transit',
      description: 'Package in transit to destination',
    },
    {
      value: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      description: 'Package out for delivery',
    },
    {
      value: 'DELIVERED',
      label: 'Delivered',
      description: 'Package successfully delivered',
    },
    {
      value: 'ATTEMPTED',
      label: 'Delivery Attempted',
      description: 'Delivery attempted but failed',
    },
    {
      value: 'RETURNED',
      label: 'Returned',
      description: 'Package returned to sender',
    },
    { value: 'LOST', label: 'Lost', description: 'Package appears to be lost' },
    {
      value: 'CANCELLED',
      label: 'Cancelled',
      description: 'Shipment cancelled',
    },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Update description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        applyToGroup,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Update Tracking
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tracking?.trackingNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {
                statusOptions.find((opt) => opt.value === formData.status)
                  ?.description
              }
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Update Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none ${
                errors.description
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Describe what happened with this shipment..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Location Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facility/Hub
                </label>
                <input
                  type="text"
                  value={formData.location.facility}
                  onChange={(e) =>
                    handleLocationChange('facility', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="e.g., Lagos Distribution Center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="e.g., Lagos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) =>
                    handleLocationChange('state', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="e.g., Lagos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) =>
                    handleLocationChange('country', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Estimated Delivery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Update Estimated Delivery (Optional)
            </label>
            <input
              type="date"
              name="estimatedDelivery"
              value={formData.estimatedDelivery}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isCustomerVisible"
                checked={formData.isCustomerVisible}
                onChange={handleInputChange}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Visible to customer
              </span>
            </label>
          </div>

          {tracking?.isGroupShipment && tracking.groupItemCount > 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToGroup}
                  onChange={(e) => setApplyToGroup(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Apply update to all {tracking.groupItemCount} items in this
                  shipment
                </span>
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-6">
                This shipment contains {tracking.groupItemCount} items. Checking
                this will update tracking for all items.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Tracking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTrackingModal;
