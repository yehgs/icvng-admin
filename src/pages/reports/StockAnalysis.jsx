// admin/src/pages/reports/StockAnalysis.jsx
// Roles: IT, DIRECTOR, WAREHOUSE, MANAGER
import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  Archive,
  RefreshCw,
  Download,
  Search,
  TrendingDown,
  TrendingUp,
  Clock,
  Layers,
  BarChart2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const tok = () => localStorage.getItem("accessToken");
const api = async (path) => {
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${tok()}` },
    });
    if (!r.ok) return { success: false, data: null };
    return r.json();
  } catch {
    return { success: false, data: null };
  }
};

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#EC4899",
];
const STATUS_CONFIG = {
  IN_STOCK: {
    label: "In Stock",
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
    dot: "bg-green-500",
  },
  LOW_STOCK: {
    label: "Low Stock",
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    dot: "bg-orange-500",
  },
  CRITICAL_STOCK: {
    label: "Critical",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
    dot: "bg-red-500",
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-700",
    dot: "bg-gray-400",
  },
};

function fmtN(n) {
  return n != null ? Number(n).toLocaleString() : "—";
}
function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - Date.now()) / 86400000);
}

// Resolve effective stock from product document (mirrors InventoryReports logic)
function resolveStock(p) {
  if (p.partnerStock?.enabled)
    return {
      total: p.partnerStock.quantity || 0,
      online: p.partnerStock.quantity || 0,
      offline: 0,
      damaged: 0,
      expired: 0,
      refurb: 0,
      source: "Partner",
    };
  if (p.warehouseStock?.enabled) {
    const wh = p.warehouseStock;
    return {
      total: wh.finalStock || 0,
      online: wh.onlineStock || 0,
      offline: wh.offlineStock || 0,
      damaged: wh.damagedQty || 0,
      expired: wh.expiredQty || 0,
      refurb: wh.refurbishedQty || 0,
      source: "Warehouse",
    };
  }
  return {
    total: p.stock || 0,
    online: p.stock || 0,
    offline: 0,
    damaged: 0,
    expired: 0,
    refurb: 0,
    source: "Default",
  };
}

function getStockStatus(total) {
  if (total === 0) return "OUT_OF_STOCK";
  if (total <= 3) return "CRITICAL_STOCK";
  if (total <= 10) return "LOW_STOCK";
  return "IN_STOCK";
}

// ── Sort helper ────────────────────────────────────────────────────────────────
function useSortedData(data, defaultKey = "total", defaultDir = "asc") {
  const [sort, setSort] = useState({ key: defaultKey, dir: defaultDir });
  const sorted = [...data].sort((a, b) => {
    const av = a[sort.key] ?? 0;
    const bv = b[sort.key] ?? 0;
    return sort.dir === "asc" ? av - bv : bv - av;
  });
  const toggle = (key) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === "asc" ? "desc" : "asc",
    }));
  const Icon = ({ col }) => {
    if (sort.key !== col) return null;
    return sort.dir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };
  return { sorted, toggle, Icon, sort };
}

export default function StockAnalysis() {
  const { t } = useAdminTranslation();

  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [sortDir, setSortDir] = useState("asc");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [prods, wh, exp] = await Promise.all([
      api("/product/get?page=1&limit=500"),
      api("/warehouse/stock-summary"),
      api(`/stock/expiring?days=${expiryDays}`),
    ]);
    setProducts(Array.isArray(prods.data) ? prods.data : []);
    setSummary(wh.data || null);
    setBatches(Array.isArray(exp.data) ? exp.data : []);
    setLoading(false);
  }, [expiryDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Enrich products ────────────────────────────────────────────────────────
  const enriched = products.map((p) => ({
    ...p,
    _stock: resolveStock(p),
    _status: getStockStatus(resolveStock(p).total),
    _catName: p.category?.name || "Uncategorised",
  }));

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = enriched.filter((p) => {
    const sm =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const cm = !filterCat || p._catName === filterCat;
    const stm = !filterStatus || p._status === filterStatus;
    return sm && cm && stm;
  });

  // ── Status distribution ────────────────────────────────────────────────────
  const statusCounts = {
    IN_STOCK: 0,
    LOW_STOCK: 0,
    CRITICAL_STOCK: 0,
    OUT_OF_STOCK: 0,
  };
  enriched.forEach((p) => {
    statusCounts[p._status] = (statusCounts[p._status] || 0) + 1;
  });
  const statusPieData = Object.entries(statusCounts)
    .map(([key, value]) => ({ name: STATUS_CONFIG[key].label, value, key }))
    .filter((d) => d.value > 0);

  // ── Category breakdown ─────────────────────────────────────────────────────
  const catMap = {};
  enriched.forEach((p) => {
    const cat = p._catName;
    catMap[cat] = catMap[cat] || {
      name: cat,
      total: 0,
      online: 0,
      offline: 0,
      damaged: 0,
      products: 0,
    };
    catMap[cat].total += p._stock.total;
    catMap[cat].online += p._stock.online;
    catMap[cat].offline += p._stock.offline;
    catMap[cat].damaged += p._stock.damaged;
    catMap[cat].products += 1;
  });
  const catData = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // ── Low/critical stock sorted by total asc ─────────────────────────────────
  const urgentProducts = enriched
    .filter((p) =>
      ["LOW_STOCK", "CRITICAL_STOCK", "OUT_OF_STOCK"].includes(p._status),
    )
    .sort((a, b) => a._stock.total - b._stock.total);

  // ── Damaged/quality items ─────────────────────────────────────────────────
  const damagedItems = enriched
    .filter((p) => p._stock.damaged > 0 || p._stock.expired > 0)
    .sort(
      (a, b) =>
        b._stock.damaged +
        b._stock.expired -
        (a._stock.damaged + a._stock.expired),
    );

  // ── Category list for filter ──────────────────────────────────────────────
  const categories = [...new Set(enriched.map((p) => p._catName))].sort();

  // ── Table sorting ──────────────────────────────────────────────────────────
  const {
    sorted: sortedFiltered,
    toggle: toggleSort,
    Icon: SortIcon,
    sort: currentSort,
  } = useSortedData(
    filtered.map((p) => ({
      ...p,
      total: p._stock.total,
      online: p._stock.online,
      offline: p._stock.offline,
      damaged: p._stock.damaged,
    })),
    "total",
    "asc",
  );

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      [
        "Product",
        "SKU",
        "Category",
        "Source",
        "Status",
        "Total",
        "Online",
        "Offline",
        "Damaged",
        "Expired",
      ],
    ];
    filtered.forEach((p) =>
      rows.push([
        `"${p.name}"`,
        p.sku || "",
        p._catName,
        p._stock.source,
        STATUS_CONFIG[p._status]?.label || p._status,
        p._stock.total,
        p._stock.online,
        p._stock.offline,
        p._stock.damaged,
        p._stock.expired,
      ]),
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" }),
    );
    a.download = `stock_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600" />
            {t("reports.stockAnalysis")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Stock levels, quality issues, expiry tracking and category breakdown
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> {t("reports.exportCsv")}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total SKUs",
            value: loading
              ? "…"
              : fmtN(summary?.totalProducts ?? products.length),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            sub: "Active product catalogue",
          },
          {
            label: "Total Units",
            value: loading
              ? "…"
              : fmtN(
                  summary?.totalStock ??
                    enriched.reduce((s, p) => s + p._stock.total, 0),
                ),
            icon: Layers,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
            sub: `${fmtN(summary?.onlineStock ?? 0)} online · ${fmtN(summary?.offlineStock ?? 0)} offline`,
          },
          {
            label: "Low / Out of Stock",
            value: loading
              ? "…"
              : `${fmtN(urgentProducts.filter((p) => p._status !== "OUT_OF_STOCK").length)} / ${fmtN(statusCounts.OUT_OF_STOCK)}`,
            icon: AlertTriangle,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20",
            sub: `${fmtN(statusCounts.CRITICAL_STOCK)} critical (≤3 units)`,
          },
          {
            label: "Quality / Damaged",
            value: loading
              ? "…"
              : fmtN(
                  (summary?.damagedItems ?? 0) + (summary?.expiredItems ?? 0),
                ),
            icon: AlertCircle,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20",
            sub: `${fmtN(summary?.damagedItems ?? 0)} damaged · ${fmtN(summary?.expiredItems ?? 0)} expired`,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {s.value}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {s.label}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Status badge row ───────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
              ${
                filterStatus === key
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${STATUS_CONFIG[key].dot}`}
            />
            {STATUS_CONFIG[key].label}
            <span className={`text-xs font-bold ${STATUS_CONFIG[key].color}`}>
              {count}
            </span>
          </button>
        ))}
        {filterStatus && (
          <button
            onClick={() => setFilterStatus("")}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 underline"
          >
            clear
          </button>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "products", label: `All Products (${filtered.length})` },
          {
            id: "urgent",
            label: `Urgent (${urgentProducts.length})`,
            alert: urgentProducts.length > 0,
          },
          {
            id: "quality",
            label: `Quality Issues (${damagedItems.length})`,
            alert: damagedItems.length > 0,
          },
          {
            id: "expiry",
            label: `Expiring (${batches.length})`,
            alert: batches.some((b) => daysUntil(b.expiryDate) <= 7),
          },
        ].map(({ id, label, alert }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5
              ${tab === id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {label}
            {alert && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB: OVERVIEW — charts
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Category bar chart + status pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Stock Units by Category
              </h3>
              {catData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-12">
                  {t("common.noData")}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={catData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      width={90}
                    />
                    <Tooltip formatter={(v, n) => [fmtN(v), n]} />
                    <Legend />
                    <Bar
                      dataKey="online"
                      fill="#3B82F6"
                      stackId="a"
                      name="Online"
                    />
                    <Bar
                      dataKey="offline"
                      fill="#10B981"
                      stackId="a"
                      name="Offline"
                    />
                    <Bar
                      dataKey="damaged"
                      fill="#EF4444"
                      stackId="a"
                      name="Damaged"
                      radius={[0, 3, 3, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Stock Health Distribution
              </h3>
              {statusPieData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-12">
                  {t("common.noData")}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      fontSize={10}
                    >
                      {statusPieData.map(({ key }, i) => (
                        <Cell
                          key={i}
                          fill={
                            key === "IN_STOCK"
                              ? "#10B981"
                              : key === "LOW_STOCK"
                                ? "#F59E0B"
                                : key === "CRITICAL_STOCK"
                                  ? "#F97316"
                                  : "#EF4444"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category table summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Category Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {[
                      "Category",
                      "Products",
                      "Total Units",
                      "Online",
                      "Offline",
                      "Damaged",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {catData.map((c, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{c.products}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {fmtN(c.total)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">
                        {fmtN(c.online)}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-semibold">
                        {fmtN(c.offline)}
                      </td>
                      <td className="px-4 py-3">
                        {c.damaged > 0 ? (
                          <span className="text-red-600 font-semibold">
                            {fmtN(c.damaged)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: ALL PRODUCTS — full sortable table
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "products" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("stock.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">{t("products.allCategories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">{t("products.allStatus")}</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400 self-center">
              {filtered.length} products
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Source
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-indigo-600"
                    onClick={() => toggleSort("total")}
                  >
                    Total <SortIcon col="total" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide cursor-pointer hover:text-blue-700"
                    onClick={() => toggleSort("online")}
                  >
                    Online <SortIcon col="online" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-green-500 uppercase tracking-wide cursor-pointer hover:text-green-700"
                    onClick={() => toggleSort("offline")}
                  >
                    Offline <SortIcon col="offline" />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-red-500 uppercase tracking-wide cursor-pointer hover:text-red-700"
                    onClick={() => toggleSort("damaged")}
                  >
                    Damaged <SortIcon col="damaged" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      {t("common.loading")}
                    </td>
                  </tr>
                ) : sortedFiltered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  sortedFiltered.slice(0, 150).map((p, i) => {
                    const cfg =
                      STATUS_CONFIG[p._status] || STATUS_CONFIG.IN_STOCK;
                    return (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {p.image?.[0] && (
                              <img
                                src={p.image[0]}
                                alt=""
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-44">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p._catName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                            {p._stock.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                          {fmtN(p._stock.total)}
                        </td>
                        <td className="px-4 py-3 text-blue-600 font-semibold">
                          {fmtN(p._stock.online)}
                        </td>
                        <td className="px-4 py-3 text-green-600 font-semibold">
                          {fmtN(p._stock.offline)}
                        </td>
                        <td className="px-4 py-3">
                          {p._stock.damaged > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {fmtN(p._stock.damaged)}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
                          >
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1 align-middle`}
                            />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: URGENT — low/critical/out-of-stock
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "urgent" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {urgentProducts.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-400" />
              <p className="font-medium text-green-600 dark:text-green-400">
                All products are well stocked!
              </p>
              <p className="text-sm mt-1 text-gray-400">
                No products below the 10-unit threshold.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-red-50 dark:bg-red-900/10">
                <tr>
                  {[
                    "Product",
                    "Category",
                    "Source",
                    "Online",
                    "Offline",
                    "Total Stock",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {urgentProducts.map((p, i) => {
                  const cfg = STATUS_CONFIG[p._status];
                  return (
                    <tr
                      key={i}
                      className={`hover:bg-red-50/20 dark:hover:bg-red-900/5 transition-colors
                      ${p._status === "OUT_OF_STOCK" ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-44">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {p.sku}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p._catName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                          {p._stock.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold">
                        {fmtN(p._stock.online)}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-semibold">
                        {fmtN(p._stock.offline)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-lg font-black ${p._status === "OUT_OF_STOCK" ? "text-red-600" : p._status === "CRITICAL_STOCK" ? "text-orange-600" : "text-yellow-600"}`}
                        >
                          {p._stock.total}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href="/admin/purchase-orders"
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold hover:underline whitespace-nowrap"
                        >
                          Create PO →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: QUALITY ISSUES — damaged + expired
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "quality" && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Damaged Units",
                value: fmtN(
                  summary?.damagedItems ??
                    damagedItems.reduce((s, p) => s + p._stock.damaged, 0),
                ),
                color: "text-red-600",
                bg: "bg-red-50 dark:bg-red-900/20",
              },
              {
                label: "Expired Units",
                value: fmtN(
                  summary?.expiredItems ??
                    damagedItems.reduce((s, p) => s + p._stock.expired, 0),
                ),
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-900/20",
              },
              {
                label: "Refurbished Units",
                value: fmtN(
                  summary?.refurbishedItems ??
                    damagedItems.reduce((s, p) => s + p._stock.refurb, 0),
                ),
                color: "text-yellow-600",
                bg: "bg-yellow-50 dark:bg-yellow-900/20",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.bg} rounded-xl border border-white/40 p-4`}
              >
                <p className={`text-2xl font-bold ${s.color}`}>
                  {loading ? "…" : s.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {damagedItems.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <Archive className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-400" />
                <p className="font-medium text-green-600 dark:text-green-400">
                  No quality issues detected.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-orange-50 dark:bg-orange-900/10">
                  <tr>
                    {[
                      "Product",
                      "Category",
                      "Damaged",
                      "Expired",
                      "Refurbished",
                      "Total Stock",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {damagedItems.map((p, i) => (
                    <tr
                      key={i}
                      className="hover:bg-orange-50/20 dark:hover:bg-orange-900/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 truncate max-w-52">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p._catName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-red-600">
                          {fmtN(p._stock.damaged)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${p._stock.expired > 0 ? "text-orange-600" : "text-gray-300 dark:text-gray-600"}`}
                        >
                          {p._stock.expired > 0 ? fmtN(p._stock.expired) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${p._stock.refurb > 0 ? "text-yellow-600" : "text-gray-300 dark:text-gray-600"}`}
                        >
                          {p._stock.refurb > 0 ? fmtN(p._stock.refurb) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">
                        {fmtN(p._stock.total)}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href="/admin/warehouse"
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold hover:underline"
                        >
                          Manage →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: EXPIRY — batch-level expiry tracking
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "expiry" && (
        <div className="space-y-4">
          {/* Expiry window selector */}
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <Clock className="h-4 w-4 text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show batches expiring within:
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {["7", "14", "30", "60", "90"].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400">
              {batches.length} batch{batches.length !== 1 ? "es" : ""} found
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {batches.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <Archive className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-400" />
                <p className="font-medium text-green-600 dark:text-green-400">
                  No batches expiring within {expiryDays} days.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-red-50 dark:bg-red-900/10">
                  <tr>
                    {[
                      "Product",
                      "Batch #",
                      "Quality",
                      "Qty",
                      "Expiry Date",
                      "Days Left",
                      "Location",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[...batches]
                    .sort(
                      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
                    )
                    .map((b, i) => {
                      const days = daysUntil(b.expiryDate);
                      const isExpired = days !== null && days <= 0;
                      return (
                        <tr
                          key={i}
                          className={`
                          ${isExpired ? "bg-red-50/50 dark:bg-red-900/10" : days <= 7 ? "bg-orange-50/30 dark:bg-orange-900/5" : ""}
                          hover:bg-red-50/20 dark:hover:bg-red-900/5 transition-colors`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                            {b.productName || b.product?.name || "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-blue-600">
                            {b.batchNumber || "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {b.quality || "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                            {fmtN(b.quantity)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                            {b.expiryDate
                              ? new Date(b.expiryDate).toLocaleDateString(
                                  "en-GB",
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {days === null ? (
                              "—"
                            ) : (
                              <span
                                className={`text-sm font-bold ${isExpired ? "text-red-600" : days <= 7 ? "text-orange-600" : "text-yellow-600"}`}
                              >
                                {isExpired ? "EXPIRED" : `${days}d`}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                            {[b.location?.zone, b.location?.shelf]
                              .filter(Boolean)
                              .join("–") || "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
