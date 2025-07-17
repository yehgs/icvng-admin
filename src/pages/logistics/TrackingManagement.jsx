import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  Clock,
  MapPin,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  Navigation,
  TrendingUp,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { logisticsAPI } from '../../utils/api.js';
import CreateShipmentModal from '../../components/logistics/CreateShipmentModal.jsx';
import UpdateTrackingModal from '../../components/logistics/UpdateTrackingModal';
import TrackingDetailsModal from '../../components/logistics/TrackingDetailsModal';
import toast from 'react-hot-toast';

const TrackingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [trackings, setTrackings] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTrackings();
    fetchStats();
  }, [
    currentPage,
    statusFilter,
    carrierFilter,
    priorityFilter,
    overdueFilter,
    searchTerm,
  ]);

  const fetchTrackings = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(carrierFilter && { carrier: carrierFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(overdueFilter && { overdue: 'true' }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await logisticsAPI.getAllTrackings(params);
      if (response.success) {
        setTrackings(response.data);
        setTotalPages(response.totalPages);
        setTotalCount(response.totalCount);
      }
    } catch (error) {
      toast.error('Failed to load tracking data');
      console.error('Error fetching trackings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await logisticsAPI.getTrackingStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateShipment = async (shipmentData) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.createShipment(shipmentData);
      if (response.success) {
        toast.success('Shipment created successfully');
        fetchTrackings();
        fetchStats();
        setShowCreateModal(false);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async (updateData) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.updateTracking(
        selectedTracking._id,
        updateData
      );
      if (response.success) {
        toast.success('Tracking updated successfully');
        fetchTrackings();
        fetchStats();
        setShowUpdateModal(false);
        setSelectedTracking(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update tracking');
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (tracking) => {
    setSelectedTracking(tracking);
    setShowUpdateModal(true);
  };

  const openDetailsModal = (tracking) => {
    setSelectedTracking(tracking);
    setShowDetailsModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowUpdateModal(false);
    setShowDetailsModal(false);
    setSelectedTracking(null);
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: Clock,
      PROCESSING: Package,
      PICKED_UP: Truck,
      IN_TRANSIT: Truck,
      OUT_FOR_DELIVERY: MapPin,
      DELIVERED: CheckCircle,
      ATTEMPTED: AlertTriangle,
      RETURNED: XCircle,
      LOST: XCircle,
      CANCELLED: XCircle,
    };
    return icons[status] || Package;
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING:
        'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300',
      PROCESSING:
        'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
      PICKED_UP:
        'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300',
      IN_TRANSIT:
        'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300',
      OUT_FOR_DELIVERY:
        'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300',
      DELIVERED:
        'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300',
      ATTEMPTED:
        'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300',
      RETURNED: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
      LOST: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
      CANCELLED:
        'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      colors[status] ||
      'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
      NORMAL:
        'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
      HIGH: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300',
      URGENT: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      colors[priority] ||
      'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCarrierFilter('');
    setPriorityFilter('');
    setOverdueFilter(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter ||
    carrierFilter ||
    priorityFilter ||
    overdueFilter;

  // Format stats for display
  const statusStats = stats.statusBreakdown || [];
  const totalStatusCount = statusStats.reduce(
    (sum, stat) => sum + stat.count,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tracking Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage shipments and track deliveries ({totalCount.toLocaleString()}{' '}
            total shipments)
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Shipment
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Shipments
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalStatusCount.toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400 mr-1" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  All time
                </p>
              </div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Delivered Today
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(stats.todayDeliveries || 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <Activity className="h-3 w-3 text-green-600 dark:text-green-400 mr-1" />
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Today
                </p>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Overdue
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {(stats.overdue || 0).toLocaleString()}
              </p>
              <div className="flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 mr-1" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Requires attention
                </p>
              </div>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Avg Delivery
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.avgDeliveryTime || 0)}
              </p>
              <div className="flex items-center mt-1">
                <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400 mr-1" />
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Days
                </p>
              </div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Filters & Search
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by tracking number, order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="ATTEMPTED">Attempted</option>
              <option value="RETURNED">Returned</option>
              <option value="LOST">Lost</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Carrier
            </label>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="">All Carriers</option>
              <option value="DHL">DHL</option>
              <option value="FEDEX">FedEx</option>
              <option value="UPS">UPS</option>
              <option value="ARAMEX">Aramex</option>
              <option value="GIG">GIG Logistics</option>
              <option value="SPEEDAF">Speedaf</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={overdueFilter}
                onChange={(e) => setOverdueFilter(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                Overdue only
              </span>
            </label>
          </div>
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
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                  Status: {statusFilter.replace('_', ' ')}
                  <button
                    onClick={() => setStatusFilter('')}
                    className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              {carrierFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                  Carrier: {carrierFilter}
                  <button
                    onClick={() => setCarrierFilter('')}
                    className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              {priorityFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
                  Priority: {priorityFilter}
                  <button
                    onClick={() => setPriorityFilter('')}
                    className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}

              {overdueFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                  Overdue only
                  <button
                    onClick={() => setOverdueFilter(false)}
                    className="ml-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tracking Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading shipments...
            </span>
          </div>
        ) : trackings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No shipments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search filters or create a new shipment.'
                : 'Get started by creating your first shipment.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Shipment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tracking Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {trackings.map((tracking) => {
                  const StatusIcon = getStatusIcon(tracking.status);
                  const isOverdue =
                    tracking.estimatedDelivery &&
                    new Date() > new Date(tracking.estimatedDelivery) &&
                    !tracking.actualDelivery &&
                    !['DELIVERED', 'RETURNED', 'LOST', 'CANCELLED'].includes(
                      tracking.status
                    );

                  return (
                    <tr
                      key={tracking._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {tracking.trackingNumber}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {tracking.carrier.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                                  tracking.priority
                                )}`}
                              >
                                {tracking.priority}
                              </span>
                              {isOverdue && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tracking.orderId?.orderId || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ₦
                            {tracking.orderId?.totalAmt?.toLocaleString() ||
                              '0'}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {tracking.shippingMethod?.name}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon
                            className={`w-4 h-4 mr-2 ${
                              getStatusColor(tracking.status).split(' ')[0]
                            }`}
                          />
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                              tracking.status
                            )}`}
                          >
                            {tracking.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {tracking.trackingEvents.length} update
                          {tracking.trackingEvents.length !== 1 ? 's' : ''}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tracking.recipientInfo.name}
                          </div>
                          {tracking.recipientInfo.phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {tracking.recipientInfo.phone}
                            </div>
                          )}
                          {tracking.deliveryAddress.city && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {tracking.deliveryAddress.city},{' '}
                              {tracking.deliveryAddress.state}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {tracking.estimatedDelivery && (
                            <div className="text-sm text-gray-900 dark:text-white flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(
                                tracking.estimatedDelivery
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {tracking.actualDelivery && (
                            <div className="text-sm text-green-600 dark:text-green-400">
                              Delivered:{' '}
                              {new Date(
                                tracking.actualDelivery
                              ).toLocaleDateString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Weight: {tracking.packageInfo.weight}kg
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailsModal(tracking)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openUpdateModal(tracking)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                            title="Update tracking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              {/* Mobile pagination */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(currentPage + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * 10 + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, totalCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">
                      {totalCount.toLocaleString()}
                    </span>{' '}
                    results
                  </p>
                </div>

                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(currentPage - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
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
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateShipmentModal
          isOpen={showCreateModal}
          onClose={closeModals}
          onSubmit={handleCreateShipment}
          loading={loading}
        />
      )}

      {showUpdateModal && selectedTracking && (
        <UpdateTrackingModal
          isOpen={showUpdateModal}
          onClose={closeModals}
          onSubmit={handleUpdateTracking}
          tracking={selectedTracking}
          loading={loading}
        />
      )}

      {showDetailsModal && selectedTracking && (
        <TrackingDetailsModal
          isOpen={showDetailsModal}
          onClose={closeModals}
          tracking={selectedTracking}
        />
      )}
    </div>
  );
};

export default TrackingManagement;
