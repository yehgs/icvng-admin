//admin
// utils/api.js
const API_BASE_URL =
  import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

// admin/src/utils/api.js - FIXED cleanShippingMethodData function

const cleanShippingMethodData = (methodData) => {
  const cleaned = { ...methodData };

  console.log('=== CLEANING SHIPPING METHOD DATA ===');
  console.log('Method type:', cleaned.type);

  // Remove empty strings and convert to appropriate types
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === '') {
      cleaned[key] = undefined;
    }
  });

  // Ensure code is uppercase (will be auto-generated on backend, but just in case)
  if (cleaned.code) {
    cleaned.code = cleaned.code.toUpperCase();
  }

  // ===== PICKUP METHOD CLEANING =====
  if (cleaned.type === 'pickup' && cleaned.pickup) {
    console.log('Cleaning PICKUP method');
    const pickup = cleaned.pickup;

    // FIXED: Ensure proper assignment defaults
    if (
      !pickup.assignment ||
      (pickup.assignment === 'categories' &&
        (!pickup.categories || pickup.categories.length === 0)) ||
      (pickup.assignment === 'specific_products' &&
        (!pickup.products || pickup.products.length === 0))
    ) {
      pickup.assignment = 'all_products';
      pickup.categories = [];
      pickup.products = [];
    }

    // FIXED: Clean zone locations with MANDATORY LGA
    if (pickup.zoneLocations && Array.isArray(pickup.zoneLocations)) {
      console.log('Cleaning zone locations...');

      pickup.zoneLocations = pickup.zoneLocations
        .map((zoneLocation) => {
          if (!zoneLocation.zone || zoneLocation.zone.trim() === '') {
            console.log('Filtering out zone location: no zone');
            return null;
          }

          // Clean locations within this zone
          if (zoneLocation.locations && Array.isArray(zoneLocation.locations)) {
            zoneLocation.locations = zoneLocation.locations
              .filter((location) => {
                // CRITICAL: All fields including LGA must be present
                const isValid =
                  location.name &&
                  location.name.trim() !== '' &&
                  location.address &&
                  location.address.trim() !== '' &&
                  location.city &&
                  location.city.trim() !== '' &&
                  location.state &&
                  location.state.trim() !== '' &&
                  location.lga && // MUST HAVE LGA
                  location.lga.trim() !== '';

                if (!isValid) {
                  console.log('Filtering out invalid location:', {
                    name: location.name || 'missing',
                    hasLga: !!location.lga,
                    hasState: !!location.state,
                  });
                }

                return isValid;
              })
              .map((location) => ({
                name: location.name.trim(),
                address: location.address.trim(),
                city: location.city.trim(),
                state: location.state.trim(),
                lga: location.lga.trim(), // REQUIRED
                postalCode: location.postalCode
                  ? location.postalCode.trim()
                  : '',
                phone: location.phone ? location.phone.trim() : '',
                isActive: location.isActive !== false,
                operatingHours: location.operatingHours || {},
              }));
          }

          // Only keep zone locations that have valid locations
          if (!zoneLocation.locations || zoneLocation.locations.length === 0) {
            console.log('Filtering out zone location: no valid locations');
            return null;
          }

          return zoneLocation;
        })
        .filter(Boolean); // Remove null entries

      console.log(
        'Zone locations after cleaning:',
        pickup.zoneLocations.length
      );
    }

    // FIXED: Clean default locations with MANDATORY LGA
    if (pickup.defaultLocations && Array.isArray(pickup.defaultLocations)) {
      console.log('Cleaning default locations...');

      pickup.defaultLocations = pickup.defaultLocations
        .filter((location) => {
          // CRITICAL: All fields including LGA must be present
          const isValid =
            location.name &&
            location.name.trim() !== '' &&
            location.address &&
            location.address.trim() !== '' &&
            location.city &&
            location.city.trim() !== '' &&
            location.state &&
            location.state.trim() !== '' &&
            location.lga && // MUST HAVE LGA
            location.lga.trim() !== '';

          if (!isValid) {
            console.log('Filtering out invalid default location:', {
              name: location.name || 'missing',
              hasLga: !!location.lga,
              hasState: !!location.state,
            });
          }

          return isValid;
        })
        .map((location) => ({
          name: location.name.trim(),
          address: location.address.trim(),
          city: location.city.trim(),
          state: location.state.trim(),
          lga: location.lga.trim(), // REQUIRED
          postalCode: location.postalCode ? location.postalCode.trim() : '',
          phone: location.phone ? location.phone.trim() : '',
          isActive: location.isActive !== false,
          operatingHours: location.operatingHours || {},
        }));

      console.log(
        'Default locations after cleaning:',
        pickup.defaultLocations.length
      );
    }

    // CRITICAL: Validate that at least one location exists
    const hasZoneLocations =
      pickup.zoneLocations && pickup.zoneLocations.length > 0;
    const hasDefaultLocations =
      pickup.defaultLocations && pickup.defaultLocations.length > 0;

    console.log('Pickup validation:', {
      hasZoneLocations,
      hasDefaultLocations,
      zoneCount: pickup.zoneLocations?.length || 0,
      defaultCount: pickup.defaultLocations?.length || 0,
    });

    if (!hasZoneLocations && !hasDefaultLocations) {
      throw new Error(
        'At least one valid pickup location is required with name, address, city, state, and LGA.'
      );
    }
  }

  // ===== FLAT RATE METHOD CLEANING =====
  if (cleaned.type === 'flat_rate' && cleaned.flatRate) {
    console.log('Cleaning FLAT RATE method');
    const flatRate = cleaned.flatRate;

    // FIXED: Ensure proper assignment defaults
    if (
      !flatRate.assignment ||
      (flatRate.assignment === 'categories' &&
        (!flatRate.categories || flatRate.categories.length === 0)) ||
      (flatRate.assignment === 'specific_products' &&
        (!flatRate.products || flatRate.products.length === 0))
    ) {
      flatRate.assignment = 'all_products';
      flatRate.categories = [];
      flatRate.products = [];
    }

    // Clean zone rates
    if (flatRate.zoneRates && Array.isArray(flatRate.zoneRates)) {
      flatRate.zoneRates = flatRate.zoneRates
        .filter((zoneRate) => zoneRate.zone && zoneRate.zone.trim() !== '')
        .map((zoneRate) => ({
          ...zoneRate,
          cost: Number(zoneRate.cost) || 0,
          freeShipping: {
            enabled: Boolean(zoneRate.freeShipping?.enabled),
            minimumOrderAmount:
              Number(zoneRate.freeShipping?.minimumOrderAmount) || 0,
          },
        }));
      console.log('Flat rate zone rates:', flatRate.zoneRates.length);
    }

    // Ensure numeric values
    flatRate.defaultCost =
      Number(flatRate.defaultCost) || Number(flatRate.cost) || 0;
    flatRate.cost = Number(flatRate.cost) || 0;

    if (flatRate.freeShipping) {
      flatRate.freeShipping.minimumOrderAmount =
        Number(flatRate.freeShipping.minimumOrderAmount) || 0;
    }
  }

  // ===== TABLE SHIPPING METHOD CLEANING =====
  if (cleaned.type === 'table_shipping' && cleaned.tableShipping) {
    console.log('Cleaning TABLE SHIPPING method');
    const tableShipping = cleaned.tableShipping;

    // FIXED: Ensure proper assignment defaults
    if (
      !tableShipping.assignment ||
      (tableShipping.assignment === 'categories' &&
        (!tableShipping.categories || tableShipping.categories.length === 0)) ||
      (tableShipping.assignment === 'specific_products' &&
        (!tableShipping.products || tableShipping.products.length === 0))
    ) {
      tableShipping.assignment = 'all_products';
      tableShipping.categories = [];
      tableShipping.products = [];
    }

    // Clean zone rates
    if (tableShipping.zoneRates && Array.isArray(tableShipping.zoneRates)) {
      tableShipping.zoneRates = tableShipping.zoneRates
        .filter((zoneRate) => zoneRate.zone && zoneRate.zone.trim() !== '')
        .map((zoneRate) => ({
          ...zoneRate,
          weightRanges: (zoneRate.weightRanges || []).map((range) => ({
            minWeight: Number(range.minWeight) || 0,
            maxWeight: Number(range.maxWeight) || 0,
            shippingCost: Number(range.shippingCost) || 0,
          })),
        }));
      console.log('Table shipping zone rates:', tableShipping.zoneRates.length);
    }

    if (!tableShipping.zoneRates || tableShipping.zoneRates.length === 0) {
      throw new Error(
        'At least one zone rate is required for table shipping method'
      );
    }
  }

  // Clean up type-specific data
  if (cleaned.type !== 'pickup') {
    delete cleaned.pickup;
  }
  if (cleaned.type !== 'flat_rate') {
    delete cleaned.flatRate;
  }
  if (cleaned.type !== 'table_shipping') {
    delete cleaned.tableShipping;
  }

  // Ensure required numeric fields
  cleaned.sortOrder = Number(cleaned.sortOrder) || 0;
  cleaned.isActive = Boolean(cleaned.isActive);

  console.log('=== CLEANING COMPLETE ===');
  console.log('Final structure:', {
    type: cleaned.type,
    hasPickup: !!cleaned.pickup,
    hasFlatRate: !!cleaned.flatRate,
    hasTableShipping: !!cleaned.tableShipping,
  });

  return cleaned;
};

