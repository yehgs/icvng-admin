//admin
// utils/api.js - Updated with improved error handling and getCurrentUser consistency
const API_BASE_URL =
  import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

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
    const processedOptions = {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers },
    };

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
      if (response.status === 401) {
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

// Enhanced getCurrentUser function with consistency check
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!user || !token) {
      return null;
    }

    const parsedUser = JSON.parse(user);

    // Validate token is not expired
    if (!isTokenValid()) {
      clearAuthData();
      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    clearAuthData();
    return null;
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
    if (!orderData.supplier) {
      throw new Error('Supplier is required');
    }
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (!orderData.expectedDeliveryDate) {
      throw new Error('Expected delivery date is required');
    }

    const processedData = {
      ...orderData,
      currency:
        typeof orderData.currency === 'object'
          ? orderData.currency.code
          : orderData.currency || 'USD',
      exchangeRate:
        typeof orderData.currency === 'object'
          ? orderData.currency.exchangeRate || 1
          : orderData.exchangeRate || 1,
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
      logistics: {
        transportMode: orderData.logistics?.transportMode || 'AIR',
        freightCost: parseFloat(orderData.logistics?.freightCost) || 0,
        clearanceCost: parseFloat(orderData.logistics?.clearanceCost) || 0,
        otherLogisticsCost:
          parseFloat(orderData.logistics?.otherLogisticsCost) || 0,
      },
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      notes: orderData.notes || '',
    };

    return apiCall('/purchase-orders', {
      method: 'POST',
      body: processedData,
    });
  },

  updatePurchaseOrder: async (orderId, orderData) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const processedData = {
      ...orderData,
      currency:
        typeof orderData.currency === 'object'
          ? orderData.currency.code
          : orderData.currency || 'USD',
      exchangeRate:
        typeof orderData.currency === 'object'
          ? orderData.currency.exchangeRate || 1
          : orderData.exchangeRate || 1,
      items: orderData.items.map((item) => ({
        product: item.product,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice || item.unitCost) || 0,
      })),
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

  updateOrderStatus: async (orderId, statusData) => {
    if (!orderId || !statusData) {
      throw new Error('Order ID and status data are required');
    }

    return apiCall(`/purchase-orders/${orderId}/status`, {
      method: 'PATCH',
      body: statusData,
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

  getAllowedStatusUpdates: async (orderId) => {
    return apiCall(`/purchase-orders/${orderId}/allowed-statuses`);
  },

  getStatusHistory: async (orderId) => {
    return apiCall(`/purchase-orders/${orderId}/status-history`);
  },

  getPurchaseOrderStats: async () => {
    return apiCall('/purchase-orders/stats');
  },

  getLogisticsCostAnalysis: async () => {
    return apiCall('/purchase-orders/logistics-analysis');
  },
};

// Exchange Rate API calls
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
      baseCurrency: 'NGN',
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

// Product API calls
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

// Stock management API calls
export const stockAPI = {
  createStockIntake: async (intakeData) => {
    if (!intakeData.purchaseOrderId) {
      throw new Error('Purchase order is required');
    }
    if (!intakeData.items || intakeData.items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Validate that all items have proper quantities and locations
    for (const item of intakeData.items) {
      const total =
        item.passedQuantity +
        item.refurbishedQuantity +
        item.damagedQuantity +
        item.expiredQuantity;
      if (total !== item.originalQuantity) {
        throw new Error(`Total quantity for item must equal original quantity`);
      }

      // Check that locations are provided for non-zero quantities
      const qualityTypes = ['PASSED', 'REFURBISHED', 'DAMAGED', 'EXPIRED'];
      for (const type of qualityTypes) {
        const quantity = item[`${type.toLowerCase()}Quantity`];
        if (quantity > 0) {
          const location = item.locations[type];
          if (
            !location.zone ||
            !location.aisle ||
            !location.shelf ||
            !location.bin
          ) {
            throw new Error(
              `Location required for ${type.toLowerCase()} items`
            );
          }
        }
      }
    }

    return apiCall('/stock/intake', {
      method: 'POST',
      body: intakeData,
    });
  },

  // Get stock summary by product
  getStockSummary: async () => {
    return apiCall('/stock/summary');
  },

  // Get expiring batches
  getExpiringBatches: async (days = 30) => {
    const queryParams = new URLSearchParams({ days: days.toString() });
    return apiCall(`/stock/expiring?${queryParams.toString()}`);
  },

  // Get all stock batches with filters
  getStockBatches: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/stock/batches${queryString ? `?${queryString}` : ''}`);
  },

  // Get specific stock batch details
  getStockBatchDetails: async (batchId) => {
    if (!batchId) {
      throw new Error('Batch ID is required');
    }
    return apiCall(`/stock/batches/${batchId}`);
  },

  // Create new stock batch from purchase order (simplified)
  createStockBatch: async (batchData) => {
    if (!batchData.purchaseOrderId) {
      throw new Error('Purchase order is required');
    }
    if (!batchData.items || batchData.items.length === 0) {
      throw new Error('At least one item is required');
    }

    return apiCall('/stock/batches', {
      method: 'POST',
      body: batchData,
    });
  },

  // Perform quality check on batch (simplified)
  performQualityCheck: async (batchId, qualityData) => {
    if (!batchId) {
      throw new Error('Batch ID is required');
    }
    if (!qualityData.qualityStatus) {
      throw new Error('Quality status is required');
    }

    return apiCall(`/stock/batches/${batchId}/quality-check`, {
      method: 'PATCH',
      body: qualityData,
    });
  },

  // Distribute stock (online/offline) - requires approval
  distributeStock: async (batchId, distributionData) => {
    if (!batchId) {
      throw new Error('Batch ID is required');
    }
    if (
      !distributionData.distributions ||
      distributionData.distributions.length === 0
    ) {
      throw new Error('Distribution data is required');
    }

    return apiCall(`/stock/batches/${batchId}/distribute`, {
      method: 'PATCH',
      body: distributionData,
    });
  },

  // Approve distribution (Director, IT, Manager only)
  approveDistribution: async (batchId, approvalData) => {
    if (!batchId) {
      throw new Error('Batch ID is required');
    }

    return apiCall(`/stock/batches/${batchId}/approve-distribution`, {
      method: 'PATCH',
      body: approvalData,
    });
  },

  // Get purchase orders ready for batch creation (DELIVERED status)
  getDeliveredPurchaseOrders: async () => {
    return apiCall('/purchase-orders?status=DELIVERED&hasBatch=false');
  },

  // Close purchase order after batch approval
  closePurchaseOrder: async (purchaseOrderId) => {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }

    return apiCall(`/purchase-orders/${purchaseOrderId}/close`, {
      method: 'PATCH',
    });
  },

  // Reactivate purchase order (Director, IT only)
  reactivatePurchaseOrder: async (purchaseOrderId, reason) => {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }

    return apiCall(`/purchase-orders/${purchaseOrderId}/reactivate`, {
      method: 'PATCH',
      body: { reason },
    });
  },
};

export const pricingAPI = {
  // Get pricing configuration
  getPricingConfig: async () => {
    return apiCall('/pricing/config');
  },

  // Update pricing configuration
  updatePricingConfig: async (configData) => {
    return apiCall('/pricing/config', {
      method: 'PUT',
      body: configData,
    });
  },

  // Approve pricing configuration (Director only)
  approvePricingConfig: async () => {
    return apiCall('/pricing/config/approve', {
      method: 'PATCH',
    });

    console.log('=== END PRICING API ===');
  },

  // Calculate prices from purchase order
  calculatePricesFromPurchaseOrder: async (purchaseOrderId) => {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }

    return apiCall(`/pricing/calculate/${purchaseOrderId}`, {
      method: 'POST',
    });
  },

  // Approve calculated prices (Director only)
  approvePriceCalculations: async (approvalData) => {
    const validatedData = {
      purchaseOrderId: approvalData.purchaseOrderId,
      calculatedItems:
        approvalData.calculatedItems?.map((item) => ({
          productId: item.productId,
          calculations: item.calculations,
        })) || [],
    };

    if (!validatedData.purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }

    if (!validatedData.calculatedItems.length) {
      throw new Error('At least one calculated item is required');
    }

    return apiCall('/pricing/approve', {
      method: 'POST',
      body: validatedData,
    });
  },

  // NEW: Direct product price update for accountants
  updateProductPricing: async (pricingData) => {
    const validatedData = {
      productId: pricingData.productId,
      price: parseFloat(pricingData.price) || 0,
      notes: pricingData.notes || '',
    };

    if (!validatedData.productId) {
      throw new Error('Product ID is required');
    }

    if (validatedData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return apiCall('/pricing/update-product-price', {
      method: 'PUT',
      body: validatedData,
    });
  },

  // NEW: Direct product price creation for accountants
  createProductPricing: async (pricingData) => {
    const validatedData = {
      productId: pricingData.productId,
      price: parseFloat(pricingData.price) || 0,
      notes: pricingData.notes || '',
      currency: pricingData.currency || 'NGN',
    };

    if (!validatedData.productId) {
      throw new Error('Product ID is required');
    }

    if (validatedData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return apiCall('/pricing/create-product-price', {
      method: 'POST',
      body: validatedData,
    });
  },

  // Get product pricing list with filters
  getProductPricingList: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/pricing/products${queryString ? `?${queryString}` : ''}`);
  },

  // Update prices when exchange rates change
  updatePricesOnExchangeRateChange: async (updateData) => {
    const validatedData = {
      currency: updateData.currency?.toUpperCase(),
      newRate: parseFloat(updateData.newRate) || 0,
    };

    if (!validatedData.currency) {
      throw new Error('Currency is required');
    }

    if (validatedData.newRate <= 0) {
      throw new Error('Exchange rate must be greater than 0');
    }

    return apiCall('/pricing/exchange-rate-update', {
      method: 'POST',
      body: validatedData,
    });
  },

  // Bulk recalculate prices for specific currency
  bulkRecalculatePricesForCurrency: async (currency) => {
    if (!currency) {
      throw new Error('Currency is required');
    }

    return apiCall('/pricing/bulk-recalculate', {
      method: 'POST',
      body: { currency: currency.toUpperCase() },
    });
  },

  // Get delivered purchase orders ready for price calculation
  getDeliveredPurchaseOrders: async () => {
    return apiCall('/purchase-orders?status=DELIVERED');
  },

  // Get purchase order details for pricing
  getPurchaseOrderForPricing: async (purchaseOrderId) => {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required');
    }

    return apiCall(`/purchase-orders/${purchaseOrderId}`);
  },
};

