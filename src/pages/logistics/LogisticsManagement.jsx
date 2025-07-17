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
} from 'lucide-react';
import { logisticsAPI } from '../../utils/api.js';
import LogisticsMethodModal from '../../components/logistics/LogisticsMethodModal';
import LogisticsZoneModal from '../../components/logistics/LogisticsZoneModal';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import toast from 'react-hot-toast';

const LogisticsManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [zones, setZones] = useState([]);
  const [methods, setMethods] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      const [zonesRes, methodsRes, statsRes] = await Promise.all([
        logisticsAPI.getShippingZones(),
        logisticsAPI.getShippingMethods(),
        logisticsAPI.getTrackingStats(),
      ]);

      setZones(zonesRes.data || []);
      setMethods(methodsRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error fetching logistics data:', error);
      toast.error('Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (zoneData) => {
    try {
      await logisticsAPI.createShippingZone(zoneData);
      toast.success('Shipping zone created successfully');
      setShowZoneModal(false);
      fetchLogisticsData();
    } catch (error) {
      toast.error('Failed to create shipping zone');
    }
  };

  const handleUpdateZone = async (zoneData) => {
    try {
      await logisticsAPI.updateShippingZone(selectedItem._id, zoneData);
      toast.success('Shipping zone updated successfully');
      setShowZoneModal(false);
      fetchLogisticsData();
    } catch (error) {
      toast.error('Failed to update shipping zone');
    }
  };

  const handleCreateMethod = async (methodData) => {
    try {
      await logisticsAPI.createShippingMethod(methodData);
      toast.success('Shipping method created successfully');
      setShowMethodModal(false);
      fetchLogisticsData();
    } catch (error) {
      toast.error('Failed to create shipping method');
    }
  };

  const handleUpdateMethod = async (methodData) => {
    try {
      await logisticsAPI.updateShippingMethod(selectedItem._id, methodData);
      toast.success('Shipping method updated successfully');
      setShowMethodModal(false);
      fetchLogisticsData();
    } catch (error) {
      toast.error('Failed to update shipping method');
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteType === 'zone') {
        await logisticsAPI.deleteShippingZone(selectedItem._id);
        toast.success('Shipping zone deleted successfully');
      } else if (deleteType === 'method') {
        await logisticsAPI.deleteShippingMethod(selectedItem._id);
        toast.success('Shipping method deleted successfully');
      }
      setShowDeleteModal(false);
      fetchLogisticsData();
    } catch (error) {
      toast.error(`Failed to delete ${deleteType}`);
    }
  };

  // Helper function to get assignment display text
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

  // Helper function to get cost display
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
                {zones.filter((z) => z.isActive).length}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                {zones.length} total
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
                {methods.filter((m) => m.isActive).length}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                {methods.length} configured
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
            Manage shipping zones and coverage areas ({zones.length} zones)
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedItem(null);
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
                          setSelectedItem(zone);
                          setShowZoneModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit zone"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(zone);
                          setDeleteType('zone');
                          setShowDeleteModal(true);
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
                setSelectedItem(null);
                setShowZoneModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Zone
            </button>
          </div>
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
            Configure delivery options and pricing ({methods.length} methods)
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedItem(null);
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
                          setSelectedItem(method);
                          setShowMethodModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit method"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(method);
                          setDeleteType('method');
                          setShowDeleteModal(true);
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
                setSelectedItem(null);
                setShowMethodModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Method
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
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
        onClose={() => setShowZoneModal(false)}
        onSubmit={selectedItem ? handleUpdateZone : handleCreateZone}
        zone={selectedItem}
        loading={loading}
      />

      <LogisticsMethodModal
        isOpen={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        onSubmit={selectedItem ? handleUpdateMethod : handleCreateMethod}
        method={selectedItem}
        zones={zones}
        loading={loading}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${
          deleteType === 'zone' ? 'Shipping Zone' : 'Shipping Method'
        }`}
        message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        loading={loading}
      />
    </div>
  );
};

export default LogisticsManagement;
