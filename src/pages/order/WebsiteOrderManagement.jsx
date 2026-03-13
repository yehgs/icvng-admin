// icvng-admin/src/pages/order/WebsiteOrderManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminOrderAPI, getCurrentUser } from "../../utils/api";
import {
  Package,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
  Eye,
  Globe,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import WebsiteOrderDetailsModal from "../../components/order/WebsiteOrderDetailsModal";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ORDERS_PER_PAGE = 10;

const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    dot: "bg-yellow-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-400",
  },
  PROCESSING: {
    label: "Processing",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    dot: "bg-purple-400",
  },
  SHIPPED: {
    label: "Shipped",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    dot: "bg-indigo-400",
  },
  DELIVERED: {
    label: "Delivered",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    dot: "bg-green-400",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-400",
  },
  RETURNED: {
    label: "Returned",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
  },
};

const PAYMENT_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  PAID: {
    label: "Paid",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  },
  PENDING_BANK_TRANSFER: {
    label: "Bank Transfer",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  PARTIAL: {
    label: "Partial",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
};

const PAYMENT_METHOD_CONFIG = {
  PAYSTACK: {
    label: "Paystack",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  STRIPE: {
    label: "Stripe",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  CASH: {
    label: "Cash",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  CARD: {
    label: "Card",
    color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  },
  ONLINE: {
    label: "Online",
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    amount || 0,
  );

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Groups a flat paginated list of orders into orderGroupId buckets.
 * The backend may return multiple rows for one checkout (one row per product);
 * we reassemble them client-side using orderGroupId + isParentOrder.
 */
const groupOrdersByGroupId = (ordersList) => {
  const map = new Map();

  ordersList.forEach((order) => {
    const gid = order.orderGroupId || `SINGLE-${order._id}`;

    if (!map.has(gid)) {
      map.set(gid, {
        orderGroupId: gid,
        parentOrder: null,
        childOrders: [],
        allOrders: [],
        summary: {
          totalItems: order.totalItemsInGroup || 1,
          createdAt: order.createdAt,
          order_status: order.order_status,
          payment_status: order.payment_status,
          payment_method: order.payment_method,
          totals: order.groupTotals || {
            subTotal: order.subTotalAmt || 0,
            totalShipping: order.shipping_cost || 0,
            totalDiscount: order.discount_amount || 0,
            totalTax: order.tax_amount || 0,
            grandTotal: order.totalAmt || 0,
          },
        },
      });
    }

    const group = map.get(gid);
    group.allOrders.push(order);

    // isParentOrder flag from backend, or first encountered = parent
    if (order.isParentOrder || !group.parentOrder) {
      group.parentOrder = order;
    }
  });

  // Re-derive childOrders so parentOrder is never duplicated in the list
  map.forEach((g) => {
    g.childOrders = g.allOrders.filter((o) => o._id !== g.parentOrder?._id);
  });

  return Array.from(map.values());
};

const buildPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (currentPage >= totalPages - 3)
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, type = "order" }) => {
  const cfg =
    type === "order"
      ? ORDER_STATUS_CONFIG[status]
      : PAYMENT_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}
    >
      {type === "order" && cfg.dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      )}
      {cfg.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, iconBg }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
    <div className={`p-3 rounded-xl flex-shrink-0 ${iconBg}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  </div>
);

const FilterChip = ({ label, onRemove, color = "blue" }) => {
  const palette = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    green:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    orange:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300",
    yellow:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${palette[color]}`}
    >
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:opacity-75"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────
const WebsiteOrderManagement = () => {
  // ── Data state ─────────────────────────────────────────────
  const [orderGroups, setOrderGroups] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Pagination ─────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filters ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Modal ──────────────────────────────────────────────────
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const currentUser = getCurrentUser();

  // ── Debounce ref for search ─────────────────────────────────
  const searchDebounce = useRef(null);

  // ── Core fetch ─────────────────────────────────────────────
  const fetchOrders = useCallback(
    async (page = currentPage) => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: ORDERS_PER_PAGE,
          sortBy,
          sortOrder,
          isWebsiteOrder: "true",
          ...(searchTerm && { search: searchTerm }),
          ...(filterType && { orderType: filterType }),
          ...(filterStatus && { orderStatus: filterStatus }),
          ...(filterPaymentStatus && { paymentStatus: filterPaymentStatus }),
          ...(filterPaymentMethod && { paymentMethod: filterPaymentMethod }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        };

        const res = await adminOrderAPI.getOrders(params);

        if (res.success) {
          const docs = res.data.docs || [];
          const grouped = groupOrdersByGroupId(docs);
          setOrderGroups(grouped);
          setTotalOrders(res.data.totalDocs || 0);

          // Derive quick stats from the raw doc list
          setStats({
            total: res.data.totalDocs || 0,
            paid: docs.filter((o) => o.payment_status === "PAID").length,
            pending: docs.filter((o) => o.order_status === "PENDING").length,
            delivered: docs.filter((o) => o.order_status === "DELIVERED")
              .length,
          });
        }
      } catch (err) {
        console.error("fetchOrders:", err);
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      sortBy,
      sortOrder,
      searchTerm,
      filterType,
      filterStatus,
      filterPaymentStatus,
      filterPaymentMethod,
      startDate,
      endDate,
    ],
  );

  // Fire on page / sort / filter changes (not search – that's debounced below)
  useEffect(() => {
    fetchOrders(currentPage);
  }, [
    currentPage,
    sortBy,
    sortOrder,
    filterType,
    filterStatus,
    filterPaymentStatus,
    filterPaymentMethod,
    startDate,
    endDate,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — resets to page 1 then fetches
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders(1);
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page when non-search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterType,
    filterStatus,
    filterPaymentStatus,
    filterPaymentMethod,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  // ── Derived ────────────────────────────────────────────────
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);

  const hasActiveFilters = Boolean(
    searchTerm ||
    filterType ||
    filterStatus ||
    filterPaymentStatus ||
    filterPaymentMethod ||
    startDate ||
    endDate,
  );

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterStatus("");
    setFilterPaymentStatus("");
    setFilterPaymentMethod("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleViewOrder = (group) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  const handleOrderUpdated = () => {
    fetchOrders(currentPage);
    setShowDetailsModal(false);
    setSelectedGroup(null);
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Website Orders
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-14">
            Orders placed directly through the website
          </p>
        </div>

        <button
          onClick={() => fetchOrders(currentPage)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Failed to load orders
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
              {error}
            </p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Quick Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={ShoppingBag}
            label="Total Orders"
            value={stats.total.toLocaleString()}
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={CheckCircle}
            label="Paid"
            value={stats.paid}
            sub="this page"
            iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            sub="need attention"
            iconBg="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Delivered"
            value={stats.delivered}
            sub="this page"
            iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          />
        </div>
      )}

      {/* ── Filter Panel ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Panel header */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Filters & Search
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showAdvanced ? "Fewer filters" : "More filters"}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1 – always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order ID, group ID, email…"
                className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Order Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="BTC">BTC – Consumer</option>
              <option value="BTB">BTB – Business</option>
            </select>

            {/* Order Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              {Object.entries(ORDER_STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>

            {/* Payment Status */}
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Payment Statuses</option>
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([val, cfg]) => (
                <option key={val} value={val}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2 – advanced (toggle) */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              {/* Payment Method */}
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Payment Methods</option>
                {Object.entries(PAYMENT_METHOD_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              {/* Date From */}
              <div className="relative">
                <label className="absolute -top-2 left-2.5 px-1 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Date To */}
              <div className="relative">
                <label className="absolute -top-2 left-2.5 px-1 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="totalAmt">Amount</option>
                  <option value="order_status">Order Status</option>
                  <option value="payment_status">Payment Status</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder((v) => (v === "desc" ? "asc" : "desc"))
                  }
                  title={`Currently ${sortOrder === "desc" ? "newest first" : "oldest first"}`}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {sortOrder === "desc" ? "↓" : "↑"}
                </button>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Filtering:
              </span>
              {searchTerm && (
                <FilterChip
                  label={`"${searchTerm}"`}
                  onRemove={() => setSearchTerm("")}
                  color="blue"
                />
              )}
              {filterType && (
                <FilterChip
                  label={`Type: ${filterType}`}
                  onRemove={() => setFilterType("")}
                  color="green"
                />
              )}
              {filterStatus && (
                <FilterChip
                  label={`Status: ${ORDER_STATUS_CONFIG[filterStatus]?.label || filterStatus}`}
                  onRemove={() => setFilterStatus("")}
                  color="orange"
                />
              )}
              {filterPaymentStatus && (
                <FilterChip
                  label={`Payment: ${PAYMENT_STATUS_CONFIG[filterPaymentStatus]?.label || filterPaymentStatus}`}
                  onRemove={() => setFilterPaymentStatus("")}
                  color="yellow"
                />
              )}
              {filterPaymentMethod && (
                <FilterChip
                  label={`Method: ${PAYMENT_METHOD_CONFIG[filterPaymentMethod]?.label || filterPaymentMethod}`}
                  onRemove={() => setFilterPaymentMethod("")}
                  color="purple"
                />
              )}
              {(startDate || endDate) && (
                <FilterChip
                  label={`Date: ${startDate || "—"} → ${endDate || "—"}`}
                  onRemove={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  color="blue"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table bar */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/40">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {loading
              ? "Loading…"
              : `${totalOrders.toLocaleString()} order${totalOrders !== 1 ? "s" : ""} found`}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/30">
                {[
                  "Order Group",
                  "Customer",
                  "Products",
                  "Amount",
                  "Delivery Address",
                  "Order Status",
                  "Payment",
                  "Date",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {/* Loading skeleton */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        {j < 2 && (
                          <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2 mt-1.5" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

              {/* Empty state */}
              {!loading && orderGroups.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <Globe className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        No website orders found
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Orders placed on the website will appear here"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading &&
                orderGroups.map((group) => {
                  const main = group.parentOrder || group.allOrders[0];
                  if (!main) return null;

                  const isMulti = group.summary.totalItems > 1;
                  const methodCfg =
                    PAYMENT_METHOD_CONFIG[main.payment_method] ||
                    PAYMENT_METHOD_CONFIG.ONLINE;
                  const addr = main.delivery_address;
                  const addrSnippet = addr
                    ? [addr.city || addr.address_line, addr.state]
                        .filter(Boolean)
                        .join(", ")
                    : null;

                  return (
                    <tr
                      key={group.orderGroupId}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      {/* Order Group */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white font-mono leading-tight">
                              {group.orderGroupId.length > 18
                                ? `${group.orderGroupId.slice(0, 18)}…`
                                : group.orderGroupId}
                            </p>
                            {isMulti && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {group.summary.totalItems} items
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 flex-shrink-0 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mt-0.5">
                            <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                              {main.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate max-w-[140px]">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {main.userId?.email || "—"}
                            </p>
                            {main.userId?.mobile && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                {main.userId.mobile}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Products */}
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            {isMulti ? (
                              <>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {group.summary.totalItems} Products
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Multiple items
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[150px] truncate">
                                  {main.productId?.name ||
                                    main.product_details?.name ||
                                    "Product"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Qty: {main.quantity || 1}
                                  {main.product_details?.priceOption &&
                                    main.product_details.priceOption !==
                                      "regular" && (
                                      <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">
                                        {main.product_details.priceOption}
                                      </span>
                                    )}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(group.summary.totals.grandTotal)}
                        </p>
                        {group.summary.totals.totalShipping > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                            <Truck className="w-3 h-3" />+
                            {formatCurrency(group.summary.totals.totalShipping)}
                          </p>
                        )}
                        {group.summary.totals.totalDiscount > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            −
                            {formatCurrency(group.summary.totals.totalDiscount)}{" "}
                            off
                          </p>
                        )}
                      </td>

                      {/* Delivery Address */}
                      <td className="px-4 py-4">
                        {addrSnippet ? (
                          <div className="flex items-start gap-1.5 max-w-[160px]">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                                {addrSnippet}
                              </p>
                              {addr.lga && (
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {addr.lga} LGA
                                </p>
                              )}
                              {addr.mobile && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  {addr.mobile}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                            No address
                          </span>
                        )}
                      </td>

                      {/* Order Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={group.summary.order_status}
                          type="order"
                        />
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <StatusBadge
                            status={group.summary.payment_status}
                            type="payment"
                          />
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${methodCfg.color}`}
                          >
                            <CreditCard className="w-3 h-3" />
                            {methodCfg.label}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {formatDate(group.summary.createdAt)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewOrder(group)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.min((currentPage - 1) * ORDERS_PER_PAGE + 1, totalOrders)}
            </span>
            {" – "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)}
            </span>
            {" of "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalOrders.toLocaleString()}
            </span>
          </p>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {buildPageNumbers(currentPage, totalPages).map((pg, idx) =>
              pg === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-gray-400 text-sm"
                >
                  …
                </span>
              ) : (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pg
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {pg}
                </button>
              ),
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}

      {/* ── Order Details Modal ── */}
      {showDetailsModal && selectedGroup && (
        <WebsiteOrderDetailsModal
          orderGroup={selectedGroup}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGroup(null);
          }}
          onUpdate={handleOrderUpdated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default WebsiteOrderManagement;
