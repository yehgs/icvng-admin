import React from 'react';
import {
  Search,
  Filter,
  X,
  Scale,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const WarehouseFilters = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  categories,
  brands,
  compatibleSystems,
  filteredCount,
  totalCount,
}) => {
  const productTypes = [
    'COFFEE',
    'MACHINE',
    'ACCESSORIES',
    'COFFEE_BEANS',
    'TEA',
    'DRINKS',
  ];

  const availabilityOptions = [
    { value: '', label: 'All Stock Levels' },
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' },
  ];

  // NEW: Weight filter options
  const weightFilterOptions = [
    { value: '', label: 'All Products' },
    { value: 'not-set', label: 'Weight Not Set' },
    { value: 'set', label: 'Weight Set' },
  ];

  // NEW: Weight sorting options
  const weightSortOptions = [
    { value: '', label: 'Default Order' },
    { value: 'lightest', label: 'Lightest First' },
    { value: 'heaviest', label: 'Heaviest First' },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: '',
      brand: '',
      productType: '',
      compatibleSystem: '',
      availability: '',
      weightFilter: '',
      weightSort: '',
    });
  };

  const hasActiveFilters =
    searchTerm || Object.values(filters).some((filter) => filter !== '');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter Row 1 - Basic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brand
            </label>
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Type
            </label>
            <select
              value={filters.productType}
              onChange={(e) =>
                handleFilterChange('productType', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Compatible System Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Compatible System
            </label>
            <select
              value={filters.compatibleSystem}
              onChange={(e) =>
                handleFilterChange('compatibleSystem', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Systems</option>
              {compatibleSystems.map((system) => (
                <option key={system._id} value={system._id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Stock Level
            </label>
            <select
              value={filters.availability}
              onChange={(e) =>
                handleFilterChange('availability', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {availabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Row 2 - Weight Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 col-span-full mb-2">
            <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Weight Filters
            </span>
          </div>

          {/* Weight Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Scale className="w-4 h-4" />
              Weight Status
            </label>
            <select
              value={filters.weightFilter}
              onChange={(e) =>
                handleFilterChange('weightFilter', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {weightFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Weight Sort */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {filters.weightSort === 'lightest' ? (
                <TrendingUp className="w-4 h-4" />
              ) : filters.weightSort === 'heaviest' ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <Scale className="w-4 h-4" />
              )}
              Weight Sorting
            </label>
            <select
              value={filters.weightSort}
              onChange={(e) => handleFilterChange('weightSort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {weightSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>
              Showing {filteredCount.toLocaleString()} of{' '}
              {totalCount.toLocaleString()} products
            </span>
            {hasActiveFilters && (
              <span className="text-blue-600 dark:text-blue-400">
                (filtered)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.entries(filters).filter(([key, value]) => value !== '')
                  .length + (searchTerm ? 1 : 0)}{' '}
                filters active
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-blue-600 dark:hover:text-blue-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                Category:{' '}
                {categories.find((c) => c._id === filters.category)?.name}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="hover:text-purple-600 dark:hover:text-purple-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.brand && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                Brand: {brands.find((b) => b._id === filters.brand)?.name}
                <button
                  onClick={() => handleFilterChange('brand', '')}
                  className="hover:text-green-600 dark:hover:text-green-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.weightFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                <Scale className="w-3 h-3" />
                {
                  weightFilterOptions.find(
                    (w) => w.value === filters.weightFilter
                  )?.label
                }
                <button
                  onClick={() => handleFilterChange('weightFilter', '')}
                  className="hover:text-orange-600 dark:hover:text-orange-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.weightSort && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                {filters.weightSort === 'lightest' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {
                  weightSortOptions.find((w) => w.value === filters.weightSort)
                    ?.label
                }
                <button
                  onClick={() => handleFilterChange('weightSort', '')}
                  className="hover:text-orange-600 dark:hover:text-orange-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseFilters;
