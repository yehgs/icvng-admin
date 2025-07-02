// utils/api.js - Updated with improved error handling and data processing
const API_BASE_URL =
  import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

console.log(`API_BASE_URL: ${API_BASE_URL}`);

// Generic API call function with improved error handling
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    // Ensure body is properly stringified if it's an object
    const processedOptions = {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers },
    };

    // Only stringify if body exists and is not already a string or FormData
    if (
      processedOptions.body &&
      typeof processedOptions.body !== 'string' &&
      !(processedOptions.body instanceof FormData)
    ) {
      processedOptions.body = JSON.stringify(processedOptions.body);
    }

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      processedOptions
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(
        data.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  login: async (credentials) => {
    return apiCall('/admin/auth/login', {
      method: 'POST',
      body: credentials,
    });
  },

  logout: async () => {
    return apiCall('/user/logout', {
      method: 'POST',
    });
  },

  getStats: async () => {
    return apiCall('/admin/auth/stats');
  },
};

// User management API calls
export const userAPI = {
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/admin/user/users${queryString ? `?${queryString}` : ''}`);
  },

  createUser: async (userData) => {
    return apiCall('/admin/user/create-user', {
      method: 'POST',
      body: userData,
    });
  },

  updateUser: async (userId, userData) => {
    return apiCall(`/admin/user/update-user/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  },

  deleteUser: async (userId) => {
    return apiCall(`/admin/user/delete-user/${userId}`, {
      method: 'DELETE',
    });
  },

  resetPassword: async (userId, newPassword) => {
    return apiCall(`/admin/user/reset-password/${userId}`, {
      method: 'POST',
      body: { newPassword },
    });
  },

  generateRecovery: async (userId) => {
    return apiCall(`/admin/user/generate-recovery/${userId}`, {
      method: 'POST',
    });
  },
};