// Tag API calls
export const tagAPI = {
  getTags: async () => {
    return apiCall('/tag/get');
  },

  createTag: async (tagData) => {
    return apiCall('/tag/add', {
      method: 'POST',
      body: tagData,
    });
  },

  updateTag: async (tagData) => {
    return apiCall('/tag/update', {
      method: 'PUT',
      body: tagData,
    });
  },

  deleteTag: async (tagId) => {
    return apiCall('/tag/delete', {
      method: 'DELETE',
      body: { _id: tagId },
    });
  },
};

// Attribute API calls
export const attributeAPI = {
  getAttributes: async () => {
    return apiCall('/attribute/get');
  },

  createAttribute: async (attributeData) => {
    return apiCall('/attribute/add', {
      method: 'POST',
      body: attributeData,
    });
  },

  updateAttribute: async (attributeData) => {
    return apiCall('/attribute/update', {
      method: 'PUT',
      body: attributeData,
    });
  },

  deleteAttribute: async (attributeId) => {
    return apiCall('/attribute/delete', {
      method: 'DELETE',
      body: { _id: attributeId },
    });
  },
};

// Coffee Roast Area API calls
export const coffeeRoastAreaAPI = {
  getCoffeeRoastAreas: async () => {
    return apiCall('/coffee-roast-area/get');
  },

  createCoffeeRoastArea: async (areaData) => {
    return apiCall('/coffee-roast-area/add', {
      method: 'POST',
      body: areaData,
    });
  },

  updateCoffeeRoastArea: async (areaData) => {
    return apiCall('/coffee-roast-area/update', {
      method: 'PUT',
      body: areaData,
    });
  },

  deleteCoffeeRoastArea: async (areaId) => {
    return apiCall('/coffee-roast-area/delete', {
      method: 'DELETE',
      body: { _id: areaId },
    });
  },
};

