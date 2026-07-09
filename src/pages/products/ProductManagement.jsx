import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Download,
  Package,
  Eye,
  Star,
  Sparkles,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { productAPI, brandAPI, colorAPI } from "../../utils/manageApi";
import { getCategories } from "../../utils/categoryService";
import ProductExportModal from "../../components/product/ProductExportModal";
import ProductForm from "../../components/product/ProductForm";
import RoleBasedButton from "../../components/layout/RoleBasedButton";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

const ProductManagement = () => {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin } = useAdminCountry();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    productType: "",
    publish: "",
    featured: "",
    lowStock: "", // 'true' = online stock <= 5
    priceFilter: "", // 'hasbtc', 'has3week', 'has5week', 'noPrice'
    hiddenFromShop: "", // 'true' = published but invisible to customers
  });

  const productTypes = [
    "COFFEE",
    "MACHINE",
    "ACCESSORIES",
    "COFFEE_BEANS",
    "TEA",
    "DRINKS",
  ];

  const publishStates = ["PUBLISHED", "PENDING", "DRAFT"];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchColors();
  }, [currentPage, searchTerm, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: filters.category,
        brand: filters.brand,
        productType: filters.productType,
        publish: filters.publish,
        featured: filters.featured,
        lowStock: filters.lowStock,
        priceFilter: filters.priceFilter,
        hiddenFromShop: filters.hiddenFromShop,
      };

      const response = await productAPI.getProducts(params);
      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.totalNoPage || 1);
        setTotalProducts(response.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await brandAPI.getBrands();
      if (response.success) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await colorAPI.getColors();
      if (response.success) {
        setColors(response.data);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await productAPI.deleteProduct(productId);
      if (response.success) {
        fetchProducts();
        toast.success("Product deleted successfully!");
      } else {
        toast.error(response.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      brand: "",
      productType: "",
      publish: "",
      featured: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // ── Column value extractor ───────────────────────────────────────────────
  const getColValue = (p, key) => {
    const onlineStock = p.partnerStock?.enabled
      ? p.partnerStock?.quantity || 0
      : p.warehouseStock?.onlineStock || 0;
    const offlineStock = p.partnerStock?.enabled
      ? ""
      : p.warehouseStock?.offlineStock || 0;
    const isPartner = p.partnerStock?.enabled === true;
    const has3weeks = (p.price3weeksDelivery || 0) > 0;
    const has5weeks = (p.price5weeksDelivery || 0) > 0;
    const publishedNoStock =
      p.publish === "PUBLISHED" &&
      onlineStock === 0 &&
      !isPartner &&
      !has3weeks &&
      !has5weeks;
    const visibleInShop =
      p.publish === "PUBLISHED" && !publishedNoStock ? "Yes" : "No";

    const map = {
      name: p.name,
      sku: p.sku,
      category: p.category?.name || "",
      subCategory: p.subCategory?.name || "",
      brand: Array.isArray(p.brand)
        ? p.brand.map((b) => b?.name || b).join("; ")
        : p.brand?.name || "",
      compatibleSystem: p.compatibleSystem?.name || "",
      producer: p.producer?.name || "",
      productType: p.productType || "",
      publish: p.publish || "",
      featured: p.featured ? "Yes" : "No",
      visibleInShop,
      btbPrice: p.btbPrice > 0 ? p.btbPrice : "",
      btcPrice: p.btcPrice > 0 ? p.btcPrice : "",
      price3weeks: p.price3weeksDelivery > 0 ? p.price3weeksDelivery : "",
      price5weeks: p.price5weeksDelivery > 0 ? p.price5weeksDelivery : "",
      discount: p.discount > 0 ? p.discount : "",
      onlineStock,
      offlineStock,
      partnerEnabled: isPartner ? "Yes" : "No",
      partnerQty: isPartner ? p.partnerStock?.quantity || 0 : "",
      roastLevel: p.roastLevel || "",
      blend: p.blend || "",
      intensity: p.intensity || "",
      coffeeOrigin: p.coffeeOrigin || "",
      aromaticProfile: p.aromaticProfile || "",
      weight: p.weight ? `${p.weight}kg` : "",
      unit: p.unit || "",
      packaging: p.packaging || "",
      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
      shortDescription: p.shortDescription || "",
      createdAt: p.createdAt
        ? new Date(p.createdAt).toLocaleDateString("en-GB")
        : "",
    };
    return map[key] ?? "";
  };

  // Column display labels (same order as ALL_COLUMNS in modal)
  const COL_LABELS = {
    name: t("products.productName"),
    sku: "SKU",
    category: "Category",
    subCategory: t("products.subCategory"),
    brand: t("products.brand"),
    compatibleSystem: t("products.compatibleSystem"),
    producer: t("products.producer"),
    productType: t("products.productType"),
    publish: t("products.publishStatus"),
    featured: t("blogExt.featured"),
    visibleInShop: t("products.visibleInShop"),
    btbPrice: "BTB Price (₦)",
    btcPrice: "BTC Price (₦)",
    price3weeks: "3-Week Price (₦)",
    price5weeks: "5-Week Price (₦)",
    discount: "Discount (%)",
    onlineStock: t("products.onlineStock"),
    offlineStock: t("products.offlineStock"),
    partnerEnabled: t("products.partnerEnabled"),
    partnerQty: t("products.partnerQty"),
    roastLevel: t("products.roastLevel"),
    blend: "Blend",
    intensity: "Intensity",
    coffeeOrigin: t("products.coffeeOrigin"),
    aromaticProfile: t("products.aromaticProfile"),
    weight: "Weight",
    unit: "Unit",
    packaging: t("importExport.packaging"),
    seoTitle: "SEO Title",
    seoDescription: "SEO Description",
    shortDescription: t("products.shortDescription"),
    createdAt: t("products.createdAt"),
  };

  // ── Fetch data for export ─────────────────────────────────────────────────
  const fetchExportData = async ({ scope, customLimit, customPage }) => {
    const base = {
      search: searchTerm,
      category: filters.category,
      brand: filters.brand,
      productType: filters.productType,
      publish: filters.publish,
      featured: filters.featured,
      lowStock: filters.lowStock,
      priceFilter: filters.priceFilter,
      hiddenFromShop: filters.hiddenFromShop,
    };

    if (scope === "page") {
      return products; // already loaded
    }
    if (scope === "filtered") {
      const r = await productAPI.getProducts({
        ...base,
        page: 1,
        limit: totalProducts || 10000,
      });
      return r.success ? r.data : products;
    }
    if (scope === "all") {
      const r = await productAPI.getProducts({ page: 1, limit: 10000 });
      return r.success ? r.data : products;
    }
    if (scope === "custom") {
      const r = await productAPI.getProducts({
        ...base,
        page: customPage,
        limit: customLimit,
      });
      return r.success ? r.data : [];
    }
    return products;
  };

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = (data, selectedColumns) => {
    const esc = (val) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const headers = selectedColumns.map((k) => esc(COL_LABELS[k] || k));
    const rows = data.map((p) =>
      selectedColumns.map((k) => esc(getColValue(p, k))).join(","),
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `products_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF export (pure HTML→print, no library needed) ──────────────────────
  const exportPDF = (data, selectedColumns) => {
    const dateStr = new Date().toLocaleDateString("en-GB");
    const stockStatus = (p) => {
      const stock = p.partnerStock?.enabled
        ? p.partnerStock?.quantity || 0
        : p.warehouseStock?.onlineStock || 0;
      const visible =
        p.publish === "PUBLISHED" &&
        (stock > 0 ||
          p.partnerStock?.enabled ||
          p.price3weeksDelivery > 0 ||
          p.price5weeksDelivery > 0);
      if (p.publish !== "PUBLISHED") return "#9ca3af"; // grey
      if (!visible) return "#ef4444"; // red
      if (stock === 0) return "#f97316"; // orange (special order)
      if (stock <= 5) return "#f59e0b"; // amber (low)
      return "#22c55e"; // green
    };

    const rows = data
      .map(
        (p) => `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:6px 8px;border-right:1px solid #f0f0f0">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${stockStatus(p)};margin-right:6px;vertical-align:middle"></span>
        </td>
        ${selectedColumns.map((k) => `<td style="padding:6px 8px;border-right:1px solid #f0f0f0;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis">${String(getColValue(p, k) ?? "").replace(/</g, "&lt;")}</td>`).join("")}
      </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><title>Product Export — ${dateStr}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#222;margin:0;padding:16px}
      h1{font-size:16px;margin-bottom:4px;color:#7B3F1C}
      p.meta{font-size:10px;color:#888;margin-bottom:12px}
      table{border-collapse:collapse;width:100%;table-layout:auto}
      th{background:#7B3F1C;color:white;padding:7px 8px;text-align:left;font-size:10px;border-right:1px solid rgba(255,255,255,0.2);white-space:nowrap}
      tr:nth-child(even){background:#fdf8f5}
      .legend{margin-top:16px;display:flex;gap:16px;font-size:10px}
      .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:middle}
      @media print{@page{size:landscape;margin:10mm}}
    </style></head><body>
    <h1>Product Catalog Export</h1>
    <p class="meta">Generated: ${dateStr} · ${data.length} products · ${selectedColumns.length} columns</p>
    <table>
      <thead><tr>
        <th style="width:18px"></th>
        ${selectedColumns.map((k) => `<th>${COL_LABELS[k] || k}</th>`).join("")}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="legend">
      <span><span class="dot" style="background:#22c55e"></span>In Stock</span>
      <span><span class="dot" style="background:#f59e0b"></span>Low Stock</span>
      <span><span class="dot" style="background:#f97316"></span>Special Order</span>
      <span><span class="dot" style="background:#ef4444"></span>Hidden / No Stock</span>
      <span><span class="dot" style="background:#9ca3af"></span>Not Published</span>
    </div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  // ── Main export handler (called by modal) ─────────────────────────────────
  const handleExportFromModal = async ({
    format,
    scope,
    customLimit,
    customPage,
    selectedColumns,
  }) => {
    setExporting(true);
    try {
      const data = await fetchExportData({ scope, customLimit, customPage });
      if (format === "csv") {
        exportCSV(data, selectedColumns);
      } else {
        exportPDF(data, selectedColumns);
      }
      toast.success(
        `Exported ${data.length} products as ${format.toUpperCase()}`,
      );
      return data.length;
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed. Please try again.");
      return 0;
    } finally {
      setExporting(false);
    }
  };

  // Returns true if this product will NOT appear in the client shop
  // because it has no online stock, no partner stock, and no delivery price options
  const isHiddenFromShop = (product) => {
    if (product.publish !== "PUBLISHED") return false; // non-published are expected to be hidden
    const onlineStock = product.warehouseStock?.onlineStock || 0;
    const isPartner = product.partnerStock?.enabled === true;
    const has3weeks = (product.price3weeksDelivery || 0) > 0;
    const has5weeks = (product.price5weeksDelivery || 0) > 0;
    if (onlineStock > 0) return false;
    if (isPartner) return false;
    if (has3weeks || has5weeks) return false;
    return true; // PUBLISHED but invisible to customers
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      PUBLISHED:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}
      >
        {status}
      </span>
    );
  };

  const hasActiveFilters =
    Object.values(filters).some((value) => value !== "") || searchTerm !== "";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Product Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your product catalog ({totalProducts} total products)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={loading || products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export {totalProducts > 0 ? `(${totalProducts})` : ""}
          </button>
          <RoleBasedButton disabledRoles={["MANAGER"]}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </RoleBasedButton>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t("products.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Hidden from shop filter */}
          <select
            value={filters.hiddenFromShop}
            onChange={(e) =>
              handleFilterChange("hiddenFromShop", e.target.value)
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t("products.allVisibility")}</option>
            <option value="true">🚫 Hidden from shop</option>
            <option value="false">✅ Visible in shop</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("products.allCategories")}</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Brand Filter */}
          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange("brand", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("products.allBrands")}</option>
            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>

          {/* Product Type Filter */}
          <select
            value={filters.productType}
            onChange={(e) => handleFilterChange("productType", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("orders.allTypes")}</option>
            {productTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Publish Status Filter */}
          <select
            value={filters.publish}
            onChange={(e) => handleFilterChange("publish", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("products.allStatus")}</option>
            {publishStates.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Low Stock Filter */}
          <select
            value={filters.lowStock}
            onChange={(e) => handleFilterChange("lowStock", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("products.allStockLevels")}</option>
            <option value="true">Low Online Stock (≤5)</option>
            <option value="critical">{t("products.outOfStockOnline")}</option>
          </select>

          {/* Price Filter */}
          <select
            value={filters.priceFilter}
            onChange={(e) => handleFilterChange("priceFilter", e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("products.allPriceStates")}</option>
            <option value="hasbtc">{t("products.hasBtcPrice")}</option>
            <option value="has3week">Has 3-Week Price</option>
            <option value="has5week">Has 5-Week Price</option>
            <option value="noPrice">
              {t("productExport.missingAllPrices")}
            </option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading products...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {hasActiveFilters ? t("common.noData") : "No products yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {hasActiveFilters
                ? t("purchaseOrder.tryAdjusting")
                : "Get started by creating your first product"}
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
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  {isGlobalAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      BTB
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    BTC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    3-Wk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    5-Wk
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Online
                  </th>
                  {isGlobalAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Offline
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleEdit(product)}
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
                          {isHiddenFromShop(product) && (
                            <div className="flex items-center mt-1 gap-1">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border border-red-300"
                                title="This product is PUBLISHED but hidden from the client shop: no online stock, no partner stock, and no delivery price options."
                              >
                                🚫 Hidden from shop
                              </span>
                            </div>
                          )}
                          {product.featured && (
                            <div className="flex items-center mt-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">
                                Featured
                              </span>
                            </div>
                          )}
                          {product.limitedEdition?.isLimitedEdition && (
                            <div className="flex items-center mt-1">
                              <Sparkles className="h-3 w-3 text-red-500" />
                              <span
                                className="text-xs ml-1 font-medium"
                                style={{
                                  color:
                                    product.limitedEdition?.bannerColor ||
                                    "#c8102e",
                                }}
                              >
                                {product.limitedEdition?.bannerText ||
                                  "Limited Edition"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.category?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.brand?.map((b) => b.name).join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                        {product.productType}
                      </span>
                    </td>
                    {/* BTB Price — HQ-only, hidden from country-scoped/foreign admins */}
                    {isGlobalAdmin && (
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {product.btbPrice && product.btbPrice > 0 ? (
                          `₦${Number(product.btbPrice).toLocaleString()}`
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    {/* BTC Price */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-green-700 dark:text-green-400">
                      {product.btcPrice && product.btcPrice > 0 ? (
                        `₦${Number(product.btcPrice).toLocaleString()}`
                      ) : (
                        <span className="text-red-400 font-normal">0</span>
                      )}
                    </td>
                    {/* 3-Week Price */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-orange-700 dark:text-orange-400">
                      {product.price3weeksDelivery &&
                      product.price3weeksDelivery > 0 ? (
                        `₦${Number(product.price3weeksDelivery).toLocaleString()}`
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* 5-Week Price */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-red-700 dark:text-red-400">
                      {product.price5weeksDelivery &&
                      product.price5weeksDelivery > 0 ? (
                        `₦${Number(product.price5weeksDelivery).toLocaleString()}`
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Discount */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs">
                      {product.discount && product.discount > 0 ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full font-medium">
                          {product.discount}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Online Stock */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(() => {
                        const online = product.partnerStock?.enabled
                          ? product.partnerStock?.quantity || 0
                          : product.warehouseStock?.onlineStock || 0;
                        return (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              online === 0
                                ? "bg-red-100 text-red-700"
                                : online <= 5
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {online}
                            {product.partnerStock?.enabled && (
                              <span
                                className="ml-1 text-purple-600"
                                title="Partner stock"
                              >
                                P
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Offline Stock — HQ-only, hidden from country-scoped/foreign admins */}
                    {isGlobalAdmin && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        {product.partnerStock?.enabled ? (
                          <span className="text-xs text-gray-400 italic">
                            N/A
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (product.warehouseStock?.offlineStock || 0) === 0
                                ? "bg-gray-100 text-gray-500"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {product.warehouseStock?.offlineStock || 0}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.publish)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <RoleBasedButton
                          disabledRoles={[
                            "SALES",
                            "HR",
                            "MANAGER",
                            "SALES-MANAGER",
                            "ACCOUNTANT",
                            "GRAPHICS",
                            "LOGISTICS",
                            "WAREHOUSE",
                          ]}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(product);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </RoleBasedButton>
                        <RoleBasedButton
                          disabledRoles={[
                            "SALES",
                            "HR",
                            "MANAGER",
                            "SALES-MANAGER",
                            "ACCOUNTANT",
                            "GRAPHICS",
                            "LOGISTICS",
                            "WAREHOUSE",
                          ]}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(product._id, product.name);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </RoleBasedButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(currentPage + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * 10 + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, totalProducts)}
                    </span>{" "}
                    of <span className="font-medium">{totalProducts}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(currentPage - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + index;
                      } else {
                        pageNumber = currentPage - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNumber
                              ? "z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300"
                              : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(currentPage + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modals */}
      <ProductForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        product={null}
        onSuccess={() => {
          fetchProducts();
          setShowCreateModal(false);
        }}
      />

      <ProductForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={selectedProduct}
        onSuccess={() => {
          fetchProducts();
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
      />

      {/* Export Modal */}
      <ProductExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportFromModal}
        totalProducts={totalProducts}
        currentPageCount={products.length}
        activeFilterCount={
          hasActiveFilters
            ? Object.values(filters).filter((v) => v && v !== "").length
            : 0
        }
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
};

export default ProductManagement;
