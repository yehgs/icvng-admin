import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Filter,
  Download,
  Edit,
  Save,
  Upload,
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle,
  Globe,
  Monitor,
  Building,
  Eye,
  Activity,
  Calendar,
  Scale,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  warehouseAPI,
  productAPI,
  brandAPI,
  getCurrentUser,
  handleApiError,
} from "../../utils/api";
import RoleBasedAccess from "../../components/layout/RoleBaseAccess";
import WarehouseStockTable from "../../components/stock/WarehouseStockTable";
import WarehouseStatsCards from "../../components/stock/WarehouseStatsCards";
import WarehouseFilters from "../../components/stock/WarehouseFilters";
import StockEditModal from "../../components/stock/StockEditModal";
import WeightEditModal from "../../components/stock/WeightEditModal";
import SystemControlModal from "../../components/stock/SystemControlModal";
import ActivityLogModal from "../../components/stock/ActivityLogModal";
import ImportExportModal from "../../components/stock/ImportExportModal";

const WarehouseManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [paginatedProducts, setPaginatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportType, setImportExportType] = useState("import");
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    productType: "",
    compatibleSystem: "",
    availability: "",
    weightFilter: "",
    weightSort: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 15,
    totalItems: 0,
    totalPages: 0,
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showSystemControlModal, setShowSystemControlModal] = useState(false);
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingWeightProduct, setEditingWeightProduct] = useState(null);

  // Filter data
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [compatibleSystems, setCompatibleSystems] = useState([]);

  // System status
  const [systemEnabled, setSystemEnabled] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    autoSyncEnabled: true,
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
  });

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    onlineStock: 0,
    offlineStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    damagedItems: 0,
    refurbishedItems: 0,
  });

  const currentUser = getCurrentUser();
  const canEdit = systemEnabled && currentUser?.subRole === "WAREHOUSE";
  const canEditWeight = currentUser?.subRole === "WAREHOUSE";
  const canManageSystem = ["DIRECTOR", "IT"].includes(currentUser?.subRole);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, filters]);

  useEffect(() => {
    applyPagination();
  }, [filteredProducts, pagination.currentPage, pagination.itemsPerPage]);

  const initializeData = async () => {
    await Promise.all([
      fetchProducts(),
      fetchFilterData(),
      checkSystemStatus(),
    ]);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await warehouseAPI.getProductsForStock({
        page: 1,
        limit: 10000, // Get all products for client-side filtering/pagination
      });

      if (response.success) {
        setProducts(response.data);
        calculateStats(response.data);
      } else {
        toast.error(response.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(handleApiError(error, "Failed to fetch products"));
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [categoryResponse, brandResponse] = await Promise.all([
        productAPI.getCategoryStructure(),
        brandAPI.getBrands(),
      ]);

      if (categoryResponse.success) {
        setCategories(categoryResponse.data);
      }

      if (brandResponse.success) {
        setBrands(brandResponse.data);
        const systems = brandResponse.data
          .filter((brand) => brand.compatibleSystem)
          .map((brand) => ({ _id: brand._id, name: brand.name }));
        setCompatibleSystems(systems);
      }
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const response = await warehouseAPI.getSystemStatus();
      if (response.success) {
        setSystemEnabled(response.data.enabled);
        setSystemSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Error checking system status:", error);
      toast.error("Failed to load system status");
    }
  };

  const calculateStats = (productData) => {
    const stats = productData.reduce(
      (acc, product) => {
        const stock = product.warehouseStock || {};

        acc.totalProducts += 1;
        acc.totalStock += stock.finalStock || 0;
        acc.onlineStock += stock.onlineStock || 0;
        acc.offlineStock += stock.offlineStock || 0;
        acc.damagedItems += stock.damagedQty || 0;
        acc.refurbishedItems += stock.refurbishedQty || 0;

        const finalStock = stock.finalStock || 0;
        if (finalStock === 0) {
          acc.outOfStockItems += 1;
        } else if (finalStock <= systemSettings.lowStockThreshold) {
          acc.lowStockItems += 1;
        }

        return acc;
      },
      {
        totalProducts: 0,
        totalStock: 0,
        onlineStock: 0,
        offlineStock: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        damagedItems: 0,
        refurbishedItems: 0,
      },
    );

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower),
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category?._id === filters.category,
      );
    }

    // Apply brand filter
    if (filters.brand) {
      filtered = filtered.filter((product) =>
        product.brand?.some((b) => b._id === filters.brand),
      );
    }

    // Apply product type filter
    if (filters.productType) {
      filtered = filtered.filter(
        (product) => product.productType === filters.productType,
      );
    }

    // Apply compatible system filter
    if (filters.compatibleSystem) {
      filtered = filtered.filter(
        (product) => product.compatibleSystem?._id === filters.compatibleSystem,
      );
    }

    // Apply availability filter
    if (filters.availability) {
      filtered = filtered.filter((product) => {
        const stock = product.warehouseStock?.finalStock || 0;
        switch (filters.availability) {
          case "in-stock":
            return stock > systemSettings.lowStockThreshold;
          case "low-stock":
            return stock > 0 && stock <= systemSettings.lowStockThreshold;
          case "out-of-stock":
            return stock === 0;
          default:
            return true;
        }
      });
    }

    // NEW: Apply weight filter
    if (filters.weightFilter) {
      filtered = filtered.filter((product) => {
        switch (filters.weightFilter) {
          case "not-set":
            return !product.weight || product.weight === 0;
          case "set":
            return product.weight && product.weight > 0;
          default:
            return true;
        }
      });
    }

    // NEW: Apply weight sorting
    if (filters.weightSort) {
      filtered.sort((a, b) => {
        const weightA = a.weight || 0;
        const weightB = b.weight || 0;

        switch (filters.weightSort) {
          case "lightest":
            return weightA - weightB;
          case "heaviest":
            return weightB - weightA;
          default:
            return 0;
        }
      });
    }

    setFilteredProducts(filtered);

    // Update pagination
    setPagination((prev) => ({
      ...prev,
      currentPage: 1, // Reset to first page when filters change
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.itemsPerPage),
    }));
  };

  const applyPagination = () => {
    const { currentPage, itemsPerPage } = pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredProducts.slice(startIndex, endIndex);
    setPaginatedProducts(paginated);
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: newPage,
    }));
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setPagination((prev) => ({
      ...prev,
      itemsPerPage: newItemsPerPage,
      currentPage: 1, // Reset to first page
      totalPages: Math.ceil(filteredProducts.length / newItemsPerPage),
    }));
  };

  const handleEditStock = (product) => {
    if (!canEdit) {
      toast.error("Warehouse stock editing is disabled");
      return;
    }
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleEditWeight = (product) => {
    if (!canEditWeight) {
      toast.error("Only warehouse staff can edit product weights");
      return;
    }
    setEditingWeightProduct(product);
    setShowWeightModal(true);
  };

  const handleSaveStock = async (productId, stockData) => {
    try {
      const response = await warehouseAPI.updateStock({
        productId,
        ...stockData,
      });

      if (response.success) {
        toast.success("Stock updated successfully");
        await fetchProducts();
        setShowEditModal(false);
        setEditingProduct(null);
      } else {
        toast.error(response.message || "Failed to update stock");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error(handleApiError(error, "Failed to update stock"));
    }
  };

  const handleSaveWeight = async (productId, weight) => {
    try {
      const response = await warehouseAPI.updateWeight(productId, weight);

      if (response.success) {
        toast.success("Product weight updated successfully");
        await fetchProducts();
        setShowWeightModal(false);
        setEditingWeightProduct(null);
      } else {
        toast.error(response.message || "Failed to update weight");
      }
    } catch (error) {
      console.error("Error updating weight:", error);
      toast.error(handleApiError(error, "Failed to update weight"));
    }
  };

  const handleSystemToggle = async (enabled) => {
    try {
      if (enabled) {
        const response = await warehouseAPI.enableSystem();
        if (response.success) {
          setSystemEnabled(true);
          toast.success("Warehouse stock system enabled");
        }
      } else {
        const response = await warehouseAPI.disableSystem();
        if (response.success) {
          setSystemEnabled(false);
          toast.success("Warehouse stock system disabled");
        }
      }
    } catch (error) {
      console.error("Error toggling system:", error);
      toast.error(error.message || "Failed to update system status");
    }
  };

  const handleUpdateSettings = async (settings) => {
    try {
      const response = await warehouseAPI.updateSystemSettings(settings);
      if (response.success) {
        setSystemSettings(response.data);
        toast.success("System settings updated successfully");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    }
  };

  const handleExportModal = async (config) => {
    try {
      const { format, columns, allProducts, limit } = config;

      const queryParams = {
        columns: columns,
        category: filters.category || undefined,
        brand: filters.brand || undefined,
        productType: filters.productType || undefined,
        compatibleSystem: filters.compatibleSystem || undefined,
        limit: allProducts ? undefined : limit,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      if (format === "csv") {
        toast.loading("Exporting CSV...");
        await warehouseAPI.exportStockCSV(queryParams);
        toast.dismiss();
        toast.success("CSV exported successfully");
      } else if (format === "pdf") {
        toast.loading("Generating PDF...");
        await warehouseAPI.exportStockPDF(queryParams);
        toast.dismiss();
        toast.success("PDF exported successfully");
      }

      // Close modal after successful export
      setShowImportExportModal(false);
    } catch (error) {
      toast.dismiss();
      console.error("Export error:", error);
      toast.error(handleApiError(error, "Failed to export data"));
    }
  };

  const handleImportModal = async (data) => {
    try {
      const { csvData, notificationEmails = [] } = data;

      const emails =
        notificationEmails.length > 0
          ? notificationEmails
          : [currentUser?.email].filter(Boolean);

      const response = await warehouseAPI.importStockCSV({
        csvData,
        notificationEmails: emails,
      });

      if (response.success) {
        await fetchProducts();
        return response;
      } else {
        throw new Error(response.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Warehouse Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manual stock quantity management and inventory control
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setImportExportType("export");
              setShowImportExportModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => {
              setImportExportType("import");
              setShowImportExportModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import Stock
          </button>

          <button
            onClick={() => setShowActivityLogModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity Log</span>
          </button>

          <RoleBasedAccess allowedRoles={["DIRECTOR", "IT"]}>
            <button
              onClick={() => setShowSystemControlModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">System Control</span>
            </button>
          </RoleBasedAccess>
        </div>
      </div>

      {/* System Status Alert */}
      <div
        className={`p-4 rounded-lg border ${
          systemEnabled
            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
        }`}
      >
        <div className="flex items-center gap-3">
          {systemEnabled ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <p
              className={`font-medium ${
                systemEnabled
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              Warehouse Stock System: {systemEnabled ? "Enabled" : "Disabled"}
            </p>
            <p
              className={`text-sm ${
                systemEnabled
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {systemEnabled
                ? "Warehouse staff can manually update stock quantities"
                : "Manual stock updates are disabled. Contact Director or IT to enable."}
            </p>
          </div>
        </div>
      </div>

      {/* Weight Notice */}
      <div className="p-4 rounded-lg border bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
        <div className="flex items-center gap-3">
          <Scale className="h-5 w-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-800 dark:text-orange-200">
              Product Weight Management
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Warehouse staff can always update product weights without
              additional approval.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <WarehouseStatsCards systemSettings={systemSettings} />

      {/* Filters */}
      <WarehouseFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        brands={brands}
        compatibleSystems={compatibleSystems}
        filteredCount={filteredProducts.length}
        totalCount={products.length}
      />

      {/* Stock Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Product Stock Management
            </h3>
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Show:</span>
                <select
                  value={pagination.itemsPerPage}
                  onChange={(e) =>
                    handleItemsPerPageChange(parseInt(e.target.value))
                  }
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Package className="h-4 w-4" />
                {filteredProducts.length} of {products.length} products
              </div>
            </div>
          </div>
        </div>

        <WarehouseStockTable
          loading={loading}
          filteredProducts={paginatedProducts}
          canEdit={canEdit}
          onEditStock={handleEditStock}
          onEditWeight={handleEditWeight}
          systemSettings={systemSettings}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center md:text-left">
                Showing{" "}
                {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems,
                )}{" "}
                of {pagination.totalItems} results
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="flex items-center gap-1 px-2 md:px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page numbers - hide some on mobile */}
                <div className="flex items-center gap-1">
                  {Array.from(
                    {
                      length: Math.min(
                        pagination.totalPages,
                        window.innerWidth < 640 ? 3 : 5,
                      ),
                    },
                    (_, i) => {
                      let pageNumber;
                      if (
                        pagination.totalPages <=
                        (window.innerWidth < 640 ? 3 : 5)
                      ) {
                        pageNumber = i + 1;
                      } else {
                        const start = Math.max(
                          1,
                          pagination.currentPage -
                            (window.innerWidth < 640 ? 1 : 2),
                        );
                        pageNumber = start + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-2 md:px-3 py-2 text-sm rounded-lg transition-colors ${
                            pagination.currentPage === pageNumber
                              ? "bg-blue-600 text-white"
                              : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="flex items-center gap-1 px-2 md:px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock Edit Modal */}
      {showEditModal && editingProduct && (
        <StockEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          onSave={handleSaveStock}
        />
      )}

      {/* Weight Edit Modal */}
      {showWeightModal && editingWeightProduct && (
        <WeightEditModal
          isOpen={showWeightModal}
          onClose={() => {
            setShowWeightModal(false);
            setEditingWeightProduct(null);
          }}
          product={editingWeightProduct}
          onSave={handleSaveWeight}
        />
      )}

      {/* System Control Modal */}
      {showSystemControlModal && (
        <SystemControlModal
          isOpen={showSystemControlModal}
          onClose={() => setShowSystemControlModal(false)}
          systemEnabled={systemEnabled}
          systemSettings={systemSettings}
          onToggleSystem={handleSystemToggle}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {showImportExportModal && (
        <ImportExportModal
          isOpen={showImportExportModal}
          onClose={() => setShowImportExportModal(false)}
          type={importExportType}
          onExport={handleExportModal}
          onImport={handleImportModal}
        />
      )}

      {/* Activity Log Modal */}
      {showActivityLogModal && (
        <ActivityLogModal
          isOpen={showActivityLogModal}
          onClose={() => setShowActivityLogModal(false)}
        />
      )}
    </div>
  );
};

export default WarehouseManagement;
