// pages/pricing/ExchangeRates.jsx
import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Globe,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Loader2,
  Settings,
  BarChart3,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { exchangeRateAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';
import RoleBasedAccess from '../../components/layout/RoleBaseAccess';

const ExchangeRates = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [fetchingAPI, setFetchingAPI] = useState(false);
  const [stats, setStats] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('exchangerate.host');

  // Available providers
  const providers = [
    {
      key: 'exchangerate.host',
      name: 'ExchangeRate.host',
      free: true,
      status: 'active',
    },
    { key: 'fixer.io', name: 'Fixer.io', free: false, status: 'needs-key' },
    {
      key: 'currencyapi.com',
      name: 'CurrencyAPI.com',
      free: false,
      status: 'needs-key',
    },
    {
      key: 'exchangeratesapi.io',
      name: 'ExchangeRatesAPI.io',
      free: false,
      status: 'needs-key',
    },
    {
      key: 'freecurrencyapi.net',
      name: 'FreeCurrencyAPI.net',
      free: false,
      status: 'needs-key',
    },
  ];

  const [formData, setFormData] = useState({
    baseCurrency: 'USD',
    targetCurrency: '',
    rate: '',
    notes: '',
  });

  const [conversionData, setConversionData] = useState({
    amount: '',
    fromCurrency: 'USD',
    toCurrency: 'NGN',
    result: null,
  });

  useEffect(() => {
    fetchExchangeRates();
    fetchSupportedCurrencies();
    fetchStats();
  }, [currentPage, searchTerm]);

  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await exchangeRateAPI.getExchangeRates(params);

      if (response.success) {
        setRates(response.data);
        setTotalPages(response.totalPages);
      } else {
        toast.error(response.message || 'Failed to fetch exchange rates');
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast.error(handleApiError(error, 'Failed to fetch exchange rates'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await exchangeRateAPI.getSupportedCurrencies();

      if (response.success) {
        setSupportedCurrencies(response.data);
      }
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      toast.error(
        handleApiError(error, 'Failed to fetch supported currencies')
      );
    }
  };

  const fetchStats = async () => {
    try {
      const response = await exchangeRateAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAPIRates = async () => {
    setFetchingAPI(true);
    try {
      const response = await exchangeRateAPI.fetchRatesFromAPI({
        baseCurrency: 'USD',
        provider: selectedProvider,
      });

      if (response.success) {
        const message =
          response.errors && response.errors.length > 0
            ? `Updated ${response.data.length} rates from ${
                response.provider || 'API'
              } (with ${response.errors.length} warnings)`
            : `Updated ${response.data.length} exchange rates from ${
                response.provider || 'API'
              }`;

        toast.success(message);

        // Show warnings if any
        if (response.errors && response.errors.length > 0) {
          console.warn('API fetch warnings:', response.errors);
        }

        fetchExchangeRates();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to fetch rates from API');
      }
    } catch (error) {
      console.error('Error fetching API rates:', error);
      toast.error(handleApiError(error, 'Failed to fetch rates from API'));
    } finally {
      setFetchingAPI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await exchangeRateAPI.createOrUpdateRate(formData);

      if (response.success) {
        toast.success(
          editingRate
            ? 'Exchange rate updated successfully!'
            : 'Exchange rate created successfully!'
        );
        setShowModal(false);
        resetForm();
        fetchExchangeRates();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to save exchange rate');
      }
    } catch (error) {
      console.error('Error saving exchange rate:', error);
      toast.error(handleApiError(error, 'Failed to save exchange rate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rateId) => {
    if (!confirm('Are you sure you want to delete this exchange rate?')) return;

    try {
      const response = await exchangeRateAPI.deleteExchangeRate(rateId);

      if (response.success) {
        toast.success('Exchange rate deleted successfully!');
        fetchExchangeRates();
        fetchStats();
      } else {
        toast.error(response.message || 'Failed to delete exchange rate');
      }
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      toast.error(handleApiError(error, 'Failed to delete exchange rate'));
    }
  };

  const handleEdit = (rate) => {
    setEditingRate(rate);
    setFormData({
      baseCurrency: rate.baseCurrency,
      targetCurrency: rate.targetCurrency,
      rate: rate.rate.toString(),
      notes: rate.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      baseCurrency: 'USD',
      targetCurrency: '',
      rate: '',
      notes: '',
    });
    setEditingRate(null);
  };

  const handleConvert = async () => {
    if (
      !conversionData.amount ||
      !conversionData.fromCurrency ||
      !conversionData.toCurrency
    ) {
      toast.error('Please fill in all conversion fields');
      return;
    }

    try {
      const response = await exchangeRateAPI.convertCurrency({
        amount: conversionData.amount,
        fromCurrency: conversionData.fromCurrency,
        toCurrency: conversionData.toCurrency,
      });

      if (response.success) {
        setConversionData((prev) => ({ ...prev, result: response.data }));
      } else {
        toast.error(response.message || 'Failed to convert currency');
      }
    } catch (error) {
      console.error('Error converting currency:', error);
      toast.error(handleApiError(error, 'Failed to convert currency'));
    }
  };

  const formatCurrency = (amount, currency) => {
    const currencyInfo = supportedCurrencies.find((c) => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getSourceBadge = (source, apiProvider) => {
    if (source === 'API') {
      const providerInfo = providers.find((p) => p.key === apiProvider);
      const isReliable =
        apiProvider === 'exchangerate.host' || apiProvider === 'fixer.io';

      return (
        <div className="flex items-center gap-1">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              isReliable
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            }`}
          >
            {isReliable ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {providerInfo?.name || apiProvider || 'API'}
          </span>
        </div>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium flex items-center gap-1">
          <User className="h-3 w-3" />
          Manual
        </span>
      );
    }
  };

  const getConfidenceBadge = (confidence) => {
    const level =
      confidence >= 0.9 ? 'high' : confidence >= 0.7 ? 'medium' : 'low';
    const colors = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level]}`}
      >
        {Math.round(confidence * 100)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Exchange Rate Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage currency exchange rates for international pricing
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <RoleBasedAccess allowedRoles={['IT', 'ADMIN']}>
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Statistics
            </button>
          </RoleBasedAccess>
          <RoleBasedAccess allowedRoles={['IT', 'ADMIN']}>
            <button
              onClick={() => setShowProviderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Providers
            </button>
          </RoleBasedAccess>
          <RoleBasedAccess allowedRoles={['IT']}>
            <button
              onClick={fetchAPIRates}
              disabled={fetchingAPI}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {fetchingAPI ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Fetch API Rates
            </button>
          </RoleBasedAccess>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Manual Rate
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Rates
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  API Rates
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.api}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Manual Rates
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.manual}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Providers
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.providers?.length || 0}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Currency Converter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          Currency Converter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={conversionData.amount}
              onChange={(e) =>
                setConversionData((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <select
              value={conversionData.fromCurrency}
              onChange={(e) =>
                setConversionData((prev) => ({
                  ...prev,
                  fromCurrency: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {supportedCurrencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <select
              value={conversionData.toCurrency}
              onChange={(e) =>
                setConversionData((prev) => ({
                  ...prev,
                  toCurrency: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {supportedCurrencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action
            </label>
            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Convert
            </button>
          </div>
        </div>

        {conversionData.result && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conversion Result
              </p>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(
                  conversionData.result.originalAmount,
                  conversionData.result.fromCurrency
                )}{' '}
                ={' '}
                {formatCurrency(
                  conversionData.result.convertedAmount,
                  conversionData.result.toCurrency
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Rate: 1 {conversionData.result.fromCurrency} ={' '}
                {conversionData.result.rate} {conversionData.result.toCurrency}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search currencies..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Currency Pair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Updated By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      Loading rates...
                    </span>
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No exchange rates found
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr
                    key={rate._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {rate.baseCurrency} → {rate.targetCurrency}
                          </div>
                          <div className="text-sm text-gray-500">
                            {
                              supportedCurrencies.find(
                                (c) => c.code === rate.baseCurrency
                              )?.name
                            }{' '}
                            to{' '}
                            {
                              supportedCurrencies.find(
                                (c) => c.code === rate.targetCurrency
                              )?.name
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {rate.rate.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(rate.source, rate.apiProvider)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getConfidenceBadge(rate.confidence || 1.0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div>
                            {new Date(rate.lastUpdated).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(rate.lastUpdated).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rate.updatedBy ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {rate.updatedBy.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {rate.updatedBy.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit Rate"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rate._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Rate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provider Selection Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select API Provider
              </h3>
              <button
                onClick={() => setShowProviderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which API provider to use for fetching exchange rates.
                Free providers work without API keys.
              </p>

              {providers.map((provider) => (
                <div
                  key={provider.key}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProvider === provider.key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProvider(provider.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={selectedProvider === provider.key}
                        onChange={() => setSelectedProvider(provider.key)}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {provider.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {provider.free
                            ? 'Free - No API key required'
                            : 'Requires API key'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {provider.free && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                          Free
                        </span>
                      )}
                      {provider.status === 'active' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowProviderModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exchange Rate Statistics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Exchange Rates
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.api}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    API Sourced
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.manual}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Manual Entries
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.providers?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Active Providers
                  </div>
                </div>
              </div>

              {stats.providers && stats.providers.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Provider Breakdown
                  </h4>
                  <div className="space-y-2">
                    {stats.providers.map((provider, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {provider._id || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {provider.count} rates
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exchange Rate Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRate ? 'Edit Exchange Rate' : 'Add Exchange Rate'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base Currency
                </label>
                <select
                  value={formData.baseCurrency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      baseCurrency: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={editingRate}
                >
                  {supportedCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Currency
                </label>
                <select
                  value={formData.targetCurrency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetCurrency: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={editingRate}
                  required
                >
                  <option value="">Select Target Currency</option>
                  {supportedCurrencies
                    .filter(
                      (currency) => currency.code !== formData.baseCurrency
                    )
                    .map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exchange Rate
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter exchange rate"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add any notes about this rate..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingRate ? 'Update Rate' : 'Add Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRates;
