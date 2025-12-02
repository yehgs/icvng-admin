// icvng-admin/src/pages/order/OfflineOrderManagement.jsx
// FIXED: Added timeout protection to prevent infinite loader
import React, { useState, useEffect, useCallback } from 'react';
import { adminOrderAPI, getCurrentUser } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  Package,
  RefreshCw,
  Plus,
  Search,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  User,
  Calendar,
  DollarSign,
  Eye,
  FileText,
} from 'lucide-react';

// Import sub-components
import CreateOrderModal from '../../components/order/CreateOrderModal';
import OrderDetailsModal from '../../components/order/OrderDetailsModal';

const OfflineOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filters - specifically for offline orders
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const currentUser = getCurrentUser();

  // Helper functions
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
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
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      RETURNED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      PENDING:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      PARTIAL:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Check if user can create orders
  const canCreateOrder = () => {
    if (!currentUser || !currentUser.subRole) return false;
    return ['SALES', 'EDITOR', 'IT', 'MANAGER', 'DIRECTOR'].includes(
      currentUser.subRole
    );
  };

  // Get user's role display text
  const getUserRoleInfo = () => {
    if (!currentUser || !currentUser.subRole) return 'Unknown Role';

    const roleInfo = {
      SALES: 'Sales Agent',
      EDITOR: 'Editor',
      MANAGER: 'Manager',
      DIRECTOR: 'Director',
      IT: 'IT Administrator',
    };

    return roleInfo[currentUser.subRole] || currentUser.subRole;
  };

  // Check if user has full access (can see all orders)
  const hasFullAccess = () => {
    if (!currentUser || !currentUser.subRole) return false;
    return ['IT', 'MANAGER', 'DIRECTOR'].includes(currentUser.subRole);
  };

  // Fetch orders - OFFLINE ONLY (isWebsiteOrder = false) with role-based filtering
  const fetchOrders = useCallback(async () => {
    // 🔥 FIX: Get currentUser inside function to avoid infinite loop
    const user = getCurrentUser();

    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: ordersPerPage,
        sortBy,
        sortOrder,
        isWebsiteOrder: 'false', // CRITICAL: Only offline orders
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { orderType: filterType }),
        ...(filterMode && { orderMode: filterMode }),
        ...(filterStatus && { orderStatus: filterStatus }),
        ...(filterPaymentStatus && { paymentStatus: filterPaymentStatus }),
      };

      // Role-based filtering
      // IT, MANAGER, DIRECTOR see all offline orders
      // SALES and EDITOR only see orders they created
      if (user?.subRole && ['SALES', 'EDITOR'].includes(user.subRole)) {
        params.createdBy = user._id || user.id;
      }

      console.log('Fetching orders with params:', params);
      console.log('Current user role:', user?.subRole);

      // 🔥 FIX: Add 30-second timeout protection
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Request timeout. Server is not responding. Please check if MongoDB is connected.'
              )
            ),
          30000
        )
      );

      const apiPromise = adminOrderAPI.getOrders(params);
      const response = await Promise.race([apiPromise, timeoutPromise]);

      if (response.success) {
        setOrders(response.data.docs || []);
        setTotalOrders(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);

      // 🔥 FIX: Better error messages
      let errorMessage = 'Failed to load orders';

      if (
        error.message.includes('timeout') ||
        error.message.includes('not responding')
      ) {
        errorMessage =
          'Server is not responding. Please check if MongoDB is connected and backend is running.';
      } else if (
        error.message.includes('Network error') ||
        error.message.includes('fetch')
      ) {
        errorMessage =
          'Cannot connect to server. Please check if the backend server is running.';
      } else if (
        error.message.includes('Session expired') ||
        error.message.includes('401')
      ) {
        errorMessage = 'Your session has expired. Please login again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false); // 🔥 FIX: ALWAYS stop loading
    }
  }, [
    currentPage,
    ordersPerPage,
    sortBy,
    sortOrder,
    searchTerm,
    filterType,
    filterMode,
    filterStatus,
    filterPaymentStatus,
    // 🔥 FIX: Removed currentUser from dependencies to prevent infinite loop
  ]);

  // Generate invoice
  const handleGenerateInvoice = async (orderId) => {
    try {
      setLoading(true);
      const response = await adminOrderAPI.generateInvoice(orderId);

      if (response.success) {
        toast.success('Invoice generated successfully');
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  // Order handlers
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCreateOrder = () => {
    if (!canCreateOrder()) {
      toast.error('You do not have permission to create orders');
      return;
    }
    setShowCreateModal(true);
  };

  const handleOrderCreated = () => {
    toast.success('Order created successfully!');
    fetchOrders();
    setShowCreateModal(false);
  };

  const handleOrderUpdated = () => {
    toast.success('Order updated successfully!');
    fetchOrders();
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterMode('');
    setFilterStatus('');
    setFilterPaymentStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    filterType ||
    filterMode ||
    filterStatus ||
    filterPaymentStatus;

  // Effects
  // 🔥 FIX: Only trigger on pagination/sort changes
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, ordersPerPage, sortBy, sortOrder]);

  // 🔥 FIX: Debounce filter changes separately
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchOrders();
      } else {
        setCurrentPage(1); // Will trigger the above useEffect
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, filterMode, filterStatus, filterPaymentStatus]);

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manual Online/Offline Orders
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {hasFullAccess()
              ? `All manual/sales orders (${totalOrders.toLocaleString()} total)`
              : `Your orders as ${getUserRoleInfo()} (${totalOrders.toLocaleString()} total)`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {canCreateOrder() && (
            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Order
            </button>
          )}
        </div>
      </div>

      {/* Role-based access notice */}
      {!hasFullAccess() && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                Limited Access View
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                As a {getUserRoleInfo()}, you can only see orders you created.
                You can create new orders using the "Create Order" button above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Filters & Search
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order ID, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Order Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="BTC">BTC</option>
            <option value="BTB">BTB</option>
          </select>

          {/* Order Mode */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Modes</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Order Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Payment Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Active filters:
              </span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                  Type: {filterType}
                  <button
                    onClick={() => setFilterType('')}
                    className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterMode && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  Mode: {filterMode}
                  <button
                    onClick={() => setFilterMode('')}
                    className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterStatus && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
                  Status: {filterStatus}
                  <button
                    onClick={() => setFilterStatus('')}
                    className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterPaymentStatus && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium">
                  Payment: {filterPaymentStatus}
                  <button
                    onClick={() => setFilterPaymentStatus('')}
                    className="ml-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type & Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Loading orders...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {hasActiveFilters
                          ? 'No orders found matching your filters'
                          : hasFullAccess()
                          ? 'No offline orders found'
                          : "You haven't created any orders yet"}
                      </p>
                      {canCreateOrder() && !hasActiveFilters && (
                        <button
                          onClick={handleCreateOrder}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Create Your First Order
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.orderId}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {order.customerId?.customerType === 'BTB' ? (
                            <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.customerId?.displayName ||
                              order.customerId?.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {order.customerId?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.orderType === 'BTB'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }`}
                        >
                          {order.orderType}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.orderMode === 'ONLINE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {order.orderMode}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(order.totalAmt)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.quantity || 1} items
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.order_status
                          )}`}
                        >
                          {order.order_status}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.createdBy?.name || 'Unknown'}
                      </div>
                      {order.invoiceGenerated && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {order.invoiceNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {canCreateOrder() && !order.invoiceGenerated && (
                          <button
                            onClick={() => handleGenerateInvoice(order._id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Generate invoice"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * ordersPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ordersPerPage, totalOrders)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">
                    {totalOrders.toLocaleString()}
                  </span>{' '}
                  results
                </p>
              </div>

              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(currentPage + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleOrderCreated}
        />
      )}

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={handleCloseDetailsModal}
          onUpdate={handleOrderUpdated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default OfflineOrderManagement;
