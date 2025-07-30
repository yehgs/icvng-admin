import React, { useState, useEffect, useCallback } from 'react';
import { adminOrderAPI, getCurrentUser } from '../../utils/api';
import toast from 'react-hot-toast';

// Import all the sub-components
import OrderFilters from '../../components/order/OrderFilters';
import OrderTable from '../../components/order/OrderTable';
import CreateOrderModal from '../../components/order/CreateOrderModal';
import OrderDetailsModal from '../../components/order/OrderDetailsModal';
import OrderPagination from '../../components/order/OrderPagination';

const OrderManagement = () => {
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

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterWebsiteOrder, setFilterWebsiteOrder] = useState('');
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

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: ordersPerPage,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { orderType: filterType }),
        ...(filterMode && { orderMode: filterMode }),
        ...(filterStatus && { orderStatus: filterStatus }),
        ...(filterPaymentStatus && { paymentStatus: filterPaymentStatus }),
        ...(filterWebsiteOrder && { isWebsiteOrder: filterWebsiteOrder }),
      };

      const response = await adminOrderAPI.getOrders(params);

      if (response.success) {
        setOrders(response.data.docs || []);
        setTotalOrders(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
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
    filterWebsiteOrder,
  ]);

  // Generate invoice
  const handleGenerateInvoice = async (orderId) => {
    try {
      setLoading(true);
      const response = await adminOrderAPI.generateInvoice(orderId);

      if (response.success) {
        toast.success('Invoice generated and sent successfully');
        fetchOrders(); // Refresh to show updated invoice status
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

  const handleEditOrder = (order) => {
    // For now, just show details modal
    // You can implement edit functionality later
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCreateOrder = () => {
    setShowCreateModal(true);
  };

  const handleOrderCreated = () => {
    fetchOrders();
    setShowCreateModal(false);
  };

  const handleOrderUpdated = () => {
    fetchOrders();
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  // Effects
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [
    searchTerm,
    filterType,
    filterMode,
    filterStatus,
    filterPaymentStatus,
    filterWebsiteOrder,
  ]);

  const totalPages = Math.ceil(totalOrders / ordersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage customer orders ({totalOrders} total orders)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            Refresh
          </button>

          {currentUser?.subRole === 'SALES' && (
            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Create Order
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            ⚠️ <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <OrderFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPaymentStatus={filterPaymentStatus}
        setFilterPaymentStatus={setFilterPaymentStatus}
        filterWebsiteOrder={filterWebsiteOrder}
        setFilterWebsiteOrder={setFilterWebsiteOrder}
      />

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        loading={loading}
        currentUser={currentUser}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onGenerateInvoice={handleGenerateInvoice}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Pagination */}
      <OrderPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalOrders={totalOrders}
        ordersPerPage={ordersPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      {showCreateModal && (
        <CreateOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={handleOrderCreated}
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="h-6 w-6 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-900 dark:text-white">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
