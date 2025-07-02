// components/PurchaseOrder/ProductSearchModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Package,
  Tag,
  Building2,
  Loader2,
  ShoppingCart,
  AlignVerticalJustifyEnd,
} from 'lucide-react';
import { productAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const ProductSearchModal = ({ isOpen, onClose, onProductSelect }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    productType: '',
    availability: true,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (isOpen) {
        searchProducts();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filters, currentPage, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchCategoryStructure();
      // Initial search when modal opens
      searchProducts();
    }
  }, [isOpen]);

  const fetchCategoryStructure = async () => {
    try {
      const response = await productAPI.getCategoryStructure();
      if (response.success) {
        setCategories(response.data);

        // Extract unique brands from categories
        const allBrands = [];
        response.data.forEach((category) => {
          if (category.brands && Array.isArray(category.brands)) {
            allBrands.push(...category.brands);
          }
          if (category.subcategories && Array.isArray(category.subcategories)) {
            category.subcategories.forEach((subcat) => {
              if (subcat.brands && Array.isArray(subcat.brands)) {
                allBrands.push(...subcat.brands);
              }
            });
          }
        });

        // Remove duplicates
        const uniqueBrands = allBrands.filter(
          (brand, index, self) =>
            index === self.findIndex((b) => b._id === brand._id)
        );

        setBrands(uniqueBrands);
      }
    } catch (error) {
      console.error('Error fetching category structure:', error);
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      // Build search data object
      const searchData = {
        page: currentPage,
        limit: 20,
      };

      // Add search term if provided
      if (searchTerm && searchTerm.trim() !== '') {
        searchData.search = searchTerm.trim();
      }

      // Add filters
      if (filters.category) {
        searchData.category = filters.category;
      }
      if (filters.brand) {
        searchData.brand = filters.brand;
      }
      if (filters.productType) {
        searchData.productType = filters.productType;
      }
      if (filters.availability !== undefined) {
        searchData.productAvailability = filters.availability;
      }

      console.log('Search data:', searchData); // Debug log

      const response = await productAPI.searchProduct(searchData);

      console.log('Search response:', response); // Debug log

      if (response.success) {
        setProducts(response.data || []);
        setTotalPages(response.totalPage || 1);

        // Extract unique product types from results
        if (response.data && Array.isArray(response.data)) {
          const types = [
            ...new Set(response.data.map((p) => p.productType).filter(Boolean)),
          ];
          setProductTypes(types);
        }
      } else {
        console.error('Search failed:', response.message);
        toast.error(response.message || 'Failed to search products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error(handleApiError(error, 'Failed to search products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    console.log('🔥 PRODUCT CLICKED!', product); // Add this line
    console.log('Selected product:', product); // Debug log
    onProductSelect(product);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      brand: '',
      productType: '',
      availability: true,
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getBrandName = (brand) => {
    if (!brand) return 'N/A';
    if (Array.isArray(brand)) {
      return brand
        .map((b) => (typeof b === 'object' && b.name ? b.name : b))
        .join(', ');
    }
    return typeof brand === 'object' && brand.name ? brand.name : brand;
  };

  const getCategoryName = (category) => {
    if (!category) return 'N/A';
    return typeof category === 'object' && category.name
      ? category.name
      : category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Select Product
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={filters.brand}
                    onChange={(e) =>
                      setFilters({ ...filters, brand: e.target.value })
                    }
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={filters.productType}
                    onChange={(e) =>
                      setFilters({ ...filters, productType: e.target.value })
                    }
                  >
                    <option value="">All Types</option>
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.availability}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          availability: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Available only
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products List */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Searching products...
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No products found matching your criteria</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-start mb-3">
                    {product.image &&
                      Array.isArray(product.image) &&
                      product.image.length > 0 && (
                        <img
                          src={product.image[0]}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md mr-3 flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {product.sku || 'N/A'}
                      </p>
                      {product.shortDescription && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {product.shortDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                    {product.category && (
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <Tag className="w-3 h-3" />
                        {getCategoryName(product.category)}
                      </div>
                    )}
                    {product.brand && (
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <Building2 className="w-3 h-3" />
                        {getBrandName(product.brand)}
                      </div>
                    )}
                    {product.productType && (
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <Package className="w-3 h-3" />
                        {product.productType}
                      </div>
                    )}
                    {product.stock !== undefined && (
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <AlignVerticalJustifyEnd className="w-3 h-3" />
                        Stock: {product.stock}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {product.productAvailability ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                          Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full text-xs">
                          Unavailable
                        </span>
                      )}
                      {product.featured && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs">
                          Featured
                        </span>
                      )}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center">
              <div className="flex gap-2">
                {Array.from(
                  { length: Math.min(totalPages, 10) },
                  (_, i) => i + 1
                ).map((page) => (
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
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearchModal;
