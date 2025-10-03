import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Loader2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exchangeRateAPI, pricingAPI } from '../../utils/api';
import RoleBasedAccess from '../../components/layout/RoleBaseAccess';

const PricingUtilities = () => {
  const [exchangeRates, setExchangeRates] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [bulkUpdateCurrency, setBulkUpdateCurrency] = useState('');

  useEffect(() => {
    fetchExchangeRates();
    fetchPricingConfig();
    fetchSupportedCurrencies();
  }, []);

  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const data = await exchangeRateAPI.getExchangeRates();
      if (data.success) {
        setExchangeRates(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch exchange rates');
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error('Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingConfig = async () => {
    try {
      const data = await pricingAPI.getPricingConfig();
      if (data.success) {
        setPricingConfig(data.data);
      } else {
        console.error('Failed to fetch pricing config:', data.message);
      }
    } catch (error) {
      console.error('Error fetching pricing config:', error);
    }
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const data = await exchangeRateAPI.getSupportedCurrencies();
      if (data.success) {
        setCurrencies(data.data);
      } else {
        console.error('Failed to fetch currencies:', data.message);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleFetchLatestRates = async () => {
    setUpdating(true);
    try {
      const data = await exchangeRateAPI.fetchRatesFromAPI({
        baseCurrency: 'USD',
        provider: 'exchangerate.host',
      });

      if (data.success) {
        toast.success(data.message);
        setLastUpdateInfo({
          timestamp: new Date(),
          updatedCount: data.data?.length || 0,
          provider: data.provider || 'External API',
        });
        await fetchExchangeRates(); // Refresh the rates
      } else {
        toast.error(data.message || 'Failed to fetch latest rates');
      }
    } catch (error) {
      console.error('Error fetching latest rates:', error);
      toast.error('Failed to update exchange rates');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkPriceUpdate = async (specificCurrency = null) => {
    setUpdating(true);
    try {
      if (specificCurrency) {
        await updatePricesForCurrency(specificCurrency);
        toast.success(`Updated prices for ${specificCurrency} successfully!`);
      } else {
        // Update prices for all major currencies
        const updatePromises = exchangeRates
          .filter(
            (rate) =>
              rate.targetCurrency === 'NGN' && rate.baseCurrency !== 'NGN'
          )
          .map((rate) => updatePricesForCurrency(rate.baseCurrency));

        const results = await Promise.allSettled(updatePromises);

        const successful = results.filter((r) => r.status === 'fulfilled');
        const failed = results.filter((r) => r.status === 'rejected');

        if (successful.length > 0) {
          toast.success(`Updated prices for ${successful.length} currencies`);
        }

        if (failed.length > 0) {
          toast.error(
            `Failed to update prices for ${failed.length} currencies`
          );
        }
      }
    } catch (error) {
      console.error('Error bulk updating prices:', error);
      toast.error('Failed to bulk update prices');
    } finally {
      setUpdating(false);
    }
  };

  const updatePricesForCurrency = async (currency) => {
    const rate = exchangeRates.find(
      (r) => r.baseCurrency === currency && r.targetCurrency === 'NGN'
    );
    if (!rate) throw new Error(`Rate not found for ${currency}`);

    const data = await pricingAPI.updatePricesOnExchangeRateChange({
      currency: currency,
      newRate: rate.rate,
    });

    if (!data.success) {
      throw new Error(
        data.message || `Failed to update prices for ${currency}`
      );
    }

    return data;
  };

  const handleSpecificCurrencyUpdate = async () => {
    if (!bulkUpdateCurrency) {
      toast.error('Please select a currency');
      return;
    }

    setUpdating(true);
    try {
      await updatePricesForCurrency(bulkUpdateCurrency);
      toast.success(`Updated prices for ${bulkUpdateCurrency} successfully!`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - new Date(date)) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getStatusColor = (lastUpdated) => {
    const hoursAgo = Math.floor(
      (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60)
    );
    if (hoursAgo < 24) return 'text-green-600';
    if (hoursAgo < 48) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Pricing Utilities
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage exchange rates and bulk price updates
          </p>
        </div>
      </div>

      {/* Configuration Status */}
      {pricingConfig && (
        <div
          className={`rounded-lg p-4 ${
            pricingConfig.isApproved
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {pricingConfig.isApproved ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              )}
              <div>
                <h3
                  className={`font-medium ${
                    pricingConfig.isApproved
                      ? 'text-green-900 dark:text-green-200'
                      : 'text-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  Pricing Configuration Status
                </h3>
                <p
                  className={`text-sm ${
                    pricingConfig.isApproved
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  {pricingConfig.isApproved
                    ? 'Approved and Active'
                    : 'Pending Approval'}
                  {pricingConfig.autoUpdateOnExchangeRateChange &&
                    ' • Auto-update enabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Rate Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fetch Latest Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Update Exchange Rates
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <Info className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Fetch latest rates from external API
                </span>
              </div>
              <RoleBasedAccess allowedRoles={['ACCOUNTANT', 'DIRECTOR', 'IT']}>
                <button
                  onClick={handleFetchLatestRates}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {updating ? 'Updating...' : 'Fetch Latest Rates'}
                </button>
              </RoleBasedAccess>
            </div>

            {lastUpdateInfo && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Last update: {lastUpdateInfo.timestamp.toLocaleString()}</p>
                <p>
                  Updated {lastUpdateInfo.updatedCount} rates from{' '}
                  {lastUpdateInfo.provider}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Price Updates */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Bulk Price Updates
          </h3>

          <div className="space-y-4">
            {/* Update All Prices */}
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  Update all product prices
                </span>
              </div>
              <RoleBasedAccess allowedRoles={['DIRECTOR', 'IT']}>
                <button
                  onClick={() => handleBulkPriceUpdate()}
                  disabled={updating || !pricingConfig?.isApproved}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  Update All Prices
                </button>
              </RoleBasedAccess>
            </div>

            {/* Update Specific Currency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Update prices for specific currency:
              </label>
              <div className="flex gap-2">
                <select
                  value={bulkUpdateCurrency}
                  onChange={(e) => setBulkUpdateCurrency(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                <RoleBasedAccess allowedRoles={['DIRECTOR', 'IT']}>
                  <button
                    onClick={handleSpecificCurrencyUpdate}
                    disabled={
                      updating ||
                      !bulkUpdateCurrency ||
                      !pricingConfig?.isApproved
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Update
                  </button>
                </RoleBasedAccess>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Exchange Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Current Exchange Rates
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading exchange rates...
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Currency Pair
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {exchangeRates
                  .filter((rate) => rate.targetCurrency === 'NGN')
                  .map((rate) => {
                    const hoursAgo = Math.floor(
                      (new Date() - new Date(rate.lastUpdated)) /
                        (1000 * 60 * 60)
                    );
                    const isStale = hoursAgo > 24;

                    return (
                      <tr
                        key={`${rate.baseCurrency}-${rate.targetCurrency}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {rate.baseCurrency} → {rate.targetCurrency}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                          ₦{rate.rate.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rate.source === 'API'
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            }`}
                          >
                            {rate.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                          <div className={getStatusColor(rate.lastUpdated)}>
                            {getTimeAgo(rate.lastUpdated)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isStale ? (
                            <div className="flex items-center justify-center">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="ml-1 text-xs text-red-500">
                                Stale
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="ml-1 text-xs text-green-500">
                                Fresh
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warnings */}
      {!pricingConfig?.isApproved && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-200">
                Pricing Configuration Not Approved
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Price updates are disabled until the pricing configuration is
                approved by a Director.
              </p>
            </div>
          </div>
        </div>
      )}

      {!pricingConfig?.autoUpdateOnExchangeRateChange && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-200">
                Auto-update Disabled
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Automatic price updates on exchange rate changes are disabled.
                Enable this in the pricing configuration.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingUtilities;
