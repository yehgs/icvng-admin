// components/order/CreateOrderModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Search,
  Eye,
  Mail,
} from 'lucide-react';
import { adminOrderAPI, customerAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';
import ProductSearchModal from './ProductSearchModal';
import InvoicePreviewModal from './InvoicePreviewModal';

const CreateOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '',
    items: [
      {
        productId: '',
        productDetails: null,
        quantity: 1,
        priceOption: 'regular',
      },
    ],
    orderType: 'BTC',
    orderMode: 'OFFLINE',
    paymentMethod: 'CASH',
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
    },
    notes: '',
    customerNotes: '',
    discountAmount: 0,
    taxAmount: 0,
    shippingCost: 0,
    sendInvoiceEmail: false,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.getCustomersForOrder();
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          productDetails: null,
          quantity: 1,
          priceOption: 'regular',
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error('Order must have at least one item');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleProductSelect = (product) => {
    if (currentItemIndex !== null) {
      const newItems = [...formData.items];
      newItems[currentItemIndex] = {
        ...newItems[currentItemIndex],
        productId: product._id,
        productDetails: product,
      };
      setFormData({ ...formData, items: newItems });
      setShowProductSearch(false);
      setCurrentItemIndex(null);
    }
  };

  const openProductSearch = (index) => {
    setCurrentItemIndex(index);
    setShowProductSearch(true);
  };

  const getItemPrice = (item) => {
    if (!item.productDetails) return 0;

    const product = item.productDetails;
    let price = 0;

    if (formData.orderType === 'BTB') {
      price = product.btbPrice || product.price || 0;
    } else {
      // BTC pricing
      if (item.priceOption === '3weeks') {
        price =
          product.price3weeksDelivery || product.btcPrice || product.price || 0;
      } else if (item.priceOption === '5weeks') {
        price =
          product.price5weeksDelivery || product.btcPrice || product.price || 0;
      } else {
        price = product.btcPrice || product.price || 0;
      }
    }

    return price * item.quantity;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + getItemPrice(item),
      0
    );
    const total =
      subtotal +
      formData.taxAmount +
      formData.shippingCost -
      formData.discountAmount;

    return {
      subtotal,
      total,
    };
  };

  const handlePreviewInvoice = () => {
    // Validate required fields first
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    const validItems = formData.items.filter(
      (item) => item.productId && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    setShowInvoicePreview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return;
    }

    const validItems = formData.items.filter(
      (item) => item.productId && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        customerId: formData.customerId,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity) || 1,
          priceOption: item.priceOption,
        })),
        orderType: formData.orderType,
        orderMode: formData.orderMode,
        paymentMethod: formData.paymentMethod,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes,
        customerNotes: formData.customerNotes,
        discountAmount: parseFloat(formData.discountAmount) || 0,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        sendInvoiceEmail: formData.sendInvoiceEmail,
      };

      const response = await adminOrderAPI.createOrder(orderData);

      if (response.success) {
        toast.success('Order created successfully!');
        if (response.data.invoiceEmailSent) {
          toast.success('Invoice email sent to customer');
        }
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(handleApiError(error, 'Failed to create order'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      items: [
        {
          productId: '',
          productDetails: null,
          quantity: 1,
          priceOption: 'regular',
        },
      ],
      orderType: 'BTC',
      orderMode: 'OFFLINE',
      paymentMethod: 'CASH',
      deliveryAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
      },
      notes: '',
      customerNotes: '',
      discountAmount: 0,
      taxAmount: 0,
      shippingCost: 0,
      sendInvoiceEmail: false,
    });
  };

  const selectedCustomer = customers.find((c) => c._id === formData.customerId);
  const totals = calculateTotals();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Manual Order
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                required
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}{' '}
                    {customer.companyName && `(${customer.companyName})`} -{' '}
                    {customer.customerType}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type & Mode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.orderType}
                  onChange={(e) =>
                    setFormData({ ...formData, orderType: e.target.value })
                  }
                >
                  <option value="BTC">Business to Customer (BTC)</option>
                  <option value="BTB">Business to Business (BTB)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Mode *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.orderMode}
                  onChange={(e) =>
                    setFormData({ ...formData, orderMode: e.target.value })
                  }
                >
                  <option value="OFFLINE">Offline</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            </div>

            {/* Items Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                  Order Items *
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {item.productDetails ? (
                          <div className="flex items-center gap-3">
                            {item.productDetails.image &&
                              item.productDetails.image[0] && (
                                <img
                                  src={item.productDetails.image[0]}
                                  alt={item.productDetails.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.productDetails.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                SKU: {item.productDetails.sku}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openProductSearch(index)}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors"
                          >
                            <Search className="w-4 h-4" />
                            Search Product
                          </button>
                        )}
                      </div>

                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {item.productDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'quantity',
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Delivery Option
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            value={item.priceOption}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                'priceOption',
                                e.target.value
                              )
                            }
                            disabled={formData.orderType === 'BTB'}
                          >
                            <option value="regular">Regular</option>
                            <option value="3weeks">3 Weeks Delivery</option>
                            <option value="5weeks">5 Weeks Delivery</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Item Total
                          </label>
                          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium">
                            ₦{getItemPrice(item).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Delivery Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Street Address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.deliveryAddress.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          street: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.deliveryAddress.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          city: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="State"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.deliveryAddress.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          state: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      value={formData.discountAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tax
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      value={formData.taxAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          taxAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Shipping
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      value={formData.shippingCost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingCost: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">
                      Subtotal:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₦{totals.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">
                      Total:
                    </span>
                    <span className="text-green-600 dark:text-green-400">
                      ₦{totals.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Internal Notes
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Internal notes (not visible to customer)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Notes
                </label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={formData.customerNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, customerNotes: e.target.value })
                  }
                  placeholder="Notes visible to customer"
                />
              </div>

              {/* Email Invoice Option */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <input
                  type="checkbox"
                  id="sendInvoiceEmail"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={formData.sendInvoiceEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sendInvoiceEmail: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="sendInvoiceEmail"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  Send invoice to customer via email
                  {selectedCustomer && selectedCustomer.email && (
                    <span className="text-blue-600 dark:text-blue-400">
                      ({selectedCustomer.email})
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handlePreviewInvoice}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={loading}
              >
                <Eye className="w-4 h-4" />
                Preview Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Product Search Modal */}
      {showProductSearch && (
        <ProductSearchModal
          isOpen={showProductSearch}
          onClose={() => {
            setShowProductSearch(false);
            setCurrentItemIndex(null);
          }}
          onSelect={handleProductSelect}
          orderType={formData.orderType}
        />
      )}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
        <InvoicePreviewModal
          isOpen={showInvoicePreview}
          onClose={() => setShowInvoicePreview(false)}
          formData={formData}
          selectedCustomer={selectedCustomer}
          totals={totals}
        />
      )}
    </>
  );
};

export default CreateOrderModal;
