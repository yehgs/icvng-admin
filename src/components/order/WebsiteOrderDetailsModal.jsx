// icvng-admin/src/components/order/WebsiteOrderDetailsModal.jsx
import React, { useState } from 'react';
import { adminOrderAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  Truck,
  Globe,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Download,
  FileText,
  Send,
} from 'lucide-react';
import { generateOrderPDF } from '../../utils/pdfGenerator';

const WebsiteOrderDetailsModal = ({
  orderGroup,
  onClose,
  onUpdate,
  currentUser,
}) => {
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Collective status update
  const [collectiveStatus, setCollectiveStatus] = useState({
    order_status: orderGroup?.summary?.order_status || '',
    payment_status: orderGroup?.summary?.payment_status || '',
    notes: '',
  });

  // Individual status updates
  const [individualStatuses, setIndividualStatuses] = useState(() => {
    const statuses = {};
    orderGroup?.allOrders?.forEach((order) => {
      statuses[order._id] = {
        order_status: order.order_status,
        payment_status: order.payment_status,
        notes: order.admin_notes || '',
      };
    });
    return statuses;
  });

  // Track which orders are selected for individual update
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [updateMode, setUpdateMode] = useState('collective'); // 'collective' or 'individual'

  if (!orderGroup) return null;

  const mainOrder = orderGroup.parentOrder || orderGroup.allOrders[0];
  const hasMultipleItems = orderGroup.summary.totalItems > 1;

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
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[type][status]}`}
      >
        {status}
      </span>
    );
  };

  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAllOrders = () => {
    if (selectedOrders.size === orderGroup.allOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orderGroup.allOrders.map((o) => o._id)));
    }
  };

  const handleCollectiveUpdate = async () => {
    try {
      setUpdating(true);

      // Update all orders in the group with the same status
      const updatePromises = orderGroup.allOrders.map((order) =>
        adminOrderAPI.updateOrderStatus(order._id, {
          order_status: collectiveStatus.order_status,
          payment_status: collectiveStatus.payment_status,
          notes: collectiveStatus.notes,
        })
      );

      await Promise.all(updatePromises);
      toast.success(
        `Updated ${orderGroup.allOrders.length} orders collectively`
      );
      setEditMode(false);
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to update orders');
    } finally {
      setUpdating(false);
    }
  };

  const handleIndividualUpdate = async () => {
    try {
      setUpdating(true);

      if (selectedOrders.size === 0) {
        toast.error('Please select at least one order to update');
        return;
      }

      // Update only selected orders
      const updatePromises = Array.from(selectedOrders).map((orderId) =>
        adminOrderAPI.updateOrderStatus(orderId, individualStatuses[orderId])
      );

      await Promise.all(updatePromises);
      toast.success(`Updated ${selectedOrders.size} selected order(s)`);
      setEditMode(false);
      setSelectedOrders(new Set());
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to update orders');
    } finally {
      setUpdating(false);
    }
  };

  const updateIndividualStatus = (orderId, field, value) => {
    setIndividualStatuses((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }));
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
      await generateOrderPDF(orderGroup);
      toast.success('PDF invoice downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF invoice');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const canUpdateOrder = () => {
    if (['IT', 'MANAGER', 'DIRECTOR'].includes(currentUser?.subRole))
      return true;
    if (currentUser?.subRole === 'SALES') return true;
    return false;
  };

  const canGenerateInvoice = () => {
    return currentUser?.subRole === 'SALES' && !mainOrder?.invoiceGenerated;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Order Group Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {orderGroup.orderGroupId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Order Group Header */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {orderGroup.orderGroupId}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                Created on {formatDate(orderGroup.summary.createdAt)}
              </p>
              {mainOrder?.invoiceNumber && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <FileText className="w-4 h-4" />
                  Invoice: {mainOrder.invoiceNumber}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(orderGroup.summary.totals.grandTotal)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {orderGroup.summary.totalItems} item(s)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {getStatusBadge(orderGroup.summary.order_status, 'order')}
            {getStatusBadge(orderGroup.summary.payment_status, 'payment')}
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Globe className="w-3 h-3" />
              Website Order
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              <CreditCard className="w-3 h-3" />
              {mainOrder.payment_method}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Customer Information */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Customer Information
            </h4>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {mainOrder.userId?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {mainOrder.userId?.email}
                  </p>
                </div>
              </div>

              {mainOrder.userId?.mobile && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mobile
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {mainOrder.userId.mobile}
                    </p>
                  </div>
                </div>
              )}

              {mainOrder.delivery_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Delivery Address
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {mainOrder.delivery_address.street},{' '}
                      {mainOrder.delivery_address.city}
                      {mainOrder.delivery_address.state &&
                        `, ${mainOrder.delivery_address.state}`}
                      {mainOrder.delivery_address.postalCode &&
                        ` ${mainOrder.delivery_address.postalCode}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products in Order Group */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                Products ({orderGroup.summary.totalItems})
              </h4>
              {hasMultipleItems && (
                <button
                  onClick={() => setExpandedProducts(!expandedProducts)}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {expandedProducts ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Expand
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {expandedProducts &&
                orderGroup.allOrders.map((order, index) => (
                  <div
                    key={order._id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-start gap-4"
                  >
                    {order.productId?.image && order.productId.image[0] && (
                      <div className="w-20 h-20 bg-white dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={order.productId.image[0]}
                          alt={order.productId.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {order.productId?.name ||
                              order.product_details?.name ||
                              'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Order ID: {order.orderId}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Qty:{' '}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {order.quantity || 1}
                              </span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Unit Price:{' '}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(order.unitPrice)}
                              </span>
                            </span>
                            {order.product_details?.priceOption && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                                {order.product_details.priceOption} delivery
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(order.totalAmt)}
                          </div>
                          <div className="flex flex-col gap-1 mt-2">
                            {getStatusBadge(order.order_status, 'order')}
                            {getStatusBadge(order.payment_status, 'payment')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              Order Summary
            </h4>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(orderGroup.summary.totals.subTotal)}
                  </span>
                </div>

                {orderGroup.summary.totals.totalShipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Shipping:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(orderGroup.summary.totals.totalShipping)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      Total:
                    </span>
                    <span className="text-base font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(orderGroup.summary.totals.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          {canUpdateOrder() && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Update Order Status
                </h4>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Status
                  </button>
                )}
              </div>

              {editMode && (
                <div className="space-y-6">
                  {/* Update Mode Toggle */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <button
                      onClick={() => setUpdateMode('collective')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        updateMode === 'collective'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      Collective Update
                    </button>
                    <button
                      onClick={() => setUpdateMode('individual')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        updateMode === 'individual'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      Individual Update
                    </button>
                  </div>

                  {updateMode === 'collective' ? (
                    <>
                      {/* Collective Update Form */}
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-300">
                          This will update all {orderGroup.allOrders.length}{' '}
                          orders in this group with the same status.
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Order Status
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            value={collectiveStatus.order_status}
                            onChange={(e) =>
                              setCollectiveStatus({
                                ...collectiveStatus,
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
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Payment Status
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            value={collectiveStatus.payment_status}
                            onChange={(e) =>
                              setCollectiveStatus({
                                ...collectiveStatus,
                                payment_status: e.target.value,
                              })
                            }
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="PENDING_BANK_TRANSFER">
                              Pending Bank Transfer
                            </option>
                            <option value="FAILED">Failed</option>
                            <option value="REFUNDED">Refunded</option>
                            <option value="PARTIAL">Partial</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Admin Notes (applies to all orders)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          value={collectiveStatus.notes}
                          onChange={(e) =>
                            setCollectiveStatus({
                              ...collectiveStatus,
                              notes: e.target.value,
                            })
                          }
                          placeholder="Add notes about this collective update..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleCollectiveUpdate}
                          disabled={updating}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {updating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Update All Orders
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(false);
                            setCollectiveStatus({
                              order_status: orderGroup.summary.order_status,
                              payment_status: orderGroup.summary.payment_status,
                              notes: '',
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Individual Update Form */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                              Select orders to update individually (
                              {selectedOrders.size} selected)
                            </div>
                          </div>
                          <button
                            onClick={selectAllOrders}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                          >
                            {selectedOrders.size === orderGroup.allOrders.length
                              ? 'Deselect All'
                              : 'Select All'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {orderGroup.allOrders.map((order) => {
                          const isSelected = selectedOrders.has(order._id);
                          return (
                            <div
                              key={order._id}
                              className={`border-2 rounded-lg p-4 transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleOrderSelection(order._id)
                                  }
                                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />

                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {order.productId?.name || 'Product'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {order.orderId}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {getStatusBadge(
                                        order.order_status,
                                        'order'
                                      )}
                                      {getStatusBadge(
                                        order.payment_status,
                                        'payment'
                                      )}
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Order Status
                                        </label>
                                        <select
                                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                          value={
                                            individualStatuses[order._id]
                                              .order_status
                                          }
                                          onChange={(e) =>
                                            updateIndividualStatus(
                                              order._id,
                                              'order_status',
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="PENDING">
                                            Pending
                                          </option>
                                          <option value="CONFIRMED">
                                            Confirmed
                                          </option>
                                          <option value="PROCESSING">
                                            Processing
                                          </option>
                                          <option value="SHIPPED">
                                            Shipped
                                          </option>
                                          <option value="DELIVERED">
                                            Delivered
                                          </option>
                                          <option value="CANCELLED">
                                            Cancelled
                                          </option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Payment Status
                                        </label>
                                        <select
                                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                          value={
                                            individualStatuses[order._id]
                                              .payment_status
                                          }
                                          onChange={(e) =>
                                            updateIndividualStatus(
                                              order._id,
                                              'payment_status',
                                              e.target.value
                                            )
                                          }
                                        >
                                          <option value="PENDING">
                                            Pending
                                          </option>
                                          <option value="PAID">Paid</option>
                                          <option value="PENDING_BANK_TRANSFER">
                                            Pending Bank Transfer
                                          </option>
                                          <option value="FAILED">Failed</option>
                                          <option value="REFUNDED">
                                            Refunded
                                          </option>
                                          <option value="PARTIAL">
                                            Partial
                                          </option>
                                        </select>
                                      </div>

                                      <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Notes
                                        </label>
                                        <textarea
                                          rows={2}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                          value={
                                            individualStatuses[order._id].notes
                                          }
                                          onChange={(e) =>
                                            updateIndividualStatus(
                                              order._id,
                                              'notes',
                                              e.target.value
                                            )
                                          }
                                          placeholder="Add notes..."
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleIndividualUpdate}
                          disabled={updating || selectedOrders.size === 0}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {updating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Update Selected ({selectedOrders.size})
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditMode(false);
                            setSelectedOrders(new Set());
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {formatDate(mainOrder.updatedAt)}
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

export default WebsiteOrderDetailsModal;