// Enhanced error handling wrapper
export const handleShippingMethodSubmission = async (
  methodData,
  isUpdate = false,
  methodId = null
) => {
  try {
    let result;
    if (isUpdate && methodId) {
      result = await logisticsAPI.updateShippingMethod(methodId, methodData);
    } else {
      result = await logisticsAPI.createShippingMethod(methodData);
    }

    return {
      success: true,
      data: result,
      message: isUpdate
        ? 'Shipping method updated successfully'
        : 'Shipping method created successfully',
    };
  } catch (error) {
    console.error('Shipping method submission error:', error);

    // Parse common validation errors
    let userFriendlyMessage = error.message;

    if (error.message.includes('validation failed')) {
      if (
        error.message.includes('pickup.zoneLocations') &&
        error.message.includes('Cast to ObjectId failed')
      ) {
        userFriendlyMessage =
          'Please select a valid zone for all pickup locations, or remove empty zone entries.';
      } else if (
        error.message.includes('address') &&
        error.message.includes('required')
      ) {
        userFriendlyMessage =
          'All pickup locations must have name, address, city, and state filled out.';
      } else if (error.message.includes('pickup.defaultLocations')) {
        userFriendlyMessage =
          'Default pickup locations must have all required fields (name, address, city, state) filled out.';
      }
    }

    return {
      success: false,
      error: userFriendlyMessage,
      originalError: error,
    };
  }
};

