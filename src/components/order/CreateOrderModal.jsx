import React, { useState, useEffect } from 'react';
import { customerAPI, productAPI, adminOrderAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CreateOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    orderType: 'BTC',
    orderMode: 'OFFLINE',
    paymentMethod: 'CASH',
    items: [{ productId: '', quantity: 1, priceOption: 'regular' }],
    discountAmount: 0,
    taxAmount: 0,
    shippingCost: 0,
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
    },
    notes: '',
    customerNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Load customers and products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadProducts();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getCustomersForOrder();
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getProducts({
        limit: 100,
        publish: 'PUBLISHED',
      });
      if (response.success) {
        setProducts(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { productId: '', quantity: 1, priceOption: 'regular' },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const validateForm = () => {
    if (!formData.customerId) {
      toast.error('Please select a customer');
      return false;
    }

    if (formData.items.length === 0) {
      toast.error('Please add at least one item');
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.productId) {
        toast.error(`Please select a product for item ${i + 1}`);
        return false;
      }
      if (!item.quantity || item.quantity < 1) {
        toast.error(`Please enter a valid quantity for item ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      const product = products.find((p) => p._id === item.productId);
      if (product) {
        let price = product.price;
        if (item.priceOption === '3weeks' && product.price3weeksDelivery) {
          price = product.price3weeksDelivery;
        } else if (
          item.priceOption === '5weeks' &&
          product.price5weeksDelivery
        ) {
          price = product.price5weeksDelivery;
        }
        return total + price * item.quantity;
      }
      return total;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return (
      subtotal +
      formData.taxAmount +
      formData.shippingCost -
      formData.discountAmount
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare the order data
      const orderData = {
        ...formData,
        subTotal: calculateSubtotal(),
        totalAmount: calculateTotal(),
      };

      const response = await adminOrderAPI.createOrder(orderData);

      if (response.success) {
        toast.success('Order created successfully');
        onOrderCreated();
        onClose();

        // Reset form
        setFormData({
          customerId: '',
          orderType: 'BTC',
          orderMode: 'OFFLINE',
          paymentMethod: 'CASH',
          items: [{ productId: '', quantity: 1, priceOption: 'regular' }],
          discountAmount: 0,
          taxAmount: 0,
          shippingCost: 0,
          deliveryAddress: { street: '', city: '', state: '', postalCode: '' },
          notes: '',
          customerNotes: '',
        });
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              ➕
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Order
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add a new order for a customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.displayName || customer.name} (
                    {customer.customerType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Type *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.orderType}
                onChange={(e) =>
                  setFormData({ ...formData, orderType: e.target.value })
                }
              >
                <option value="BTC">BTC (Business to Consumer)</option>
                <option value="BTB">BTB (Business to Business)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Mode *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.orderMode}
                onChange={(e) =>
                  setFormData({ ...formData, orderMode: e.target.value })
                }
              >
                <option value="OFFLINE">Offline Sale</option>
                <option value="ONLINE">Online Sale</option>
              </select>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Order Items * ({formData.items.length} item
                {formData.items.length !== 1 ? 's' : ''})
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
              >
                ➕ Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => {
                const product = products.find((p) => p._id === item.productId);
                let unitPrice = 0;
                if (product) {
                  unitPrice = product.price;
                  if (
                    item.priceOption === '3weeks' &&
                    product.price3weeksDelivery
                  ) {
                    unitPrice = product.price3weeksDelivery;
                  } else if (
                    item.priceOption === '5weeks' &&
                    product.price5weeksDelivery
                  ) {
                    unitPrice = product.price5weeksDelivery;
                  }
                }
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div
                    key={index}
                    className="flex gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Product
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        value={item.productId}
                        onChange={(e) =>
                          updateItem(index, 'productId', e.target.value)
                        }
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - ₦{product.price?.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>

                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Price Option
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        value={item.priceOption}
                        onChange={(e) =>
                          updateItem(index, 'priceOption', e.target.value)
                        }
                      >
                        <option value="regular">Regular</option>
                        <option value="3weeks">3 Weeks</option>
                        <option value="5weeks">5 Weeks</option>
                      </select>
                    </div>

                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-sm font-medium text-gray-900 dark:text-white">
                        ₦{itemTotal.toLocaleString()}
                      </div>
                    </div>

                    {formData.items.length > 1 && (
                      <div className="w-10">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          &nbsp;
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="w-full px-2 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Method
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Amount (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                Tax Amount (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                Shipping Cost (₦)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

          {/* Order Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Order Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal:
                </span>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ₦{subtotal.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Discount:
                </span>
                <div className="font-semibold text-red-600 dark:text-red-400">
                  -₦{formData.discountAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Tax + Shipping:
                </span>
                <div className="font-semibold text-gray-900 dark:text-white">
                  ₦
                  {(
                    formData.taxAmount + formData.shippingCost
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                  ₦{total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Address
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <input
                type="text"
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <input
                type="text"
                placeholder="State"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <input
                type="text"
                placeholder="Postal Code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.deliveryAddress.postalCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryAddress: {
                      ...formData.deliveryAddress,
                      postalCode: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internal Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add internal notes for this order..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add notes from the customer..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.customerNotes}
                onChange={(e) =>
                  setFormData({ ...formData, customerNotes: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Press Ctrl+Enter to create order quickly
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || formData.items.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>✅ Create Order</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderModal;
