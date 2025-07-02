import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  FileText,
  Clock,
  Ship,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import {
  purchaseOrderAPI,
  handleApiError,
  getCurrentUser,
} from '../../utils/api';
import toast from 'react-hot-toast';

// Status Update Component
const StatusUpdateComponent = ({
  orderId,
  currentStatus,
  userRole,
  onStatusUpdate,
  orderData,
}) => {
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Status configuration
  const statusConfig = {
    DRAFT: {
      color: 'bg-gray-100 text-gray-800',
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'Draft',
      description: 'Order is being prepared',
    },
    PENDING: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="w-4 h-4" />,
      label: 'Pending Approval',
      description: 'Waiting for approval',
    },
    APPROVED: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Approved',
      description: 'Order has been approved',
    },
    SHIPPED: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Ship className="w-4 h-4" />,
      label: 'Shipped',
      description: 'Order is in transit',
    },
    DELIVERED: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Truck className="w-4 h-4" />,
      label: 'Delivered',
      description: 'Items have been delivered',
    },
    COMPLETED: {
      color: 'bg-purple-100 text-purple-800',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Completed',
      description: 'Order process completed',
    },
    CANCELLED: {
      color: 'bg-red-100 text-red-800',
      icon: <X className="w-4 h-4" />,
      label: 'Cancelled',
      description: 'Order has been cancelled',
    },
  };

  // Fetch allowed status updates with role-based permissions
  useEffect(() => {
    fetchAllowedStatuses();
    fetchStatusHistory();
  }, [orderId, userRole]);

  const fetchAllowedStatuses = async () => {
    try {
      // Calculate allowed statuses based on current user role and order status
      const allowedTransitions = getRoleBasedAllowedStatuses(
        userRole,
        currentStatus
      );
      setAllowedStatuses(allowedTransitions);
    } catch (error) {
      console.error('Error fetching allowed statuses:', error);
    }
  };

  const getRoleBasedAllowedStatuses = (role, currentStatus) => {
    const roleUpper = role?.toUpperCase();

    // Role-based permissions for status updates
    const permissions = {
      WAREHOUSE: {
        DRAFT: ['PENDING'],
        APPROVED: ['DELIVERED'],
      },
      IT: {
        PENDING: ['APPROVED', 'CANCELLED'],
        APPROVED: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: ['COMPLETED'],
      },
      DIRECTOR: {
        DRAFT: ['PENDING', 'CANCELLED'],
        PENDING: ['APPROVED', 'CANCELLED'],
        APPROVED: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: ['COMPLETED'],
      },
    };

    return permissions[roleUpper]?.[currentStatus] || [];
  };

  const fetchStatusHistory = async () => {
    try {
      const response = await purchaseOrderAPI.getStatusHistory(orderId);
      if (response.success) {
        setStatusHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      const statusData = {
        status: selectedStatus,
        notes,
        reason: selectedStatus === 'CANCELLED' ? reason : notes,
      };

      const response = await purchaseOrderAPI.updateOrderStatus(
        orderId,
        statusData
      );

      if (response.success) {
        // Update parent component
        if (onStatusUpdate) {
          onStatusUpdate(response.data);
        }

        // Reset form
        setSelectedStatus('');
        setNotes('');
        setReason('');
        setShowUpdateForm(false);

        // Refresh data
        fetchAllowedStatuses();
        fetchStatusHistory();

        toast.success(
          `Order status updated to ${selectedStatus} successfully!`
        );
      } else {
        toast.error(`Failed to update status: ${response.message}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(handleApiError(error, 'Failed to update status'));
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      WAREHOUSE: 'Warehouse Staff',
      IT: 'IT Admin',
      DIRECTOR: 'Director',
      ACCOUNT: 'Accountant',
    };
    return roleNames[role?.toUpperCase()] || role;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatusConfig = statusConfig[currentStatus] || statusConfig.DRAFT;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      {/* Current Status Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusConfig.color}`}
          >
            {currentStatusConfig.icon}
            <span className="ml-2">{currentStatusConfig.label}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentStatusConfig.description}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>

          {allowedStatuses.length > 0 && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Status Update Form */}
      {showUpdateForm && (
        <div className="border-t pt-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Update Order Status</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select new status...</option>
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusConfig[status]?.label || status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Role
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300">
                <User className="w-4 h-4 inline mr-2" />
                {getRoleDisplayName(userRole)}
              </div>
            </div>
          </div>

          {selectedStatus === 'CANCELLED' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cancellation Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select reason...</option>
                <option value="Supplier unavailable">
                  Supplier unavailable
                </option>
                <option value="Budget constraints">Budget constraints</option>
                <option value="Requirements changed">
                  Requirements changed
                </option>
                <option value="Better alternative found">
                  Better alternative found
                </option>
                <option value="Project cancelled">Project cancelled</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add any additional notes about this status change..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleStatusUpdate}
              disabled={
                !selectedStatus ||
                isUpdating ||
                (selectedStatus === 'CANCELLED' && !reason)
              }
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>

            <button
              onClick={() => {
                setShowUpdateForm(false);
                setSelectedStatus('');
                setNotes('');
                setReason('');
              }}
              className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-300 px-6 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status History */}
      {showHistory && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Status History
          </h3>

          {statusHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No status changes yet.
            </p>
          ) : (
            <div className="space-y-4">
              {statusHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      statusConfig[entry.newStatus]?.color ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusConfig[entry.newStatus]?.icon}
                    <span className="ml-1">
                      {statusConfig[entry.newStatus]?.label || entry.newStatus}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {entry.changedBy?.name || 'Unknown User'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({getRoleDisplayName(entry.userRole)})
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(entry.changedAt)}
                      </span>
                    </div>

                    {entry.previousStatus && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Changed from{' '}
                        {statusConfig[entry.previousStatus]?.label ||
                          entry.previousStatus}
                      </div>
                    )}

                    {(entry.notes || entry.reason) && (
                      <div className="text-xs text-gray-700 dark:text-gray-300 mt-2 bg-white dark:bg-gray-800 p-2 rounded border-l-2 border-blue-200 dark:border-blue-600">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {entry.reason || entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Permissions Info */}
      {allowedStatuses.length === 0 && (
        <div className="border-t pt-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Limited Permissions:</strong> Your role (
                {getRoleDisplayName(userRole)}) cannot update this order from
                its current status ({currentStatusConfig.label}).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PurchaseOrderDetailsModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onStatusUpdate,
  supportedCurrencies = [],
}) => {
  const [currentUser, setCurrentUser] = useState(null);

  // Status configuration
  const statusConfig = {
    DRAFT: {
      color: 'bg-gray-100 text-gray-800',
      icon: FileText,
      label: 'Draft',
      description: 'Order is being prepared',
    },
    PENDING: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: Clock,
      label: 'Pending Approval',
      description: 'Waiting for approval',
    },
    APPROVED: {
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      label: 'Approved',
      description: 'Order has been approved',
    },
    SHIPPED: {
      color: 'bg-blue-100 text-blue-800',
      icon: Ship,
      label: 'Shipped',
      description: 'Order is in transit',
    },
    DELIVERED: {
      color: 'bg-blue-100 text-blue-800',
      icon: Truck,
      label: 'Delivered',
      description: 'Items have been delivered',
    },
    COMPLETED: {
      color: 'bg-purple-100 text-purple-800',
      icon: CheckCircle,
      label: 'Completed',
      description: 'Order process completed',
    },
    CANCELLED: {
      color: 'bg-red-100 text-red-800',
      icon: XCircle,
      label: 'Cancelled',
      description: 'Order has been cancelled',
    },
  };

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, [isOpen, purchaseOrder]);

  const formatCurrency = (amount, currencyCode = 'USD') => {
    const currency = supportedCurrencies.find((c) => c.code === currencyCode);
    return `${currency?.symbol || '$'}${amount?.toLocaleString() || '0'}`;
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.DRAFT;
    const StatusIcon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <StatusIcon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      WAREHOUSE: 'Warehouse Staff',
      IT: 'IT Admin',
      DIRECTOR: 'Director',
    };
    return roleNames[role] || role;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !purchaseOrder) return null;

  const currentStatusConfig =
    statusConfig[purchaseOrder.status] || statusConfig.DRAFT;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Purchase Order Details
            </h3>
            <p className="text-sm text-gray-500">{purchaseOrder.orderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Management Section */}
          <StatusUpdateComponent
            orderId={purchaseOrder._id}
            currentStatus={purchaseOrder.status}
            userRole={currentUser?.subRole || currentUser?.role || 'USER'}
            onStatusUpdate={(updatedOrder) => {
              if (onStatusUpdate) {
                onStatusUpdate(purchaseOrder._id, updatedOrder.status);
              }
            }}
            orderData={purchaseOrder}
          />

          {/* Header Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Order Date
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(purchaseOrder.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Amount
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      purchaseOrder.grandTotal ||
                        purchaseOrder.totalAmount ||
                        0,
                      purchaseOrder.currency?.code || purchaseOrder.currency
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Items Count
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {purchaseOrder.items?.length || 0} items
                  </p>
                </div>
                <Package className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              Supplier Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {purchaseOrder.supplier?.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {purchaseOrder.supplier?.email || 'N/A'}
                </p>
              </div>
              {purchaseOrder.supplier?.phone && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {purchaseOrder.supplier.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Delivery Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expected Delivery
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {purchaseOrder.expectedDeliveryDate
                    ? new Date(
                        purchaseOrder.expectedDeliveryDate
                      ).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
              {purchaseOrder.actualDeliveryDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Actual Delivery
                  </p>
                  <p className="font-medium text-green-600">
                    {new Date(
                      purchaseOrder.actualDeliveryDate
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Logistics Information */}
          {purchaseOrder.logistics && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-orange-600" />
                Logistics Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Transport Mode
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {purchaseOrder.logistics.transportMode || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Freight Cost
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      purchaseOrder.logistics.freightCost || 0,
                      purchaseOrder.currency?.code || purchaseOrder.currency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clearance Cost
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      purchaseOrder.logistics.clearanceCost || 0,
                      purchaseOrder.currency?.code || purchaseOrder.currency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Logistics
                  </p>
                  <p className="font-medium text-orange-600">
                    {formatCurrency(
                      purchaseOrder.logistics.totalLogisticsCost || 0,
                      purchaseOrder.currency?.code || purchaseOrder.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Order Items
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.items?.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.product?.sku || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {formatCurrency(
                          item.unitPrice || item.unitCost || 0,
                          purchaseOrder.currency?.code || purchaseOrder.currency
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {formatCurrency(
                          item.totalPrice || item.totalCost || 0,
                          purchaseOrder.currency?.code || purchaseOrder.currency
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Order Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(
                    purchaseOrder.subtotal || 0,
                    purchaseOrder.currency?.code || purchaseOrder.currency
                  )}
                </span>
              </div>

              {purchaseOrder.logistics?.totalLogisticsCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Logistics:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(
                      purchaseOrder.logistics.totalLogisticsCost,
                      purchaseOrder.currency?.code || purchaseOrder.currency
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-gray-900 dark:text-white">
                  Grand Total:
                </span>
                <span className="text-green-600">
                  {formatCurrency(
                    purchaseOrder.grandTotal || purchaseOrder.totalAmount || 0,
                    purchaseOrder.currency?.code || purchaseOrder.currency
                  )}
                </span>
              </div>

              {/* NGN conversion if not NGN */}
              {(purchaseOrder.currency?.code || purchaseOrder.currency) !==
                'NGN' &&
                purchaseOrder.exchangeRate && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    In NGN: ₦
                    {(
                      (purchaseOrder.grandTotal ||
                        purchaseOrder.totalAmount ||
                        0) * purchaseOrder.exchangeRate
                    ).toLocaleString()}
                  </div>
                )}
            </div>
          </div>

          {/* Notes */}
          {purchaseOrder.notes && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notes
              </h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {purchaseOrder.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailsModal;