// Supplier API calls
export const supplierAPI = {
  getSuppliers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/suppliers${queryString ? `?${queryString}` : ''}`);
  },

  getSupplier: async (supplierId) => {
    return apiCall(`/suppliers/${supplierId}`);
  },

  createSupplier: async (supplierData) => {
    return apiCall('/suppliers', {
      method: 'POST',
      body: supplierData,
    });
  },

  updateSupplier: async (supplierId, supplierData) => {
    return apiCall(`/suppliers/${supplierId}`, {
      method: 'PUT',
      body: supplierData,
    });
  },

  deleteSupplier: async (supplierId) => {
    return apiCall(`/suppliers/${supplierId}`, {
      method: 'DELETE',
    });
  },
};

// Purchase Order API calls with improved data handling
export const purchaseOrderAPI = {
  getPurchaseOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/purchase-orders${queryString ? `?${queryString}` : ''}`);
  },

  getPurchaseOrder: async (orderId) => {
    return apiCall(`/purchase-orders/${orderId}`);
  },

  createPurchaseOrder: async (orderData) => {
    // Validate required fields
    if (!orderData.supplier) {
      throw new Error('Supplier is required');
    }
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (!orderData.expectedDeliveryDate) {
      throw new Error('Expected delivery date is required');
    }

    // Ensure proper data structure before sending
    const processedData = {
      ...orderData,
      // Ensure currency is a string, not an object
      currency:
        typeof orderData.currency === 'object'
          ? orderData.currency.code
          : orderData.currency || 'USD',

      // Ensure exchange rate is properly set
      exchangeRate:
        typeof orderData.currency === 'object'
          ? orderData.currency.exchangeRate || 1
          : orderData.exchangeRate || 1,

      // Ensure items have proper structure
      items: orderData.items.map((item) => {
        if (!item.product) {
          throw new Error('Product is required for all items');
        }
        return {
          product: item.product,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice || item.unitCost) || 0,
        };
      }),

      // Ensure logistics has proper structure
      logistics: {
        transportMode: orderData.logistics?.transportMode || 'AIR',
        freightCost: parseFloat(orderData.logistics?.freightCost) || 0,
        clearanceCost: parseFloat(orderData.logistics?.clearanceCost) || 0,
        otherLogisticsCost:
          parseFloat(orderData.logistics?.otherLogisticsCost) || 0,
      },

      // Ensure dates are properly formatted
      expectedDeliveryDate: orderData.expectedDeliveryDate,

      // Ensure notes is a string
      notes: orderData.notes || '',
    };

    return apiCall('/purchase-orders', {
      method: 'POST',
      body: processedData,
    });
  },

  updatePurchaseOrder: async (orderId, orderData) => {
    // Validate order ID
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Ensure proper data structure before sending
    const processedData = {
      ...orderData,
      // Ensure currency is a string, not an object
      currency:
        typeof orderData.currency === 'object'
          ? orderData.currency.code
          : orderData.currency || 'USD',

      // Ensure exchange rate is properly set
      exchangeRate:
        typeof orderData.currency === 'object'
          ? orderData.currency.exchangeRate || 1
          : orderData.exchangeRate || 1,

      // Ensure items have proper structure
      items: orderData.items.map((item) => ({
        product: item.product,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice || item.unitCost) || 0,
      })),

      // Ensure logistics has proper structure
      logistics: {
        transportMode: orderData.logistics?.transportMode || 'AIR',
        freightCost: parseFloat(orderData.logistics?.freightCost) || 0,
        clearanceCost: parseFloat(orderData.logistics?.clearanceCost) || 0,
        otherLogisticsCost:
          parseFloat(orderData.logistics?.otherLogisticsCost) || 0,
      },
    };

    return apiCall(`/purchase-orders/${orderId}`, {
      method: 'PUT',
      body: processedData,
    });
  },

  updateOrderStatus: async (orderId, status) => {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }

    return apiCall(`/purchase-orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  deletePurchaseOrder: async (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    return apiCall(`/purchase-orders/${orderId}`, {
      method: 'DELETE',
    });
  },

  getPurchaseOrderStats: async () => {
    return apiCall('/purchase-orders/stats');
  },

  getLogisticsCostAnalysis: async () => {
    return apiCall('/purchase-orders/logistics-analysis');
  },
};

// Enhanced Exchange Rate API calls
export const exchangeRateAPI = {
  // Test authentication
  testAuth: async () => {
    try {
      return await apiCall('/api/test-auth');
    } catch (error) {
      console.error('Auth test failed:', error);
      throw error;
    }
  },

  // Fetch rates from external APIs
  fetchRatesFromAPI: async (data = {}) => {
    const requestData = {
      baseCurrency: 'USD',
      provider: 'exchangerate.host',
      ...data,
    };

    return apiCall('/exchange-rates/fetch-api-rates', {
      method: 'POST',
      body: requestData,
    });
  },

  // Get all exchange rates with pagination and filters
  getExchangeRates: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(
      `/exchange-rates/get${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get supported currencies list with fallback
  getSupportedCurrencies: async () => {
    try {
      return await apiCall('/exchange-rates/currencies');
    } catch (error) {
      console.error('Error fetching supported currencies:', error);
      // Return fallback currencies if API fails
      return {
        success: true,
        data: [
          { code: 'USD', name: 'US Dollar', symbol: '$' },
          { code: 'EUR', name: 'Euro', symbol: '€' },
          { code: 'GBP', name: 'British Pound', symbol: '£' },
          { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
          { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        ],
      };
    }
  },

  // Create or update a manual exchange rate
  createOrUpdateRate: async (data) => {
    return apiCall('/exchange-rates/create-update', {
      method: 'POST',
      body: data,
    });
  },

  // Get specific exchange rate between two currencies with validation
  getSpecificRate: async (baseCurrency, targetCurrency) => {
    // Validate inputs
    if (!baseCurrency || !targetCurrency) {
      throw new Error('Both base and target currencies are required');
    }

    if (
      typeof baseCurrency !== 'string' ||
      typeof targetCurrency !== 'string'
    ) {
      throw new Error('Currency codes must be strings');
    }

    // Ensure uppercase
    const base = baseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();

    return apiCall(`/exchange-rates/rate/${base}/${target}`);
  },

  // Delete an exchange rate (soft delete)
  deleteExchangeRate: async (rateId) => {
    return apiCall('/exchange-rates/delete', {
      method: 'DELETE',
      body: { rateId },
    });
  },

  // Convert currency with validation
  convertCurrency: async (data) => {
    // Validate conversion data
    const validatedData = {
      amount: parseFloat(data.amount) || 0,
      from: typeof data.from === 'string' ? data.from.toUpperCase() : 'USD',
      to: typeof data.to === 'string' ? data.to.toUpperCase() : 'NGN',
    };

    return apiCall('/exchange-rates/convert', {
      method: 'POST',
      body: validatedData,
    });
  },

  // Get exchange rate statistics
  getStats: async () => {
    return apiCall('/exchange-rates/stats');
  },

  // Get stale rates (rates that need updating)
  getStaleRates: async (hoursOld = 24) => {
    return apiCall(`/exchange-rates/stale?hours=${hoursOld}`);
  },

  // Bulk update rates
  bulkUpdateRates: async (rates) => {
    return apiCall('/exchange-rates/bulk-update', {
      method: 'POST',
      body: { rates },
    });
  },

  // Get rate history (if implemented)
  getRateHistory: async (baseCurrency, targetCurrency, days = 30) => {
    const base = baseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    return apiCall(`/exchange-rates/history/${base}/${target}?days=${days}`);
  },
};

// Additional utility functions for exchange rates
export const exchangeRateUtils = {
  // Format currency with proper symbol
  formatCurrency: (amount, currencyCode, supportedCurrencies = []) => {
    const currency = supportedCurrencies.find((c) => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formattedAmount}`;
  },

  // Calculate percentage change between two rates
  calculatePercentageChange: (oldRate, newRate) => {
    if (!oldRate || oldRate === 0) return 0;
    return ((newRate - oldRate) / oldRate) * 100;
  },

  // Get rate trend (up, down, stable)
  getRateTrend: (percentageChange, threshold = 1) => {
    if (Math.abs(percentageChange) < threshold) return 'stable';
    return percentageChange > 0 ? 'up' : 'down';
  },

  // Validate currency pair
  validateCurrencyPair: (baseCurrency, targetCurrency) => {
    if (!baseCurrency || !targetCurrency) {
      return 'Both base and target currencies are required';
    }

    if (baseCurrency === targetCurrency) {
      return 'Base and target currencies must be different';
    }

    if (
      !/^[A-Z]{3}$/.test(baseCurrency) ||
      !/^[A-Z]{3}$/.test(targetCurrency)
    ) {
      return 'Currency codes must be 3-letter ISO codes (e.g., USD, EUR)';
    }

    return null; // Valid
  },

  // Validate exchange rate
  validateExchangeRate: (rate) => {
    const numRate = parseFloat(rate);

    if (isNaN(numRate)) {
      return 'Exchange rate must be a valid number';
    }

    if (numRate <= 0) {
      return 'Exchange rate must be greater than 0';
    }

    if (numRate > 1000000) {
      return 'Exchange rate seems unusually high, please verify';
    }

    return null; // Valid
  },

  // Get inverse rate
  getInverseRate: (rate) => {
    return rate && rate > 0 ? 1 / rate : null;
  },

  // Calculate cross rate (e.g., EUR/GBP via USD)
  calculateCrossRate: (baseToUSD, targetToUSD) => {
    if (!baseToUSD || !targetToUSD || baseToUSD === 0) return null;
    return targetToUSD / baseToUSD;
  },

  // Format rate with appropriate decimal places
  formatRate: (rate, maxDecimals = 4) => {
    if (!rate) return '0.0000';

    const num = parseFloat(rate);
    if (num >= 1) {
      return num.toFixed(Math.min(2, maxDecimals));
    } else if (num >= 0.1) {
      return num.toFixed(Math.min(3, maxDecimals));
    } else {
      return num.toFixed(maxDecimals);
    }
  },

  // Check if rate is stale
  isRateStale: (lastUpdated, hoursOld = 24) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffHours = (now - updated) / (1000 * 60 * 60);
    return diffHours > hoursOld;
  },

  // Get confidence level description
  getConfidenceDescription: (confidence) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    if (confidence >= 0.5) return 'Low';
    return 'Very Low';
  },

  // Common currency pairs for quick access
  getCommonPairs: () => [
    { base: 'USD', target: 'EUR', name: 'US Dollar to Euro' },
    { base: 'USD', target: 'GBP', name: 'US Dollar to British Pound' },
    { base: 'USD', target: 'JPY', name: 'US Dollar to Japanese Yen' },
    { base: 'USD', target: 'CAD', name: 'US Dollar to Canadian Dollar' },
    { base: 'USD', target: 'AUD', name: 'US Dollar to Australian Dollar' },
    { base: 'USD', target: 'CHF', name: 'US Dollar to Swiss Franc' },
    { base: 'USD', target: 'CNY', name: 'US Dollar to Chinese Yuan' },
    { base: 'USD', target: 'NGN', name: 'US Dollar to Nigerian Naira' },
    { base: 'EUR', target: 'GBP', name: 'Euro to British Pound' },
    { base: 'EUR', target: 'JPY', name: 'Euro to Japanese Yen' },
  ],

  // Export rates to CSV format
  exportToCSV: (rates) => {
    if (!rates || rates.length === 0) return '';

    const headers = [
      'Base Currency',
      'Target Currency',
      'Rate',
      'Source',
      'Provider',
      'Confidence',
      'Last Updated',
      'Notes',
    ];

    const csvData = rates.map((rate) => [
      rate.baseCurrency,
      rate.targetCurrency,
      rate.rate,
      rate.source,
      rate.apiProvider || '',
      rate.confidence || 1.0,
      new Date(rate.lastUpdated).toISOString(),
      rate.notes || '',
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  },

  // Download CSV file
  downloadCSV: (csvContent, filename = 'exchange_rates.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// File upload API calls
export const fileAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return apiCall('/file/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },
};

// Brand API calls
export const brandAPI = {
  getBrands: async () => {
    return apiCall('/brand/get');
  },

  createBrand: async (brandData) => {
    return apiCall('/brand/add-brand', {
      method: 'POST',
      body: brandData,
    });
  },

  updateBrand: async (brandData) => {
    return apiCall('/brand/update', {
      method: 'PUT',
      body: brandData,
    });
  },

  deleteBrand: async (brandId) => {
    return apiCall('/brand/delete', {
      method: 'DELETE',
      body: { _id: brandId },
    });
  },
};

// Product API calls with improved data handling
export const productAPI = {
  // Get products
  getProducts: async (params = {}) => {
    return apiCall('/product/get', {
      method: 'POST',
      body: params,
    });
  },

  createProduct: async (productData) => {
    return apiCall('/product/create', {
      method: 'POST',
      body: productData,
    });
  },

  // Update product
  updateProduct: async (productData) => {
    return apiCall('/product/update-product-details', {
      method: 'PUT',
      body: productData,
    });
  },

  // Delete product
  deleteProduct: async (productId) => {
    return apiCall('/product/delete-product', {
      method: 'DELETE',
      body: { _id: productId },
    });
  },

  searchProducts: async (query) => {
    const queryParams = new URLSearchParams({ q: query });
    return apiCall(`/product/search?${queryParams.toString()}`);
  },

  getCategoryStructure: async () => {
    return apiCall('/product/category-structure');
  },

  getProductByCategory: async (categoryData) => {
    return apiCall('/product/get-product-by-category', {
      method: 'POST',
      body: categoryData,
    });
  },

  getProductByCategoryAndSubCategory: async (categoryData) => {
    return apiCall('/product/get-product-by-category-and-subcategory', {
      method: 'POST',
      body: categoryData,
    });
  },

  getProductDetails: async (productData) => {
    return apiCall('/product/get-product-details', {
      method: 'POST',
      body: productData,
    });
  },

  searchProduct: async (searchData) => {
    return apiCall('/product/search-product', {
      method: 'POST',
      body: searchData,
    });
  },

  getProductByBrand: async (brandData) => {
    return apiCall('/product/get-product-by-brand', {
      method: 'POST',
      body: brandData,
    });
  },

  getFeaturedProducts: async (params = {}) => {
    return apiCall('/product/get-featured-products', {
      method: 'POST',
      body: params,
    });
  },

  getProductsByAvailability: async (availabilityData) => {
    return apiCall('/product/get-products-by-availability', {
      method: 'POST',
      body: availabilityData,
    });
  },

  getProductBySKU: async (skuData) => {
    return apiCall('/product/get-product-by-sku', {
      method: 'POST',
      body: skuData,
    });
  },
};

// Order API calls
export const orderAPI = {
  getOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/order/order-list${queryString ? `?${queryString}` : ''}`);
  },

  updateOrderStatus: async (orderId, status) => {
    return apiCall('/order/update-order', {
      method: 'PUT',
      body: { _id: orderId, status },
    });
  },
};

// Enhanced utility functions
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);

  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

export const isTokenValid = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    // Basic token validation (you might want to add expiry check)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (error) {
    return false;
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setAuthData = (accessToken, refreshToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Request interceptor for automatic token refresh (optional)
export const setupInterceptors = () => {
  const originalFetch = window.fetch;

  window.fetch = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');

    if (token && !isTokenValid()) {
      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await originalFetch(
            `${API_BASE_URL}/user/refresh-token`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              localStorage.setItem('accessToken', data.data.accessToken);
            }
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuthData();
        window.location.href = '/login';
      }
    }

    return originalFetch(url, options);
  };
};

export default {
  authAPI,
  userAPI,
  supplierAPI,
  purchaseOrderAPI,
  exchangeRateAPI,
  exchangeRateUtils,
  fileAPI,
  brandAPI,
  productAPI,
  orderAPI,
  handleApiError,
  isTokenValid,
  getCurrentUser,
  setAuthData,
  clearAuthData,
  setupInterceptors,
};
