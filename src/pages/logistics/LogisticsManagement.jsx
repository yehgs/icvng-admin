import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  MapPin,
  Truck,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  Tag,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { logisticsAPI } from '../../utils/api.js';
import LogisticsMethodModal from '../../components/logistics/LogisticsMethodModal';
import LogisticsZoneModal from '../../components/logistics/LogisticsZoneModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import ZoneDeleteModal from '../../components/logistics/ZoneDeleteModal';
import toast from 'react-hot-toast';

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [zones, setZones] = useState([]); // Paginated zones for table
  const [allZones, setAllZones] = useState([]); // ALL zones for modal dropdown
  const [methods, setMethods] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Pagination states for zones
  const [zonesPage, setZonesPage] = useState(1);
  const [zonesLimit, setZonesLimit] = useState(10);
  const [zonesTotalPages, setZonesTotalPages] = useState(1);
  const [zonesTotalCount, setZonesTotalCount] = useState(0);

  // Pagination states for methods
  const [methodsPage, setMethodsPage] = useState(1);
  const [methodsLimit, setMethodsLimit] = useState(10);
  const [methodsTotalPages, setMethodsTotalPages] = useState(1);
  const [methodsTotalCount, setMethodsTotalCount] = useState(0);

  // Modal states
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showZoneDeleteModal, setShowZoneDeleteModal] = useState(false);
  const [showMethodDeleteModal, setShowMethodDeleteModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchLogisticsData();
    fetchAllZones(); // NEW: Fetch all zones for modal dropdown
  }, []);

  // Fetch zones when pagination changes
  useEffect(() => {
    if (activeTab === 'zones') {
      fetchZones();
    }
  }, [zonesPage, zonesLimit]);

  // Fetch methods when pagination changes
  useEffect(() => {
    if (activeTab === 'methods') {
      fetchMethods();
    }
  }, [methodsPage, methodsLimit]);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      const statsRes = await logisticsAPI.getShippingDashboardStats();
      setStats(statsRes.data || {});

      // Fetch initial data for zones and methods
      await Promise.all([fetchZones(), fetchMethods()]);
    } catch (error) {
      console.error('Error fetching logistics data:', error);
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch all zones without pagination for modal dropdown
  const fetchAllZones = async () => {
    try {
      console.log('🔄 Fetching all zones for modal dropdown...');
      const zonesRes = await logisticsAPI.getAllZones({ isActive: true });
      setAllZones(zonesRes.data || []);
      console.log('✅ Fetched all zones for modal:', zonesRes.data?.length);
    } catch (error) {
      console.error('Error fetching all zones:', error);
      toast.error('Failed to load zones for dropdown');
    }
  };

  const fetchZones = async () => {
    try {
      const zonesRes = await logisticsAPI.getShippingZones({
        page: zonesPage,
        limit: zonesLimit,
      });

      setZones(zonesRes.data || []);
      setZonesTotalCount(zonesRes.totalCount || 0);
      setZonesTotalPages(zonesRes.totalPages || 1);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to load zones');
    }
  };

  const fetchMethods = async () => {
    try {
      const methodsRes = await logisticsAPI.getShippingMethods({
        page: methodsPage,
        limit: methodsLimit,
      });

      setMethods(methodsRes.data || []);
      setMethodsTotalCount(methodsRes.totalCount || 0);
      setMethodsTotalPages(methodsRes.totalPages || 1);
    } catch (error) {
      console.error('Error fetching methods:', error);
      toast.error('Failed to load methods');
    }
  };

  const handleCreateZone = async (zoneData) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.createShippingZone(zoneData);

      if (response.success) {
        toast.success('Shipping zone created successfully');
        setShowZoneModal(false);
        setSelectedZone(null);
        setZonesPage(1);
        await Promise.all([fetchZones(), fetchAllZones()]); // Refresh both lists
      } else {
        toast.error(response.message || 'Failed to create shipping zone');
      }
    } catch (error) {
      console.error('Create zone error:', error);
      toast.error(error.message || 'Failed to create shipping zone');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateZone = async (zoneData) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.updateShippingZone(
        selectedZone._id,
        zoneData
      );

      if (response.success) {
        toast.success('Shipping zone updated successfully');
        setShowZoneModal(false);
        setSelectedZone(null);
        await Promise.all([fetchZones(), fetchAllZones()]); // Refresh both lists
      } else {
        toast.error(response.message || 'Failed to update shipping zone');
      }
    } catch (error) {
      console.error('Update zone error:', error);
      toast.error(error.message || 'Failed to update shipping zone');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMethod = async (methodData) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.createShippingMethod(methodData);

      if (response.success) {
        toast.success('Shipping method created successfully');
        setShowMethodModal(false);
        setSelectedMethod(null);
        setMethodsPage(1);
        await fetchMethods();
      } else {
        toast.error(response.message || 'Failed to create shipping method');
      }
    } catch (error) {
      console.error('Create method error:', error);
      toast.error(error.message || 'Failed to create shipping method');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMethod = async (methodData) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.updateShippingMethod(
        selectedMethod._id,
        methodData
      );

      if (response.success) {
        toast.success('Shipping method updated successfully');
        setShowMethodModal(false);
        setSelectedMethod(null);
        await fetchMethods();
      } else {
        toast.error(response.message || 'Failed to update shipping method');
      }
    } catch (error) {
      console.error('Update method error:', error);
      toast.error(error.message || 'Failed to update shipping method');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (zoneId, cascadeDelete) => {
    try {
      setLoading(true);
      const response = await logisticsAPI.deleteShippingZone(
        zoneId,
        cascadeDelete
      );

      if (response.success) {
        toast.success(
          cascadeDelete
            ? 'Zone and dependent methods deleted successfully'
            : 'Shipping zone deleted successfully'
        );
        setShowZoneDeleteModal(false);
        setSelectedZone(null);
        await Promise.all([fetchZones(), fetchAllZones()]); // Refresh both lists
      } else {
        toast.error(response.message || 'Failed to delete shipping zone');
      }
    } catch (error) {
      console.error('Delete zone error:', error);
      toast.error(error.message || 'Failed to delete shipping zone');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async () => {
    try {
      setLoading(true);
      const response = await logisticsAPI.deleteShippingMethod(
        selectedMethod._id
      );

      if (response.success) {
        toast.success('Shipping method deleted successfully');
        setShowMethodDeleteModal(false);
        setSelectedMethod(null);
        await fetchMethods();
      } else {
        toast.error(response.message || 'Failed to delete shipping method');
      }
    } catch (error) {
      console.error('Delete method error:', error);
      toast.error(error.message || 'Failed to delete shipping method');
    } finally {
      setLoading(false);
    }
  };

  // Pagination controls component
  const PaginationControls = ({
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    onPageChange,
    onLimitChange,
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing {startItem} to {endItem} of {totalCount} results
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span
                      key={pageNum}
                      className="px-2 text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getAssignmentDisplay = (method) => {
    const config = method[method.type];
    if (!config) return 'All Products';

    switch (config.assignment) {
      case 'all_products':
        return 'All Products';
      case 'categories':
        return `Categories (${config.categories?.length || 0})`;
      case 'specific_products':
        return `Products (${config.products?.length || 0})`;
      default:
        return 'All Products';
    }
  };

  const getCostDisplay = (method) => {
    switch (method.type) {
      case 'flat_rate':
        if (method.flatRate?.freeShipping?.enabled) {
          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white">
                ₦{method.flatRate.cost?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Free above ₦
                {method.flatRate.freeShipping.minimumOrderAmount?.toLocaleString() ||
                  '0'}
              </div>
            </div>
          );
        }
        return (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            ₦{method.flatRate?.cost?.toLocaleString() || '0'}
          </span>
        );
      case 'table_shipping':
        const zones = method.tableShipping?.zoneRates?.length || 0;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              Zone-based
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {zones} zone{zones !== 1 ? 's' : ''} configured
            </div>
          </div>
        );
      case 'pickup':
        const locations =
          method.pickup?.locations?.filter((loc) => loc.isActive)?.length || 0;
        return (
          <div className="text-sm">
            <div className="font-medium text-green-600 dark:text-green-400">
              Free
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {locations} location{locations !== 1 ? 's' : ''}
            </div>
          </div>
        );
      default:
        return 'N/A';
    }
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Active Zones
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeZones || 0}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                {stats.totalZones || 0} total
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Shipping Methods
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeMethods || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                {stats.totalMethods || 0} configured
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                In Transit
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.inTransit || 0}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mr-1" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  Processing
                </p>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
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
                {stats.todayDeliveries || 0}
              </p>
              <div className="flex items-center mt-1">
                <Activity className="h-3 w-3 text-purple-600 dark:text-purple-400 mr-1" />
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Completed
                </p>
              </div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('zones')}
            className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
          >
            <div className="text-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Manage Zones
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure shipping zones and coverage areas
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('methods')}
            className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
          >
            <div className="text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Shipping Methods
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Setup delivery options and pricing
              </p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = '/admin/tracking')}
            className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
          >
            <div className="text-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-200">
                <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Track Orders
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor shipments and deliveries
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const ZonesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shipping Zones
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage shipping zones and coverage areas ({zonesTotalCount} zones)
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedZone(null);
            setShowZoneModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Zone
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Zone Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {zones.map((zone) => (
                <tr
                  key={zone._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {zone.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Code: {zone.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {zone.states.slice(0, 3).map((state) => (
                        <span
                          key={state.code}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full"
                        >
                          {state.name}
                        </span>
                      ))}
                      {zone.states.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                          +{zone.states.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {zone.states.length} state
                      {zone.states.length !== 1 ? 's' : ''}
                      {zone.total_lgas_covered && (
                        <span> • {zone.total_lgas_covered} LGAs</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        zone.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedZone(zone);
                          setShowZoneModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit zone"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedZone(zone);
                          setShowZoneDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete zone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {zones.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No shipping zones
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by creating your first shipping zone.
            </p>
            <button
              onClick={() => {
                setSelectedZone(null);
                setShowZoneModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Zone
            </button>
          </div>
        )}

        {zones.length > 0 && (
          <PaginationControls
            currentPage={zonesPage}
            totalPages={zonesTotalPages}
            totalCount={zonesTotalCount}
            itemsPerPage={zonesLimit}
            onPageChange={setZonesPage}
            onLimitChange={(newLimit) => {
              setZonesLimit(newLimit);
              setZonesPage(1);
            }}
          />
        )}
      </div>
    </div>
  );

  const MethodsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shipping Methods
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure delivery options and pricing ({methodsTotalCount} methods)
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMethod(null);
            setShowMethodModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Method
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Costing
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {methods.map((method) => (
                <tr
                  key={method._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {method.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {method.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getAssignmentDisplay(method) === 'All Products' ? (
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            All Products
                          </span>
                        </div>
                      ) : getAssignmentDisplay(method).startsWith(
                          'Categories'
                        ) ? (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getAssignmentDisplay(method)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getAssignmentDisplay(method)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {method.type.replace('_', ' ').toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <div>{getCostDisplay(method)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        method.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {method.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowMethodModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit method"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowMethodDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete method"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {methods.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No shipping methods
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create shipping methods to offer delivery options to customers.
            </p>
            <button
              onClick={() => {
                setSelectedMethod(null);
                setShowMethodModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Method
            </button>
          </div>
        )}

        {methods.length > 0 && (
          <PaginationControls
            currentPage={methodsPage}
            totalPages={methodsTotalPages}
            totalCount={methodsTotalCount}
            itemsPerPage={methodsLimit}
            onPageChange={setMethodsPage}
            onLimitChange={(newLimit) => {
              setMethodsLimit(newLimit);
              setMethodsPage(1);
            }}
          />
        )}
      </div>
    </div>
  );

  if (loading && zones.length === 0 && methods.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 dark:border-blue-400"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading logistics data...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Logistics Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage shipping zones, methods, and logistics configuration
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'zones', label: 'Shipping Zones', icon: MapPin },
              { id: 'methods', label: 'Shipping Methods', icon: Truck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'zones' && <ZonesTab />}
          {activeTab === 'methods' && <MethodsTab />}
        </div>
      </div>

      {/* Modals */}
      <LogisticsZoneModal
        isOpen={showZoneModal}
        onClose={() => {
          setShowZoneModal(false);
          setSelectedZone(null);
        }}
        onSubmit={selectedZone ? handleUpdateZone : handleCreateZone}
        zone={selectedZone}
        loading={loading}
      />

      <ZoneDeleteModal
        isOpen={showZoneDeleteModal}
        onClose={() => {
          setShowZoneDeleteModal(false);
          setSelectedZone(null);
        }}
        onConfirm={handleDeleteZone}
        zone={selectedZone}
        loading={loading}
      />

      <LogisticsMethodModal
        isOpen={showMethodModal}
        onClose={() => {
          setShowMethodModal(false);
          setSelectedMethod(null);
        }}
        onSubmit={selectedMethod ? handleUpdateMethod : handleCreateMethod}
        method={selectedMethod}
        zones={allZones}
        loading={loading}
      />

      <DeleteConfirmModal
        isOpen={showMethodDeleteModal}
        onClose={() => {
          setShowMethodDeleteModal(false);
          setSelectedMethod(null);
        }}
        onConfirm={handleDeleteMethod}
        title="Delete Shipping Method"
        message={`Are you sure you want to delete "${selectedMethod?.name}"? This action cannot be undone.`}
        loading={loading}
      />
    </div>
  );
};

export default LogisticsManagement;
