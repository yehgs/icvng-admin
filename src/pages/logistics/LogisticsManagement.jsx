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
  Download,
  Upload,
} from 'lucide-react';
import { logisticsAPI, getCurrentUser } from '../../utils/api.js';
import LogisticsMethodModal from '../../components/logistics/LogisticsMethodModal';
import LogisticsZoneModal from '../../components/logistics/LogisticsZoneModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import ZoneDeleteModal from '../../components/logistics/ZoneDeleteModal';
import LogisticsCsvImportModal from '../../components/logistics/LogisticsCsvImportModal';
import CountrySwitcher from '../../components/logistics/CountrySwitcher';
import toast from 'react-hot-toast';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const LogisticsManagement = () => {
  const { t } = useAdminTranslation();
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

  // CSV import/export modal states
  const [showZoneImportModal, setShowZoneImportModal] = useState(false);
  const [showMethodImportModal, setShowMethodImportModal] = useState(false);
  const [showRatesImportModal, setShowRatesImportModal] = useState(false);
  const [exportingZones, setExportingZones] = useState(false);
  const [exportingMethods, setExportingMethods] = useState(false);
  const [exportingRates, setExportingRates] = useState(false);
  // GLOBAL admins (IT/DIRECTOR) only — filters every fetch below to one
  // country via ?countryCode=. "" means "All Countries" (their existing
  // default). No-op server-side for COUNTRY-scoped admins, and
  // CountrySwitcher renders nothing for them anyway (see its own
  // comment) — see controllers/shipping.controller.js's
  // applyGlobalCountryFilter.
  const [countryFilter, setCountryFilter] = useState('');

  // What country a NEW zone/method should default to: the GLOBAL admin's
  // switcher selection if set, else a COUNTRY-scoped admin's own
  // assignedCountry, else Nigeria. Passed into the zone modal so its
  // dynamic states/LGA picker (see LogisticsZoneModal.jsx) fetches the
  // right country's data instead of always Nigeria's.
  const currentUser = getCurrentUser();
  const newItemCountryCode = countryFilter || currentUser?.assignedCountry || 'NG';

  useEffect(() => {
    fetchLogisticsData();
    fetchAllZones(); // NEW: Fetch all zones for modal dropdown
  }, [countryFilter]);

  // Fetch zones when pagination changes
  useEffect(() => {
    if (activeTab === 'zones') {
      fetchZones();
    }
  }, [zonesPage, zonesLimit, countryFilter]);

  // Fetch methods when pagination changes
  useEffect(() => {
    if (activeTab === 'methods') {
      fetchMethods();
    }
  }, [methodsPage, methodsLimit, countryFilter]);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      const statsRes = await logisticsAPI.getShippingDashboardStats(
        countryFilter ? { countryCode: countryFilter } : {}
      );
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
      const zonesRes = await logisticsAPI.getAllZones({
        isActive: true,
        ...(countryFilter ? { countryCode: countryFilter } : {}),
      });
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
        ...(countryFilter ? { countryCode: countryFilter } : {}),
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
        ...(countryFilter ? { countryCode: countryFilter } : {}),
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
      // For a GLOBAL admin with the country switcher set to a specific
      // country, stamp that as the new zone's country (resolveTargetCountry
      // on the server otherwise defaults to Nigeria for a GLOBAL admin
      // with no explicit countryCode — see controllers/shipping.controller.js).
      // Never overrides an explicit choice already made inside the modal.
      const payload = countryFilter && !zoneData.countryCode
        ? { ...zoneData, countryCode: countryFilter }
        : zoneData;
      const response = await logisticsAPI.createShippingZone(payload);

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
      // Same reasoning as handleCreateZone above.
      const payload = countryFilter && !methodData.countryCode
        ? { ...methodData, countryCode: countryFilter }
        : methodData;
      const response = await logisticsAPI.createShippingMethod(payload);

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

  const handleExportZonesCSV = async () => {
    try {
      setExportingZones(true);
      await logisticsAPI.exportShippingZonesCSV();
      toast.success('Shipping zones exported');
    } catch (error) {
      console.error('Export zones CSV error:', error);
      toast.error(error.message || 'Failed to export shipping zones');
    } finally {
      setExportingZones(false);
    }
  };

  const handleExportMethodsCSV = async () => {
    try {
      setExportingMethods(true);
      await logisticsAPI.exportShippingMethodsCSV();
      toast.success('Shipping methods exported');
    } catch (error) {
      console.error('Export methods CSV error:', error);
      toast.error(error.message || 'Failed to export shipping methods');
    } finally {
      setExportingMethods(false);
    }
  };

  const handleExportRatesCSV = async () => {
    try {
      setExportingRates(true);
      await logisticsAPI.exportShippingRatesCSV();
      toast.success('Shipping rates exported');
    } catch (error) {
      console.error('Export rates CSV error:', error);
      toast.error(error.message || 'Failed to export shipping rates');
    } finally {
      setExportingRates(false);
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
            {t('logistics.pagination.showing', { start: startItem, end: endItem, total: totalCount })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              {t('logistics.pagination.perPage')}
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
    if (!config) return t('logistics.methods.allProducts');

    switch (config.assignment) {
      case 'all_products':
        return t('logistics.methods.allProducts');
      case 'categories':
        return t('logistics.methods.categoriesCount', { count: config.categories?.length || 0 });
      case 'specific_products':
        return t('logistics.methods.productsCount', { count: config.products?.length || 0 });
      default:
        return t('logistics.methods.allProducts');
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
                {t('logistics.methods.freeAbove', {
                  amount: method.flatRate.freeShipping.minimumOrderAmount?.toLocaleString() || '0',
                })}
              </div>
            </div>
          );
        }
        return (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            ₦{method.flatRate?.cost?.toLocaleString() || '0'}
          </span>
        );
      case 'table_shipping': {
        const zones = method.tableShipping?.zoneRates?.length || 0;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              {t('logistics.methods.zoneBased')}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {t('logistics.methods.zonesConfigured', { count: zones })}
            </div>
          </div>
        );
      }
      case 'pickup': {
        const locations =
          method.pickup?.locations?.filter((loc) => loc.isActive)?.length || 0;
        return (
          <div className="text-sm">
            <div className="font-medium text-green-600 dark:text-green-400">
              {t('logistics.methods.free')}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('logistics.methods.locationsCount', { count: locations })}
            </div>
          </div>
        );
      }
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
                {t('logistics.dashboard.activeZones')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeZones || 0}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                {t('logistics.dashboard.totalZones', { count: stats.totalZones || 0 })}
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
                {t('logistics.dashboard.shippingMethods')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeMethods || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                {t('logistics.dashboard.methodsConfigured', { count: stats.totalMethods || 0 })}
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
                {t('logistics.dashboard.inTransit')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.inTransit || 0}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mr-1" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  {t('logistics.dashboard.processing')}
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
                {t('logistics.dashboard.deliveredToday')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.todayDeliveries || 0}
              </p>
              <div className="flex items-center mt-1">
                <Activity className="h-3 w-3 text-purple-600 dark:text-purple-400 mr-1" />
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  {t('logistics.dashboard.completed')}
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
          {t('logistics.dashboard.quickActions')}
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
                {t('logistics.dashboard.manageZones')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('logistics.dashboard.manageZonesDesc')}
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
                {t('logistics.dashboard.shippingMethodsAction')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('logistics.dashboard.shippingMethodsDesc')}
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
                {t('logistics.dashboard.trackOrders')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('logistics.dashboard.trackOrdersDesc')}
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
            {t('logistics.zones.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('logistics.zones.subtitleCount', { count: zonesTotalCount })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportZonesCSV}
            disabled={exportingZones}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {t('logistics.zones.exportCsv')}
          </button>
          <button
            onClick={() => setShowZoneImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t('logistics.zones.importCsv')}
          </button>
          <button
            onClick={() => {
              setSelectedZone(null);
              setShowZoneModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('logistics.zones.addZone')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.zones.colZoneInfo')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.zones.colCoverage')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.zones.colStatus')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.zones.colActions')}
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
                          {t('logistics.zones.code')} {zone.code}
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
                          {t('logistics.zones.moreStates', { count: zone.states.length - 3 })}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('logistics.zones.state', { count: zone.states.length })}
                      {zone.total_lgas_covered && (
                        <span> • {t('logistics.zones.lgasCovered', { count: zone.total_lgas_covered })}</span>
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
                      {zone.isActive ? t('logistics.zones.active') : t('logistics.zones.inactive')}
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
                        title={t('logistics.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedZone(zone);
                          setShowZoneDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title={t('logistics.delete')}
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
              {t('logistics.zones.empty')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('logistics.zones.emptyDesc')}
            </p>
            <button
              onClick={() => {
                setSelectedZone(null);
                setShowZoneModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('logistics.zones.createZone')}
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
            {t('logistics.methods.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('logistics.methods.subtitleCount', { count: methodsTotalCount })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMethodsCSV}
            disabled={exportingMethods}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {t('logistics.methods.exportCsv')}
          </button>
          <button
            onClick={() => setShowMethodImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t('logistics.methods.importCsv')}
          </button>
          <button
            onClick={handleExportRatesCSV}
            disabled={exportingRates}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Bulk-edit flat rate zone costs, table shipping weight bands, and pickup locations"
          >
            <Download className="h-4 w-4" />
            {t('logistics.methods.exportRatesCsv')}
          </button>
          <button
            onClick={() => setShowRatesImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {t('logistics.methods.importRatesCsv')}
          </button>
          <button
            onClick={() => {
              setSelectedMethod(null);
              setShowMethodModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('logistics.methods.addMethod')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.methods.colMethod')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.methods.colAssignment')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.methods.colCosting')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.methods.colStatus')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('logistics.methods.colActions')}
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
                      {(() => {
                        // Was comparing against getAssignmentDisplay(method)'s
                        // translated string ('All Products'/'Categories...') —
                        // broke as soon as that started returning French/
                        // Italian text. Compare the raw assignment value
                        // instead; only the label shown is translated.
                        const assignment = method[method.type]?.assignment;
                        if (!assignment || assignment === 'all_products') {
                          return (
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {t('logistics.methods.allProducts')}
                              </span>
                            </div>
                          );
                        }
                        if (assignment === 'categories') {
                          return (
                            <div className="flex items-center gap-1">
                              <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {getAssignmentDisplay(method)}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {getAssignmentDisplay(method)}
                            </span>
                          </div>
                        );
                      })()}
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
                      {method.isActive ? t('logistics.methods.active') : t('logistics.methods.inactive')}
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
                        title={t('logistics.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowMethodDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title={t('logistics.delete')}
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
              {t('logistics.methods.empty')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('logistics.methods.emptyDesc')}
            </p>
            <button
              onClick={() => {
                setSelectedMethod(null);
                setShowMethodModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('logistics.methods.createMethod')}
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
            {t('logistics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('logistics.subtitle')}
          </p>
        </div>
        {/* GLOBAL admins (IT/DIRECTOR) only — renders nothing for
            COUNTRY-scoped admins, see CountrySwitcher's own comment. */}
        <CountrySwitcher value={countryFilter} onChange={setCountryFilter} />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: t('logistics.tabs.dashboard'), icon: BarChart3 },
              { id: 'zones', label: t('logistics.tabs.zones'), icon: MapPin },
              { id: 'methods', label: t('logistics.tabs.methods'), icon: Truck },
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
        countryCode={selectedZone?.countryCode || newItemCountryCode}
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

      {/* CSV Import - Shipping Zones */}
      <LogisticsCsvImportModal
        isOpen={showZoneImportModal}
        onClose={() => setShowZoneImportModal(false)}
        entityLabel="Shipping Zones"
        onExport={() => logisticsAPI.exportShippingZonesCSV()}
        onImport={(csvData) => logisticsAPI.importShippingZonesCSV({ csvData })}
        onImportSuccess={async () => {
          setZonesPage(1);
          await Promise.all([fetchZones(), fetchAllZones(), fetchLogisticsData()]);
        }}
        formatGuide={
          <div className="text-sm space-y-2">
            <div className="text-gray-700 dark:text-gray-300">
              One row per zone. Columns:
            </div>
            <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
              Zone Code, Zone Name, Description, Zone Type (urban/rural/mixed),
              Priority (low/medium/high), Active (TRUE/FALSE), Sort Order,
              Operational Notes, States Coverage
            </div>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                • <strong>States Coverage</strong> packs every state into one
                cell:{' '}
                <code className="text-xs">StateName:all</code> for full state
                coverage, or{' '}
                <code className="text-xs">
                  StateName:specific[LGA One|LGA Two]
                </code>{' '}
                for selected LGAs only. Separate multiple states with{' '}
                <code className="text-xs">;</code>
              </div>
              <div>• Leave Zone Code blank on new rows - it auto-generates.</div>
            </div>
            <div className="mt-2 text-gray-700 dark:text-gray-300 font-medium">
              Example States Coverage cell:
            </div>
            <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border leading-5 overflow-x-auto whitespace-pre">
              {`Lagos:all;Ogun:specific[Abeokuta North|Ijebu Ode];Oyo:all`}
            </div>
          </div>
        }
      />

      {/* CSV Import - Shipping Methods */}
      <LogisticsCsvImportModal
        isOpen={showMethodImportModal}
        onClose={() => setShowMethodImportModal(false)}
        entityLabel="Shipping Methods"
        onExport={() => logisticsAPI.exportShippingMethodsCSV()}
        onImport={(csvData) => logisticsAPI.importShippingMethodsCSV({ csvData })}
        onImportSuccess={async () => {
          setMethodsPage(1);
          await Promise.all([fetchMethods(), fetchLogisticsData()]);
        }}
        formatGuide={
          <div className="text-sm space-y-2">
            <div className="text-gray-700 dark:text-gray-300">
              One row per method. Core columns:
            </div>
            <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
              Method Code, Method Name, Description, Type (flat_rate /
              table_shipping / pickup), Active, Sort Order, Min Delivery Days,
              Max Delivery Days, Assignment (all_products/categories/
              specific_products), Categories, Products
            </div>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                • <strong>Categories</strong>/<strong>Products</strong> use
                category slug / product SKU, separated by{' '}
                <code className="text-xs">|</code> - only needed when
                Assignment matches.
              </div>
              <div>
                • Only fill the columns for the row's <strong>Type</strong>;
                leave the others blank.
              </div>
              <div>
                • Zones are referenced by their <strong>Zone Code</strong>{' '}
                (create zones first via the Zones tab or CSV).
              </div>
            </div>
            <div className="mt-2 text-gray-700 dark:text-gray-300 font-medium">
              Type-specific columns & examples:
            </div>
            <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border leading-5 overflow-x-auto whitespace-pre">
              {`flat_rate:
  Flat Rate Default Cost: 1500
  Flat Rate Zone Rates:  LAG:1500;ABJ:2000
  Free Shipping Enabled: TRUE
  Free Shipping Min Order: 50000

table_shipping (minWeight^maxWeight^cost, "|" between ranges):
  Table Shipping Zone Rates: LAG:[0^5^1500|5^20^2500];ABJ:[0^5^2000]

pickup (name^address^city^state^lga^phone, "|" between locations):
  Pickup Cost: 0
  Pickup Default Locations: Ikeja Store^12 Allen Ave^Ikeja^Lagos^Ikeja^08012345678
  Pickup Zone Locations: LAG:[Ikeja Store^12 Allen Ave^Ikeja^Lagos^Ikeja^0801...]`}
            </div>
          </div>
        }
      />

      {/* CSV Import - Shipping Rates (flat_rate zone costs / table_shipping weight bands / pickup locations) */}
      <LogisticsCsvImportModal
        isOpen={showRatesImportModal}
        onClose={() => setShowRatesImportModal(false)}
        entityLabel="Shipping Rates"
        onExport={() => logisticsAPI.exportShippingRatesCSV()}
        onImport={(csvData) => logisticsAPI.importShippingRatesCSV({ csvData })}
        onImportSuccess={async () => {
          await Promise.all([fetchMethods(), fetchLogisticsData()]);
        }}
        formatGuide={
          <div className="text-sm space-y-2">
            <div className="text-gray-700 dark:text-gray-300">
              One row per rate (no packed cells) - much easier to bulk-edit
              in Excel/Sheets than the Methods CSV. This only updates{' '}
              <strong>existing</strong> methods (matched by Method Code) -
              create the method first via the Methods tab or Methods CSV.
            </div>
            <div className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border break-all">
              Method Code, Method Name, Type, Zone Code, Zone Name, Min
              Weight, Max Weight, Cost, Location Name, Address, City, State,
              LGA, Phone
            </div>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                • <strong>flat_rate</strong>: one row with Zone Code blank =
                the default/base cost. One row per zone override with Zone
                Code filled in and Cost set (Min/Max Weight, location columns
                unused).
              </div>
              <div>
                • <strong>table_shipping</strong>: one row per Zone Code +
                Min Weight + Max Weight + Cost. Zone Code is required on
                every row.
              </div>
              <div>
                • <strong>pickup</strong>: one row per location - Zone Code
                blank means it's a default location (available everywhere);
                filled in means it's scoped to that zone. Cost here sets the
                method's overall pickup cost.
              </div>
              <div className="text-yellow-700 dark:text-yellow-400">
                • Important: for any Method Code present in the file, ALL of
                its rows become the complete new rate/location table for
                that method - rows you remove are removed from the method
                too. Methods with no rows in the file are left untouched.
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default LogisticsManagement;
