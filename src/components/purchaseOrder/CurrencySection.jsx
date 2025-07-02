// components/PurchaseOrder/CurrencySection.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, Loader2 } from 'lucide-react';
import { exchangeRateAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const CurrencySection = ({ formData, updateFormData, supportedCurrencies }) => {
  const [fetchingRate, setFetchingRate] = useState(false);
  const [currencies, setCurrencies] = useState(supportedCurrencies || []);

  useEffect(() => {
    // Fetch supported currencies if not provided or empty
    if (!supportedCurrencies || supportedCurrencies.length === 0) {
      fetchSupportedCurrencies();
    } else {
      setCurrencies(supportedCurrencies);
    }
  }, [supportedCurrencies]);

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await exchangeRateAPI.getSupportedCurrencies();
      if (response.success) {
        setCurrencies(response.data);
      } else {
        // Use fallback currencies
        setFallbackCurrencies();
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      // Use fallback currencies
      setFallbackCurrencies();
    }
  };

  const setFallbackCurrencies = () => {
    const fallbackCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    ];
    setCurrencies(fallbackCurrencies);
  };

  const fetchExchangeRate = async (currencyCode) => {
    if (!currencyCode || currencyCode === 'NGN') {
      return;
    }

    setFetchingRate(true);
    try {
      const response = await exchangeRateAPI.getSpecificRate(
        currencyCode,
        'NGN'
      );

      if (response.success) {
        const newCurrency = {
          code: currencyCode,
          exchangeRate: response.data.rate,
          exchangeRateSource: 'API',
        };
        updateFormData('currency', newCurrency);
        toast.success('Exchange rate updated from API');
      } else {
        toast.error('Failed to fetch exchange rate from API');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.error(handleApiError(error, 'Failed to fetch exchange rate'));
    } finally {
      setFetchingRate(false);
    }
  };

  const handleCurrencyChange = (e) => {
    const currencyCode = e.target.value;

    // Create new currency object with proper structure
    const newCurrency = {
      code: currencyCode,
      exchangeRate: currencyCode === 'NGN' ? 1 : 1, // Start with 1, will be updated by API if not NGN
      exchangeRateSource: 'API',
    };

    // Update form data immediately
    updateFormData('currency', newCurrency);

    // Auto-fetch rate for non-NGN currencies
    if (currencyCode !== 'NGN' && currencyCode !== '') {
      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchExchangeRate(currencyCode);
      }, 100);
    }
  };

  const handleExchangeRateChange = (e) => {
    const newRate = parseFloat(e.target.value) || 1;
    const updatedCurrency = {
      ...formData.currency,
      exchangeRate: newRate,
      exchangeRateSource: 'MANUAL',
    };
    updateFormData('currency', updatedCurrency);
  };

  const handleRateSourceChange = (e) => {
    const updatedCurrency = {
      ...formData.currency,
      exchangeRateSource: e.target.value,
    };
    updateFormData('currency', updatedCurrency);
  };

  const handleRefreshRate = () => {
    if (formData.currency?.code && formData.currency.code !== 'NGN') {
      fetchExchangeRate(formData.currency.code);
    }
  };

  const selectedCurrency = currencies.find(
    (c) => c.code === formData.currency?.code
  );

  // Ensure we have a valid currency object
  const currentCurrency = formData.currency || {
    code: 'USD',
    exchangeRate: 1,
    exchangeRateSource: 'API',
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        Currency & Exchange Rate
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency *
          </label>
          <select
            className="form-select w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={currentCurrency.code}
            onChange={handleCurrencyChange}
            required
          >
            {currencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exchange Rate to NGN *
          </label>
          <div className="flex">
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              className="form-input flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={currentCurrency.exchangeRate || 1}
              onChange={handleExchangeRateChange}
              disabled={currentCurrency.code === 'NGN'}
              required
            />
            {currentCurrency.code !== 'NGN' && (
              <button
                type="button"
                onClick={handleRefreshRate}
                disabled={fetchingRate}
                className="px-3 py-2 bg-blue-600 text-white border border-l-0 border-blue-600 rounded-r-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                title="Fetch latest rate from API"
              >
                {fetchingRate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {currentCurrency.code === 'NGN' && (
            <p className="text-xs text-gray-500 mt-1">
              NGN is the base currency (rate = 1)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rate Source
          </label>
          <select
            className="form-select w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={currentCurrency.exchangeRateSource}
            onChange={handleRateSourceChange}
          >
            <option value="API">API (Automatic)</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview
          </label>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              1 {currentCurrency.code} = ₦{currentCurrency.exchangeRate || 1}
            </div>
            <div className="text-xs text-gray-500">
              {selectedCurrency?.symbol || '$'}100 = ₦
              {((currentCurrency.exchangeRate || 1) * 100).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {currentCurrency.exchangeRateSource === 'MANUAL' && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Manual Rate:</strong> You're using a manually entered
            exchange rate. Consider using the API rate for more accurate
            pricing.
          </p>
        </div>
      )}
    </div>
  );
};

export default CurrencySection;
