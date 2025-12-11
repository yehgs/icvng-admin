// icvng-admin/src/components/order/OrderDetailsModal.jsx
import React, { useState } from 'react';
import { adminOrderAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  X,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  FileText,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingBag,
  Globe,
} from 'lucide-react';
import { generateOrderPDF } from '../../utils/pdfGenerator';

const OrderDetailsModal = ({ order, onClose, onUpdate, currentUser }) => {
  const [updating, setUpdating] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    order_status: order?.summary?.order_status || '',
    payment_status: order?.summary?.payment_status || '',
    notes: '',
  });

  if (!order) return null;

  // Get main order (parent or first order)
  const mainOrder = order.parentOrder || order.allOrders?.[0];
  const isGroupedOrder = order.summary?.totalItems > 1;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status badge helpers
  const getStatusBadge = (status, type = 'order') => {
    const statusClasses = {
      order: {
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        CONFIRMED:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        PROCESSING:
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        SHIPPED:
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        DELIVERED:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        CANCELLED:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        RETURNED:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      payment: {
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        REFUNDED:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        PENDING_BANK_TRANSFER:
          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        PARTIAL:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
    };

    return (
      <span
        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[type][status]}`}
      >
        {status}
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      PAYSTACK: {
        icon: CreditCard,
        color:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        label: 'Paystack',
      },
      STRIPE: {
        icon: CreditCard,
        color:
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        label: 'Stripe',
      },
      BANK_TRANSFER: {
        icon: DollarSign,
        color:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        label: 'Bank Transfer',
      },
    };
    const badge = badges[method] || {
      icon: CreditCard,
      color: 'bg-gray-100 text-gray-800',
      label: method,
    };
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  // Update order status
  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);

      // Update all orders in the group with the same status
      const ordersToUpdate = order.allOrders || [mainOrder];

      const updatePromises = ordersToUpdate.map((singleOrder) =>
        adminOrderAPI.updateOrderStatus(singleOrder._id, statusUpdate)
      );

      await Promise.all(updatePromises);

      toast.success('Order(s) updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  // Generate and send invoice via email
  const handleGenerateInvoice = async (sendEmail = false) => {
    try {
      setGeneratingInvoice(true);

      // For grouped orders, generate invoice for parent order
      const targetOrder = mainOrder;

      const response = await adminOrderAPI.generateInvoice(
        targetOrder._id,
        sendEmail
      );

      if (response.success) {
        if (sendEmail) {
          toast.success('Invoice generated and email sent successfully');
        } else {
          toast.success('Invoice generated successfully');
        }
        onUpdate();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Download PDF invoice
  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      await generateOrderPDF(order);
      toast.success('PDF invoice downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF invoice');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Permission checks
  const canUpdateOrder = () => {
    if (['IT', 'MANAGER', 'DIRECTOR'].includes(currentUser?.subRole))
      return true;
    if (currentUser?.subRole === 'SALES') {
      return (
        mainOrder?.isWebsiteOrder ||
        mainOrder?.createdBy?._id === currentUser._id
      );
    }
    return false;
  };

  const canGenerateInvoice = () => {
    return currentUser?.subRole === 'SALES' && !mainOrder?.invoiceGenerated;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Order Details
                  {mainOrder?.isWebsiteOrder && <Globe className="w-5 h-5" />}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  {order.orderGroupId}
                  {isGroupedOrder && ` (${order.summary.totalItems} items)`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Order Summary Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {formatDate(order.summary.createdAt)}
                </span>
              </div>
              {mainOrder?.invoiceNumber && (
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Invoice: {mainOrder.invoiceNumber}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(order.summary.totals.grandTotal)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {order.summary.totalItems} item(s)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {getStatusBadge(order.summary.order_status, 'order')}
            {getStatusBadge(order.summary.payment_status, 'payment')}
            {getPaymentMethodBadge(mainOrder?.payment_method)}

            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                mainOrder?.orderType === 'BTB'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              }`}
            >
              {mainOrder?.orderType}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                mainOrder?.orderMode === 'ONLINE'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {mainOrder?.orderMode === 'ONLINE' ? '🌐' : '📱'}{' '}
              {mainOrder?.orderMode}
            </span>

            {mainOrder?.isWebsiteOrder && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                <Globe className="w-3 h-3" />
                Website Order
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Customer Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Customer Information
              </h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {mainOrder?.userId?.name ||
                        mainOrder?.customerId?.name ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {mainOrder?.userId?.email ||
                        mainOrder?.customerId?.email ||
                        'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mobile
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {mainOrder?.userId?.mobile ||
                        mainOrder?.customerId?.mobile ||
                        'Not provided'}
                    </p>
                  </div>
                </div>

                {(mainOrder?.deliveryAddress ||
                  mainOrder?.delivery_address) && (
                  <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Delivery Address
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {(() => {
                          const addr =
                            mainOrder.deliveryAddress ||
                            mainOrder.delivery_address;
                          const parts = [];
                          if (addr.street) parts.push(addr.street);
                          if (addr.city) parts.push(addr.city);
                          if (addr.state) parts.push(addr.state);
                          if (addr.lga) parts.push(`LGA: ${addr.lga}`);
                          if (addr.postalCode) parts.push(addr.postalCode);
                          return parts.join(', ') || 'N/A';
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping & Tracking */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Shipping & Tracking
              </h4>

              <div className="space-y-3">
                {mainOrder?.tracking_number && (
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Tracking Number
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {mainOrder.tracking_number}
                      </p>
                    </div>
                  </div>
                )}

                {mainOrder?.shipping_details?.method_name && (
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Shipping Method
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {mainOrder.shipping_details.method_name}
                      </p>
                    </div>
                  </div>
                )}

                {mainOrder?.estimated_delivery && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Estimated Delivery
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(mainOrder.estimated_delivery)}
                      </p>
                    </div>
                  </div>
                )}

                {mainOrder?.actual_delivery && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Delivered On
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatDate(mainOrder.actual_delivery)}
                      </p>
                    </div>
                  </div>
                )}

                {order.summary.totals.totalShipping > 0 && (
                  <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Shipping Cost
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(order.summary.totals.totalShipping)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Order Items
              {isGroupedOrder && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({order.summary.totalItems} products)
                </span>
              )}
            </h4>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price Option
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(order.allOrders || [mainOrder]).map((item, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.productId?.image?.[0] && (
                            <img
                              src={item.productId.image[0]}
                              alt={item.productId.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.productId?.name ||
                                item.product_details?.name ||
                                'Product'}
                            </p>
                            {item.productId?.sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SKU: {item.productId.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {item.product_details?.priceOption || 'regular'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(order.summary.totals.subTotal)}
                </span>
              </div>

              {order.summary.totals.totalShipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Shipping:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.summary.totals.totalShipping)}
                  </span>
                </div>
              )}

              {order.summary.totals.totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount:
                  </span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(order.summary.totals.totalDiscount)}
                  </span>
                </div>
              )}

              {order.summary.totals.totalTax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.summary.totals.totalTax)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    Grand Total:
                  </span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(order.summary.totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {(mainOrder?.notes ||
            mainOrder?.customer_notes ||
            mainOrder?.admin_notes) && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Notes
              </h4>
              <div className="space-y-2">
                {mainOrder.customer_notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Customer Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {mainOrder.customer_notes}
                    </p>
                  </div>
                )}
                {mainOrder.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Order Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {mainOrder.notes}
                    </p>
                  </div>
                )}
                {mainOrder.admin_notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                      Admin Notes:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {mainOrder.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Update Section */}
          {canUpdateOrder() && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Update Order Status
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order Status
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={statusUpdate.order_status}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        order_status: e.target.value,
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Status
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={statusUpdate.payment_status}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        payment_status: e.target.value,
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="PENDING_BANK_TRANSFER">
                      Pending Bank Transfer
                    </option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={statusUpdate.notes}
                  onChange={(e) =>
                    setStatusUpdate({ ...statusUpdate, notes: e.target.value })
                  }
                  placeholder="Add any additional notes about this update..."
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
              >
                {updating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Update Status
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last updated: {formatDate(mainOrder?.updatedAt)}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloadingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>

            {/* Generate Invoice (without email) */}
            {canGenerateInvoice() && (
              <button
                onClick={() => handleGenerateInvoice(false)}
                disabled={generatingInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generatingInvoice ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Invoice
                  </>
                )}
              </button>
            )}

            {/* Generate & Send Invoice Email */}
            {canGenerateInvoice() && mainOrder?.userId?.email && (
              <button
                onClick={() => handleGenerateInvoice(true)}
                disabled={generatingInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generatingInvoice ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invoice Email
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
