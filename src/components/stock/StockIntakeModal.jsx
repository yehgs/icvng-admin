// components/stock/StockIntakeModal.jsx (Enhanced with Expiry Management)
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
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowLeft,
  CalendarDays,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { stockAPI, purchaseOrderAPI } from '../../utils/api';

const StockIntakeModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Select PO, 2: Expiry Dates, 3: Quality Check

  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    items: [], // Will be populated with expiry dates and quality check data
    generalNotes: '',
    bulkExpiryDate: '', // For bulk assignment
    expiredLocation: { zone: 'EXPIRED', aisle: '01', shelf: '01', bin: '01' }, // Default expired location
  });

  // Product types that can have expiry dates
  const consumableProductTypes = ['COFFEE', 'COFFEE_BEANS', 'TEA', 'DRINKS'];

  const isConsumableProduct = (productType) => {
    return consumableProductTypes.includes(productType);
  };

  // Quality status options with colors for UI
  const qualityStatuses = {
    PASSED: { label: 'Passed', icon: CheckCircle, color: 'green' },
    REFURBISHED: { label: 'Refurbished', icon: RotateCcw, color: 'blue' },
    DAMAGED: { label: 'Damaged', icon: XCircle, color: 'red' },
    EXPIRED: { label: 'Expired', icon: AlertTriangle, color: 'orange' },
  };

  useEffect(() => {
    if (isOpen) {
      fetchDeliveredPurchaseOrders();
      resetForm();
    }
  }, [isOpen]);

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

  const handlePOSelection = async (poId) => {
    try {
      const data = await purchaseOrderAPI.getPurchaseOrder(poId);
      if (data.success) {
        setSelectedPO(data.data);

        // Initialize items with expiry date fields
        const initialItems = data.data.items.map((item) => ({
          productId: item.product._id,
          productName: item.product.name,
          productType: item.product.productType,
          originalQuantity: item.quantity,

          // Expiry management
          hasExpiryDate: isConsumableProduct(item.product.productType), // Auto-enable for consumables
          expiryDate: '',
          isExpired: false, // Will be calculated

          // Quality quantities (will be calculated based on expiry)
          passedQuantity: item.quantity,
          refurbishedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: 0,

          // Locations for each quality type
          locations: {
            PASSED: { zone: '', aisle: '', shelf: '', bin: '' },
            REFURBISHED: { zone: '', aisle: '', shelf: '', bin: '' },
            DAMAGED: { zone: '', aisle: '', shelf: '', bin: '' },
            EXPIRED: { ...formData.expiredLocation }, // Use default expired location
          },

          notes: '',
        }));

        setFormData((prev) => ({
          ...prev,
          purchaseOrderId: poId,
          items: initialItems,
        }));

        setCurrentStep(2); // Move to expiry date assignment
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast.error('Failed to fetch purchase order details');
    }
  };

  const checkExpiredItems = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const newItems = formData.items.map((item) => {
      if (item.hasExpiryDate && item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        const isExpired = expiryDate <= today;

        if (isExpired) {
          // If expired, move all quantity to expired
          return {
            ...item,
            isExpired: true,
            passedQuantity: 0,
            refurbishedQuantity: 0,
            damagedQuantity: 0,
            expiredQuantity: item.originalQuantity,
          };
        } else {
          // If not expired, reset to original state
          return {
            ...item,
            isExpired: false,
            passedQuantity: item.originalQuantity,
            refurbishedQuantity: 0,
            damagedQuantity: 0,
            expiredQuantity: 0,
          };
        }
      }
      return item;
    });

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleBulkExpiryAssignment = () => {
    if (!formData.bulkExpiryDate) {
      toast.error('Please select a bulk expiry date');
      return;
    }

    // Apply to all consumable products that have expiry enabled
    const newItems = formData.items.map((item) => {
      if (item.hasExpiryDate) {
        return {
          ...item,
          expiryDate: formData.bulkExpiryDate,
        };
      }
      return item;
    });

    setFormData((prev) => ({ ...prev, items: newItems }));

    // Check for expired items after bulk assignment
    setTimeout(() => {
      const updatedItems = newItems.map((item) => {
        if (item.hasExpiryDate && item.expiryDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiryDate = new Date(item.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);

          const isExpired = expiryDate <= today;

          if (isExpired) {
            return {
              ...item,
              isExpired: true,
              passedQuantity: 0,
              refurbishedQuantity: 0,
              damagedQuantity: 0,
              expiredQuantity: item.originalQuantity,
            };
          } else {
            return {
              ...item,
              isExpired: false,
              passedQuantity: item.originalQuantity,
              refurbishedQuantity: 0,
              damagedQuantity: 0,
              expiredQuantity: 0,
            };
          }
        }
        return item;
      });

      setFormData((prev) => ({ ...prev, items: updatedItems }));
    }, 100);

    const affectedItems = newItems.filter((item) => item.hasExpiryDate).length;
    toast.success(`Bulk expiry date assigned to ${affectedItems} items`);
  };

  const handleExpiryToggle = (index, enabled) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      hasExpiryDate: enabled,
      expiryDate: enabled ? newItems[index].expiryDate : '',
      isExpired: false,
      // Reset quantities when toggling
      passedQuantity: newItems[index].originalQuantity,
      refurbishedQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
    };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleExpiryDateChange = (index, date) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], expiryDate: date };

    // Check if this specific item is expired
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(date);
      expiryDate.setHours(0, 0, 0, 0);

      const isExpired = expiryDate <= today;

      if (isExpired) {
        newItems[index] = {
          ...newItems[index],
          isExpired: true,
          passedQuantity: 0,
          refurbishedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: newItems[index].originalQuantity,
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          isExpired: false,
          passedQuantity: newItems[index].originalQuantity,
          refurbishedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: 0,
        };
      }
    }

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleQuantityChange = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    const item = formData.items[index];

    // Don't allow changes if item is expired
    if (item.isExpired) {
      toast.error('Cannot modify quantities for expired items');
      return;
    }

    const newItem = { ...item, [field]: numValue };

    // Ensure total doesn't exceed original quantity
    const total =
      newItem.passedQuantity +
      newItem.refurbishedQuantity +
      newItem.damagedQuantity +
      newItem.expiredQuantity;

    if (total <= item.originalQuantity) {
      const newItems = [...formData.items];
      newItems[index] = newItem;
      setFormData((prev) => ({ ...prev, items: newItems }));
    }
  };

  const handleLocationChange = (index, qualityType, locationField, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      locations: {
        ...newItems[index].locations,
        [qualityType]: {
          ...newItems[index].locations[qualityType],
          [locationField]: value,
        },
      },
    };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleExpiredLocationChange = (locationField, value) => {
    const newExpiredLocation = {
      ...formData.expiredLocation,
      [locationField]: value,
    };

    // Update the global expired location
    setFormData((prev) => ({
      ...prev,
      expiredLocation: newExpiredLocation,
      // Update all items' expired locations
      items: prev.items.map((item) => ({
        ...item,
        locations: {
          ...item.locations,
          EXPIRED: newExpiredLocation,
        },
      })),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.purchaseOrderId) {
        newErrors.purchaseOrderId = 'Purchase order is required';
      }
    }

    if (currentStep === 3) {
      // Validate quantities
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        const total =
          item.passedQuantity +
          item.refurbishedQuantity +
          item.damagedQuantity +
          item.expiredQuantity;

        if (total !== item.originalQuantity) {
          newErrors[
            `item_${i}_quantity`
          ] = `Total quantity for ${item.productName} must equal ${item.originalQuantity}`;
        }

        // Validate locations for non-zero quantities
        Object.keys(qualityStatuses).forEach((status) => {
          const quantity = item[`${status.toLowerCase()}Quantity`];
          if (quantity > 0) {
            const location = item.locations[status];
            if (
              !location.zone ||
              !location.aisle ||
              !location.shelf ||
              !location.bin
            ) {
              newErrors[
                `item_${i}_location_${status}`
              ] = `Location required for ${status.toLowerCase()} items of ${
                item.productName
              }`;
            }
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const intakeData = {
        purchaseOrderId: formData.purchaseOrderId,
        items: formData.items.map((item) => ({
          productId: item.productId,
          originalQuantity: item.originalQuantity,
          hasExpiryDate: item.hasExpiryDate,
          expiryDate:
            item.hasExpiryDate && item.expiryDate ? item.expiryDate : null,
          passedQuantity: item.passedQuantity,
          refurbishedQuantity: item.refurbishedQuantity,
          damagedQuantity: item.damagedQuantity,
          expiredQuantity: item.expiredQuantity,
          locations: item.locations,
          notes: item.notes,
        })),
        expiredLocation: formData.expiredLocation,
        generalNotes: formData.generalNotes,
      };

      const data = await stockAPI.createStockIntake(intakeData);

      if (data.success) {
        onSuccess();
        toast.success('Stock intake completed successfully!');
      } else {
        toast.error(data.message || 'Failed to complete stock intake');
      }
    } catch (error) {
      console.error('Error completing stock intake:', error);
      toast.error('Failed to complete stock intake');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      purchaseOrderId: '',
      items: [],
      generalNotes: '',
      bulkExpiryDate: '',
      expiredLocation: { zone: 'EXPIRED', aisle: '01', shelf: '01', bin: '01' },
    });
    setSelectedPO(null);
    setCurrentStep(1);
    setErrors({});
  };

  const renderLocationInputs = (item, index, qualityType) => {
    const quantity = item[`${qualityType.toLowerCase()}Quantity`];
    if (quantity === 0) return null;

    const location = item.locations[qualityType];
    const statusInfo = qualityStatuses[qualityType];

    return (
      <div className="mt-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center mb-3">
          <statusInfo.icon
            className={`h-4 w-4 mr-2 text-${statusInfo.color}-600`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {statusInfo.label} Items Location ({quantity} units)
          </span>
        </div>

        {qualityType === 'EXPIRED' ? (
          <div className="text-sm text-orange-600 dark:text-orange-400">
            📍 Location: {location.zone}-{location.aisle}-{location.shelf}-
            {location.bin}
            <br />
            <span className="text-xs">
              This uses the global expired location defined above
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Zone
                </label>
                <input
                  type="text"
                  value={location.zone}
                  onChange={(e) =>
                    handleLocationChange(
                      index,
                      qualityType,
                      'zone',
                      e.target.value
                    )
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="A"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Aisle
                </label>
                <input
                  type="text"
                  value={location.aisle}
                  onChange={(e) =>
                    handleLocationChange(
                      index,
                      qualityType,
                      'aisle',
                      e.target.value
                    )
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="01"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Shelf
                </label>
                <input
                  type="text"
                  value={location.shelf}
                  onChange={(e) =>
                    handleLocationChange(
                      index,
                      qualityType,
                      'shelf',
                      e.target.value
                    )
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="01"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Bin
                </label>
                <input
                  type="text"
                  value={location.bin}
                  onChange={(e) =>
                    handleLocationChange(
                      index,
                      qualityType,
                      'bin',
                      e.target.value
                    )
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="01"
                  required
                />
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {location.zone &&
              location.aisle &&
              location.shelf &&
              location.bin ? (
                <span>
                  📍 Location: {location.zone}-{location.aisle}-{location.shelf}
                  -{location.bin}
                </span>
              ) : (
                <span className="text-red-500">
                  ⚠ Please fill all location fields
                </span>
              )}
            </div>
          </>
        )}

        {errors[`item_${index}_location_${qualityType}`] && (
          <p className="mt-1 text-xs text-red-600">
            {errors[`item_${index}_location_${qualityType}`]}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Stock Intake & Quality Control
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentStep === 1
                  ? 'Select purchase order'
                  : currentStep === 2
                  ? 'Set expiry dates'
                  : 'Quality assessment and location assignment'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mr-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <div
                className={`w-8 h-1 ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <div
                className={`w-8 h-1 ${
                  currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading purchase orders...
            </span>
          </div>
        ) : (
          <div className="p-6">
            {/* Step 1: Purchase Order Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Select Purchase Order for Stock Intake
                  </h4>

                  {purchaseOrders.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No delivered purchase orders available for intake
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {purchaseOrders.map((po) => (
                        <div
                          key={po._id}
                          onClick={() => handlePOSelection(po._id)}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {po.orderNumber}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {po.supplier?.name}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                              DELIVERED
                            </span>
                          </div>

                          {/* PO Summary */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Items:
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {po.items?.length || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Delivery Date:
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {new Date(po.deliveryDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Items Preview */}
                          {po.items && po.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 mb-1">
                                Items:
                              </div>
                              <div className="space-y-1 max-h-16 overflow-y-auto">
                                {po.items.slice(0, 3).map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-gray-700 dark:text-gray-300 truncate">
                                      {item.product?.name}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      {item.quantity}
                                    </span>
                                  </div>
                                ))}
                                {po.items.length > 3 && (
                                  <div className="text-xs text-gray-400">
                                    +{po.items.length - 3} more items
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Expiry Date Assignment */}
            {currentStep === 2 && selectedPO && (
              <div className="space-y-6">
                {/* Back button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Purchase Order Selection
                  </button>
                </div>

                {/* Purchase Order Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Purchase Order: {selectedPO.orderNumber}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Supplier:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedPO.supplier?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Items:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedPO.items?.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Delivery Date:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {new Date(selectedPO.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Global Expired Location */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Global Expired Items Location
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                    All expired items will be automatically moved to this
                    location
                  </p>

                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-orange-700 dark:text-orange-300 mb-1">
                        Zone
                      </label>
                      <input
                        type="text"
                        value={formData.expiredLocation.zone}
                        onChange={(e) =>
                          handleExpiredLocationChange('zone', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="EXPIRED"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-orange-700 dark:text-orange-300 mb-1">
                        Aisle
                      </label>
                      <input
                        type="text"
                        value={formData.expiredLocation.aisle}
                        onChange={(e) =>
                          handleExpiredLocationChange('aisle', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-orange-700 dark:text-orange-300 mb-1">
                        Shelf
                      </label>
                      <input
                        type="text"
                        value={formData.expiredLocation.shelf}
                        onChange={(e) =>
                          handleExpiredLocationChange('shelf', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-orange-700 dark:text-orange-300 mb-1">
                        Bin
                      </label>
                      <input
                        type="text"
                        value={formData.expiredLocation.bin}
                        onChange={(e) =>
                          handleExpiredLocationChange('bin', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="01"
                      />
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                    📍 Expired Location: {formData.expiredLocation.zone}-
                    {formData.expiredLocation.aisle}-
                    {formData.expiredLocation.shelf}-
                    {formData.expiredLocation.bin}
                  </div>
                </div>

                {/* Individual Expiry Date Assignment (Primary Method) */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Individual Expiry Date Assignment
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Set expiry dates for each item individually. Different items
                    may have different expiry dates.
                  </p>

                  <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          item.isExpired
                            ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {/* Item Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.productName}
                              </span>
                              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
                                {item.productType?.replace('_', ' ')}
                              </span>
                              {item.isExpired && (
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded text-xs">
                                  ⚠ EXPIRED
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            Qty: {item.originalQuantity}
                          </span>
                        </div>

                        {/* Expiry Date Management */}
                        {isConsumableProduct(item.productType) ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  checked={item.hasExpiryDate}
                                  onChange={(e) =>
                                    handleExpiryToggle(index, e.target.checked)
                                  }
                                  className="rounded border-gray-300 mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Has expiry date
                                </span>
                              </label>
                            </div>

                            {item.hasExpiryDate && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Expiry Date
                                  </label>
                                  <input
                                    type="date"
                                    value={item.expiryDate || ''}
                                    onChange={(e) =>
                                      handleExpiryDateChange(
                                        index,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  />
                                </div>

                                <div className="text-sm">
                                  {item.expiryDate && (
                                    <div
                                      className={`font-medium ${
                                        item.isExpired
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }`}
                                    >
                                      {item.isExpired
                                        ? '❌ Expired'
                                        : '✅ Valid'}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {item.productType === 'MACHINE'
                                  ? 'Machine'
                                  : 'Accessory'}{' '}
                                - No expiry date needed
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Expired Item Alert */}
                        {item.isExpired && (
                          <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-300">
                            ⚠ This item is expired and will be automatically
                            moved to expired location:{' '}
                            {formData.expiredLocation.zone}-
                            {formData.expiredLocation.aisle}-
                            {formData.expiredLocation.shelf}-
                            {formData.expiredLocation.bin}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bulk Expiry Date Assignment (Override Option) */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Bulk Expiry Date Override
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                    <strong>Optional:</strong> Override all individual expiry
                    dates with the same date. This will replace any existing
                    expiry dates you've set above.
                  </p>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Bulk Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.bulkExpiryDate || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bulkExpiryDate: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Optional bulk override"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleBulkExpiryAssignment}
                      disabled={!formData.bulkExpiryDate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Override All
                    </button>
                  </div>

                  {formData.bulkExpiryDate && (
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      ⚠ This will override individual expiry dates for{' '}
                      {
                        formData.items.filter((item) => item.hasExpiryDate)
                          .length
                      }{' '}
                      items that have expiry enabled
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      checkExpiredItems(); // Final check before moving to quality control
                      setCurrentStep(3);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Continue to Quality Control
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Quality Control & Location Assignment */}
            {currentStep === 3 && selectedPO && (
              <div className="space-y-6">
                {/* Back button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Expiry Dates
                  </button>
                </div>

                {/* Items Quality Assessment */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                    Quality Assessment & Location Assignment
                  </h4>

                  <div className="space-y-6">
                    {formData.items.map((item, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-6 ${
                          item.isExpired
                            ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {/* Item Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.productName}
                              </span>
                              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded text-xs">
                                {item.productType?.replace('_', ' ')}
                              </span>
                              {item.isExpired && (
                                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded text-xs">
                                  ⚠ EXPIRED
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            Total: {item.originalQuantity} units
                          </span>
                        </div>

                        {/* Expired Item Notice */}
                        {item.isExpired && (
                          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                              <span className="text-sm text-red-800 dark:text-red-300">
                                This item is expired (Expiry:{' '}
                                {new Date(item.expiryDate).toLocaleDateString()}
                                ) and has been automatically moved to expired
                                location. Quantity adjustments are disabled.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Quantity Assessment */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-green-600 dark:text-green-400 mb-1">
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
                              disabled={item.isExpired}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
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
                              disabled={item.isExpired}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1">
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
                              disabled={item.isExpired}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
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
                              disabled={item.isExpired}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Quantity Validation */}
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex justify-between text-sm">
                            <span>Total Assessed:</span>
                            <span
                              className={
                                item.passedQuantity +
                                  item.refurbishedQuantity +
                                  item.damagedQuantity +
                                  item.expiredQuantity ===
                                item.originalQuantity
                                  ? 'text-green-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {item.passedQuantity +
                                item.refurbishedQuantity +
                                item.damagedQuantity +
                                item.expiredQuantity}{' '}
                              / {item.originalQuantity}
                            </span>
                          </div>
                          {errors[`item_${index}_quantity`] && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors[`item_${index}_quantity`]}
                            </p>
                          )}
                        </div>

                        {/* Location Assignments */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Warehouse Location Assignments
                          </h5>

                          {Object.keys(qualityStatuses).map((qualityType) =>
                            renderLocationInputs(item, index, qualityType)
                          )}
                        </div>

                        {/* Item Notes */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Item Notes
                          </label>
                          <textarea
                            rows={2}
                            value={item.notes}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index] = {
                                ...newItems[index],
                                notes: e.target.value,
                              };
                              setFormData((prev) => ({
                                ...prev,
                                items: newItems,
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
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
                    General Stock Intake Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.generalNotes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        generalNotes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Overall observations, delivery conditions, or additional notes..."
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              {currentStep === 3 && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Stock Intake...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Complete Stock Intake
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockIntakeModal;
