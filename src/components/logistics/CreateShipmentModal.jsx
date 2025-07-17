// admin/src/components/logistics/CreateShipmentModal.jsx - Enhanced with order type and print functionality
import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Search,
  AlertCircle,
  Loader2,
  Truck,
  Calendar,
  User,
  Printer,
  Globe,
  Store,
  MapPin,
  Phone,
} from 'lucide-react';

const CreateShipmentModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    trackingNumber: '',
    carrier: {
      name: 'I-Coffee Logistics',
      code: 'ICF',
      phone: '+234-800-ICOFFEE',
      website: 'https://i-coffee.ng',
    },
    estimatedDelivery: '',
    packageInfo: {
      weight: 1,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'cm',
      },
      fragile: false,
      insured: false,
      insuranceValue: 0,
    },
    deliveryInstructions: '',
    priority: 'NORMAL',
    orderType: 'online', // New field for order type
  });

  const [errors, setErrors] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const carriers = [
    { name: 'I-Coffee Logistics', code: 'ICF', phone: '+234-800-ICOFFEE' },
    { name: 'DHL Express', code: 'DHL', phone: '+234-1-279-9999' },
    { name: 'FedEx', code: 'FEDEX', phone: '+234-1-271-3400' },
    { name: 'UPS', code: 'UPS', phone: '+234-1-462-3632' },
    { name: 'Aramex', code: 'ARAMEX', phone: '+234-1-271-6400' },
    { name: 'GIG Logistics', code: 'GIG', phone: '+234-700-2000-744' },
    { name: 'Speedaf', code: 'SPEEDAF', phone: '+234-1-454-8888' },
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600 bg-gray-100' },
    { value: 'NORMAL', label: 'Normal', color: 'text-blue-600 bg-blue-100' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-100' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600 bg-red-100' },
  ];

  const orderTypes = [
    {
      value: 'online',
      label: 'Online Order',
      icon: Globe,
      description: 'Order placed through website',
    },
    {
      value: 'offline',
      label: 'Offline Order',
      icon: Store,
      description: 'Order placed in physical store',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      orderId: '',
      trackingNumber: '',
      carrier: {
        name: 'I-Coffee Logistics',
        code: 'ICF',
        phone: '+234-800-ICOFFEE',
        website: 'https://i-coffee.ng',
      },
      estimatedDelivery: '',
      packageInfo: {
        weight: 1,
        dimensions: { length: 0, width: 0, height: 0, unit: 'cm' },
        fragile: false,
        insured: false,
        insuranceValue: 0,
      },
      deliveryInstructions: '',
      priority: 'NORMAL',
      orderType: 'online',
    });
    setSelectedOrder(null);
    setSearchResults([]);
    setErrors({});
  };

  const searchOrders = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // This would be replaced with actual API call
      // For now using mock data
      const mockResults = [
        {
          _id: '1',
          orderId: 'ORD-001',
          userId: { name: 'John Doe', email: 'john@example.com' },
          totalAmt: 15000,
          payment_status: 'PAID',
          order_status: 'CONFIRMED',
          shipping_cost: 2000,
          delivery_address: {
            address_line: '123 Main St',
            city: 'Lagos',
            state: 'Lagos',
            mobile: '+234-801-234-5678',
          },
          productId: { name: 'Coffee Beans Premium', weight: 2 },
          quantity: 3,
        },
        {
          _id: '2',
          orderId: 'ORD-002',
          userId: { name: 'Jane Smith', email: 'jane@example.com' },
          totalAmt: 25000,
          payment_status: 'PAID',
          order_status: 'CONFIRMED',
          shipping_cost: 1500,
          delivery_address: {
            address_line: '456 Oak Ave',
            city: 'Abuja',
            state: 'FCT',
            mobile: '+234-802-345-6789',
          },
          productId: { name: 'Espresso Machine Deluxe', weight: 5 },
          quantity: 1,
        },
      ];

      setSearchResults(
        mockResults.filter(
          (order) =>
            order.orderId.toLowerCase().includes(query.toLowerCase()) ||
            order.userId.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error searching orders:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setFormData((prev) => ({
      ...prev,
      orderId: order._id,
      packageInfo: {
        ...prev.packageInfo,
        weight: (order.productId?.weight || 1) * order.quantity,
        insured: order.totalAmt > 50000,
        insuranceValue: order.totalAmt > 50000 ? order.totalAmt : 0,
      },
    }));
    setSearchResults([]);
    setErrors((prev) => ({ ...prev, orderId: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.orderId) {
      newErrors.orderId = 'Order selection is required';
    }

    if (!formData.carrier.name) {
      newErrors.carrier = 'Carrier is required';
    }

    if (!formData.packageInfo.weight || formData.packageInfo.weight <= 0) {
      newErrors.weight = 'Package weight must be greater than 0';
    }

    if (
      formData.packageInfo.insured &&
      (!formData.packageInfo.insuranceValue ||
        formData.packageInfo.insuranceValue <= 0)
    ) {
      newErrors.insuranceValue =
        'Insurance value is required when package is insured';
    }

    if (
      formData.estimatedDelivery &&
      new Date(formData.estimatedDelivery) <= new Date()
    ) {
      newErrors.estimatedDelivery = 'Estimated delivery must be in the future';
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCarrierChange = (carrierCode) => {
    const carrier = carriers.find((c) => c.code === carrierCode);
    setFormData((prev) => ({
      ...prev,
      carrier: {
        ...carrier,
        website:
          carrier.code === 'ICF'
            ? 'https://i-coffee.ng'
            : `https://${carrier.name.toLowerCase().replace(/\s+/g, '')}.com`,
      },
    }));

    if (errors.carrier) {
      setErrors((prev) => ({ ...prev, carrier: '' }));
    }
  };

  const handlePackageInfoChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      packageInfo: {
        ...prev.packageInfo,
        [field]: value,
      },
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleDimensionChange = (dimension, value) => {
    setFormData((prev) => ({
      ...prev,
      packageInfo: {
        ...prev.packageInfo,
        dimensions: {
          ...prev.packageInfo.dimensions,
          [dimension]: parseFloat(value) || 0,
        },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;

    // Generate print content with detailed shipment information
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0; font-size: 28px;">I-Coffee Shipping Label</h1>
          <p style="margin: 5px 0; color: #6b7280; font-size: 16px;">Professional Coffee Solutions</p>
          <p style="margin: 0; color: #9ca3af; font-size: 14px;">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <!-- Main Content Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <!-- Left Column -->
          <div>
            <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px;">SHIPMENT DETAILS</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 8px 0;"><strong>Tracking Number:</strong> <span style="color: #2563eb; font-size: 16px;">${
                formData.trackingNumber || 'Auto-generated'
              }</span></p>
              <p style="margin: 8px 0;"><strong>Order ID:</strong> ${
                selectedOrder.orderId
              }</p>
              <p style="margin: 8px 0;"><strong>Order Type:</strong> <span style="text-transform: uppercase; color: ${
                formData.orderType === 'online' ? '#059669' : '#7c3aed'
              };">${formData.orderType}</span></p>
              <p style="margin: 8px 0;"><strong>Priority:</strong> <span style="color: ${
                formData.priority === 'URGENT'
                  ? '#dc2626'
                  : formData.priority === 'HIGH'
                  ? '#ea580c'
                  : '#6b7280'
              };">${formData.priority}</span></p>
              <p style="margin: 8px 0;"><strong>Payment Status:</strong> <span style="color: #059669;">${
                selectedOrder.payment_status
              }</span></p>
            </div>
            
            <h4 style="color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">CARRIER INFORMATION</h4>
            <p style="margin: 5px 0;"><strong>Carrier:</strong> ${
              formData.carrier.name
            }</p>
            <p style="margin: 5px 0;"><strong>Code:</strong> ${
              formData.carrier.code
            }</p>
            <p style="margin: 5px 0;"><strong>Contact:</strong> ${
              formData.carrier.phone
            }</p>
            ${
              formData.estimatedDelivery
                ? `<p style="margin: 5px 0;"><strong>Est. Delivery:</strong> ${new Date(
                    formData.estimatedDelivery
                  ).toLocaleDateString()}</p>`
                : ''
            }
          </div>
          
          <!-- Right Column -->
          <div>
            <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px;">PACKAGE INFORMATION</h3>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 8px 0;"><strong>Weight:</strong> ${
                formData.packageInfo.weight
              } kg</p>
              <p style="margin: 8px 0;"><strong>Dimensions:</strong> ${
                formData.packageInfo.dimensions.length
              }×${formData.packageInfo.dimensions.width}×${
      formData.packageInfo.dimensions.height
    } cm</p>
              <p style="margin: 8px 0;"><strong>Fragile:</strong> ${
                formData.packageInfo.fragile ? '⚠️ YES' : '✅ NO'
              }</p>
              <p style="margin: 8px 0;"><strong>Insured:</strong> ${
                formData.packageInfo.insured
                  ? `🛡️ YES - ₦${formData.packageInfo.insuranceValue.toLocaleString()}`
                  : '❌ NO'
              }</p>
            </div>
            
            <h4 style="color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px;">ORDER DETAILS</h4>
            <p style="margin: 5px 0;"><strong>Product:</strong> ${
              selectedOrder.productId?.name || 'N/A'
            }</p>
            <p style="margin: 5px 0;"><strong>Quantity:</strong> ${
              selectedOrder.quantity
            }</p>
            <p style="margin: 5px 0;"><strong>Order Value:</strong> ₦${selectedOrder.totalAmt.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Shipping Cost:</strong> ₦${
              selectedOrder.shipping_cost?.toLocaleString() || '0'
            }</p>
          </div>
        </div>
        
        <!-- Customer Information -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px;">📋 CUSTOMER INFORMATION</h3>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${
              selectedOrder.userId.name
            }</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${
              selectedOrder.userId.email
            }</p>
            <p style="margin: 8px 0;"><strong>Phone:</strong> ${
              selectedOrder.delivery_address.mobile
            }</p>
          </div>
        </div>
        
        <!-- Delivery Address -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px;">📍 DELIVERY ADDRESS</h3>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>${
              selectedOrder.delivery_address.address_line
            }</strong></p>
            <p style="margin: 8px 0;">${selectedOrder.delivery_address.city}, ${
      selectedOrder.delivery_address.state
    }</p>
            <p style="margin: 8px 0;"><strong>Contact:</strong> ${
              selectedOrder.delivery_address.mobile
            }</p>
          </div>
        </div>
        
        ${
          formData.deliveryInstructions
            ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; font-size: 18px;">📝 DELIVERY INSTRUCTIONS</h3>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <p style="margin: 0; font-style: italic;">${formData.deliveryInstructions}</p>
          </div>
        </div>
        `
            : ''
        }
        
        <!-- Tracking Information -->
        <div style="background: #1f2937; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 20px;">🔍 TRACKING INFORMATION</h3>
          <p style="margin: 5px 0; font-size: 18px;"><strong>Track your shipment at: ${
            formData.carrier.website
          }</strong></p>
          <p style="margin: 5px 0;">Use tracking number: <strong style="background: #374151; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${
            formData.trackingNumber || 'TBD'
          }</strong></p>
        </div>
        
        <!-- Barcode Placeholder -->
        <div style="text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #9ca3af; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">📊 BARCODE PLACEHOLDER</p>
          <div style="background: linear-gradient(90deg, #000 2px, transparent 2px), linear-gradient(90deg, #000 4px, transparent 4px); background-size: 3px 40px, 6px 40px; height: 40px; width: 200px; margin: 10px auto;"></div>
          <p style="margin: 5px 0; font-family: monospace; font-size: 12px; letter-spacing: 2px;">${
            formData.trackingNumber || selectedOrder.orderId
          }</p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 3px solid #2563eb; padding-top: 20px; text-align: center; margin-top: 30px;">
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>I-Coffee Nigeria Limited</strong></p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">Customer Service: +234-800-ICOFFEE | support@i-coffee.ng</p>
          <p style="margin: 5px 0; color: #9ca3af; font-size: 11px;">This is a computer-generated document. Handle with care.</p>
        </div>
        
        <!-- Print Instructions -->
        <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">📋 SHIPPING INSTRUCTIONS</h4>
          <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
            <li>Attach this label securely to the package</li>
            <li>Ensure package is properly sealed and protected</li>
            <li>Update tracking status at each checkpoint</li>
            <li>Contact customer for delivery coordination</li>
            ${
              formData.packageInfo.fragile
                ? '<li><strong>⚠️ HANDLE WITH CARE - FRAGILE CONTENTS</strong></li>'
                : ''
            }
          </ul>
        </div>
      </div>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label - ${selectedOrder.orderId}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${printContent}
          <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px; background: #f3f4f6; border-top: 1px solid #d1d5db;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-right: 10px;">🖨️ Print Label</button>
            <button onclick="window.close()" style="padding: 12px 24px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">❌ Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Shipment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new shipment for tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedOrder && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Print shipping label"
              >
                <Printer className="h-4 w-4" />
                Print Label
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Selection */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Select Order
            </h3>

            {!selectedOrder ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by order ID or customer name..."
                    onChange={(e) => searchOrders(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {searchLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      Searching...
                    </span>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((order) => (
                      <div
                        key={order._id}
                        onClick={() => selectOrder(order)}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                              <Package className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {order.orderId}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.userId.name} • {order.userId.email}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {order.delivery_address.city},{' '}
                                {order.delivery_address.state}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {order.productId?.name} × {order.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              ₦{order.totalAmt.toLocaleString()}
                            </p>
                            <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                              {order.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.orderId}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedOrder.userId.name} •{' '}
                        {selectedOrder.userId.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedOrder.delivery_address.address_line}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedOrder.delivery_address.city},{' '}
                        {selectedOrder.delivery_address.state}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedOrder.productId?.name} ×{' '}
                        {selectedOrder.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ₦{selectedOrder.totalAmt.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errors.orderId && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.orderId}
              </p>
            )}
          </div>

          {/* Order Type Selection */}
          {selectedOrder && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Order Type
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.orderType === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderType"
                        value={type.value}
                        checked={formData.orderType === type.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            formData.orderType === type.value
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              formData.orderType === type.value
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shipping Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Carrier *
              </label>
              <select
                value={formData.carrier.code}
                onChange={(e) => handleCarrierChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.carrier
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {carriers.map((carrier) => (
                  <option key={carrier.code} value={carrier.code}>
                    {carrier.name}
                  </option>
                ))}
              </select>
              {errors.carrier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.carrier}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tracking Number and Delivery Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Tracking Number (Optional)
              </label>
              <input
                type="text"
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Leave blank for auto-generation"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                If not provided, a tracking number will be generated
                automatically
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Estimated Delivery Date
              </label>
              <input
                type="date"
                name="estimatedDelivery"
                value={formData.estimatedDelivery}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.estimatedDelivery
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.estimatedDelivery && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.estimatedDelivery}
                </p>
              )}
            </div>
          </div>

          {/* Package Information */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              Package Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.packageInfo.weight}
                  onChange={(e) =>
                    handlePackageInfoChange(
                      'weight',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                    errors.weight
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.weight}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dimensions (cm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.packageInfo.dimensions.length}
                    onChange={(e) =>
                      handleDimensionChange('length', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Length"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.packageInfo.dimensions.width}
                    onChange={(e) =>
                      handleDimensionChange('width', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    min="0"
                    value={formData.packageInfo.dimensions.height}
                    onChange={(e) =>
                      handleDimensionChange('height', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Height"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="fragile"
                  checked={formData.packageInfo.fragile}
                  onChange={(e) =>
                    handlePackageInfoChange('fragile', e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="fragile"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Fragile
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="insured"
                  checked={formData.packageInfo.insured}
                  onChange={(e) =>
                    handlePackageInfoChange('insured', e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="insured"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Insured
                </label>
                {formData.packageInfo.insured && (
                  <input
                    type="number"
                    min="0"
                    value={formData.packageInfo.insuranceValue}
                    onChange={(e) =>
                      handlePackageInfoChange(
                        'insuranceValue',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className={`ml-3 w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                      errors.insuranceValue
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Insurance Value"
                  />
                )}
              </div>
            </div>
            {errors.insuranceValue && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.insuranceValue}
              </p>
            )}
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Instructions
            </label>
            <textarea
              name="deliveryInstructions"
              value={formData.deliveryInstructions}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder="Special delivery instructions..."
            />
          </div>

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
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShipmentModal;
