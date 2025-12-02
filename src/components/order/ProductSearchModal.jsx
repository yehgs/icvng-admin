// components/order/ProductSearchModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Package } from 'lucide-react';
import { productAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const ProductSearchModal = ({ isOpen, onClose, onSelect, orderType }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, searchTerm, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Use the searchProductAdmin endpoint for full product details
      const response = await productAPI.searchProductAdmin({
        search: searchTerm,
        page,
        limit: 10,
        productAvailability: true,
      });

      if (response.success) {
        setProducts(response.data || []);
        setTotalPages(response.totalPage || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(handleApiError(error, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const getProductPrice = (product) => {
    if (orderType === 'BTB') {
      return product.btbPrice || product.price || 0;
    }
    return (
      product.btcPrice || product.price3weeksDelivery || product.price || 0
    );
  };

  const getProductStock = (product) => {
    if (product.warehouseStock?.enabled) {
      return product.warehouseStock.offlineStock || 0;
    }
    return product.stock || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Products
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Loading products...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'No products found matching your search'
                  : 'Start typing to search for products'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => {
                const stock = getProductStock(product);
                const price = getProductPrice(product);
                const hasStock = stock > 0;

                return (
                  <button
                    key={product._id}
                    onClick={() => {
                      if (hasStock) {
                        onSelect(product);
                      } else {
                        toast.error('This product is out of stock');
                      }
                    }}
                    disabled={!hasStock}
                    className={`flex items-start gap-4 p-4 border rounded-lg text-left transition-colors ${
                      hasStock
                        ? 'border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {/* Product Image */}
                    {product.image && product.image[0] ? (
                      <img
                        src={product.image[0]}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        SKU: {product.sku}
                      </p>

                      {/* Stock & Category */}
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            hasStock
                              ? stock <= 5
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}
                        >
                          {hasStock ? `${stock} in stock` : 'Out of stock'}
                        </span>
                        {product.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {product.category.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ₦{price.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {orderType === 'BTB' ? 'BTB Price' : 'BTC Price'}
                      </div>
                      {product.weight && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {product.weight}g
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && products.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearchModal;
