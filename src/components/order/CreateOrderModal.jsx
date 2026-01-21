// components/order/CreateOrderModal.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Loader2,
  Plus,
  Trash2,
  Search,
  Eye,
  Mail,
  Calculator,
} from "lucide-react";
import {
  adminOrderAPI,
  customerAPI,
  handleApiError,
  logisticsAPI,
} from "../../utils/api";
import toast from "react-hot-toast";
import ProductSearchModal from "./ProductSearchModal";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { nigeriaStatesLgas } from "../../data/nigeria-states-lgas.js";

const CreateOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Shipping states
  const [availableShippingMethods, setAvailableShippingMethods] = useState([]);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingCalculated, setShippingCalculated] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    items: [
      {
        productId: "",
        productDetails: null,
        quantity: 1,
        priceOption: "regular",
      },
    ],
    orderType: "BTC",
    orderMode: "OFFLINE",
    paymentMethod: "CASH",
    deliveryAddress: {
      street: "",
      city: "",
      state: "",
      lga: "",
      postalCode: "",
    },
    shippingMethodId: "",
    notes: "",
    customerNotes: "",
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

  // ===== FIX 1: IMPROVED CUSTOMER SEARCH =====
  useEffect(() => {
    if (customerSearchTerm.length >= 3) {
      const filtered = customers.filter((customer) => {
        const searchLower = customerSearchTerm.toLowerCase();
        const nameLower = customer.name.toLowerCase();
        return nameLower.startsWith(searchLower);
      });
      setFilteredCustomers(filtered);
    } else if (customerSearchTerm.length === 0) {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers([]);
    }
  }, [customerSearchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.getCustomersForOrder();
      if (response.success) {
        setCustomers(response.data);
        setFilteredCustomers(response.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const getAvailableLgas = () => {
    if (!formData.deliveryAddress.state) return [];
    const stateData = nigeriaStatesLgas.find(
      (s) => s.state === formData.deliveryAddress.state
    );
    return stateData?.lga || [];
  };

  // ===== FIX 3: CORRECTED calculateShipping =====
  const calculateShipping = async () => {
    const { deliveryAddress, items } = formData;

    const hasDropshipment = items.some(
      (item) => item.priceOption === "3weeks" || item.priceOption === "5weeks"
    );

    if (hasDropshipment) {
      toast.info("Dropshipment orders don't require shipping calculation");
      setFormData((prev) => ({
        ...prev,
        shippingCost: 0,
        shippingMethodId: "",
      }));
      setShippingCalculated(true);
      setAvailableShippingMethods([]);
      return;
    }

    if (!deliveryAddress.state || !deliveryAddress.lga) {
      toast.error("Please select state and LGA for shipping calculation");
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    try {
      setCalculatingShipping(true);
      setShippingCalculated(false);

      let totalWeight = 0;
      validItems.forEach((item) => {
        if (item.productDetails?.weight) {
          totalWeight += item.productDetails.weight * item.quantity;
        } else {
          totalWeight += 1 * item.quantity;
        }
      });

      const subtotal = validItems.reduce(
        (sum, item) => sum + getItemPrice(item),
        0
      );

      const shippingResponse = await logisticsAPI.calculateShippingCostManually(
        {
          items: validItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          deliveryAddress: {
            state: deliveryAddress.state,
            lga: deliveryAddress.lga,
            city: deliveryAddress.city,
          },
          orderValue: subtotal,
          totalWeight,
        }
      );

      if (shippingResponse.success && shippingResponse.data.methods) {
        setAvailableShippingMethods(shippingResponse.data.methods);
        setShippingCalculated(true);

        if (shippingResponse.data.methods.length > 0) {
          const cheapest = shippingResponse.data.methods[0];
          setFormData((prev) => ({
            ...prev,
            shippingMethodId: cheapest._id,
            shippingCost: cheapest.cost,
          }));
        }

        toast.success("Shipping calculated successfully");
      } else {
        toast.error("No shipping methods available for this location");
      }
    } catch (error) {
      console.error("Error calculating shipping:", error);
      toast.error("Failed to calculate shipping");
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: "",
          productDetails: null,
          quantity: 1,
          priceOption: "regular",
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("Order must have at least one item");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    setShippingCalculated(false);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
    setShippingCalculated(false);
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
      setShippingCalculated(false);
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

    if (formData.orderType === "BTB") {
      price = product.btbPrice || product.price || 0;
    } else {
      if (item.priceOption === "3weeks") {
        price =
          product.price3weeksDelivery || product.btcPrice || product.price || 0;
      } else if (item.priceOption === "5weeks") {
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

    return { subtotal, total };
  };

  const handlePreviewInvoice = () => {
    if (!formData.customerId) {
      toast.error("Please select a customer");
      return;
    }

    const validItems = formData.items.filter(
      (item) => item.productId && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    setShowInvoicePreview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error("Please select a customer");
      return;
    }

    const validItems = formData.items.filter(
      (item) => item.productId && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    const hasDropshipment = validItems.some(
      (item) => item.priceOption === "3weeks" || item.priceOption === "5weeks"
    );

    if (!hasDropshipment && !shippingCalculated) {
      toast.error("Please calculate shipping cost before creating order");
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
        shippingMethodId: formData.shippingMethodId,
        notes: formData.notes,
        customerNotes: formData.customerNotes,
        discountAmount: parseFloat(formData.discountAmount) || 0,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        sendInvoiceEmail: formData.sendInvoiceEmail,
      };

      const response = await adminOrderAPI.createOrder(orderData);

      if (response.success) {
        toast.success("Order created successfully!");
        if (response.data.invoiceEmailSent) {
          toast.success("Invoice email sent to customer");
        }
        resetForm();
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(handleApiError(error, "Failed to create order"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      items: [
        {
          productId: "",
          productDetails: null,
          quantity: 1,
          priceOption: "regular",
        },
      ],
      orderType: "BTC",
      orderMode: "OFFLINE",
      paymentMethod: "CASH",
      deliveryAddress: {
        street: "",
        city: "",
        state: "",
        lga: "",
        postalCode: "",
      },
      shippingMethodId: "",
      notes: "",
      customerNotes: "",
      discountAmount: 0,
      taxAmount: 0,
      shippingCost: 0,
      sendInvoiceEmail: false,
    });
    setCustomerSearchTerm("");
    setShippingCalculated(false);
    setAvailableShippingMethods([]);
  };

  const selectedCustomer = customers.find((c) => c._id === formData.customerId);
  const totals = calculateTotals();
  const hasDropshipment = formData.items.some(
    (item) => item.priceOption === "3weeks" || item.priceOption === "5weeks"
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
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
            {/* ===== FIX 1: IMPROVED CUSTOMER SELECTION ===== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer * (Search by first 3 letters)
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type at least 3 letters to search..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      if (e.target.value !== customerSearchTerm) {
                        setFormData({ ...formData, customerId: "" });
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {customerSearchTerm.length > 0 &&
                  customerSearchTerm.length < 3 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Type at least 3 letters to search
                    </p>
                  )}

                {customerSearchTerm.length >= 3 &&
                  filteredCustomers.length === 0 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      No customers found matching "{customerSearchTerm}"
                    </p>
                  )}

                {(customerSearchTerm.length === 0 ||
                  filteredCustomers.length > 0) && (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.customerId}
                    onChange={(e) =>
                      setFormData({ ...formData, customerId: e.target.value })
                    }
                    required
                  >
                    <option value="">
                      {customerSearchTerm.length >= 3
                        ? `${filteredCustomers.length} customer(s) found - Select one`
                        : "Select a customer"}
                    </option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name}
                        {customer.companyName &&
                          ` (${customer.companyName})`} -{" "}
                        {customer.customerType}
                      </option>
                    ))}
                  </select>
                )}
              </div>
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
                  onChange={(e) => {
                    setFormData({ ...formData, orderType: e.target.value });
                    setShippingCalculated(false);
                  }}
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
                {formData.items.map((item, index) => {
                  const isDropshipment =
                    item.priceOption === "3weeks" ||
                    item.priceOption === "5weeks";

                  return (
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
                                {isDropshipment && (
                                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                                    🚚 Dropshipment - No stock check required
                                  </p>
                                )}
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
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Pricing / Delivery Option
                            </label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                              value={item.priceOption}
                              onChange={(e) => {
                                handleItemChange(
                                  index,
                                  "priceOption",
                                  e.target.value
                                );
                                setShippingCalculated(false);
                              }}
                              disabled={formData.orderType === "BTB"}
                            >
                              <option value="regular">
                                Regular BTC (₦
                                {item.productDetails.btcPrice?.toLocaleString() ||
                                  "0"}
                                )
                              </option>
                              <option value="3weeks">
                                3 Weeks Delivery - Dropship (₦
                                {item.productDetails.price3weeksDelivery?.toLocaleString() ||
                                  "0"}
                                )
                              </option>
                              <option value="5weeks">
                                5 Weeks Delivery - Dropship (₦
                                {item.productDetails.price5weeksDelivery?.toLocaleString() ||
                                  "0"}
                                )
                              </option>
                            </select>
                            {formData.orderType === "BTB" && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                BTB pricing: ₦
                                {item.productDetails.btbPrice?.toLocaleString() ||
                                  "0"}
                              </p>
                            )}
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
                  );
                })}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Delivery Address *
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.deliveryAddress.state}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          state: e.target.value,
                          lga: "",
                        },
                      });
                      setShippingCalculated(false);
                    }}
                    required
                  >
                    <option value="">Select State</option>
                    {nigeriaStatesLgas.map((state) => (
                      <option key={state.state} value={state.state}>
                        {state.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    LGA *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.deliveryAddress.lga}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        deliveryAddress: {
                          ...formData.deliveryAddress,
                          lga: e.target.value,
                        },
                      });
                      setShippingCalculated(false);
                    }}
                    required
                    disabled={!formData.deliveryAddress.state}
                  >
                    <option value="">Select LGA</option>
                    {getAvailableLgas().map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="Postal Code"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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

              {/* Calculate Shipping Button */}
              {!hasDropshipment && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={calculateShipping}
                    disabled={calculatingShipping}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {calculatingShipping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4" />
                        Calculate Shipping
                      </>
                    )}
                  </button>
                  {shippingCalculated && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      ✓ Shipping calculated successfully
                    </p>
                  )}
                </div>
              )}

              {/* Shipping Methods Selection */}
              {shippingCalculated && availableShippingMethods.length > 0 && (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Shipping Method *
                  </label>
                  {availableShippingMethods.map((method) => (
                    <div
                      key={method._id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.shippingMethodId === method._id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                      }`}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          shippingMethodId: method._id,
                          shippingCost: method.cost,
                        })
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </p>
                          {method.estimatedDelivery && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Delivery: {method.estimatedDelivery.minDays}-
                              {method.estimatedDelivery.maxDays} days
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ₦{method.cost.toLocaleString()}
                          </p>
                          {method.cost === 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Free shipping!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasDropshipment && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    📦 <strong>Dropshipment Order:</strong> Shipping will be
                    handled by the supplier. No warehouse stock check required.
                  </p>
                </div>
              )}
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
                      Shipping Cost
                    </label>
                    <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium">
                      ₦{formData.shippingCost.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {shippingCalculated || hasDropshipment
                        ? "Auto-calculated"
                        : "Calculate shipping first"}
                    </p>
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