export const logisticsAPI = {
  // Shipping Zones
  getShippingZones: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/shipping/zones${queryString ? `?${queryString}` : ''}`);
  },

  createShippingZone: async (zoneData) => {
    return apiCall('/shipping/zones', {
      method: 'POST',
      body: zoneData,
    });
  },

  updateShippingZone: async (zoneId, zoneData) => {
    return apiCall(`/shipping/zones/${zoneId}`, {
      method: 'PUT',
      body: zoneData,
    });
  },

  deleteShippingZone: async (zoneId) => {
    return apiCall(`/shipping/zones/${zoneId}`, {
      method: 'DELETE',
    });
  },

  // Shipping Methods
  getShippingMethods: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/shipping/methods${queryString ? `?${queryString}` : ''}`);
  },

  createShippingMethod: async (methodData) => {
    // Clean up the data based on method type and new structure
    const cleanedData = { ...methodData };

    // Clean up unused configurations
    if (methodData.type !== 'pickup') {
      delete cleanedData.pickup;
    }
    if (methodData.type !== 'flat_rate') {
      delete cleanedData.flatRate;
    }
    if (methodData.type !== 'table_shipping') {
      delete cleanedData.tableShipping;
    }

    // Additional cleanup for new zone structure
    if (methodData.type === 'flat_rate' && cleanedData.flatRate) {
      // If no zone rates, ensure we have a default cost
      if (
        !cleanedData.flatRate.zoneRates ||
        cleanedData.flatRate.zoneRates.length === 0
      ) {
        cleanedData.flatRate.defaultCost =
          cleanedData.flatRate.defaultCost || cleanedData.flatRate.cost || 0;
      }
    }

    if (methodData.type === 'pickup' && cleanedData.pickup) {
      // If no zone locations, ensure we have default locations
      if (
        !cleanedData.pickup.zoneLocations ||
        cleanedData.pickup.zoneLocations.length === 0
      ) {
        cleanedData.pickup.defaultLocations =
          cleanedData.pickup.defaultLocations ||
          cleanedData.pickup.locations ||
          [];
      }
      // Remove old locations field for backward compatibility
      delete cleanedData.pickup.locations;
    }

    return apiCall('/shipping/methods', {
      method: 'POST',
      body: cleanedData,
    });
  },

  updateShippingMethod: async (methodId, methodData) => {
    // Same cleanup logic as create
    const cleanedData = { ...methodData };

    if (methodData.type !== 'pickup') {
      delete cleanedData.pickup;
    }
    if (methodData.type !== 'flat_rate') {
      delete cleanedData.flatRate;
    }
    if (methodData.type !== 'table_shipping') {
      delete cleanedData.tableShipping;
    }

    if (methodData.type === 'flat_rate' && cleanedData.flatRate) {
      if (
        !cleanedData.flatRate.zoneRates ||
        cleanedData.flatRate.zoneRates.length === 0
      ) {
        cleanedData.flatRate.defaultCost =
          cleanedData.flatRate.defaultCost || cleanedData.flatRate.cost || 0;
      }
    }

    if (methodData.type === 'pickup' && cleanedData.pickup) {
      if (
        !cleanedData.pickup.zoneLocations ||
        cleanedData.pickup.zoneLocations.length === 0
      ) {
        cleanedData.pickup.defaultLocations =
          cleanedData.pickup.defaultLocations ||
          cleanedData.pickup.locations ||
          [];
      }
      delete cleanedData.pickup.locations;
    }

    return apiCall(`/shipping/methods/${methodId}`, {
      method: 'PUT',
      body: cleanedData,
    });
  },

  deleteShippingMethod: async (methodId) => {
    return apiCall(`/shipping/methods/${methodId}`, {
      method: 'DELETE',
    });
  },

  // NEW: Categories and Products for Assignment
  getCategoriesForAssignment: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/shipping/categories/for-assignment${
        queryString ? `?${queryString}` : ''
      }`
    );
  },

  getProductsForAssignment: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/shipping/products/for-assignment${queryString ? `?${queryString}` : ''}`
    );
  },

  // Calculate shipping costs
  calculateShippingCost: async (orderData) => {
    return apiCall('/shipping/calculate', {
      method: 'POST',
      body: orderData,
    });
  },

  // Tracking Management
  createShipment: async (shipmentData) => {
    return apiCall('/shipping/shipments', {
      method: 'POST',
      body: shipmentData,
    });
  },

  updateTracking: async (trackingId, updateData) => {
    return apiCall(`/shipping/trackings/${trackingId}`, {
      method: 'PUT',
      body: updateData,
    });
  },

  getAllTrackings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/shipping/trackings${queryString ? `?${queryString}` : ''}`
    );
  },

  getTrackingByNumber: async (trackingNumber) => {
    return apiCall(`/shipping/track/${trackingNumber}`);
  },

  getTrackingStats: async () => {
    return apiCall('/shipping/trackings/stats');
  },

  // Dashboard
  getShippingDashboardStats: async () => {
    return apiCall('/shipping/dashboard/stats');
  },

  // Orders ready for shipping
  getOrdersReadyForShipping: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/shipping/orders/ready-for-shipping${
        queryString ? `?${queryString}` : ''
      }`
    );
  },
};

