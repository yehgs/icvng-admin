import React, { useState } from 'react';
import { adminOrderAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const OrderDetailsModal = ({ order, onClose, onUpdate, currentUser }) => {
  const [updating, setUpdating] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    orderStatus: order?.orderStatus || '',
    paymentStatus: order?.paymentStatus || '',
    notes: order?.notes || '',
  });

  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

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

  const getStatusBadge = (status, type = 'order') => {
    const statusClasses = {
      order: {
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        CONFIRMED:
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        PROCESSING:
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        SHIPPED:
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        DELIVERED:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      },
      payment: {
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        REFUNDED:
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        PARTIAL:
          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      },
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[type][status]}`}
      >
        {status}
      </span>
    );
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const response = await adminOrderAPI.updateOrderStatus(
        order._id,
        statusUpdate
      );

      if (response.success) {
        toast.success('Order updated successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setUpdating(true);
      const response = await adminOrderAPI.generateInvoice(order._id);

      if (response.success) {
        toast.success('Invoice generated and sent successfully');
        onUpdate();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setUpdating(false);
    }
  };

  const canUpdateOrder = () => {
    if (['IT', 'MANAGER', 'DIRECTOR'].includes(currentUser?.subRole))
      return true;
    if (currentUser?.subRole === 'SALES') {
      return order.createdBy?._id === currentUser._id || order.isWebsiteOrder;
    }
    return false;
  };

  const canGenerateInvoice = () => {
    return currentUser?.subRole === 'SALES' && !order.invoiceGenerated;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              📦
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Details
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {order.orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Order Header Info */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {order.orderId}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Created on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(order.totalAmount)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {order.items?.length || 0} item(s)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {getStatusBadge(order.orderStatus, 'order')}
            {getStatusBadge(order.paymentStatus, 'payment')}

            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                order.orderType === 'BTB'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              }`}
            >
              {order.orderType}
            </span>

            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                order.orderMode === 'ONLINE'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {order.orderMode === 'ONLINE' ? '🌐' : '📱'} {order.orderMode}
            </span>

            {order.isWebsiteOrder && (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                Website Order
              </span>
            )}

            {order.invoiceGenerated && (
              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                📄 Invoice: {order.invoiceNumber}
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {order.customerId?.customerType === 'BTB' ? '🏢' : '👤'}
                Customer Information
              </h4>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Name
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.customerId?.displayName || order.customerId?.name}
                    </p>
                    {order.customerId?.companyName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Company: {order.customerId.companyName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">📧</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.customerId?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">📱</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mobile
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.customerId?.mobile || 'Not provided'}
                    </p>
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Delivery Address
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {order.deliveryAddress.street &&
                          `${order.deliveryAddress.street}, `}
                        {order.deliveryAddress.city &&
                          `${order.deliveryAddress.city}, `}
                        {order.deliveryAddress.state}
                        {order.deliveryAddress.postalCode &&
                          ` ${order.deliveryAddress.postalCode}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📋 Order Information
              </h4>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Order Date
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Payment Method
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created By
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {order.isWebsiteOrder
                        ? 'Website Customer'
                        : order.createdBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {order.deliveryDate && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🚚</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Delivery Date
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(order.deliveryDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Items
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price Option
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {order.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {item.priceOption}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.subTotal)}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Discount:
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}

                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tax:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.taxAmount)}
                    </span>
                  </div>
                )}

                {order.shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Shipping:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(order.shippingCost)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Total:
                    </span>
                    <span className="text-base font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          {canUpdateOrder() && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Update Order Status
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusUpdate.orderStatus}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        orderStatus: e.target.value,
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={statusUpdate.paymentStatus}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        paymentStatus: e.target.value,
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>✏️ Update Status</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(order.updatedAt)}
          </div>
          <div className="flex gap-3">
            {canGenerateInvoice() && (
              <button
                onClick={handleGenerateInvoice}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                🧾 Generate Invoice
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