// Generic API call function with improved error handling
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');

  // Default headers
  const defaultHeaders = {
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const defaultOptions = {
    headers: defaultHeaders,
  };

  try {
    const processedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers, // Merge user headers but keep Authorization
      },
    };

    // Only stringify non-FormData bodies
    if (
      processedOptions.body &&
      typeof processedOptions.body !== 'string' &&
      !(processedOptions.body instanceof FormData)
    ) {
      processedOptions.body = JSON.stringify(processedOptions.body);
    }

    console.log('🔄 API Call:', endpoint, {
      method: processedOptions.method || 'GET',
      hasAuth: !!processedOptions.headers.Authorization,
      bodyType: processedOptions.body?.constructor?.name,
    });

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      processedOptions
    );

    console.log('📥 Response:', {
      status: response.status,
      statusText: response.statusText,
    });

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
    console.error('❌ API Call Error:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

// utils/api.js - Update apiCall function
export const apiCallFileUploader = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');

  // Debug: Check if token exists
  console.log('=== API CALL DEBUG ===');
  console.log('Token exists:', !!token);
  console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');

  try {
    const processedOptions = {
      method: 'GET',
      ...options,
    };

    // Initialize headers object
    processedOptions.headers = {};

    // Add authorization header if token exists
    if (token) {
      processedOptions.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData vs JSON differently
    if (processedOptions.body instanceof FormData) {
      // For FormData, don't set Content-Type - let browser handle it
      console.log('Processing FormData request');

      // Only add non-Content-Type headers from options
      if (options.headers) {
        Object.keys(options.headers).forEach((key) => {
          if (key.toLowerCase() !== 'content-type') {
            processedOptions.headers[key] = options.headers[key];
          }
        });
      }
    } else {
      // For JSON, set Content-Type and stringify body
      console.log('Processing JSON request');
      processedOptions.headers['Content-Type'] = 'application/json';

      if (processedOptions.body && typeof processedOptions.body !== 'string') {
        processedOptions.body = JSON.stringify(processedOptions.body);
      }

      // Merge any additional headers from options
      if (options.headers) {
        processedOptions.headers = {
          ...processedOptions.headers,
          ...options.headers,
        };
      }
    }

    console.log('Final headers:', processedOptions.headers);
    console.log('Request URL:', `${API_BASE_URL}${endpoint}`);
    console.log('Request method:', processedOptions.method);
    console.log('=== END API CALL DEBUG ===');

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      processedOptions
    );

    console.log('Responsse status:', response.status);
    console.log('Response headers:', response.headers);

    const data = await response.json();
    console.log('Response data:', data);

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
    console.error('API Call Error:', error);
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
// Update your fileAPI.uploadFile function in utils/api.js for better debugging

// In your api.js file
export const fileAPI = {
  uploadImage: async (file) => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('=== IMAGE UPLOAD DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('File to upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/file/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // ✅ ADD THIS!
        },
        body: formData,
        // Don't set Content-Type - browser will set it with boundary
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(
          errorData.message || `Upload failed: ${response.status}`
        );
      }

      const data = await response.json();
      console.log('Upload response:', data);
      return data;
    } catch (error) {
      console.error('Upload API error:', error);
      throw error;
    }
  },

  // Keep your existing uploadFile (it already has the Authorization header)
  uploadFile: async (file) => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Token exists:', !!token);
    console.log('File to upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/file/upload-file`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Already correct
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        throw new Error(
          errorData.message || `Upload failed: ${response.status}`
        );
      }

      const data = await response.json();
      console.log('Upload response:', data);
      return data;
    } catch (error) {
      console.error('Upload API error:', error);
      throw error;
    }
  },

  deleteFile: async (publicId) => {
    if (!publicId) {
      throw new Error('Public ID is required for file deletion');
    }

    try {
      const encodedPublicId = encodeURIComponent(publicId);
      const response = await apiCall(`/file/delete-file/${encodedPublicId}`, {
        method: 'DELETE',
      });

      console.log('Delete response:', response);
      return response;
    } catch (error) {
      console.error('Delete API error:', error);
      throw error;
    }
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
  // ===== SHIPPING ZONES =====

  getShippingZones: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const response = await apiCall(
      `/shipping/zones${queryString ? `?${queryString}` : ''}`
    );

    console.log('Get zones response:', response);
    return response;
  },

  getAllZones: async (params = {}) => {
    try {
      console.log('🔄 Fetching ALL zones (no pagination)...', params);

      const queryParams = new URLSearchParams();

      // Add query parameters if provided
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const endpoint = `/shipping/zones/all${
        queryString ? `?${queryString}` : ''
      }`;

      console.log('📡 API Endpoint:', endpoint);

      const response = await apiCall(endpoint);

      console.log('✅ Get all zones response:', {
        success: response.success,
        count: response.data?.length,
        totalCount: response.totalCount,
      });

      // Validate response
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch all zones');
      }

      if (!Array.isArray(response.data)) {
        console.warn('⚠️ Response data is not an array:', response.data);
        return {
          ...response,
          data: [],
        };
      }

      return response;
    } catch (error) {
      console.error('❌ Get all zones API error:', error);
      throw error;
    }
  },

  createShippingZone: async (zoneData) => {
    try {
      console.log('=== API: Creating shipping zone ===');
      console.log('Zone data to send:', JSON.stringify(zoneData, null, 2));

      // Validate required fields
      if (!zoneData.name || !zoneData.name.trim()) {
        throw new Error('Zone name is required');
      }

      if (
        !zoneData.states ||
        !Array.isArray(zoneData.states) ||
        zoneData.states.length === 0
      ) {
        throw new Error('At least one state is required');
      }

      // Clean the data
      const cleanedData = {
        name: zoneData.name.trim(),
        description: zoneData.description?.trim() || '',
        states: zoneData.states.map((state) => ({
          name: state.name,
          code: state.code,
          coverage_type: state.coverage_type || 'all',
          available_lgas: state.available_lgas || [],
          covered_lgas:
            state.coverage_type === 'specific' ? state.covered_lgas || [] : [],
        })),
        zone_type: zoneData.zone_type || 'mixed',
        priority: zoneData.priority || 'medium',
        isActive: zoneData.isActive !== undefined ? zoneData.isActive : true,
        sortOrder: zoneData.sortOrder || 0,
        operational_notes: zoneData.operational_notes?.trim() || '',
      };

      console.log('Cleaned zone data:', JSON.stringify(cleanedData, null, 2));

      const response = await apiCall('/shipping/zones', {
        method: 'POST',
        body: cleanedData,
      });

      console.log('Create zone response:', response);
      return response;
    } catch (error) {
      console.error('❌ Create shipping zone API error:', error);
      throw error;
    }
  },

  updateShippingZone: async (zoneId, zoneData) => {
    try {
      console.log('=== API: Updating shipping zone ===');
      console.log('Zone ID:', zoneId);
      console.log('Zone data to send:', JSON.stringify(zoneData, null, 2));

      if (!zoneId) {
        throw new Error('Zone ID is required');
      }

      // Clean the data
      const cleanedData = {
        name: zoneData.name?.trim(),
        description: zoneData.description?.trim() || '',
        states: zoneData.states?.map((state) => ({
          name: state.name,
          code: state.code,
          coverage_type: state.coverage_type || 'all',
          available_lgas: state.available_lgas || [],
          covered_lgas:
            state.coverage_type === 'specific' ? state.covered_lgas || [] : [],
        })),
        zone_type: zoneData.zone_type,
        priority: zoneData.priority,
        isActive: zoneData.isActive,
        sortOrder: zoneData.sortOrder,
        operational_notes: zoneData.operational_notes?.trim() || '',
      };

      console.log('Cleaned zone data:', JSON.stringify(cleanedData, null, 2));

      const response = await apiCall(`/shipping/zones/${zoneId}`, {
        method: 'PUT',
        body: cleanedData,
      });

      console.log('Update zone response:', response);
      return response;
    } catch (error) {
      console.error('❌ Update shipping zone API error:', error);
      throw error;
    }
  },

  getZoneDependencies: async (zoneId) => {
    if (!zoneId) {
      throw new Error('Zone ID is required');
    }

    return apiCall(`/shipping/zones/${zoneId}/dependencies`);
  },

  deleteShippingZone: async (zoneId, cascadeDelete = false) => {
    if (!zoneId) {
      throw new Error('Zone ID is required');
    }

    const queryParam = cascadeDelete ? '?cascadeDelete=true' : '';
    return apiCall(`/shipping/zones/${zoneId}${queryParam}`, {
      method: 'DELETE',
    });
  },

  // ===== SHIPPING METHODS =====

  getShippingMethods: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const response = await apiCall(
      `/shipping/methods${queryString ? `?${queryString}` : ''}`
    );

    console.log('Get methods response:', response);
    return response;
  },

  createShippingMethod: async (methodData) => {
    try {
      console.log('=== API: Creating shipping method ===');

      // Use the existing cleanShippingMethodData function from your api.js
      const cleanedData = cleanShippingMethodData(methodData);

      console.log('Sending cleaned method data to backend');

      const response = await apiCall('/shipping/methods', {
        method: 'POST',
        body: cleanedData,
      });

      console.log('Create method response:', response);
      return response;
    } catch (error) {
      console.error('❌ Create shipping method API error:', error);
      throw error;
    }
  },

  updateShippingMethod: async (methodId, methodData) => {
    try {
      console.log('=== API: Updating shipping method ===');
      console.log('Method ID:', methodId);

      if (!methodId) {
        throw new Error('Method ID is required');
      }

      // Use the existing cleanShippingMethodData function
      const cleanedData = cleanShippingMethodData(methodData);

      console.log('Sending cleaned method data to backend');

      const response = await apiCall(`/shipping/methods/${methodId}`, {
        method: 'PUT',
        body: cleanedData,
      });

      console.log('Update method response:', response);
      return response;
    } catch (error) {
      console.error('❌ Update shipping method API error:', error);
      throw error;
    }
  },

  deleteShippingMethod: async (methodId) => {
    if (!methodId) {
      throw new Error('Method ID is required');
    }

    return apiCall(`/shipping/methods/${methodId}`, {
      method: 'DELETE',
    });
  },

  // ===== CATEGORIES AND PRODUCTS FOR ASSIGNMENT =====

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

  // ===== CALCULATE SHIPPING =====

  calculateShippingCost: async (orderData) => {
    return apiCall('/shipping/calculate-checkout', {
      method: 'POST',
      body: orderData,
    });
  },

  // ===== TRACKING =====

  createShipment: async (shipmentData) => {
    return apiCall('/shipping/shipments', {
      method: 'POST',
      body: shipmentData,
    });
  },

  updateTracking: async (trackingId, updateData) => {
    if (!trackingId) {
      throw new Error('Tracking ID is required');
    }

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
    if (!trackingNumber) {
      throw new Error('Tracking number is required');
    }

    return apiCall(`/shipping/track/${trackingNumber}`);
  },

  getTrackingStats: async () => {
    return apiCall('/shipping/trackings/stats');
  },

  // ===== DASHBOARD =====

  getShippingDashboardStats: async () => {
    return apiCall('/shipping/dashboard/stats');
  },

  // ===== ORDERS =====

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

  // NEW: Update product weight (warehouse only, no approval required)
  updateWeight: async (productId, weight) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const validatedData = {
      productId,
      weight: parseFloat(weight) || 0,
    };

    return apiCall('/warehouse/update-weight', {
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

// Direct Pricing API calls - Independent pricing system
export const directPricingAPI = {
  // Create or update direct pricing for a product (bulk update)
  createOrUpdateDirectPricing: async (pricingData) => {
    const validatedData = {
      productId: pricingData.productId,
      prices: {},
      notes: pricingData.notes || '',
    };

    if (!validatedData.productId) {
      throw new Error('Product ID is required');
    }

    // Validate and clean price data
    const validPriceTypes = [
      'salePrice',
      'btbPrice',
      'btcPrice',
      'price3weeksDelivery',
      'price5weeksDelivery',
    ];
    let hasValidPrice = false;

    validPriceTypes.forEach((priceType) => {
      if (pricingData.prices && pricingData.prices[priceType] !== undefined) {
        const price = parseFloat(pricingData.prices[priceType]);
        if (!isNaN(price) && price >= 0) {
          validatedData.prices[priceType] = price;
          if (price > 0) hasValidPrice = true;
        }
      }
    });

    if (!hasValidPrice) {
      throw new Error('At least one valid price greater than 0 is required');
    }

    return apiCall('/direct-pricing/create-update', {
      method: 'POST',
      body: validatedData,
    });
  },

  // get product for direct pricing exclude edited products
  getAvailableProducts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/direct-pricing/available-products${
        queryString ? `?${queryString}` : ''
      }`
    );
  },

  // Update a single price type
  updateSinglePrice: async (updateData) => {
    const validatedData = {
      productId: updateData.productId,
      priceType: updateData.priceType,
      price: parseFloat(updateData.price) || 0,
      notes: updateData.notes || '',
    };

    if (!validatedData.productId) {
      throw new Error('Product ID is required');
    }

    const validPriceTypes = [
      'salePrice',
      'btbPrice',
      'btcPrice',
      'price3weeksDelivery',
      'price5weeksDelivery',
    ];
    if (!validPriceTypes.includes(validatedData.priceType)) {
      throw new Error(
        `Invalid price type. Must be one of: ${validPriceTypes.join(', ')}`
      );
    }

    if (validatedData.price < 0) {
      throw new Error('Price must be greater than or equal to 0');
    }

    return apiCall('/direct-pricing/update-single', {
      method: 'PUT',
      body: validatedData,
    });
  },

  // Get direct pricing for a specific product
  getDirectPricing: async (productId) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return apiCall(`/direct-pricing/product/${productId}`);
  },

  // Get all products with direct pricing (with filters)
  getDirectPricingList: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/direct-pricing/list${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get price history for a product
  getPriceHistory: async (productId, limit = 50) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const queryParams = new URLSearchParams({ limit: limit.toString() });
    return apiCall(
      `/direct-pricing/history/${productId}?${queryParams.toString()}`
    );
  },

  // Delete direct pricing for a product
  deleteDirectPricing: async (productId) => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    return apiCall(`/direct-pricing/product/${productId}`, {
      method: 'DELETE',
    });
  },

  // Get direct pricing statistics
  getDirectPricingStats: async () => {
    return apiCall('/direct-pricing/stats');
  },

  // Utility: Get products that don't have direct pricing yet
  getProductsWithoutDirectPricing: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    queryParams.append('hasDirectPricing', 'false');

    const queryString = queryParams.toString();
    return productAPI.getProducts({ ...params, hasDirectPricing: false });
  },

  // Bulk operations
  bulkUpdatePrices: async (updates) => {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required');
    }

    const validatedUpdates = updates.map((update) => {
      if (!update.productId) {
        throw new Error('Product ID is required for all updates');
      }

      const validatedUpdate = {
        productId: update.productId,
        prices: {},
        notes: update.notes || '',
      };

      const validPriceTypes = [
        'salePrice',
        'btbPrice',
        'btcPrice',
        'price3weeksDelivery',
        'price5weeksDelivery',
      ];
      validPriceTypes.forEach((priceType) => {
        if (update.prices && update.prices[priceType] !== undefined) {
          const price = parseFloat(update.prices[priceType]);
          if (!isNaN(price) && price >= 0) {
            validatedUpdate.prices[priceType] = price;
          }
        }
      });

      return validatedUpdate;
    });

    return apiCall('/direct-pricing/bulk-update', {
      method: 'POST',
      body: { updates: validatedUpdates },
    });
  },

  // Export direct pricing data
  exportDirectPricingData: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/direct-pricing/export${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Accept: 'text/csv',
        },
      }
    );
  },
};

// Direct pricing utility functions
export const directPricingUtils = {
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

  // Get price types with display information
  getPriceTypes: () => [
    {
      key: 'salePrice',
      label: 'Sale Price',
      description: 'Standard retail sale price',
      color: 'green',
      icon: '💰',
    },
    {
      key: 'btbPrice',
      label: 'BTB Price',
      description: 'Business-to-Business price',
      color: 'blue',
      icon: '🏢',
    },
    {
      key: 'btcPrice',
      label: 'BTC Price',
      description: 'Business-to-Consumer price',
      color: 'purple',
      icon: '👤',
    },
    {
      key: 'price3weeksDelivery',
      label: '3 Weeks Delivery',
      description: 'Price for 3 weeks delivery option',
      color: 'orange',
      icon: '📦',
    },
    {
      key: 'price5weeksDelivery',
      label: '5 Weeks Delivery',
      description: 'Price for 5 weeks delivery option',
      color: 'red',
      icon: '🚛',
    },
  ],

  // Validate price data
  validatePriceData: (prices) => {
    const errors = {};
    const validPriceTypes = [
      'salePrice',
      'btbPrice',
      'btcPrice',
      'price3weeksDelivery',
      'price5weeksDelivery',
    ];

    let hasValidPrice = false;

    validPriceTypes.forEach((priceType) => {
      if (prices[priceType] !== undefined) {
        const price = parseFloat(prices[priceType]);

        if (isNaN(price)) {
          errors[priceType] = 'Must be a valid number';
        } else if (price < 0) {
          errors[priceType] = 'Price cannot be negative';
        } else if (price > 0) {
          hasValidPrice = true;
        }
      }
    });

    if (!hasValidPrice) {
      errors.general = 'At least one price must be greater than 0';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Calculate price differences
  calculatePriceDifference: (oldPrice, newPrice) => {
    const old = parseFloat(oldPrice) || 0;
    const current = parseFloat(newPrice) || 0;

    const difference = current - old;
    const percentage = old > 0 ? (difference / old) * 100 : 0;

    return {
      absolute: difference,
      percentage,
      trend:
        difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'stable',
    };
  },

  // Get price change indicator
  getPriceChangeIndicator: (difference) => {
    if (Math.abs(difference.percentage) < 0.01) {
      return { trend: 'stable', color: 'gray', icon: '➖' };
    }

    return difference.percentage > 0
      ? { trend: 'increase', color: 'red', icon: '📈' }
      : { trend: 'decrease', color: 'green', icon: '📉' };
  },

  // Generate direct pricing summary
  generatePricingSummary: (directPricingList) => {
    if (!Array.isArray(directPricingList) || directPricingList.length === 0) {
      return {
        totalProducts: 0,
        averagePrices: {
          salePrice: 0,
          btbPrice: 0,
          btcPrice: 0,
          price3weeksDelivery: 0,
          price5weeksDelivery: 0,
        },
        totalValue: 0,
        recentUpdates: 0,
      };
    }

    const totalProducts = directPricingList.length;
    const priceTypes = [
      'salePrice',
      'btbPrice',
      'btcPrice',
      'price3weeksDelivery',
      'price5weeksDelivery',
    ];

    const averagePrices = {};
    let totalValue = 0;
    let recentUpdates = 0;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    priceTypes.forEach((priceType) => {
      const validPrices = directPricingList
        .map((item) => parseFloat(item.directPrices?.[priceType]) || 0)
        .filter((price) => price > 0);

      averagePrices[priceType] =
        validPrices.length > 0
          ? validPrices.reduce((sum, price) => sum + price, 0) /
            validPrices.length
          : 0;
    });

    directPricingList.forEach((item) => {
      // Add to total value (using sale price as primary)
      totalValue += parseFloat(item.directPrices?.salePrice) || 0;

      // Count recent updates
      if (new Date(item.lastUpdatedAt) > oneDayAgo) {
        recentUpdates++;
      }
    });

    return {
      totalProducts,
      averagePrices,
      totalValue,
      recentUpdates,
    };
  },

  // Export direct pricing to CSV
  exportDirectPricingToCSV: (directPricingData) => {
    if (!Array.isArray(directPricingData) || directPricingData.length === 0) {
      throw new Error('No direct pricing data to export');
    }

    const headers = [
      'Product Name',
      'SKU',
      'Product Type',
      'Sale Price',
      'BTB Price',
      'BTC Price',
      '3 Weeks Delivery Price',
      '5 Weeks Delivery Price',
      'Last Updated',
      'Updated By',
      'Notes',
      'Sale Price Updated By',
      'Sale Price Updated At',
      'BTB Price Updated By',
      'BTB Price Updated At',
      'BTC Price Updated By',
      'BTC Price Updated At',
      '3 Weeks Updated By',
      '3 Weeks Updated At',
      '5 Weeks Updated By',
      '5 Weeks Updated At',
    ];

    const csvData = directPricingData.map((item) => {
      const product = item.productDetails || {};
      const prices = item.directPrices || {};
      const priceUpdatedBy = item.priceUpdatedBy || {};
      const lastUpdatedBy = item.lastUpdatedByDetails?.[0] || {};

      return [
        product.name || '',
        product.sku || '',
        product.productType || '',
        prices.salePrice || 0,
        prices.btbPrice || 0,
        prices.btcPrice || 0,
        prices.price3weeksDelivery || 0,
        prices.price5weeksDelivery || 0,
        new Date(item.lastUpdatedAt).toLocaleDateString(),
        lastUpdatedBy.name || '',
        item.notes || '',
        priceUpdatedBy.salePrice?.updatedBy?.name || '',
        priceUpdatedBy.salePrice?.updatedAt
          ? new Date(priceUpdatedBy.salePrice.updatedAt).toLocaleDateString()
          : '',
        priceUpdatedBy.btbPrice?.updatedBy?.name || '',
        priceUpdatedBy.btbPrice?.updatedAt
          ? new Date(priceUpdatedBy.btbPrice.updatedAt).toLocaleDateString()
          : '',
        priceUpdatedBy.btcPrice?.updatedBy?.name || '',
        priceUpdatedBy.btcPrice?.updatedAt
          ? new Date(priceUpdatedBy.btcPrice.updatedAt).toLocaleDateString()
          : '',
        priceUpdatedBy.price3weeksDelivery?.updatedBy?.name || '',
        priceUpdatedBy.price3weeksDelivery?.updatedAt
          ? new Date(
              priceUpdatedBy.price3weeksDelivery.updatedAt
            ).toLocaleDateString()
          : '',
        priceUpdatedBy.price5weeksDelivery?.updatedBy?.name || '',
        priceUpdatedBy.price5weeksDelivery?.updatedAt
          ? new Date(
              priceUpdatedBy.price5weeksDelivery.updatedAt
            ).toLocaleDateString()
          : '',
      ];
    });

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  },

  // Download CSV file
  downloadCSV: (csvContent, filename = 'direct_pricing_data.csv') => {
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

  // Check if user can edit direct pricing
  canEditDirectPricing: (userRole, userSubRole) => {
    return ['ACCOUNTANT', 'DIRECTOR', 'IT'].includes(userSubRole || userRole);
  },

  // Check if user can delete direct pricing
  canDeleteDirectPricing: (userRole, userSubRole) => {
    return ['DIRECTOR', 'IT'].includes(userSubRole || userRole);
  },

  // Format date for display
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Get price type color class for UI
  getPriceTypeColorClass: (priceType) => {
    const colorMap = {
      salePrice: 'text-green-600 bg-green-50',
      btbPrice: 'text-blue-600 bg-blue-50',
      btcPrice: 'text-purple-600 bg-purple-50',
      price3weeksDelivery: 'text-orange-600 bg-orange-50',
      price5weeksDelivery: 'text-red-600 bg-red-50',
    };
    return colorMap[priceType] || 'text-gray-600 bg-gray-50';
  },
};

// Utility functions
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

export const blogAPI = {
  // Categories
  getCategories: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(
      `/blog/admin/categories${queryString ? `?${queryString}` : ''}`
    );
  },

  getCategory: async (categoryId) => {
    return apiCall(`/blog/admin/categories/${categoryId}`);
  },

  createCategory: async (categoryData) => {
    return apiCall('/blog/admin/categories', {
      method: 'POST',
      body: categoryData,
    });
  },

  updateCategory: async (categoryId, categoryData) => {
    return apiCall(`/blog/admin/categories/${categoryId}`, {
      method: 'PUT',
      body: categoryData,
    });
  },

  deleteCategory: async (categoryId) => {
    return apiCall(`/blog/admin/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  // Tags
  getTags: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/blog/admin/tags${queryString ? `?${queryString}` : ''}`);
  },

  getTag: async (tagId) => {
    return apiCall(`/blog/admin/tags/${tagId}`);
  },

  createTag: async (tagData) => {
    return apiCall('/blog/admin/tags', {
      method: 'POST',
      body: tagData,
    });
  },

  updateTag: async (tagId, tagData) => {
    return apiCall(`/blog/admin/tags/${tagId}`, {
      method: 'PUT',
      body: tagData,
    });
  },

  deleteTag: async (tagId) => {
    return apiCall(`/blog/admin/tags/${tagId}`, {
      method: 'DELETE',
    });
  },

  // Posts
  getPosts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/blog/admin/posts${queryString ? `?${queryString}` : ''}`);
  },

  getPost: async (postId) => {
    return apiCall(`/blog/admin/posts/${postId}`);
  },

  createPost: async (postData) => {
    return apiCall('/blog/admin/posts', {
      method: 'POST',
      body: postData,
    });
  },

  updatePost: async (postId, postData) => {
    return apiCall(`/blog/admin/posts/${postId}`, {
      method: 'PUT',
      body: postData,
    });
  },

  toggleFeatured: async (postId) => {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    return apiCall(`/blog/admin/posts/${postId}/toggle-featured`, {
      method: 'PATCH',
    });
  },

  deletePost: async (postId) => {
    return apiCall(`/blog/admin/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  // Public endpoints for frontend
  getPublicCategories: async () => {
    return apiCall('/blog/public/categories');
  },

  getPublicTags: async () => {
    return apiCall('/blog/public/tags');
  },

  getPublicPosts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return apiCall(`/blog/public/posts${queryString ? `?${queryString}` : ''}`);
  },

  getPublicPostBySlug: async (slug) => {
    return apiCall(`/blog/public/posts/slug/${slug}`);
  },

  getFeaturedPosts: async (limit = 6) => {
    return apiCall(`/blog/public/posts/featured?limit=${limit}`);
  },

  getRelatedPosts: async (postId, limit = 4) => {
    return apiCall(`/blog/public/posts/${postId}/related?limit=${limit}`);
  },
};

// Add this to your utils/api.js file (customerAPI section)

export const customerAPI = {
  // Get customers list
  getCustomers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    return apiCall(
      `/admin/customers/list${queryString ? `?${queryString}` : ''}`
    );
  },

  // Create customer
  createCustomer: async (customerData) => {
    return apiCall('/admin/customers/create', {
      method: 'POST',
      body: customerData,
    });
  },

  // Update customer
  updateCustomer: async (customerId, customerData) => {
    return apiCall(`/admin/customers/${customerId}`, {
      method: 'PUT',
      body: customerData,
    });
  },

  // Get customer details
  getCustomerDetails: async (customerId) => {
    return apiCall(`/admin/customers/${customerId}`);
  },

  // Get customers for order dropdown
  getCustomersForOrder: async () => {
    return apiCall('/admin/customers/for-order');
  },

  // Assign customer to users (DIRECTOR, IT, MANAGER only)
  assignCustomer: async (customerId, assignmentData) => {
    return apiCall(`/admin/customers/${customerId}/assign`, {
      method: 'PUT',
      body: assignmentData,
    });
  },

  // Get assignable users
  getAssignableUsers: async () => {
    return apiCall('/admin/customers/assignable-users');
  },

  // Export customers (DIRECTOR and IT only)
  exportCustomers: async () => {
    return apiCall('/admin/customers/export/csv');
  },

  toggleFeaturedCustomer: async (customerId) => {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    return apiCall(`/admin/customers/${customerId}/toggle-featured`, {
      method: 'PATCH',
    });
  },

  // Get featured customers (public/all users)
  getFeaturedCustomers: async (limit = 10) => {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    return apiCall(`/admin/customers/featured?${queryParams.toString()}`);
  },
};

// Admin order management API calls
export const adminOrderAPI = {
  getOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    return apiCall(`/admin/orders/list${queryString ? `?${queryString}` : ''}`);
  },

  createOrder: async (orderData) => {
    return apiCall('/admin/orders/create', {
      method: 'POST',
      body: orderData,
    });
  },

  updateOrderStatus: async (orderId, statusData) => {
    return apiCall(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: statusData,
    });
  },

  generateInvoice: async (orderId) => {
    return apiCall(`/admin/orders/${orderId}/invoice`, {
      method: 'POST',
    });
  },

  getAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    const queryString = queryParams.toString();
    return apiCall(
      `/admin/orders/analytics${queryString ? `?${queryString}` : ''}`
    );
  },
};

export const setAuthData = (accessToken, refreshToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
  localStorage.setItem('user', JSON.stringify(user));
};
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export default {
  blogAPI,
  authAPI,
  userAPI,
  supplierAPI,
  purchaseOrderAPI,
  exchangeRateAPI,
  exchangeRateUtils,
  directPricingAPI,
  directPricingUtils,
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
  customerAPI,
  adminOrderAPI,
  getCurrentUser,
  handleApiError,
  isTokenValid,
  getCurrentUser,
  setAuthData,
  clearAuthData,
};
