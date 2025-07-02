import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Edit,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calculator,
  X,
  Save,
  Package,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  productAPI,
  brandAPI,
  pricingAPI,
  getCurrentUser,
  handleApiError,
} from '../../utils/api';

const AccountingPricingManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [pricingConfig, setPricingConfig] = useState(null);

  // Filter options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [compatibleSystems, setCompatibleSystems] = useState([]);

  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    compatibleSystem: '',
    productType: '',
  });

  const [pricingData, setPricingData] = useState({
    price: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Check user permissions
    const userRole = currentUser?.subRole || currentUser?.role;
    setCanEdit(['ACCOUNTANT', 'DIRECTOR', 'IT'].includes(userRole));

    initializeData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, filters]);

  const initializeData = async () => {
    await Promise.all([
      fetchPricingConfig(),
      fetchCategories(),
      fetchBrands(),
      fetchProducts(),
    ]);
  };

  const fetchPricingConfig = async () => {
    try {
      const response = await pricingAPI.getPricingConfig();
      if (response.success) {
        setPricingConfig(response.data);
      } else {
        // Fallback to default config if API fails
        setPricingConfig({
          margins: {
            salePrice: 15,
            btbPrice: 10,
            btcPrice: 8,
            price3weeksDelivery: 20,
            price5weeksDelivery: 25,
          },
          overheadPercentage: 15,
        });
        toast.warning('Using default pricing configuration');
      }
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      // Set fallback config
      setPricingConfig({
        margins: {
          salePrice: 15,
          btbPrice: 10,
          btcPrice: 8,
          price3weeksDelivery: 20,
          price5weeksDelivery: 25,
        },
        overheadPercentage: 15,
      });
      toast.error('Failed to load pricing configuration, using defaults');
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
        // Extract compatible systems from brands
        const systems = response.data
          .filter((brand) => brand.compatibleSystem)
          .map((brand) => ({ _id: brand._id, name: brand.name }));
        setCompatibleSystems(systems);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        brand: filters.brand || undefined,
        compatibleSystem: filters.compatibleSystem || undefined,
        productType: filters.productType || undefined,
      };

      const response = await productAPI.getProducts(params);

      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.totalNoPage);
        setTotalCount(response.totalCount);
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(handleApiError(error, 'Failed to fetch products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = (basePrice) => {
    if (!basePrice || !pricingConfig?.margins) return {};

    const price = parseFloat(basePrice);
    const { margins } = pricingConfig;

    return {
      salePrice: Math.round(price * (1 + margins.salePrice / 100)),
      btbPrice: Math.round(price * (1 + margins.btbPrice / 100)),
      btcPrice: Math.round(price * (1 + margins.btcPrice / 100)),
      price3weeksDelivery: Math.round(
        price * (1 + margins.price3weeksDelivery / 100)
      ),
      price5weeksDelivery: Math.round(
        price * (1 + margins.price5weeksDelivery / 100)
      ),
    };
  };

  const validatePricingData = () => {
    const newErrors = {};
    const price = parseFloat(pricingData.price);

    if (!pricingData.price || isNaN(price) || price <= 0) {
      newErrors.price = 'Price must be a valid number greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditPricing = (product) => {
    setSelectedProduct(product);
    setPricingData({
      price: product.price?.toString() || '',
      notes: '',
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    if (!validatePricingData()) {
      return;
    }

    setSubmitting(true);

    try {
      const updateData = {
        productId: selectedProduct._id,
        price: parseFloat(pricingData.price),
        notes: pricingData.notes,
      };

      // Try to update first, if it fails because no record exists, it will create automatically
      const response = await pricingAPI.updateProductPricing(updateData);

      if (response.success) {
        toast.success('Product pricing updated successfully');
        await fetchProducts(); // Refresh the list
        setShowEditModal(false);
        resetForm();
      } else {
        throw new Error(response.message || 'Failed to update pricing');
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error(handleApiError(error, 'Failed to update pricing'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPricingData({
      price: '',
      notes: '',
    });
    setSelectedProduct(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setPricingData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const exportPricing = async () => {
    try {
      const csvContent = [
        [
          'Product Name',
          'SKU',
          'Type',
          'Brand',
          'Category',
          'Base Price',
          'Sale Price',
          'BTB Price',
          'BTC Price',
          '3 Weeks Price',
          '5 Weeks Price',
          'Stock',
          'Status',
        ],
        ...products.map((product) => [
          product.name || '',
          product.sku || '',
          product.productType || '',
          product.brand?.map((b) => b.name).join(', ') || '',
          product.category?.name || '',
          product.price || 0,
          product.salePrice || 0,
          product.btbPrice || 0,
          product.btcPrice || 0,
          product.price3weeksDelivery || 0,
          product.price5weeksDelivery || 0,
          product.stock || 0,
          product.productAvailability ? 'Available' : 'Unavailable',
        ]),
      ];

      const csvString = csvContent
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-pricing_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Product pricing data exported successfully');
    } catch (error) {
      console.error('Error exporting pricing:', error);
      toast.error('Failed to export pricing data');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      compatibleSystem: '',
      productType: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredProducts = products;
  const totalValue = products.reduce(
    (sum, product) => sum + (product.salePrice || product.price || 0),
    0
  );
  const availableProducts = products.filter(
    (product) => product.productAvailability
  );
  const outOfStockProducts = products.filter(
    (product) => (product.stock || 0) === 0
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Pricing Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage product prices and auto-calculate delivery options (
            {products.length} products)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPricing}
            disabled={loading || products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Permission Notice */}
      {!canEdit && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Product pricing editing is restricted to Accountant, Director, and
              IT roles.
            </p>
          </div>
        </div>
      )}
      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div>
          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Compatible System Filter */}
        <div>
          <select
            value={filters.compatibleSystem}
            onChange={(e) =>
              handleFilterChange('compatibleSystem', e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Systems</option>
            {compatibleSystems.map((system) => (
              <option key={system._id} value={system._id}>
                {system.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Type Filter */}
        <div>
          <select
            value={filters.productType}
            onChange={(e) => handleFilterChange('productType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="COFFEE">Coffee</option>
            <option value="MACHINE">Machine</option>
            <option value="ACCESSORIES">Accessories</option>
            <option value="COFFEE_BEANS">Coffee Beans</option>
            <option value="TEA">Tea</option>
            <option value="DRINKS">Drinks</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div>
          <button
            onClick={clearFilters}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calculator className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Value
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Available
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {availableProducts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Out of Stock
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {outOfStockProducts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Configuration Display */}
      {pricingConfig && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Current Pricing Configuration
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Sale Price:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                +{pricingConfig.margins.salePrice}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                BTB Price:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                +{pricingConfig.margins.btbPrice}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                BTC Price:
              </span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                +{pricingConfig.margins.btcPrice}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">3 Weeks:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                +{pricingConfig.margins.price3weeksDelivery}%
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">5 Weeks:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                +{pricingConfig.margins.price5weeksDelivery}%
              </span>
            </div>
          </div>
          {pricingConfig.isApproved === false && (
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Pricing configuration is pending approval by Director
            </div>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading products...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Base Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sale Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BTB Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BTC Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    3 Weeks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    5 Weeks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
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
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {product.sku}
                          </div>
                          <div className="text-xs text-gray-400">
                            {product.brand?.map((b) => b.name).join(', ')} •{' '}
                            {product.productType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(product.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(product.salePrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.btbPrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.btcPrice)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-orange-600 dark:text-orange-400">
                        {formatCurrency(product.price3weeksDelivery)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {formatCurrency(product.price5weeksDelivery)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm ${
                          (product.stock || 0) > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEdit && (
                        <button
                          onClick={() => handleEditPricing(product)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit Pricing"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {(currentPage - 1) * 20 + 1} to{' '}
              {Math.min(currentPage * 20, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Pricing Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Pricing: {selectedProduct.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {selectedProduct.sku}
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

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Base Price Input */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Base Pricing
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricingData.price}
                      onChange={(e) =>
                        handleInputChange('price', e.target.value)
                      }
                      className={`w-full pl-8 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                        errors.price
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter base price"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.price}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This is the base price used to calculate all other prices
                    using the configured margins
                  </p>
                </div>
              </div>

              {/* Calculated Prices Preview */}
              {pricingData.price &&
                !isNaN(parseFloat(pricingData.price)) &&
                pricingConfig && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Calculated Prices Preview
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(calculatePrices(pricingData.price)).map(
                        ([key, value]) => {
                          const labels = {
                            salePrice: 'Sale Price',
                            btbPrice: 'BTB Price',
                            btcPrice: 'BTC Price',
                            price3weeksDelivery: '3 Weeks Delivery',
                            price5weeksDelivery: '5 Weeks Delivery',
                          };

                          const margins = {
                            salePrice: pricingConfig.margins.salePrice,
                            btbPrice: pricingConfig.margins.btbPrice,
                            btcPrice: pricingConfig.margins.btcPrice,
                            price3weeksDelivery:
                              pricingConfig.margins.price3weeksDelivery,
                            price5weeksDelivery:
                              pricingConfig.margins.price5weeksDelivery,
                          };

                          return (
                            <div
                              key={key}
                              className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {labels[key]}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  +{margins[key]}%
                                </span>
                              </div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(value)}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={pricingData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Additional notes about this pricing update..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      Update Pricing
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingPricingManagement;
