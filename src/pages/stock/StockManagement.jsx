// Update your main StockManagement.jsx to use StockIntakeModal instead of CreateBatchModal

import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Plus,
  BarChart3,
  Warehouse,
  ArrowUpDown,
  RefreshCw,
  Globe,
  Monitor,
} from 'lucide-react';
import toast from 'react-hot-toast';
import StockOverview from '../../components/stock/StockOverview';
import BatchList from '../../components/stock/BatchList';
import StockDistribution from '../../components/stock/StockDistribution';
import ExpiryManagement from '../../components/stock/ExpiryManagement';
import StockIntakeModal from '../../components/stock/StockIntakeModal';
import RoleBasedAccess from '../../components/layout/RoleBaseAccess';
import { stockAPI } from '../../utils/api';
import { getCurrentUser } from '../../utils/api';

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stockSummary, setStockSummary] = useState([]);
  const [batches, setBatches] = useState([]);
  const [expiringBatches, setExpiringBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    qualityStatus: '',
    distributionStatus: '',
    product: '',
    supplier: '',
  });

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStockSummary();
      fetchExpiringBatches();
    } else if (activeTab === 'batches' || activeTab === 'distribution') {
      fetchBatches();
    }
  }, [activeTab, searchTerm, filters]);

  const fetchStockSummary = async () => {
    setLoading(true);
    try {
      const data = await stockAPI.getStockSummary();
      if (data.success) {
        setStockSummary(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch stock summary');
      }
    } catch (error) {
      console.error('Error fetching stock summary:', error);
      toast.error('Failed to fetch stock summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await stockAPI.getStockBatches({
        search: searchTerm,
        ...filters,
      });

      if (data.success) {
        setBatches(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringBatches = async () => {
    try {
      const data = await stockAPI.getExpiringBatches(30);
      if (data.success) {
        setExpiringBatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching expiring batches:', error);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'overview') {
      fetchStockSummary();
      fetchExpiringBatches();
    } else if (activeTab === 'batches' || activeTab === 'distribution') {
      fetchBatches();
    }
  };

  const tabs = [
    {
      id: 'overview',
      name: 'Stock Overview',
      icon: BarChart3,
      count: stockSummary.length,
    },
    {
      id: 'batches',
      name: 'Stock Batches',
      icon: Package,
      count: batches.length,
    },
    {
      id: 'distribution',
      name: 'Stock Distribution',
      icon: ArrowUpDown,
      count: batches.filter(
        (b) =>
          b.qualityStatus === 'COMPLETED' &&
          (b.distributionStatus === 'PENDING' ||
            b.distributionStatus === 'AWAITING_APPROVAL')
      ).length,
    },
    {
      id: 'expiry',
      name: 'Expiry Management',
      icon: AlertTriangle,
      count: expiringBatches.length,
      alert: expiringBatches.length > 0,
    },
  ];

  const getStockOverviewStats = () => {
    const totalProducts = stockSummary.length;
    const totalStock = stockSummary.reduce(
      (sum, item) => sum + item.totalQuantity,
      0
    );
    const onlineStock = stockSummary.reduce(
      (sum, item) => sum + item.onlineStock,
      0
    );
    const offlineStock = stockSummary.reduce(
      (sum, item) => sum + item.offlineStock,
      0
    );

    return [
      {
        title: 'Total Products',
        value: totalProducts,
        icon: Package,
        color: 'blue',
        change: '+12%',
        changeType: 'positive',
      },
      {
        title: 'Total Stock',
        value: totalStock.toLocaleString(),
        icon: Warehouse,
        color: 'green',
        change: '+8%',
        changeType: 'positive',
      },
      {
        title: 'Online Stock',
        value: onlineStock.toLocaleString(),
        icon: Globe,
        color: 'purple',
        change: '+15%',
        changeType: 'positive',
      },
      {
        title: 'Offline Stock',
        value: offlineStock.toLocaleString(),
        icon: Monitor,
        color: 'amber',
        change: '-3%',
        changeType: 'negative',
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Stock Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive stock intake, quality control, and distribution system
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Only Warehouse, Director, IT, Manager can do stock intake */}
          <RoleBasedAccess allowedRoles={['WAREHOUSE', 'DIRECTOR', 'IT']}>
            <button
              onClick={() => setShowIntakeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Stock Intake
            </button>
          </RoleBasedAccess>
        </div>
      </div>

      {/* Quick Stats - Only show on overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStockOverviewStats().map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      vs last month
                    </span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}
                >
                  <stat.icon
                    className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      tab.alert
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <StockOverview
              stockSummary={stockSummary}
              expiringBatches={expiringBatches}
              loading={loading}
            />
          )}

          {activeTab === 'batches' && (
            <BatchList
              batches={batches}
              loading={loading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={fetchBatches}
            />
          )}

          {activeTab === 'distribution' && (
            <RoleBasedAccess allowedRoles={['DIRECTOR', 'IT', 'WAREHOUSE']}>
              <StockDistribution
                batches={batches}
                loading={loading}
                onRefresh={fetchBatches}
                currentUser={currentUser}
              />
            </RoleBasedAccess>
          )}

          {activeTab === 'expiry' && (
            <ExpiryManagement
              expiringBatches={expiringBatches}
              loading={loading}
              onRefresh={fetchExpiringBatches}
            />
          )}
        </div>
      </div>

      {/* Stock Intake Modal */}
      {showIntakeModal && (
        <StockIntakeModal
          isOpen={showIntakeModal}
          onClose={() => setShowIntakeModal(false)}
          onSuccess={() => {
            setShowIntakeModal(false);
            handleRefresh();
            toast.success('Stock intake completed successfully!');
          }}
        />
      )}
    </div>
  );
};

export default StockManagement;
