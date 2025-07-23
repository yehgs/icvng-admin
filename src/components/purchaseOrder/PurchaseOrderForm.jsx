// components/PurchaseOrder/PurchaseOrderForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { purchaseOrderAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

// Import sub-components
import BasicInfoSection from './BasicInfoSection';
import CurrencySection from './CurrencySection';
import ItemsSection from './ItemsSection';
import LogisticsSection from './LogisticsSection';
import OrderSummary from './OrderSummary';

const PurchaseOrderForm = ({
  showModal,
  setShowModal,
  editingPO,
  onSuccess,
  suppliers = [],
  supportedCurrencies = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    receipts: [], // Add receipts array
    items: [
      {
        product: '',
        productDetails: null,
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
      },
    ],
    currency: {
      code: 'USD',
      exchangeRate: 1,
      exchangeRateSource: 'API',
    },
    logistics: {
      transportMode: 'AIR',
      freightCost: 0,
      clearanceCost: 0,
      otherLogisticsCost: 0,
      totalLogisticsCost: 0,
    },
    notes: '',
  });
  // In your component or wherever you're debugging
  const debugAuth = () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    console.log('=== AUTH DEBUG ===');
    console.log('Access token exists:', !!token);
    console.log('User exists:', !!user);

    if (token) {
      console.log('Token starts with:', token.substring(0, 20));

      // Check if token is expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Current time:', new Date());
        console.log('Token is expired:', payload.exp * 1000 < Date.now());
      } catch (e) {
        console.log('Could not decode token:', e);
      }
    }

    if (user) {
      console.log('User data:', JSON.parse(user));
    }
    console.log('=== END AUTH DEBUG ===');
  };

  // Call this before trying to upload
  debugAuth();
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  // Debug effect to track items changes
  useEffect(() => {
    console.log('=== FORMDATA ITEMS CHANGED ===');
    console.log('Current formData.items:', formData.items);
    formData.items.forEach((item, index) => {
      console.log(`FormData Item ${index}:`, {
        product: item.product,
        productDetails: item.productDetails ? 'EXISTS' : 'NULL',
        quantity: item.quantity,
        unitCost: item.unitCost,
      });
    });
    console.log('=== END FORMDATA ITEMS CHANGED ===');
  }, [formData.items]);

  useEffect(() => {
    if (editingPO) {
      setFormData({
        supplier: editingPO.supplier?._id || '',
        expectedDeliveryDate: editingPO.expectedDeliveryDate
          ? new Date(editingPO.expectedDeliveryDate).toISOString().split('T')[0]
          : '',
        receipts: editingPO.receipts || [],
        items: editingPO.items?.map((item) => ({
          product: item.product?._id || '',
          productDetails: item.product || null,
          quantity: item.quantity || 1,
          unitCost: item.unitPrice || item.unitCost || 0,
          totalCost: item.totalPrice || item.totalCost || 0,
        })) || [
          {
            product: '',
            productDetails: null,
            quantity: 1,
            unitCost: 0,
            totalCost: 0,
          },
        ],
        currency: editingPO.currency
          ? {
              code: editingPO.currency.code || editingPO.currency,
              exchangeRate: editingPO.exchangeRate || 1,
              exchangeRateSource:
                editingPO.currency.exchangeRateSource || 'API',
            }
          : {
              code: 'USD',
              exchangeRate: 1,
              exchangeRateSource: 'API',
            },
        logistics: editingPO.logistics || {
          transportMode: 'AIR',
          freightCost: 0,
          clearanceCost: 0,
          otherLogisticsCost: 0,
          totalLogisticsCost: 0,
        },
        notes: editingPO.notes || '',
      });
    }
  }, [editingPO]);

  // Add this debugging to your PurchaseOrderForm.jsx updateFormData function

  // Replace your updateFormData function in PurchaseOrderForm.jsx with this:

  const updateFormData = (section, data) => {
    console.log(
      'PurchaseOrderForm - updateFormData called with:',
      section,
      data
    );

    setFormData((prev) => {
      console.log('PurchaseOrderForm - Previous formData:', prev);

      let newFormData;

      if (section === 'receipts' && Array.isArray(data)) {
        // Handle receipts array specifically
        newFormData = {
          ...prev,
          receipts: data,
        };
      } else if (typeof section === 'string' && typeof data === 'string') {
        // Handle simple field updates like notes
        newFormData = {
          ...prev,
          [section]: data,
        };
      } else if (
        typeof section === 'string' &&
        typeof data === 'object' &&
        !Array.isArray(data)
      ) {
        // Handle object updates like currency, logistics
        newFormData = {
          ...prev,
          [section]: { ...prev[section], ...data },
        };
      } else {
        // Handle other cases
        newFormData = {
          ...prev,
          [section]: data,
        };
      }

      console.log('PurchaseOrderForm - New formData:', newFormData);
      console.log('PurchaseOrderForm - New receipts:', newFormData.receipts);
      console.log(
        'PurchaseOrderForm - Is receipts array?',
        Array.isArray(newFormData.receipts)
      );

      return newFormData;
    });
  };

  const updateItems = (newItems) => {
    console.log('=== PARENT updateItems CALLED ===');
    console.log('New items received:', newItems);
    console.log('Current formData.items:', formData.items);

    setFormData((prev) => {
      const updated = {
        ...prev,
        items: newItems,
      };
      console.log('Updated formData:', updated);
      return updated;
    });

    console.log('=== END PARENT updateItems ===');
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );
    const totalLogistics =
      (formData.logistics.freightCost || 0) +
      (formData.logistics.clearanceCost || 0) +
      (formData.logistics.otherLogisticsCost || 0);

    return {
      subtotal,
      totalLogistics,
      grandTotal: subtotal + totalLogistics,
      grandTotalInNaira:
        (subtotal + totalLogistics) * (formData.currency.exchangeRate || 1),
    };
  };

  const validateForm = () => {
    // Validate supplier
    if (!formData.supplier) {
      toast.error('Please select a supplier');
      return false;
    }

    // Validate delivery date
    if (!formData.expectedDeliveryDate) {
      toast.error('Please set expected delivery date');
      return false;
    }

    // Validate items
    if (formData.items.length === 0 || !formData.items[0].product) {
      toast.error('Please add at least one item');
      return false;
    }

    // Validate currency
    if (!formData.currency || !formData.currency.code) {
      toast.error('Please select a currency');
      return false;
    }

    // Validate exchange rate
    if (
      !formData.currency.exchangeRate ||
      formData.currency.exchangeRate <= 0
    ) {
      toast.error('Exchange rate must be greater than 0');
      return false;
    }

    // Validate logistics transport mode
    if (!formData.logistics || !formData.logistics.transportMode) {
      toast.error('Please select a transport mode');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form data before validation:', formData); // Debug log

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API - only include valid items
      const validItems = formData.items.filter(
        (item) =>
          item.product &&
          item.product !== '' &&
          item.quantity > 0 &&
          item.unitCost > 0
      );

      if (validItems.length === 0) {
        toast.error('No valid items found. Please check your items.');
        setLoading(false);
        return;
      }

      const apiData = {
        supplier: formData.supplier,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        receipts: formData.receipts || [], // Include receipts in API data
        items: validItems.map((item) => ({
          product: item.product,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitCost) || 0,
        })),
        currency: formData.currency.code,
        exchangeRate: parseFloat(formData.currency.exchangeRate) || 1,
        logistics: {
          transportMode: formData.logistics.transportMode,
          freightCost: parseFloat(formData.logistics.freightCost) || 0,
          clearanceCost: parseFloat(formData.logistics.clearanceCost) || 0,
          otherLogisticsCost:
            parseFloat(formData.logistics.otherLogisticsCost) || 0,
        },
        notes: formData.notes || '',
        // Add default values for required fields
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0,
        paymentTerms: 'NET_30',
        deliveryTerms: 'FOB',
        shippingAddress: {},
      };

      console.log('API data:', apiData); // Debug log

      let response;
      if (editingPO) {
        response = await purchaseOrderAPI.updatePurchaseOrder(
          editingPO._id,
          apiData
        );
      } else {
        response = await purchaseOrderAPI.createPurchaseOrder(apiData);
      }

      if (response.success) {
        toast.success(
          `Purchase order ${editingPO ? 'updated' : 'created'} successfully!`
        );
        setShowModal(false);
        resetForm();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || 'Failed to save purchase order');
      }
    } catch (error) {
      console.error('Error saving purchase order:', error);
      toast.error(handleApiError(error, 'Failed to save purchase order'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplier: '',
      expectedDeliveryDate: '',
      receipts: [],
      items: [
        {
          product: '',
          productDetails: null,
          quantity: 1,
          unitCost: 0,
          totalCost: 0,
        },
      ],
      currency: {
        code: 'USD',
        exchangeRate: 1,
        exchangeRateSource: 'API',
      },
      logistics: {
        transportMode: 'AIR',
        freightCost: 0,
        clearanceCost: 0,
        otherLogisticsCost: 0,
        totalLogisticsCost: 0,
      },
      notes: '',
    });
  };

  if (!showModal) return null;

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h3>
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <BasicInfoSection
            formData={formData}
            updateFormData={updateFormData}
            suppliers={suppliers}
            minDate={today}
          />

          {/* Currency & Exchange Rate */}
          <CurrencySection
            formData={formData}
            updateFormData={updateFormData}
            supportedCurrencies={supportedCurrencies}
          />

          {/* Items Section */}
          <ItemsSection
            items={formData.items}
            updateItems={updateItems}
            currency={formData.currency}
          />

          {/* Logistics Section */}
          <LogisticsSection
            logistics={formData.logistics}
            updateFormData={updateFormData}
            currency={formData.currency}
          />

          {/* Notes */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              rows="3"
              className="form-textarea w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Additional notes or special instructions..."
            />
          </div>

          {/* Order Summary */}
          <OrderSummary
            totals={totals}
            currency={formData.currency}
            supportedCurrencies={supportedCurrencies}
          />

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingPO ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>

        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t">
            <details>
              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Debug Info (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-40">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
