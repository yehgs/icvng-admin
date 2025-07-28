import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  Globe,
  Monitor,
  AlertTriangle,
  Building,
  RefreshCw,
} from 'lucide-react';
import { warehouseAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const WarehouseStatsCards = ({ systemSettings }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    onlineStock: 0,
    offlineStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    damagedItems: 0,
    refurbishedItems: 0,
    manualOverrideCount: 0,
    stockBatchCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await warehouseAPI.getStockSummary();

      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
      toast.error('Failed to load warehouse statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: loading ? '-' : stats.totalProducts,
      icon: Package,
      color: 'blue',
      description: 'Products in inventory',
    },
    {
      title: 'Total Stock',
      value: loading ? '-' : stats.totalStock.toLocaleString(),
      icon: Building,
      color: 'green',
      description: 'Units in warehouse',
    },
    {
      title: 'Online Stock',
      value: loading ? '-' : stats.onlineStock.toLocaleString(),
      icon: Globe,
      color: 'purple',
      description: 'Units for online sales',
    },
    {
      title: 'Offline Stock',
      value: loading ? '-' : stats.offlineStock.toLocaleString(),
      icon: Monitor,
      color: 'amber',
      description: 'Units for offline sales',
    },
    {
      title: 'Low Stock Items',
      value: loading ? '-' : stats.lowStockItems,
      icon: AlertTriangle,
      color: 'orange',
      alert: !loading && stats.lowStockItems > 0,
      description: `Below ${systemSettings?.lowStockThreshold || 10} units`,
    },
    {
      title: 'Out of Stock',
      value: loading ? '-' : stats.outOfStockItems,
      icon: Package,
      color: 'red',
      alert: !loading && stats.outOfStockItems > 0,
      description: 'Items with zero stock',
    },
    {
      title: 'Damaged Items',
      value: loading ? '-' : stats.damagedItems,
      icon: AlertTriangle,
      color: 'red',
      alert: !loading && stats.damagedItems > 0,
      description: 'Damaged inventory count',
    },
    {
      title: 'Manual Overrides',
      value: loading ? '-' : stats.manualOverrideCount,
      icon: RefreshCw,
      color: 'indigo',
      description: 'Warehouse manual overrides active',
    },
  ];

  const getColorClasses = (color, alert = false) => {
    if (alert) {
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200',
        value: 'text-red-900 dark:text-red-100',
      };
    }

    const colorMap = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200',
        value: 'text-blue-900 dark:text-blue-100',
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200',
        value: 'text-green-900 dark:text-green-100',
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-800 dark:text-purple-200',
        value: 'text-purple-900 dark:text-purple-100',
      },
      amber: {
        bg: 'bg-amber-100 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-800 dark:text-amber-200',
        value: 'text-amber-900 dark:text-amber-100',
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-800 dark:text-orange-200',
        value: 'text-orange-900 dark:text-orange-100',
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200',
        value: 'text-red-900 dark:text-red-100',
      },
      indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-800 dark:text-indigo-200',
        value: 'text-indigo-900 dark:text-indigo-100',
      },
    };

    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((stat, index) => {
        const colors = getColorClasses(stat.color, stat.alert);
        const StatIcon = stat.icon;

        return (
          <div
            key={index}
            className={`p-4 md:p-6 rounded-lg border ${
              stat.alert
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            } transition-all hover:shadow-md ${loading ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">
                  {stat.title}
                </p>
                <p
                  className={`text-xl md:text-2xl font-bold ${colors.value} mb-1`}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {stat.description}
                </p>
              </div>

              <div
                className={`p-2 md:p-3 rounded-lg ${colors.bg} flex-shrink-0`}
              >
                <StatIcon className={`h-5 w-5 md:h-6 md:w-6 ${colors.icon}`} />
              </div>
            </div>

            {stat.alert && !loading && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                  ⚠️ Requires attention
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WarehouseStatsCards;
