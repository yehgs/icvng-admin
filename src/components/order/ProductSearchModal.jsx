// components/order/ProductSearchModal.jsx - COMPLETE WITH VALIDATION
import React, { useState, useEffect } from "react";
import { X, Search, Loader2, Package, Truck } from "lucide-react";
import { productAPI, handleApiError } from "../../utils/api";
import toast from "react-hot-toast";

// ===== PRODUCT VALIDATION LOGIC =====
const isProductValidForOrderType = (product, orderType) => {
  if (orderType === "BTB") {
    // BTB: Must have btbPrice > 0 AND warehouse offline stock > 0
    const hasBtbPrice = product.btbPrice && product.btbPrice > 0;
    const hasOfflineStock = product.warehouseStock?.enabled
      ? (product.warehouseStock.offlineStock || 0) > 0
      : (product.stock || 0) > 0;

    return {
      isValid: hasBtbPrice && hasOfflineStock,
      reason: !hasBtbPrice
        ? "No BTB price set"
        : !hasOfflineStock
        ? "No warehouse stock available"
        : "",
    };
  } else {
    // BTC: Must have (btcPrice > 0 AND onlineStock > 0) OR (has dropship prices)
    const hasBtcPrice = product.btcPrice && product.btcPrice > 0;
    const hasOnlineStock = product.warehouseStock?.enabled
      ? (product.warehouseStock.onlineStock || 0) > 0
      : (product.stock || 0) > 0;

    const hasDropshipPrices =
      (product.price3weeksDelivery && product.price3weeksDelivery > 0) ||
      (product.price5weeksDelivery && product.price5weeksDelivery > 0);

    // Valid if: (has btc price AND stock) OR has dropship prices
    const isValidRegular = hasBtcPrice && hasOnlineStock;
    const isValidDropship = hasDropshipPrices;

    return {
      isValid: isValidRegular || isValidDropship,
      reason:
        !hasBtcPrice && !hasDropshipPrices
          ? "No BTC or dropship price set"
          : !hasOnlineStock && !hasDropshipPrices
          ? "No online stock and no dropship options"
          : "",
    };
  }
};

const ProductSearchModal = ({ isOpen, onClose, onSelect, orderType }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      console.error("Error fetching products:", error);
      toast.error(handleApiError(error, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const getPriceOptions = (product) => {
    const prices = {};

    if (orderType === "BTB") {
      prices.btb = product.btbPrice || product.price || 0;
    } else {
      prices.regular = product.btcPrice || product.price || 0;

      if (product.price3weeksDelivery) {
        prices.threeWeeks = product.price3weeksDelivery;
      }

      if (product.price5weeksDelivery) {
        prices.fiveWeeks = product.price5weeksDelivery;
      }
    }

    return prices;
  };

  const getProductStock = (product) => {
    if (orderType === "BTB") {
      // BTB uses offline stock
      if (product.warehouseStock?.enabled) {
        return product.warehouseStock.offlineStock || 0;
      }
      return product.stock || 0;
    } else {
      // BTC uses online stock
      if (product.warehouseStock?.enabled) {
        return product.warehouseStock.onlineStock || 0;
      }
      return product.stock || 0;
    }
  };

  const hasDropshipOptions = (product) => {
    return !!(product.price3weeksDelivery || product.price5weeksDelivery);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Products - {orderType} Orders
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

          {/* Info banner about filtering */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {orderType === "BTB" ? (
                <>
                  <strong>BTB Orders:</strong> Only showing products with BTB
                  pricing and warehouse stock available.
                </>
              ) : (
                <>
                  <strong>BTC Orders:</strong> Showing products with BTC pricing
                  + online stock, or dropship options (3/5 weeks delivery).
                </>
              )}
            </p>
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
                  ? "No products found matching your search"
                  : "Start typing to search for products"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => {
                const stock = getProductStock(product);
                const priceOptions = getPriceOptions(product);
                const hasStock = stock > 0;
                const hasDropship = hasDropshipOptions(product);

                // ===== VALIDATION LOGIC =====
                const validation = isProductValidForOrderType(
                  product,
                  orderType
                );
                const isDisabled = !validation.isValid;

                return (
                  <button
                    key={product._id}
                    onClick={() => !isDisabled && onSelect(product)}
                    disabled={isDisabled}
                    className={`flex items-start gap-4 p-4 border rounded-lg text-left transition-colors ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        : "border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
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
                      <h4
                        className={`font-medium truncate ${
                          isDisabled
                            ? "text-gray-500 dark:text-gray-500"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        SKU: {product.sku}
                      </p>

                      {/* Stock & Category */}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {/* Stock Badge */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            hasStock
                              ? stock <= 5
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {hasStock ? (
                            <>
                              {stock} in{" "}
                              {orderType === "BTB" ? "warehouse" : "online"}{" "}
                              stock
                            </>
                          ) : (
                            "Out of stock"
                          )}
                        </span>

                        {/* Dropship Available Badge */}
                        {orderType === "BTC" && hasDropship && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            Dropship Available
                          </span>
                        )}

                        {/* ===== DISABLED REASON BADGE ===== */}
                        {isDisabled && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                            ❌ {validation.reason}
                          </span>
                        )}

                        {/* Category */}
                        {product.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {product.category.name}
                          </span>
                        )}

                        {/* Weight */}
                        {product.weight && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Weight: {product.weight}g
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing Options */}
                    <div className="text-right flex-shrink-0">
                      {orderType === "BTB" ? (
                        // ===== BTB PRICING =====
                        <>
                          <div
                            className={`font-semibold ${
                              isDisabled
                                ? "text-gray-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            ₦{priceOptions.btb.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            BTB Price
                          </div>
                        </>
                      ) : (
                        // ===== BTC PRICING WITH OPTIONS =====
                        <div className="space-y-2">
                          {/* Regular BTC Price */}
                          <div>
                            <div
                              className={`font-semibold ${
                                isDisabled && !hasDropship
                                  ? "text-gray-400"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              ₦{priceOptions.regular.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Regular BTC
                            </div>
                          </div>

                          {/* 3-Week Delivery Price */}
                          {priceOptions.threeWeeks && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div className="font-medium text-purple-600 dark:text-purple-400">
                                ₦{priceOptions.threeWeeks.toLocaleString()}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                3 Weeks Delivery
                              </div>
                            </div>
                          )}

                          {/* 5-Week Delivery Price */}
                          {priceOptions.fiveWeeks && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                              <div className="font-medium text-purple-600 dark:text-purple-400">
                                ₦{priceOptions.fiveWeeks.toLocaleString()}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                5 Weeks Delivery
                              </div>
                            </div>
                          )}
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

        {/* Info Footer */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            {orderType === "BTB" ? (
              <>
                <strong>💡 Tip:</strong> BTB orders use warehouse offline stock
                and require BTB pricing to be set.
              </>
            ) : (
              <>
                <strong>💡 Tip:</strong> Products with dropship pricing options
                don't require online stock. You can select the delivery
                timeframe when adding the item to the order.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