// Warehouse Stock Management API calls
export const warehouseAPI = {
  // Get products for stock management (warehouse view)
  getProductsForStock: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/warehouse/products${queryString ? `?${queryString}` : ''}`
    );
  },

  // Update stock quantities (warehouse only)
  updateStock: async (stockData) => {
    if (!stockData.productId) {
      throw new Error('Product ID is required');
    }

    const validatedData = {
      productId: stockData.productId,
      stockOnArrival: parseInt(stockData.stockOnArrival) || 0,
      damagedQty: parseInt(stockData.damagedQty) || 0,
      expiredQty: parseInt(stockData.expiredQty) || 0,
      refurbishedQty: parseInt(stockData.refurbishedQty) || 0,
      finalStock: parseInt(stockData.finalStock) || 0,
      onlineStock: parseInt(stockData.onlineStock) || 0,
      offlineStock: parseInt(stockData.offlineStock) || 0,
      notes: stockData.notes || '',
    };

    return apiCall('/warehouse/update-stock', {
      method: 'PUT',
      body: validatedData,
    });
  },

  // Get stock summary for warehouse
  getStockSummary: async () => {
    return apiCall('/warehouse/stock-summary');
  },

  //////warehouse stock system - manual stock update
  getProductsForStock: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/warehouse/products${queryString ? `?${queryString}` : ''}`
    );
  },

  // Update stock quantities (warehouse only)
  updateStock: async (stockData) => {
    if (!stockData.productId) {
      throw new Error('Product ID is required');
    }

    const validatedData = {
      productId: stockData.productId,
      stockOnArrival: parseInt(stockData.stockOnArrival) || 0,
      damagedQty: parseInt(stockData.damagedQty) || 0,
      expiredQty: parseInt(stockData.expiredQty) || 0,
      refurbishedQty: parseInt(stockData.refurbishedQty) || 0,
      finalStock: parseInt(stockData.finalStock) || 0,
      onlineStock: parseInt(stockData.onlineStock) || 0,
      offlineStock: parseInt(stockData.offlineStock) || 0,
      notes: stockData.notes || '',
    };

    return apiCall('/warehouse/update-stock', {
      method: 'PUT',
      body: validatedData,
    });
  },

  // Get stock summary for warehouse
  getStockSummary: async () => {
    return apiCall('/warehouse/stock-summary');
  },

  // Get warehouse activity log
  getActivityLog: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/warehouse/activity-log${queryString ? `?${queryString}` : ''}`
    );
  },

  // System control endpoints
  getSystemStatus: async () => {
    return apiCall('/warehouse/system-status');
  },

  enableSystem: async () => {
    return apiCall('/warehouse/enable-system', {
      method: 'POST',
    });
  },

  disableSystem: async () => {
    return apiCall('/warehouse/disable-system', {
      method: 'POST',
    });
  },

  updateSystemSettings: async (settings) => {
    return apiCall('/warehouse/system-settings', {
      method: 'PUT',
      body: settings,
    });
  },

  getSystemSettings: async () => {
    return apiCall('/warehouse/system-settings');
  },

  // Export functions
  exportStockData: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/warehouse/export-stock${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Accept: 'text/csv',
        },
      }
    );
  },

  exportActivityLog: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/warehouse/export-activity${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Accept: 'text/csv',
        },
      }
    );
  },

  // Batch operations
  bulkUpdateStock: async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required');
    }

    const validatedUpdates = updates.map((update) => {
      if (!update.productId) {
        throw new Error('Product ID is required for all updates');
      }

      return {
        productId: update.productId,
        stockOnArrival: parseInt(update.stockOnArrival) || 0,
        damagedQty: parseInt(update.damagedQty) || 0,
        expiredQty: parseInt(update.expiredQty) || 0,
        refurbishedQty: parseInt(update.refurbishedQty) || 0,
        finalStock: parseInt(update.finalStock) || 0,
        onlineStock: parseInt(update.onlineStock) || 0,
        offlineStock: parseInt(update.offlineStock) || 0,
        notes: update.notes || '',
      };
    });

    return apiCall('/warehouse/bulk-update-stock', {
      method: 'PUT',
      body: { updates: validatedUpdates },
    });
  },

  // Stock validation
  validateStockData: async (stockData) => {
    return apiCall('/warehouse/validate-stock', {
      method: 'POST',
      body: stockData,
    });
  },

  // Low stock alerts
  getLowStockAlerts: async () => {
    return apiCall('/warehouse/low-stock-alerts');
  },

  // Stock reconciliation
  reconcileStock: async (productId, actualCount) => {
    return apiCall('/warehouse/reconcile-stock', {
      method: 'POST',
      body: {
        productId,
        actualCount: parseInt(actualCount) || 0,
      },
    });
  },
  // Warehouse override management
  disableWarehouseOverride: async (productId) => {
    return apiCall(`/warehouse/products/${productId}/disable-override`, {
      method: 'PATCH',
    });
  },

  syncAllFromStockModel: async () => {
    return apiCall('/warehouse/sync-all-from-stock-model', {
      method: 'POST',
    });
  },
};

// Accounting Pricing API calls
export const accountingAPI = {
  // Get products for pricing management (accountant view)
  getProductsForPricing: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/accounting/products${queryString ? `?${queryString}` : ''}`
    );
  },

  // Update product pricing (accountant only)
  updateProductPricing: async (pricingData) => {
    if (!pricingData.productId) {
      throw new Error('Product ID is required');
    }

    if (!pricingData.subPrice || parseFloat(pricingData.subPrice) <= 0) {
      throw new Error('Sub price is required and must be greater than 0');
    }

    const validatedData = {
      productId: pricingData.productId,
      subPrice: parseFloat(pricingData.subPrice),
      notes: pricingData.notes || '',
    };

    return apiCall('/accounting/update-pricing', {
      method: 'PUT',
      body: validatedData,
    });
  },

  // Get pricing summary for accountants
  getPricingSummary: async () => {
    return apiCall('/accounting/pricing-summary');
  },
};

