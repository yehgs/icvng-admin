// admin/src/components/logistics/LogisticsMethodModal.jsx - Updated table shipping
import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  DollarSign,
  MapPin,
  Calendar,
  Package,
  Search,
  ChevronDown,
  Check,
} from 'lucide-react';
import { logisticsAPI } from '../../utils/api.js';

const LogisticsMethodModal = ({
  isOpen,
  onClose,
  onSubmit,
  method,
  zones,
  loading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'flat_rate',
    isActive: true,
    sortOrder: 0,

    // Enhanced flat rate configuration with zone support
    flatRate: {
      defaultCost: 0, // Used when no zone-specific rates
      cost: 0, // Backward compatibility
      assignment: 'all_products',
      categories: [],
      products: [],
      zoneRates: [], // NEW: Zone-specific rates
      freeShipping: {
        enabled: false,
        minimumOrderAmount: 0,
      },
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
    },

    // Table shipping configuration (unchanged)
    tableShipping: {
      assignment: 'all_products',
      categories: [],
      products: [],
      zoneRates: [],
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
    },

    // Enhanced pickup configuration with zone support
    pickup: {
      assignment: 'all_products',
      categories: [],
      products: [],
      zoneLocations: [], // NEW: Zone-specific locations
      defaultLocations: [
        // Used when no zone-specific locations
        {
          name: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          phone: '',
          operatingHours: {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' },
            saturday: { open: '09:00', close: '14:00' },
            sunday: { open: '', close: '' },
          },
          isActive: true,
        },
      ],
      cost: 0,
    },
  });

  const [errors, setErrors] = useState({});

  // Category and Product states
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Fetch categories
  const fetchCategories = async (search = '', page = 1) => {
    try {
      setCategoriesLoading(true);
      const response = await logisticsAPI.getCategoriesForAssignment({
        search,
        page,
        limit: 50,
      });

      if (page === 1) {
        setCategories(response.data || []);
      } else {
        setCategories((prev) => [...prev, ...(response.data || [])]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async (search = '', page = 1, category = '') => {
    try {
      setProductsLoading(true);
      const response = await logisticsAPI.getProductsForAssignment({
        search,
        page,
        limit: 50,
        category,
      });

      if (page === 1) {
        setProducts(response.data || []);
      } else {
        setProducts((prev) => [...prev, ...(response.data || [])]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load categories and products on modal open
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchProducts();
    }
  }, [isOpen]);

  // Handle category search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (categoryDropdownOpen) {
        setCategoryPage(1);
        fetchCategories(categorySearch, 1);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [categorySearch, categoryDropdownOpen]);

  // Handle product search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (productDropdownOpen) {
        setProductPage(1);
        fetchProducts(productSearch, 1);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [productSearch, productDropdownOpen]);

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name || '',
        code: method.code || '',
        description: method.description || '',
        type: method.type || 'flat_rate',
        isActive: method.isActive !== undefined ? method.isActive : true,
        sortOrder: method.sortOrder || 0,

        flatRate: method.flatRate
          ? {
              defaultCost:
                method.flatRate.defaultCost || method.flatRate.cost || 0,
              cost: method.flatRate.cost || 0,
              assignment: method.flatRate.assignment || 'all_products',
              categories: method.flatRate.categories || [],
              products: method.flatRate.products || [],
              zoneRates: method.flatRate.zoneRates || [],
              freeShipping: method.flatRate.freeShipping || {
                enabled: false,
                minimumOrderAmount: 0,
              },
              validFrom: method.flatRate.validFrom
                ? method.flatRate.validFrom.split('T')[0]
                : new Date().toISOString().split('T')[0],
              validUntil: method.flatRate.validUntil
                ? method.flatRate.validUntil.split('T')[0]
                : '',
            }
          : {
              defaultCost: 0,
              cost: 0,
              assignment: 'all_products',
              categories: [],
              products: [],
              zoneRates: [],
              freeShipping: { enabled: false, minimumOrderAmount: 0 },
              validFrom: new Date().toISOString().split('T')[0],
              validUntil: '',
            },

        tableShipping: method.tableShipping || {
          assignment: 'all_products',
          categories: [],
          products: [],
          zoneRates: [],
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: '',
        },

        pickup: method.pickup
          ? {
              assignment: method.pickup.assignment || 'all_products',
              categories: method.pickup.categories || [],
              products: method.pickup.products || [],
              zoneLocations: method.pickup.zoneLocations || [],
              defaultLocations:
                method.pickup.defaultLocations || method.pickup.locations || [],
              cost: method.pickup.cost || 0,
            }
          : {
              assignment: 'all_products',
              categories: [],
              products: [],
              zoneLocations: [],
              defaultLocations: [],
              cost: 0,
            },
      });
    } else {
      // Reset form for new method (same as initial state)
      setFormData({
        name: '',
        code: '',
        description: '',
        type: 'flat_rate',
        isActive: true,
        sortOrder: 0,
        flatRate: {
          defaultCost: 0,
          cost: 0,
          assignment: 'all_products',
          categories: [],
          products: [],
          zoneRates: [],
          freeShipping: { enabled: false, minimumOrderAmount: 0 },
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: '',
        },
        tableShipping: {
          assignment: 'all_products',
          categories: [],
          products: [],
          zoneRates: [],
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: '',
        },
        pickup: {
          assignment: 'all_products',
          categories: [],
          products: [],
          zoneLocations: [],
          defaultLocations: [
            {
              name: '',
              address: '',
              city: '',
              state: '',
              postalCode: '',
              phone: '',
              operatingHours: {
                monday: { open: '09:00', close: '17:00' },
                tuesday: { open: '09:00', close: '17:00' },
                wednesday: { open: '09:00', close: '17:00' },
                thursday: { open: '09:00', close: '17:00' },
                friday: { open: '09:00', close: '17:00' },
                saturday: { open: '09:00', close: '14:00' },
                sunday: { open: '', close: '' },
              },
              isActive: true,
            },
          ],
          cost: 0,
        },
      });
    }
    setErrors({});
  }, [method]);

  const updateFlatRateZoneRate = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      flatRate: {
        ...prev.flatRate,
        zoneRates: prev.flatRate.zoneRates.map((rate, i) =>
          i === index ? { ...rate, [field]: value } : rate
        ),
      },
    }));
  };

  const removeFlatRateZoneRate = (index) => {
    setFormData((prev) => ({
      ...prev,
      flatRate: {
        ...prev.flatRate,
        zoneRates: prev.flatRate.zoneRates.filter((_, i) => i !== index),
      },
    }));
  };

  // Pickup Zone Location Functions
  const addZoneLocationToPickup = () => {
    const newZoneLocation = {
      zone: '',
      locations: [
        {
          name: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          phone: '',
          operatingHours: {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' },
            saturday: { open: '09:00', close: '14:00' },
            sunday: { open: '', close: '' },
          },
          isActive: true,
        },
      ],
    };

    setFormData((prev) => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        zoneLocations: [...prev.pickup.zoneLocations, newZoneLocation],
      },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Method name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Method code is required';
    }

    if (formData.type === 'flat_rate' && formData.flatRate.defaultCost < 0) {
      newErrors.flatRateCost = 'Cost cannot be negative';
    }

    if (
      formData.type === 'table_shipping' &&
      formData.tableShipping.zoneRates.length === 0
    ) {
      newErrors.tableShippingZones =
        'At least one zone rate is required for table shipping';
    }

    if (
      formData.type === 'pickup' &&
      formData.pickup.defaultLocations.length === 0 &&
      formData.pickup.zoneLocations.length === 0
    ) {
      newErrors.pickupLocations = 'At least one pickup location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleConfigChange = (configType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [configType]: {
        ...prev[configType],
        [field]: value,
      },
    }));
  };

  const handleNestedConfigChange = (configType, nestedField, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [configType]: {
        ...prev[configType],
        [nestedField]: {
          ...prev[configType][nestedField],
          [field]: value,
        },
      },
    }));
  };

  // Category selection handlers
  const handleCategorySelect = (configType, categoryId) => {
    const currentCategories = formData[configType].categories;
    const isSelected = currentCategories.includes(categoryId);

    const updatedCategories = isSelected
      ? currentCategories.filter((id) => id !== categoryId)
      : [...currentCategories, categoryId];

    handleConfigChange(configType, 'categories', updatedCategories);
  };

  // Product selection handlers
  const handleProductSelect = (configType, productId) => {
    const currentProducts = formData[configType].products;
    const isSelected = currentProducts.includes(productId);

    const updatedProducts = isSelected
      ? currentProducts.filter((id) => id !== productId)
      : [...currentProducts, productId];

    handleConfigChange(configType, 'products', updatedProducts);
  };

  // Get selected category names for display
  const getSelectedCategoryNames = (configType) => {
    const selectedIds = formData[configType].categories;
    return categories
      .filter((cat) => selectedIds.includes(cat._id))
      .map((cat) => cat.name);
  };

  // Get selected product names for display
  const getSelectedProductNames = (configType) => {
    const selectedIds = formData[configType].products;
    return products
      .filter((prod) => selectedIds.includes(prod._id))
      .map((prod) => prod.name);
  };

  // Category/Product Assignment Component
  const AssignmentSection = ({ configType }) => {
    const config = formData[configType];

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Apply To
          </label>
          <select
            value={config.assignment}
            onChange={(e) =>
              handleConfigChange(configType, 'assignment', e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
          >
            <option value="all_products">All Products</option>
            <option value="categories">Specific Categories</option>
            <option value="specific_products">Specific Products</option>
          </select>
        </div>

        {/* Category Selection */}
        {config.assignment === 'categories' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Categories
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-left flex items-center justify-between"
              >
                <span className="truncate">
                  {config.categories.length > 0
                    ? `${config.categories.length} categories selected`
                    : 'Select categories...'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto">
                    {categoriesLoading ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        Loading categories...
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <label
                          key={category._id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={config.categories.includes(category._id)}
                            onChange={() =>
                              handleCategorySelect(configType, category._id)
                            }
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {category.name}
                          </span>
                          {config.categories.includes(category._id) && (
                            <Check className="ml-auto h-4 w-4 text-blue-600" />
                          )}
                        </label>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        No categories found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Display selected categories */}
            {config.categories.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {getSelectedCategoryNames(configType).map((name, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product Selection */}
        {config.assignment === 'specific_products' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Products
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-left flex items-center justify-between"
              >
                <span className="truncate">
                  {config.products.length > 0
                    ? `${config.products.length} products selected`
                    : 'Select products...'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {productDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="max-h-40 overflow-y-auto">
                    {productsLoading ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        Loading products...
                      </div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <label
                          key={product._id}
                          className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={config.products.includes(product._id)}
                            onChange={() =>
                              handleProductSelect(configType, product._id)
                            }
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                          />
                          <div className="ml-2 flex-1">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku} | {product.productType}
                            </div>
                          </div>
                          {config.products.includes(product._id) && (
                            <Check className="ml-auto h-4 w-4 text-blue-600" />
                          )}
                        </label>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        No products found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Display selected products */}
            {config.products.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  {getSelectedProductNames(configType)
                    .slice(0, 5)
                    .map((name, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      >
                        {name}
                      </span>
                    ))}
                  {config.products.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      +{config.products.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const addZoneRateToFlatRate = () => {
    const newZoneRate = {
      zone: '',
      cost: 0,
      freeShipping: {
        enabled: false,
        minimumOrderAmount: 0,
      },
    };

    setFormData((prev) => ({
      ...prev,
      flatRate: {
        ...prev.flatRate,
        zoneRates: [...prev.flatRate.zoneRates, newZoneRate],
      },
    }));
  };

  const updatePickupZoneLocation = (zoneIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        zoneLocations: prev.pickup.zoneLocations.map((zoneLocation, i) =>
          i === zoneIndex ? { ...zoneLocation, [field]: value } : zoneLocation
        ),
      },
    }));
  };

  const removePickupZoneLocation = (zoneIndex) => {
    setFormData((prev) => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        zoneLocations: prev.pickup.zoneLocations.filter(
          (_, i) => i !== zoneIndex
        ),
      },
    }));
  };

  const addZoneRate = () => {
    const newZoneRate = {
      zone: '',
      weightRanges: [
        {
          minWeight: 0,
          maxWeight: 5,
          shippingCost: 1000,
        },
      ],
    };

    setFormData((prev) => ({
      ...prev,
      tableShipping: {
        ...prev.tableShipping,
        zoneRates: [...prev.tableShipping.zoneRates, newZoneRate],
      },
    }));
  };

  const updateZoneRate = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tableShipping: {
        ...prev.tableShipping,
        zoneRates: prev.tableShipping.zoneRates.map((rate, i) =>
          i === index ? { ...rate, [field]: value } : rate
        ),
      },
    }));
  };

  const removeZoneRate = (index) => {
    setFormData((prev) => ({
      ...prev,
      tableShipping: {
        ...prev.tableShipping,
        zoneRates: prev.tableShipping.zoneRates.filter((_, i) => i !== index),
      },
    }));
  };

  const addWeightRange = (zoneIndex) => {
    const newRange = {
      minWeight: 0,
      maxWeight: 5,
      shippingCost: 1000,
    };

    setFormData((prev) => ({
      ...prev,
      tableShipping: {
        ...prev.tableShipping,
        zoneRates: prev.tableShipping.zoneRates.map((rate, i) =>
          i === zoneIndex
            ? { ...rate, weightRanges: [...rate.weightRanges, newRange] }
            : rate
        ),
      },
    }));
  };

  const removeWeightRange = (zoneIndex, rangeIndex) => {
    setFormData((prev) => ({
      ...prev,
      tableShipping: {
        ...prev.tableShipping,
        zoneRates: prev.tableShipping.zoneRates.map((rate, i) =>
          i === zoneIndex
            ? {
                ...rate,
                weightRanges: rate.weightRanges.filter(
                  (_, j) => j !== rangeIndex
                ),
              }
            : rate
        ),
      },
    }));
  };

  const addPickupLocation = () => {
    const newLocation = {
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      phone: '',
      operatingHours: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '09:00', close: '14:00' },
        sunday: { open: '', close: '' },
      },
      isActive: true,
    };

    setFormData((prev) => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        defaultLocations: [...prev.pickup.defaultLocations, newLocation],
      },
    }));
  };

  const updatePickupLocation = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        locations: prev.pickup.locations.map((location, i) =>
          i === index ? { ...location, [field]: value } : location
        ),
      },
    }));
  };

  const removePickupLocation = (index) => {
    setFormData((prev) => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        defaultLocations: prev.pickup.defaultLocations.filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setCategoryDropdownOpen(false);
        setProductDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {method ? 'Edit Shipping Method' : 'Create Shipping Method'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure delivery options and pricing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Method Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.name
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Standard Delivery"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Method Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors uppercase ${
                  errors.code
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., STD-DEL"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.code}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="flat_rate">Flat Rate</option>
                <option value="table_shipping">
                  Table Shipping (Zone + Weight)
                </option>
                <option value="pickup">Store Pickup</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder="Describe the shipping method and any special conditions..."
            />
          </div>

          {/* Method-specific configuration */}
          {formData.type === 'flat_rate' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Flat Rate Configuration
              </h3>

              {/* Assignment Section */}
              <div className="dropdown-container mb-4">
                <AssignmentSection configType="flatRate" />
              </div>

              {/* Zone-specific rates or default rate */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Shipping Rates
                  </label>
                  <button
                    type="button"
                    onClick={addZoneRateToFlatRate}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Add Zone-Specific Rate
                  </button>
                </div>

                {/* Default rate (used when no zone-specific rates) */}
                {formData.flatRate.zoneRates.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Default Rate (All Zones)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Shipping Cost (₦) *
                        </label>
                        <input
                          type="number"
                          value={
                            formData.flatRate.defaultCost ||
                            formData.flatRate.cost ||
                            0
                          }
                          onChange={(e) =>
                            handleConfigChange(
                              'flatRate',
                              'defaultCost',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Free Shipping Option for default */}
                    <div className="mt-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.flatRate.freeShipping.enabled}
                          onChange={(e) =>
                            handleNestedConfigChange(
                              'flatRate',
                              'freeShipping',
                              'enabled',
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Enable free shipping above minimum order amount
                        </span>
                      </label>

                      {formData.flatRate.freeShipping.enabled && (
                        <div className="mt-2 ml-6">
                          <input
                            type="number"
                            value={
                              formData.flatRate.freeShipping.minimumOrderAmount
                            }
                            onChange={(e) =>
                              handleNestedConfigChange(
                                'flatRate',
                                'freeShipping',
                                'minimumOrderAmount',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Minimum amount"
                            min="0"
                          />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            ₦
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Zone-specific rates */}
                {formData.flatRate.zoneRates.map((zoneRate, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        Zone Rate #{index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removeFlatRateZoneRate(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Zone *
                        </label>
                        <select
                          value={zoneRate.zone}
                          onChange={(e) =>
                            updateFlatRateZoneRate(
                              index,
                              'zone',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Zone</option>
                          {zones.map((zone) => (
                            <option key={zone._id} value={zone._id}>
                              {zone.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Shipping Cost (₦) *
                        </label>
                        <input
                          type="number"
                          value={zoneRate.cost}
                          onChange={(e) =>
                            updateFlatRateZoneRate(
                              index,
                              'cost',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Zone-specific free shipping */}
                    <div className="mt-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={zoneRate.freeShipping?.enabled || false}
                          onChange={(e) => {
                            const updatedZoneRate = {
                              ...zoneRate,
                              freeShipping: {
                                ...zoneRate.freeShipping,
                                enabled: e.target.checked,
                              },
                            };
                            updateFlatRateZoneRate(
                              index,
                              'freeShipping',
                              updatedZoneRate.freeShipping
                            );
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Enable free shipping for this zone
                        </span>
                      </label>

                      {zoneRate.freeShipping?.enabled && (
                        <div className="mt-2 ml-6">
                          <input
                            type="number"
                            value={
                              zoneRate.freeShipping?.minimumOrderAmount || 0
                            }
                            onChange={(e) => {
                              const updatedZoneRate = {
                                ...zoneRate,
                                freeShipping: {
                                  ...zoneRate.freeShipping,
                                  minimumOrderAmount:
                                    parseFloat(e.target.value) || 0,
                                },
                              };
                              updateFlatRateZoneRate(
                                index,
                                'freeShipping',
                                updatedZoneRate.freeShipping
                              );
                            }}
                            className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Minimum amount"
                            min="0"
                          />
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            ₦
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {formData.flatRate.zoneRates.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Note:</strong> When zone-specific rates are
                      configured, this method will only be available in the
                      specified zones. Remove all zone rates to make it
                      available everywhere.
                    </p>
                  </div>
                )}
              </div>

              {/* Duration Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.flatRate.validFrom}
                    onChange={(e) =>
                      handleConfigChange(
                        'flatRate',
                        'validFrom',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.flatRate.validUntil}
                    onChange={(e) =>
                      handleConfigChange(
                        'flatRate',
                        'validUntil',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty for indefinite validity
                  </p>
                </div>
              </div>
            </div>
          )}

          {formData.type === 'table_shipping' && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Table Shipping Configuration (Zone + Weight Based)
              </h3>

              {/* Assignment Section */}
              <div className="dropdown-container mb-4">
                <AssignmentSection configType="tableShipping" />
              </div>

              {/* Zone Rates */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Zone Rates
                  </h4>
                  <button
                    type="button"
                    onClick={addZoneRate}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    Add Zone Rate
                  </button>
                </div>

                {formData.tableShipping.zoneRates.map((zoneRate, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        Zone Rate #{index + 1}
                      </h5>
                      <button
                        type="button"
                        onClick={() => removeZoneRate(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Zone
                        </label>
                        <select
                          value={zoneRate.zone}
                          onChange={(e) =>
                            updateZoneRate(index, 'zone', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Zone</option>
                          {zones.map((zone) => (
                            <option key={zone._id} value={zone._id}>
                              {zone.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Weight Ranges */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Weight Ranges & Costs
                        </label>
                        <button
                          type="button"
                          onClick={() => addWeightRange(index)}
                          className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                        >
                          Add Range
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <div>Min Weight (kg)</div>
                          <div>Max Weight (kg)</div>
                          <div>Shipping Cost (₦)</div>
                          <div>Action</div>
                        </div>

                        {zoneRate.weightRanges.map((range, rangeIndex) => (
                          <div
                            key={rangeIndex}
                            className="grid grid-cols-4 gap-2 items-center"
                          >
                            <input
                              type="number"
                              value={range.minWeight}
                              onChange={(e) => {
                                const newRanges = [...zoneRate.weightRanges];
                                newRanges[rangeIndex].minWeight =
                                  parseFloat(e.target.value) || 0;
                                updateZoneRate(
                                  index,
                                  'weightRanges',
                                  newRanges
                                );
                              }}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              placeholder="0"
                              min="0"
                              step="0.1"
                            />
                            <input
                              type="number"
                              value={range.maxWeight}
                              onChange={(e) => {
                                const newRanges = [...zoneRate.weightRanges];
                                newRanges[rangeIndex].maxWeight =
                                  parseFloat(e.target.value) || 0;
                                updateZoneRate(
                                  index,
                                  'weightRanges',
                                  newRanges
                                );
                              }}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              placeholder="5"
                              min="0"
                              step="0.1"
                            />
                            <input
                              type="number"
                              value={range.shippingCost}
                              onChange={(e) => {
                                const newRanges = [...zoneRate.weightRanges];
                                newRanges[rangeIndex].shippingCost =
                                  parseFloat(e.target.value) || 0;
                                updateZoneRate(
                                  index,
                                  'weightRanges',
                                  newRanges
                                );
                              }}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                              placeholder="1000"
                              min="0"
                              step="0.01"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeWeightRange(index, rangeIndex)
                              }
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              disabled={zoneRate.weightRanges.length === 1}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {errors.tableShippingZones && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.tableShippingZones}
                  </p>
                )}
              </div>

              {/* Duration Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.tableShipping.validFrom}
                    onChange={(e) =>
                      handleConfigChange(
                        'tableShipping',
                        'validFrom',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.tableShipping.validUntil}
                    onChange={(e) =>
                      handleConfigChange(
                        'tableShipping',
                        'validUntil',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.type === 'pickup' && (
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                Store Pickup Configuration
              </h3>

              {/* Assignment Section */}
              <div className="dropdown-container mb-4">
                <AssignmentSection configType="pickup" />
              </div>

              {/* Pickup Locations */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Pickup Locations
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addZoneLocationToPickup}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Add Zone-Specific Location
                    </button>
                    <button
                      type="button"
                      onClick={addPickupLocation}
                      className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                    >
                      Add Default Location
                    </button>
                  </div>
                </div>

                {/* Default locations (used when no zone-specific locations) */}
                {formData.pickup.zoneLocations.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                      Default Locations (All Zones)
                    </h5>

                    {formData.pickup.defaultLocations.map((location, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h6 className="font-medium text-gray-700 dark:text-gray-300">
                            Default Location #{index + 1}
                          </h6>
                          <button
                            type="button"
                            onClick={() => removePickupLocation(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        {/* Location form fields - same as before */}
                      </div>
                    ))}
                  </div>
                )}

                {/* Zone-specific locations */}
                {formData.pickup.zoneLocations.map(
                  (zoneLocation, zoneIndex) => (
                    <div
                      key={zoneIndex}
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          Zone Locations #{zoneIndex + 1}
                        </h5>
                        <button
                          type="button"
                          onClick={() => removePickupZoneLocation(zoneIndex)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Zone
                        </button>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Zone *
                        </label>
                        <select
                          value={zoneLocation.zone}
                          onChange={(e) =>
                            updatePickupZoneLocation(
                              zoneIndex,
                              'zone',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select Zone</option>
                          {zones.map((zone) => (
                            <option key={zone._id} value={zone._id}>
                              {zone.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Locations for this zone */}
                      {zoneLocation.locations.map((location, locIndex) => (
                        <div
                          key={locIndex}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-3"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-medium text-gray-700 dark:text-gray-300">
                              Location #{locIndex + 1}
                            </h6>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedLocations =
                                  zoneLocation.locations.filter(
                                    (_, i) => i !== locIndex
                                  );
                                updatePickupZoneLocation(
                                  zoneIndex,
                                  'locations',
                                  updatedLocations
                                );
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Location Name *
                              </label>
                              <input
                                type="text"
                                value={location.name}
                                onChange={(e) => {
                                  const updatedLocations = [
                                    ...zoneLocation.locations,
                                  ];
                                  updatedLocations[locIndex].name =
                                    e.target.value;
                                  updatePickupZoneLocation(
                                    zoneIndex,
                                    'locations',
                                    updatedLocations
                                  );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Store name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={location.phone}
                                onChange={(e) => {
                                  const updatedLocations = [
                                    ...zoneLocation.locations,
                                  ];
                                  updatedLocations[locIndex].phone =
                                    e.target.value;
                                  updatePickupZoneLocation(
                                    zoneIndex,
                                    'locations',
                                    updatedLocations
                                  );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="+234 xxx xxx xxxx"
                              />
                            </div>
                            {/* Add more location fields as needed */}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const newLocation = {
                            name: '',
                            address: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            phone: '',
                            operatingHours: {
                              monday: { open: '09:00', close: '17:00' },
                              tuesday: { open: '09:00', close: '17:00' },
                              wednesday: { open: '09:00', close: '17:00' },
                              thursday: { open: '09:00', close: '17:00' },
                              friday: { open: '09:00', close: '17:00' },
                              saturday: { open: '09:00', close: '14:00' },
                              sunday: { open: '', close: '' },
                            },
                            isActive: true,
                          };
                          const updatedLocations = [
                            ...zoneLocation.locations,
                            newLocation,
                          ];
                          updatePickupZoneLocation(
                            zoneIndex,
                            'locations',
                            updatedLocations
                          );
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                      >
                        Add Location to Zone
                      </button>
                    </div>
                  )
                )}

                {formData.pickup.zoneLocations.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Note:</strong> When zone-specific locations are
                      configured, pickup will only be available in the specified
                      zones. Remove all zone locations to make pickup available
                      everywhere.
                    </p>
                  </div>
                )}

                {errors.pickupLocations && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.pickupLocations}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status and Sort Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                min="0"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Method
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              )}
              {method ? 'Update Method' : 'Create Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogisticsMethodModal;
