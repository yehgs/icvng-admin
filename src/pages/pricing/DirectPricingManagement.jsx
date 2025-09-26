import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Edit,
  Eye,
  History,
  Download,
  Plus,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Package,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  directPricingAPI,
  directPricingUtils,
  productAPI,
  brandAPI,
  getCurrentUser,
  handleApiError,
} from '../../utils/api';

const DirectPricingManagement = () => {
  const [directPricingList, setDirectPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    productType: '',
    updatedBy: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    totalCount: 0,
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingPrices, setEditingPrices] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Add Product Modal States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productFilters, setProductFilters] = useState({
    category: '',
    brand: '',
    productType: '',
  });

  // Filter options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Get current user from your existing auth system
  const currentUser = getCurrentUser();

  const priceTypes = [
    { key: 'salePrice', label: 'Sale Price', color: 'green' },
    { key: 'btbPrice', label: 'BTB Price', color: 'blue' },
    { key: 'btcPrice', label: 'BTC Price', color: 'purple' },
    { key: 'price3weeksDelivery', label: '3 Weeks', color: 'orange' },
    { key: 'price5weeksDelivery', label: '5 Weeks', color: 'red' },
  ];

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    fetchDirectPricingList();
  }, [filters, pagination.page]);

  const initializeData = async () => {
    await Promise.all([fetchCategories(), fetchBrands(), fetchStats()]);
  };

  const fetchDirectPricingList = async () => {
    setLoading(true);
    try {
      const response = await directPricingAPI.getDirectPricingList({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      if (response.success) {
        setDirectPricingList(response.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: response.pagination.totalPages,
          totalCount: response.pagination.totalCount,
        }));
      } else {
        toast.error(response.message || 'Failed to fetch direct pricing data');
      }
    } catch (error) {
      console.error('Error fetching direct pricing list:', error);
      toast.error(handleApiError(error, 'Failed to fetch direct pricing data'));
      setDirectPricingList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await directPricingAPI.getDirectPricingStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategoryStructure();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getBrands();
      if (response.success) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // New function to fetch available products for direct pricing
  const fetchAvailableProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productAPI.getProducts({
        search: productSearchTerm,
        category: productFilters.category,
        brand: productFilters.brand,
        productType: productFilters.productType,
        excludeDirectPricing: true, // This would exclude products that already have direct pricing
        limit: 50,
        page: 1,
      });

      if (response.success) {
        setAvailableProducts(response.data || []);
      } else {
        toast.error('Failed to fetch products');
        setAvailableProducts([]);
      }
    } catch (error) {
      console.error('Error fetching available products:', error);
      toast.error('Failed to fetch products');
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle adding a product to direct pricing
  const handleAddProduct = (product) => {
    setSelectedProduct({
      productDetails: product,
      directPrices: {},
      priceUpdatedBy: {},
    });
    setEditingPrices({});
    setErrors({});
    setShowAddProductModal(false);
    setShowEditModal(true);
  };

  // Reset product modal
  const resetProductModal = () => {
    setShowAddProductModal(false);
    setAvailableProducts([]);
    setProductSearchTerm('');
    setProductFilters({
      category: '',
      brand: '',
      productType: '',
    });
  };

  const formatCurrency = (amount) => {
    return directPricingUtils.formatCurrency(amount);
  };

  const handleEditPricing = (product) => {
    setSelectedProduct(product);
    setEditingPrices({ ...product.directPrices });
    setErrors({});
    setShowEditModal(true);
  };

  const handlePriceChange = (priceType, value) => {
    setEditingPrices((prev) => ({
      ...prev,
      [priceType]: value,
    }));

    // Clear error when user starts typing
    if (errors[priceType]) {
      setErrors((prev) => ({ ...prev, [priceType]: '' }));
    }
  };

  const validatePrices = () => {
    const validation = directPricingUtils.validatePriceData(editingPrices);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async () => {
    if (!validatePrices()) return;

    setSubmitting(true);
    try {
      const response = await directPricingAPI.createOrUpdateDirectPricing({
        productId: selectedProduct.productDetails._id,
        prices: editingPrices,
        notes: `Direct pricing update by ${currentUser?.name || 'User'}`,
      });

      if (response.success) {
        toast.success('Pricing updated successfully');
        setShowEditModal(false);
        fetchDirectPricingList();
        resetForm();
      } else {
        toast.error(response.message || 'Failed to update pricing');
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error(handleApiError(error, 'Failed to update pricing'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingPrices({});
    setSelectedProduct(null);
    setErrors({});
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      brand: '',
      productType: '',
      updatedBy: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      const csvContent =
        directPricingUtils.exportDirectPricingToCSV(directPricingList);
      directPricingUtils.downloadCSV(
        csvContent,
        `direct-pricing-${new Date().toISOString().split('T')[0]}.csv`
      );
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const getPriceColorClass = (priceType) => {
    return directPricingUtils.getPriceTypeColorClass(priceType).split(' ')[0]; // Get just the text color
  };

  const canEdit = directPricingUtils.canEditDirectPricing(
    currentUser?.role,
    currentUser?.subRole
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="h-6 w-6 mr-2" />
            Direct Pricing Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Independent pricing system - Set individual prices directly without
            calculations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              onClick={() => {
                setShowAddProductModal(true);
                fetchAvailableProducts();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={directPricingList.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      {!canEdit && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Direct pricing management is restricted to Accountant, Director,
              and IT roles.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Products with Direct Pricing
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.stats.totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Sale Price
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.stats.averageSalePrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Updates Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.stats.totalUpdatesToday}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <select
              value={filters.productType}
              onChange={(e) =>
                handleFilterChange('productType', e.target.value)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Product Types</option>
              <option value="COFFEE">Coffee</option>
              <option value="MACHINE">Machine</option>
              <option value="ACCESSORIES">Accessories</option>
              <option value="COFFEE_BEANS">Coffee Beans</option>
              <option value="TEA">Tea</option>
              <option value="DRINKS">Drinks</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Direct Pricing Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading direct pricing data...
            </span>
          </div>
        ) : directPricingList.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Direct Pricing Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No products have direct pricing set with the current filters
            </p>
            {canEdit && (
              <button
                onClick={() => {
                  setShowAddProductModal(true);
                  fetchAvailableProducts();
                }}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    {priceTypes.map((priceType) => (
                      <th
                        key={priceType.key}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {priceType.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {directPricingList.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.productDetails?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {item.productDetails?.sku} •{' '}
                            {item.productDetails?.productType}
                          </div>
                        </div>
                      </td>
                      {priceTypes.map((priceType) => (
                        <td
                          key={priceType.key}
                          className="px-6 py-4 whitespace-nowrap text-right"
                        >
                          <span
                            className={`text-sm font-medium ${getPriceColorClass(
                              priceType.key
                            )}`}
                          >
                            {formatCurrency(item.directPrices?.[priceType.key])}
                          </span>
                          {item.priceUpdatedBy?.[priceType.key]?.updatedBy && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              by{' '}
                              {
                                item.priceUpdatedBy[priceType.key].updatedBy
                                  .name
                              }
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {directPricingUtils.formatDate(item.lastUpdatedAt)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          by{' '}
                          {item.lastUpdatedByDetails?.[0]?.name ||
                            item.lastUpdatedBy?.name ||
                            'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditPricing(item)}
                            disabled={!canEdit}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit Pricing"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              toast.info('Price history feature coming soon');
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.totalCount
                  )}{' '}
                  of {pagination.totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.totalPages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Add Product Direct Pricing
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a product to set up direct pricing
                  </p>
                </div>
              </div>
              <button
                onClick={() => resetProductModal()}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      clearTimeout(window.productSearchTimeout);
                      window.productSearchTimeout = setTimeout(() => {
                        fetchAvailableProducts();
                      }, 300);
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <select
                  value={productFilters.category}
                  onChange={(e) => {
                    setProductFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }));
                    fetchAvailableProducts();
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={productFilters.brand}
                  onChange={(e) => {
                    setProductFilters((prev) => ({
                      ...prev,
                      brand: e.target.value,
                    }));
                    fetchAvailableProducts();
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>

                <select
                  value={productFilters.productType}
                  onChange={(e) => {
                    setProductFilters((prev) => ({
                      ...prev,
                      productType: e.target.value,
                    }));
                    fetchAvailableProducts();
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Product Types</option>
                  <option value="COFFEE">Coffee</option>
                  <option value="MACHINE">Machine</option>
                  <option value="ACCESSORIES">Accessories</option>
                  <option value="COFFEE_BEANS">Coffee Beans</option>
                  <option value="TEA">Tea</option>
                  <option value="DRINKS">Drinks</option>
                </select>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Loading products...
                  </span>
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Products Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search terms or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-12 w-12">
                          {product.image && product.image[0] ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.image[0]}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {product.sku} • {product.productType}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                            <span>
                              Base Price: {formatCurrency(product.price)}
                            </span>
                            <span>
                              Sale Price: {formatCurrency(product.salePrice)}
                            </span>
                            <span>Stock: {product.stock || 0}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Set Pricing
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a product to set up independent direct pricing. This will
                override any config-based pricing for the selected product.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Direct Pricing: {selectedProduct.productDetails?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {selectedProduct.productDetails?.sku} • Type:{' '}
                    {selectedProduct.productDetails?.productType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-red-800 dark:text-red-200">
                      {errors.general}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {priceTypes.map((priceType) => (
                  <div
                    key={priceType.key}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {priceType.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₦
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPrices[priceType.key] || ''}
                        onChange={(e) =>
                          handlePriceChange(priceType.key, e.target.value)
                        }
                        className={`w-full pl-8 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                          errors[priceType.key]
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors[priceType.key] && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors[priceType.key]}
                      </p>
                    )}

                    {selectedProduct.priceUpdatedBy?.[priceType.key]
                      ?.updatedBy && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Last updated by{' '}
                        {
                          selectedProduct.priceUpdatedBy[priceType.key]
                            .updatedBy.name
                        }
                        <Calendar className="h-3 w-3 ml-2" />
                        {directPricingUtils.formatDate(
                          selectedProduct.priceUpdatedBy[priceType.key]
                            .updatedAt
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Price Comparison
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2">Price Type</th>
                        <th className="text-right py-2">Current</th>
                        <th className="text-right py-2">New</th>
                        <th className="text-right py-2">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceTypes.map((priceType) => {
                        const currentPrice =
                          selectedProduct.directPrices?.[priceType.key] || 0;
                        const newPrice =
                          parseFloat(editingPrices[priceType.key]) || 0;
                        const difference =
                          directPricingUtils.calculatePriceDifference(
                            currentPrice,
                            newPrice
                          );

                        return (
                          <tr
                            key={priceType.key}
                            className="border-b border-gray-100 dark:border-gray-600"
                          >
                            <td className="py-2 font-medium">
                              {priceType.label}
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(currentPrice)}
                            </td>
                            <td className="text-right py-2">
                              {formatCurrency(newPrice)}
                            </td>
                            <td className="text-right py-2">
                              {difference.absolute !== 0 && (
                                <span
                                  className={`${
                                    difference.trend === 'increase'
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                  } text-xs`}
                                >
                                  {difference.absolute > 0 ? '+' : ''}
                                  {formatCurrency(difference.absolute)}
                                  {difference.percentage !== 0 &&
                                    ` (${difference.percentage.toFixed(1)}%)`}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Prices
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Direct Pricing System
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>
                    • Prices are set directly without using margin calculations
                  </li>
                  <li>• Each price type tracks who updated it and when</li>
                  <li>• Changes are automatically applied to the product</li>
                  <li>
                    • This system works independently of config-based pricing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectPricingManagement;