// Utility functions
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  return error.message || defaultMessage;
};

export const isTokenValid = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (error) {
    return false;
  }
};

// Pricing utility functions
export const pricingUtils = {
  // Format currency for display
  formatCurrency: (amount, currency = 'NGN') => {
    const numAmount = parseFloat(amount) || 0;

    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(numAmount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  },

  // Format number for display
  formatNumber: (number) => {
    return new Intl.NumberFormat('en-NG').format(parseFloat(number) || 0);
  },

  // Calculate total from items
  calculateTotal: (items, field = 'totalPrice') => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
  },

  // Validate pricing calculation data
  validatePricingData: (calculatedItems) => {
    if (!Array.isArray(calculatedItems) || calculatedItems.length === 0) {
      throw new Error('No calculated items provided');
    }

    for (const item of calculatedItems) {
      if (!item.productId) {
        throw new Error('Product ID is required for all items');
      }

      if (!item.calculations) {
        throw new Error('Calculations are required for all items');
      }

      const { costBreakdown, calculatedPrices, appliedMargins } =
        item.calculations;

      // Validate cost breakdown
      if (!costBreakdown) {
        throw new Error('Cost breakdown is required');
      }

      const requiredCostFields = [
        'unitCostInOriginalCurrency',
        'originalCurrency',
        'exchangeRate',
        'unitCostInNaira',
        'freightAndClearingCostPerUnit',
        'totalCostPerUnit',
        'overheadPercentage',
        'overheadAmount',
        'subPrice',
      ];

      for (const field of requiredCostFields) {
        if (
          costBreakdown[field] === undefined ||
          costBreakdown[field] === null
        ) {
          throw new Error(`Cost breakdown field '${field}' is required`);
        }
      }

      // Validate calculated prices
      if (!calculatedPrices) {
        throw new Error('Calculated prices are required');
      }

      const requiredPriceFields = [
        'salePrice',
        'btbPrice',
        'btcPrice',
        'price3weeksDelivery',
        'price5weeksDelivery',
      ];

      for (const field of requiredPriceFields) {
        if (
          calculatedPrices[field] === undefined ||
          calculatedPrices[field] === null
        ) {
          throw new Error(`Price field '${field}' is required`);
        }

        if (parseFloat(calculatedPrices[field]) <= 0) {
          throw new Error(`Price field '${field}' must be greater than 0`);
        }
      }

      // Validate applied margins
      if (!appliedMargins) {
        throw new Error('Applied margins are required');
      }

      for (const field of requiredPriceFields) {
        if (
          appliedMargins[field] === undefined ||
          appliedMargins[field] === null
        ) {
          throw new Error(`Margin field '${field}' is required`);
        }

        if (parseFloat(appliedMargins[field]) < 0) {
          throw new Error(`Margin field '${field}' cannot be negative`);
        }
      }
    }

    return true; // All validations passed
  },

  // Get price types with display information
  getPriceTypes: () => [
    {
      key: 'salePrice',
      label: 'Sale Price',
      description: 'Standard retail sale price',
      color: 'green',
    },
    {
      key: 'btbPrice',
      label: 'BTB Price',
      description: 'Business-to-Business price',
      color: 'blue',
    },
    {
      key: 'btcPrice',
      label: 'BTC Price',
      description: 'Business-to-Consumer price',
      color: 'purple',
    },
    {
      key: 'price3weeksDelivery',
      label: '3 Weeks Delivery',
      description: 'Price for 3 weeks delivery option',
      color: 'orange',
    },
    {
      key: 'price5weeksDelivery',
      label: '5 Weeks Delivery',
      description: 'Price for 5 weeks delivery option',
      color: 'red',
    },
  ],

  // Calculate percentage difference between two prices
  calculatePriceChangePercentage: (oldPrice, newPrice) => {
    const old = parseFloat(oldPrice) || 0;
    const current = parseFloat(newPrice) || 0;

    if (old === 0) return current > 0 ? 100 : 0;
    return ((current - old) / old) * 100;
  },

  // Get price change indicator
  getPriceChangeIndicator: (percentage) => {
    if (Math.abs(percentage) < 1) return { trend: 'stable', color: 'gray' };
    return percentage > 0
      ? { trend: 'increase', color: 'red' }
      : { trend: 'decrease', color: 'green' };
  },

  // Generate pricing summary for display
  generatePricingSummary: (calculatedItems) => {
    if (!Array.isArray(calculatedItems) || calculatedItems.length === 0) {
      return {
        totalItems: 0,
        averageSalePrice: 0,
        totalValue: 0,
        averageMargin: 0,
      };
    }

    const totalItems = calculatedItems.length;
    const totalSalePrice = calculatedItems.reduce(
      (sum, item) =>
        sum + (parseFloat(item.calculations?.calculatedPrices?.salePrice) || 0),
      0
    );
    const averageSalePrice = totalSalePrice / totalItems;

    const totalCost = calculatedItems.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.calculations?.costBreakdown?.totalCostPerUnit) || 0),
      0
    );

    const averageMargin =
      totalCost > 0 ? ((totalSalePrice - totalCost) / totalCost) * 100 : 0;

    return {
      totalItems,
      averageSalePrice,
      totalValue: totalSalePrice,
      averageMargin,
    };
  },

  // Export pricing data to CSV
  exportPricingToCSV: (pricingData) => {
    if (!Array.isArray(pricingData) || pricingData.length === 0) {
      throw new Error('No pricing data to export');
    }

    const headers = [
      'Product Name',
      'SKU',
      'Product Type',
      'Original Cost',
      'Original Currency',
      'Exchange Rate',
      'Cost in NGN',
      'Logistics Cost',
      'Total Cost',
      'Overhead %',
      'Overhead Amount',
      'Sub Price',
      'Sale Price',
      'BTB Price',
      'BTC Price',
      '3 Weeks Price',
      '5 Weeks Price',
      'Sale Margin %',
      'BTB Margin %',
      'BTC Margin %',
      '3 Weeks Margin %',
      '5 Weeks Margin %',
      'Status',
      'Calculated Date',
    ];

    const csvData = pricingData.map((item) => {
      const product = item.productDetails || item.product || {};
      const costBreakdown = item.costBreakdown || {};
      const calculatedPrices = item.calculatedPrices || {};
      const appliedMargins = item.appliedMargins || {};

      return [
        product.name || '',
        product.sku || '',
        product.productType || '',
        costBreakdown.unitCostInOriginalCurrency || 0,
        costBreakdown.originalCurrency || '',
        costBreakdown.exchangeRate || 0,
        costBreakdown.unitCostInNaira || 0,
        costBreakdown.freightAndClearingCostPerUnit || 0,
        costBreakdown.totalCostPerUnit || 0,
        costBreakdown.overheadPercentage || 0,
        costBreakdown.overheadAmount || 0,
        costBreakdown.subPrice || 0,
        calculatedPrices.salePrice || 0,
        calculatedPrices.btbPrice || 0,
        calculatedPrices.btcPrice || 0,
        calculatedPrices.price3weeksDelivery || 0,
        calculatedPrices.price5weeksDelivery || 0,
        appliedMargins.salePrice || 0,
        appliedMargins.btbPrice || 0,
        appliedMargins.btcPrice || 0,
        appliedMargins.price3weeksDelivery || 0,
        appliedMargins.price5weeksDelivery || 0,
        item.isApproved ? 'Approved' : 'Pending',
        new Date(item.calculatedAt || Date.now()).toLocaleDateString(),
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  },

  // Download CSV file
  downloadCSV: (csvContent, filename = 'pricing_data.csv') => {
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
  stockAPI,
  pricingAPI,
  pricingUtils,
  logisticsAPI,
  tagAPI,
  coffeeRoastAreaAPI,
  warehouseAPI,
  accountingAPI,
  attributeAPI,
  getCurrentUser,
  handleApiError,
  isTokenValid,
  getCurrentUser,
  setAuthData,
  clearAuthData,
};
