import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Package,
  Loader2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pricingAPI, productAPI, brandAPI } from '../../utils/api';

const PricingManagement = () => {
  const [productPricing, setProductPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    brand: '',
    isApproved: '',
    productType: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    totalCount: 0,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const productTypes = [
    'COFFEE',
    'MACHINE',
    'ACCESSORIES',
    'COFFEE_BEANS',
    'TEA',
    'DRINKS',
  ];

  useEffect(() => {
    fetchProductPricing();
    fetchCategories();
    fetchBrands();
  }, [filters, pagination.page]);

  const fetchProductPricing = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      const data = await pricingAPI.getProductPricingList(queryParams);
      if (data.success) {
        setProductPricing(data.data);
        setPagination((prev) => ({
          ...prev,
          totalPages: data.totalPages,
          totalCount: data.totalCount,
        }));
      } else {
        toast.error(data.message || 'Failed to fetch product pricing');
      }
    } catch (error) {
      console.error('Error fetching product pricing:', error);
      toast.error('Failed to fetch product pricing');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await productAPI.getCategoryStructure();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const data = await brandAPI.getBrands();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...productPricing].sort((a, b) => {
      let aValue = key.includes('.') ? getNestedValue(a, key) : a[key];
      let bValue = key.includes('.') ? getNestedValue(b, key) : b[key];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setProductPricing(sortedData);
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (isApproved) => {
    return isApproved
      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
  };

  const getStatusIcon = (isApproved) => {
    return isApproved ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );
  };

  const exportToCsv = () => {
    try {
      const csvData = productPricing.map((item) => ({
        'Product Name': item.productDetails?.name || 'N/A',
        SKU: item.productDetails?.sku || 'N/A',
        'Product Type': item.productDetails?.productType || 'N/A',
        'Sale Price': item.calculatedPrices?.salePrice || 0,
        'BTB Price': item.calculatedPrices?.btbPrice || 0,
        'BTC Price': item.calculatedPrices?.btcPrice || 0,
        '3 Weeks Delivery': item.calculatedPrices?.price3weeksDelivery || 0,
        '5 Weeks Delivery': item.calculatedPrices?.price5weeksDelivery || 0,
        Status: item.isApproved ? 'Approved' : 'Pending',
        'Last Updated': formatDate(item.calculatedAt),
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map((row) => Object.values(row).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute(
        'download',
        `product-pricing-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const ProductDetailModal = () => {
    if (!selectedProduct || !showProductDetail) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedProduct.productDetails?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SKU: {selectedProduct.productDetails?.sku}
                </p>
              </div>
              <button
                onClick={() => setShowProductDetail(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Product Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Product Type:
                    </span>
                    <span className="font-medium">
                      {selectedProduct.productDetails?.productType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                        selectedProduct.isApproved
                      )}`}
                    >
                      {getStatusIcon(selectedProduct.isApproved)}
                      {selectedProduct.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Updated:
                    </span>
                    <span className="font-medium">
                      {formatDate(selectedProduct.calculatedAt)}
                    </span>
                  </div>
                  {selectedProduct.calculatedByDetails?.[0] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Calculated By:
                      </span>
                      <span className="font-medium">
                        {selectedProduct.calculatedByDetails[0].name}
                      </span>
                    </div>
                  )}
                  {selectedProduct.approvedByDetails?.[0] && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Approved By:
                      </span>
                      <span className="font-medium">
                        {selectedProduct.approvedByDetails[0].name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Cost Breakdown
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Unit Cost (
                      {selectedProduct.costBreakdown?.originalCurrency}
                      ):
                    </span>
                    <span className="font-medium">
                      {selectedProduct.costBreakdown?.unitCostInOriginalCurrency?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Exchange Rate:
                    </span>
                    <span className="font-medium">
                      {selectedProduct.costBreakdown?.exchangeRate?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Unit Cost (NGN):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedProduct.costBreakdown?.unitCostInNaira
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Logistics Cost:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedProduct.costBreakdown
                          ?.freightAndClearingCostPerUnit
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Cost:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedProduct.costBreakdown?.totalCostPerUnit
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Overhead (
                      {selectedProduct.costBreakdown?.overheadPercentage}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        selectedProduct.costBreakdown?.overheadAmount
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span className="text-gray-900 dark:text-white">
                      Sub Price:
                    </span>
                    <span className="text-blue-600">
                      {formatCurrency(selectedProduct.costBreakdown?.subPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                Final Prices & Margins
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 dark:border-gray-600 rounded-lg">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Margin (%)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Final Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        Sale Price
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {selectedProduct.appliedMargins?.salePrice}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(
                          selectedProduct.calculatedPrices?.salePrice
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        BTB Price
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {selectedProduct.appliedMargins?.btbPrice}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                        {formatCurrency(
                          selectedProduct.calculatedPrices?.btbPrice
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        BTC Price
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {selectedProduct.appliedMargins?.btcPrice}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                        {formatCurrency(
                          selectedProduct.calculatedPrices?.btcPrice
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        3 Weeks Delivery
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {selectedProduct.appliedMargins?.price3weeksDelivery}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-orange-600">
                        {formatCurrency(
                          selectedProduct.calculatedPrices?.price3weeksDelivery
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        5 Weeks Delivery
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {selectedProduct.appliedMargins?.price5weeksDelivery}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-red-600">
                        {formatCurrency(
                          selectedProduct.calculatedPrices?.price5weeksDelivery
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price History */}
            {selectedProduct.priceHistory &&
              selectedProduct.priceHistory.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    Price History
                  </h4>
                  <div className="space-y-3">
                    {selectedProduct.priceHistory
                      .slice(-3)
                      .map((history, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Previous Pricing
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(history.calculatedAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                Sale:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatCurrency(
                                  history.calculatedPrices?.salePrice
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                BTB:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatCurrency(
                                  history.calculatedPrices?.btbPrice
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">
                                BTC:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatCurrency(
                                  history.calculatedPrices?.btcPrice
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DollarSign className="h-6 w-6 mr-2" />
            Price Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and monitor product pricing across all categories
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCsv}
            disabled={productPricing.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={fetchProductPricing}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination.totalCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {productPricing.filter((p) => p.isApproved).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {productPricing.filter((p) => !p.isApproved).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Sale Price
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {productPricing.length > 0
                  ? formatCurrency(
                      productPricing.reduce(
                        (sum, p) => sum + (p.calculatedPrices?.salePrice || 0),
                        0
                      ) / productPricing.length
                    )
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search */}
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

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>

            {/* Product Type Filter */}
            <select
              value={filters.productType}
              onChange={(e) =>
                handleFilterChange('productType', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filters.isApproved}
              onChange={(e) => handleFilterChange('isApproved', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
          </div>
        )}
      </div>

      {/* Product Pricing Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading pricing data...
            </span>
          </div>
        ) : productPricing.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Pricing Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No product pricing found with the current filters
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('productDetails.name')}
                    >
                      Product Name
                      {sortConfig.key === 'productDetails.name' &&
                        (sortConfig.direction === 'asc' ? (
                          <ChevronUp className="inline h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="inline h-4 w-4 ml-1" />
                        ))}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU / Type
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('calculatedPrices.salePrice')}
                    >
                      Sale Price
                      {sortConfig.key === 'calculatedPrices.salePrice' &&
                        (sortConfig.direction === 'asc' ? (
                          <ChevronUp className="inline h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="inline h-4 w-4 ml-1" />
                        ))}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      BTB Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      BTC Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      3 Weeks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      5 Weeks
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('isApproved')}
                    >
                      Status
                      {sortConfig.key === 'isApproved' &&
                        (sortConfig.direction === 'asc' ? (
                          <ChevronUp className="inline h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="inline h-4 w-4 ml-1" />
                        ))}
                    </th>
                    <th
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('calculatedAt')}
                    >
                      Last Updated
                      {sortConfig.key === 'calculatedAt' &&
                        (sortConfig.direction === 'asc' ? (
                          <ChevronUp className="inline h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="inline h-4 w-4 ml-1" />
                        ))}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {productPricing.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.productDetails?.name || 'N/A'}
                          </div>
                          {product.categoryDetails?.[0] && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.categoryDetails[0].name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.productDetails?.sku || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.productDetails?.productType || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        {formatCurrency(product.calculatedPrices?.salePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                        {formatCurrency(product.calculatedPrices?.btbPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-600">
                        {formatCurrency(product.calculatedPrices?.btcPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-orange-600">
                        {formatCurrency(
                          product.calculatedPrices?.price3weeksDelivery
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        {formatCurrency(
                          product.calculatedPrices?.price5weeksDelivery
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            product.isApproved
                          )}`}
                        >
                          {getStatusIcon(product.isApproved)}
                          {product.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                        <div>{formatDate(product.calculatedAt)}</div>
                        {product.calculatedByDetails?.[0] && (
                          <div className="text-xs">
                            by {product.calculatedByDetails[0].name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductDetail(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal />
    </div>
  );
};

export default PricingManagement;
