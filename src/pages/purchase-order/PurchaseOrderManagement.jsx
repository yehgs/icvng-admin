import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Download,
  Truck,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Ship,
  FileText,
  Building2,
  Trash2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import {
  purchaseOrderAPI,
  supplierAPI,
  exchangeRateAPI,
  getCurrentUser,
  handleApiError,
} from '../../utils/api';
import toast from 'react-hot-toast';
import PurchaseOrderForm from '../../components/purchaseOrder/PurchaseOrderForm';
import PurchaseOrderDetailsModal from '../../components/purchaseOrder/PurchaseOrderDetailsModel';
import RoleBasedButton from '../../components/layout/RoleBasedButton';

const PurchaseOrderManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [viewingPO, setViewingPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
  });

  const orderStatuses = [
    'DRAFT',
    'PENDING',
    'APPROVED',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ];

  const statusConfig = {
    DRAFT: {
      color: 'badge-neutral',
      icon: FileText,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      description: 'Order being prepared',
    },
    PENDING: {
      color: 'badge-warning',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      description: 'Awaiting approval',
    },
    APPROVED: {
      color: 'badge-success',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      description: 'Ready for processing',
    },
    SHIPPED: {
      color: 'badge-info',
      icon: Ship,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      description: 'In transit',
    },
    DELIVERED: {
      color: 'badge-primary',
      icon: Truck,
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-800',
      description: 'Items delivered',
    },
    COMPLETED: {
      color: 'badge-success',
      icon: CheckCircle,
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      description: 'Process completed',
    },
    CANCELLED: {
      color: 'badge-danger',
      icon: XCircle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      description: 'Order cancelled',
    },
  };

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [currentPage, searchTerm, filterStatus]);

  const initializeData = async () => {
    const user = getCurrentUser();
    setCurrentUser(user);

    await Promise.all([
      fetchPurchaseOrders(),
      fetchSuppliers(),
      fetchSupportedCurrencies(),
    ]);
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus }),
      };

      const response = await purchaseOrderAPI.getPurchaseOrders(params);

      if (response.success) {
        setPurchaseOrders(response.data);
        setTotalPages(response.totalPages || 1);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error(handleApiError(error, 'Failed to fetch purchase orders'));
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const stats = {
      total: orders.length,
      pending: orders.filter((po) => po.status === 'PENDING').length,
      approved: orders.filter((po) => po.status === 'APPROVED').length,
      shipped: orders.filter((po) => po.status === 'SHIPPED').length,
      delivered: orders.filter((po) => po.status === 'DELIVERED').length,
      completed: orders.filter((po) => po.status === 'COMPLETED').length,
      cancelled: orders.filter((po) => po.status === 'CANCELLED').length,
    };
    setStats(stats);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getSuppliers();
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    }
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await exchangeRateAPI.getSupportedCurrencies();
      if (response.success) {
        setSupportedCurrencies(response.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setSupportedCurrencies([
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      ]);
    }
  };

  const fetchPODetails = async (poId) => {
    try {
      console.log('Fetching PO details for ID:', poId);
      const response = await purchaseOrderAPI.getPurchaseOrder(poId);
      console.log('PO details response:', response);

      if (response && response.success) {
        setViewingPO(response.data);
        setShowDetailsModal(true);
      } else {
        console.error('Failed response:', response);
        toast.error(
          response?.message || 'Failed to fetch purchase order details'
        );
      }
    } catch (error) {
      console.error('Error fetching PO details:', error);
      toast.error(
        handleApiError(error, 'Failed to fetch purchase order details')
      );
    }
  };

  const handleStatusUpdate = async (poId, newStatus) => {
    try {
      const response = await purchaseOrderAPI.updateOrderStatus(poId, {
        status: newStatus,
      });

      if (response.success) {
        const updatedOrders = purchaseOrders.map((po) =>
          po._id === poId ? { ...po, status: newStatus } : po
        );
        setPurchaseOrders(updatedOrders);
        calculateStats(updatedOrders);

        if (viewingPO && viewingPO._id === poId) {
          setViewingPO({ ...viewingPO, status: newStatus });
        }

        toast.success(
          `Purchase order ${newStatus.toLowerCase()} successfully!`
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(handleApiError(error, 'Failed to update order status'));
    }
  };

  const handleDelete = async (poId) => {
    if (!confirm('Are you sure you want to delete this purchase order?'))
      return;

    try {
      const response = await purchaseOrderAPI.deletePurchaseOrder(poId);
      if (response.success) {
        const updatedOrders = purchaseOrders.filter((po) => po._id !== poId);
        setPurchaseOrders(updatedOrders);
        calculateStats(updatedOrders);
        toast.success('Purchase order deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast.error(handleApiError(error, 'Failed to delete purchase order'));
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.DRAFT;
    const StatusIcon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
      >
        <StatusIcon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const canUpdateStatus = (po, newStatus) => {
    if (!currentUser || !po) return false;

    const role =
      currentUser.subRole?.toUpperCase() || currentUser.role?.toUpperCase();
    const currentStatus = po.status;

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

    const allowedStatuses = permissions[role]?.[currentStatus] || [];
    return allowedStatuses.includes(newStatus);
  };

  const getQuickActions = (po) => {
    const actions = [];

    // View details action (always available)
    actions.push({
      icon: Eye,
      action: () => fetchPODetails(po._id),
      tooltip: 'View Details',
      color: 'text-blue-600 hover:bg-blue-50',
    });

    // Edit action (only for DRAFT status)
    if (po.status === 'DRAFT') {
      actions.push({
        icon: Edit,
        action: () => handleEdit(po),
        tooltip: 'Edit',
        color: 'text-green-600 hover:bg-green-50',
      });
    }

    // Status-specific actions based on user role
    if (canUpdateStatus(po, 'APPROVED') && po.status === 'PENDING') {
      actions.push({
        icon: CheckCircle,
        action: () => handleStatusUpdate(po._id, 'APPROVED'),
        tooltip: 'Approve',
        color: 'text-green-600 hover:bg-green-50',
      });
    }

    if (canUpdateStatus(po, 'DELIVERED') && po.status === 'APPROVED') {
      actions.push({
        icon: Truck,
        action: () => handleStatusUpdate(po._id, 'DELIVERED'),
        tooltip: 'Mark as Delivered',
        color: 'text-blue-600 hover:bg-blue-50',
      });
    }

    if (
      canUpdateStatus(po, 'CANCELLED') &&
      ['PENDING', 'APPROVED'].includes(po.status)
    ) {
      actions.push({
        icon: XCircle,
        action: () => handleStatusUpdate(po._id, 'CANCELLED'),
        tooltip: 'Cancel',
        color: 'text-red-600 hover:bg-red-50',
      });
    }

    // Delete action (only for DRAFT or CANCELLED status)
    if (['DRAFT', 'CANCELLED'].includes(po.status)) {
      actions.push({
        icon: Trash2,
        action: () => handleDelete(po._id),
        tooltip: 'Delete',
        color: 'text-red-600 hover:bg-red-50',
      });
    }

    return actions;
  };

  const formatCurrency = (amount, currencyCode = 'USD') => {
    const currency = supportedCurrencies.find((c) => c.code === currencyCode);
    return `${currency?.symbol || '$'}${amount?.toLocaleString() || '0'}`;
  };

  const exportToExcel = () => {
    const csvContent = [
      [
        'Order Number',
        'Supplier',
        'Order Date',
        'Expected Delivery',
        'Items Count',
        'Total Amount',
        'Currency',
        'Status',
      ],
      ...purchaseOrders.map((po) => [
        po.orderNumber,
        po.supplier?.name || '',
        new Date(po.orderDate).toLocaleDateString(),
        po.expectedDeliveryDate
          ? new Date(po.expectedDeliveryDate).toLocaleDateString()
          : '',
        po.items?.length || 0,
        po.grandTotal || po.totalAmount || 0,
        po.currency?.code || po.currency || 'USD',
        po.status,
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase-orders.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFormSuccess = () => {
    fetchPurchaseOrders();
  };

  const handleEdit = (po) => {
    setEditingPO(po);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingPO(null);
    setShowModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Purchase Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage supplier purchase orders and procurement with status tracking
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchPurchaseOrders()}
            className="btn-outline flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            className="btn-outline flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <RoleBasedButton disabledRoles={['MANAGER']}>
            <button
              onClick={handleCreate}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </button>
          </RoleBasedButton>
        </div>
      </div>

      {/* Enhanced Summary Cards with Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Shipped</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.shipped}
              </p>
            </div>
            <Ship className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600">Delivered</p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.delivered}
              </p>
            </div>
            <Truck className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-600">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.completed}
              </p>
            </div>
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.cancelled}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search purchase orders..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status} ({stats[status.toLowerCase()] || 0})
                </option>
              ))}
            </select>
          </div>

          {currentUser && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
              Logged in as:{' '}
              <span className="font-medium">{currentUser.name}</span> (
              {currentUser.subRole || currentUser.role})
            </div>
          )}
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">Order Details</th>
              <th className="px-6 py-3 text-left">Supplier</th>
              <th className="px-6 py-3 text-left">Dates</th>
              <th className="px-6 py-3 text-left">Items</th>
              <th className="px-6 py-3 text-left">Total Amount</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                    Loading purchase orders...
                  </div>
                </td>
              </tr>
            ) : purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No purchase orders found
                  {(searchTerm || filterStatus) && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterStatus('');
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              purchaseOrders.map((po) => (
                <tr key={po._id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                        {po.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(po.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {po.supplier?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {po.supplier?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Expected:
                        </span>
                        <div className="font-medium">
                          {po.expectedDeliveryDate
                            ? new Date(
                                po.expectedDeliveryDate
                              ).toLocaleDateString()
                            : 'Not set'}
                        </div>
                      </div>
                      {po.actualDeliveryDate && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Actual:
                          </span>
                          <div className="font-medium text-green-600">
                            {new Date(
                              po.actualDeliveryDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="badge-neutral">
                      {po.items?.length || 0} items
                    </span>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium">
                        {formatCurrency(
                          po.grandTotal || po.totalAmount || 0,
                          po.currency?.code || po.currency
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {po.currency?.code || po.currency || 'USD'}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(po.status)}
                      <div className="text-xs text-gray-500">
                        {statusConfig[po.status]?.description}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {getQuickActions(po).map((action, index) => (
                        <RoleBasedButton
                          key={index}
                          disabledRoles={['MANAGER']}
                        >
                          <button
                            key={index}
                            onClick={action.action}
                            className={`p-1 rounded transition-colors ${action.color}`}
                            title={action.tooltip}
                          >
                            <action.icon className="w-4 h-4" />
                          </button>
                        </RoleBasedButton>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Order Form Modal */}
      <PurchaseOrderForm
        showModal={showModal}
        setShowModal={setShowModal}
        editingPO={editingPO}
        onSuccess={handleFormSuccess}
        suppliers={suppliers}
        supportedCurrencies={supportedCurrencies}
      />

      {/* Purchase Order Details Modal */}
      {showDetailsModal && viewingPO && (
        <PurchaseOrderDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setViewingPO(null);
          }}
          purchaseOrder={viewingPO}
          onStatusUpdate={handleStatusUpdate}
          supportedCurrencies={supportedCurrencies}
        />
      )}
    </div>
  );
};

export default PurchaseOrderManagement;
