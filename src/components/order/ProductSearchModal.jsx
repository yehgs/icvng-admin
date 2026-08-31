// components/order/ProductSearchModal.jsx - COMPLETE WITH VALIDATION
import React, { useState, useEffect } from "react";
import { X, Search, Loader2, Package, Truck } from "lucide-react";
import { productAPI, handleApiError } from "../../utils/api";
import {
  evaluateProductForMode,
  getPriceOptionsForMode,
  getStockForMode,
} from "../../config/manualOrderRules.js";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import toast from "react-hot-toast";

// ===== PRODUCT VALIDATION LOGIC =====
/**
 * NOTE (2026-08-28): the hand-rolled `isProductValidForOrderType` that used
 * to live here has been replaced by the shared helper in
 * config/manualOrderRules.js, which mirrors the server's canonical rule.
 * The old copy ignored partnerStock and ignored the five-week-type
 * distinction — see that file's header for why both mattered. BTB branches
 * are gone: manual orders are BTC-only.
 */

const ProductSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  countryCode,
  // ONLINE → BTC price + storefront stock rules.
  // OFFLINE → BTB price + warehouse offline stock, no delivery options.
  mode = "ONLINE",
}) => {
  const { t } = useAdminTranslation();
  const { formatPrice, allCountries } = useAdminCountry();
  // Prices belong to the ORDER's country, not the admin's active country —
  // a Director raising a Togo order must see XOF, not NGN.
  const priceCountry =
    (allCountries || []).find((c) => c.code === countryCode) || undefined;
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
        // Country-scope the catalogue. For SALES/MANAGER the server pins
        // this to their own scope regardless; for IT/DIRECTOR it reflects
        // the country selected on the order being created, so a director
        // raising a Togo order searches the Togo catalogue.
        ...(countryCode && { countryCode }),
        // Lets the server scope the catalogue to the mode's stock pool.
        mode,
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

  // BTC-only price options, sourced from the shared rule so the five-week /
  // two-week distinction is respected rather than offering both blindly.
  const getPriceOptions = (product) => getPriceOptionsForMode(product, mode);

  // Effective ONLINE stock, honouring partnerStock — the pool the storefront
  // and the server's manual-order validator both read.
  const getProductStock = (product) => getStockForMode(product, mode);

  // "Dropship" here means a valid SPECIAL-ORDER price for THIS product type
  // — not merely that some delivery price field is populated.
  // Offline never has delivery options — see getPriceOptionsForMode.
  const hasDropshipOptions = (product) =>
    evaluateProductForMode(product, mode).viaDelivery;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("manualOrders.searchProducts")}
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
              {mode === "OFFLINE" ? t("manualOrders.btbSearchHint") : t("manualOrders.btcSearchHint")}
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

                // ===== VALIDATION (shared canonical rule) =====
                const validation = evaluateProductForMode(product, mode);
                const isDisabled = !validation.valid;

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
                              {mode === "OFFLINE" ? t("manualOrders.offlineStockLabel") : t("manualOrders.onlineStockLabel")}{" "}
                              stock
                            </>
                          ) : (
                            t("productExport.outOfStock")
                          )}
                        </span>

                        {/* Dropship Available Badge */}
                        {hasDropship && (
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
                      {/* Price options.
                          BUGFIX (2026-08-31): this block read `priceOptions`
                          as an OBJECT (.regular / .threeWeeks / .fiveWeeks),
                          but getPriceOptionsForMode returns an ARRAY of
                          { key, price, labelKey }. So `.regular` was
                          undefined and `.toLocaleString()` threw, taking the
                          modal down on every render. The shape changed when
                          the mode-aware helper replaced the inline rule and
                          this render was not updated with it.

                          Also: the amount is now formatted in the ORDER's
                          currency rather than a hardcoded ₦, and the labels
                          come from the locale files, so a Togo order shows
                          XOF and an Italian one EUR. */}
                      <div className="space-y-2">
                        {priceOptions.length === 0 ? (
                          <div className="text-xs text-gray-400">
                            {t("manualOrders.noPrice")}
                          </div>
                        ) : (
                          priceOptions.map((opt, i) => (
                            <div
                              key={opt.key}
                              className={
                                i > 0
                                  ? "pt-2 border-t border-gray-200 dark:border-gray-600"
                                  : undefined
                              }
                            >
                              <div
                                className={
                                  opt.key === "regular"
                                    ? `font-semibold ${
                                        isDisabled && !hasDropship
                                          ? "text-gray-400"
                                          : "text-gray-900 dark:text-white"
                                      }`
                                    : "font-medium text-purple-600 dark:text-purple-400"
                                }
                              >
                                {formatPrice(opt.price, priceCountry)}
                              </div>
                              <div
                                className={`text-xs ${
                                  opt.key === "regular"
                                    ? "text-gray-500 dark:text-gray-400"
                                    : "text-purple-600 dark:text-purple-400"
                                }`}
                              >
                                {t(opt.labelKey)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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
            {t("manualOrders.dropshipTip")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchModal;
