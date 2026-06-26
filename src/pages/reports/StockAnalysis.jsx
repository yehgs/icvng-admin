//admin
// src/pages/reports/StockAnalysis.jsx
// Roles: IT, DIRECTOR, WAREHOUSE, MANAGER
import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  Archive,
  TrendingUp,
  RefreshCw,
  Download,
  Search,
  BarChart3,
  Warehouse,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const tok = () => localStorage.getItem("accessToken");
const api = async (p) => {
  const r = await fetch(`${API_BASE}${p}`, {
    headers: { Authorization: `Bearer ${tok()}` },
  });
  return r.json();
};

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];
const QUALITY_COLORS = {
  PASSED: "#10B981",
  REFURBISHED: "#3B82F6",
  DAMAGED: "#EF4444",
  EXPIRED: "#6B7280",
};

function fmtN(n) {
  return n != null ? Number(n).toLocaleString() : "—";
}
function fmtCur(n) {
  return n != null ? `₦${Number(n).toLocaleString()}` : "₦0";
}
function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function StockAnalysis() {
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterQuality, setFilterQuality] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [sum, batchData, exp, wh, prods] = await Promise.all([
      api("/stock/summary"),
      api("/stock/batches?page=1&limit=200"),
      api(`/stock/expiring?days=${expiryDays}`),
      api("/warehouse"),
      api("/product/get?page=1&limit=200"),
    ]);
    setSummary(sum.data || sum);
    setBatches(batchData.data || []);
    setExpiring(exp.data || []);
    setWarehouses(wh.data || []);
    setProducts(prods.data || []);
    setLoading(false);
  }, [expiryDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Aggregations ─────────────────────────────────────────────────────────
  const filteredBatches = batches.filter((b) => {
    const searchMatch =
      !search ||
      b.productName?.toLowerCase().includes(search.toLowerCase()) ||
      b.batchNumber?.toLowerCase().includes(search.toLowerCase());
    const qualityMatch = !filterQuality || b.quality === filterQuality;
    return searchMatch && qualityMatch;
  });

  // Quality breakdown
  const qualityMap = {};
  batches.forEach((b) => {
    qualityMap[b.quality] = (qualityMap[b.quality] || 0) + (b.quantity || 0);
  });
  const qualityData = Object.entries(qualityMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Category stock distribution (from products)
  const catStock = {};
  products.forEach((p) => {
    const cat = p.category?.name || "Uncategorised";
    catStock[cat] = (catStock[cat] || 0) + (p.stock || 0);
  });
  const catStockData = Object.entries(catStock)
    .map(([name, stock]) => ({ name, stock }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 8);

  // Low stock products
  const lowStock = products
    .filter((p) => (p.stock || 0) <= 10)
    .sort((a, b) => (a.stock || 0) - (b.stock || 0));
  const outOfStock = products.filter((p) => (p.stock || 0) === 0);

  const totalStockValue = products.reduce(
    (s, p) => s + (p.price || 0) * (p.stock || 0),
    0,
  );

  const exportCSV = () => {
    const rows = [
      [
        "Batch No",
        "Product",
        "Quality",
        "Quantity",
        "Expiry Date",
        "Location",
        "Received",
      ],
    ];
    filteredBatches.forEach((b) =>
      rows.push([
        b.batchNumber || "",
        b.productName || b.product?.name || "",
        b.quality || "",
        b.quantity || 0,
        b.expiryDate ? new Date(b.expiryDate).toLocaleDateString("en-NG") : "",
        `${b.location?.zone || ""}-${b.location?.shelf || ""}`,
        b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-NG") : "",
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "stock_analysis.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-orange-600" /> Stock Analysis
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Inventory levels, batch quality and warehouse utilisation
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
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            value: fmtN(summary?.totalProducts || products.length),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            sub: "In catalog",
          },
          {
            label: "Stock Value",
            value: fmtCur(totalStockValue),
            icon: BarChart3,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
            sub: "Estimated at retail",
          },
          {
            label: "Low Stock",
            value: fmtN(lowStock.length),
            icon: AlertTriangle,
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20",
            sub: "≤10 units remaining",
          },
          {
            label: "Out of Stock",
            value: fmtN(outOfStock.length),
            icon: Archive,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20",
            sub: "Needs restocking",
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
              {loading ? "..." : s.value}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {s.label}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "overview", label: "Overview" },
          { id: "batches", label: "Stock Batches" },
          {
            id: "low-stock",
            label: `Low Stock${lowStock.length > 0 ? ` (${lowStock.length})` : ""}`,
          },
          {
            id: "expiring",
            label: `Expiring${expiring.length > 0 ? ` (${expiring.length})` : ""}`,
          },
          { id: "warehouses", label: "Warehouses" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview charts */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Stock by Category
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catStockData} layout="vertical">
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
                  <Tooltip />
                  <Bar
                    dataKey="stock"
                    fill="#F97316"
                    radius={[0, 4, 4, 0]}
                    name="Units"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Batch Quality Breakdown
              </h3>
              {qualityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={qualityData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      fontSize={10}
                    >
                      {qualityData.map(({ name }, i) => (
                        <Cell
                          key={i}
                          fill={
                            QUALITY_COLORS[name] || COLORS[i % COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${fmtN(v)} units`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  <div className="text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No batch data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Critical alerts */}
          {(lowStock.length > 0 || expiring.length > 0) && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Alerts Requiring Attention
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowStock.slice(0, 5).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-gray-800 dark:text-gray-200 truncate mr-2">
                      {p.name}
                    </span>
                    <span
                      className={`font-bold flex-shrink-0 ${(p.stock || 0) === 0 ? "text-red-600" : "text-orange-500"}`}
                    >
                      {p.stock || 0} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batches table */}
      {tab === "batches" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or batch number..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Quality</option>
              {["PASSED", "REFURBISHED", "DAMAGED", "EXPIRED"].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400 self-center">
              {filteredBatches.length} batches
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    "Batch No",
                    "Product",
                    "Quality",
                    "Quantity",
                    "Location",
                    "Expiry",
                    "Received",
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No batches found
                    </td>
                  </tr>
                ) : (
                  filteredBatches.slice(0, 100).map((b, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">
                        {b.batchNumber || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 truncate max-w-40">
                        {b.productName || b.product?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${QUALITY_COLORS[b.quality] || "#6B7280"}20`,
                            color: QUALITY_COLORS[b.quality] || "#6B7280",
                          }}
                        >
                          {b.quality || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                        {fmtN(b.quantity)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                        {[
                          b.location?.zone,
                          b.location?.aisle,
                          b.location?.shelf,
                          b.location?.bin,
                        ]
                          .filter(Boolean)
                          .join("-") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {b.expiryDate ? (
                          <span
                            className={`text-xs font-medium ${new Date(b.expiryDate) < new Date(Date.now() + 30 * 86400000) ? "text-orange-600" : "text-gray-500"}`}
                          >
                            {new Date(b.expiryDate).toLocaleDateString("en-NG")}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {timeAgo(b.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low stock */}
      {tab === "low-stock" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {lowStock.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-400" />
              <p>All products are sufficiently stocked</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-orange-50 dark:bg-orange-900/10">
                <tr>
                  {[
                    "Product",
                    "Category",
                    "Stock",
                    "Retail Price",
                    "Stock Value",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-orange-600 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lowStock.map((p, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-orange-50/30 dark:hover:bg-orange-900/5 ${(p.stock || 0) === 0 ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image?.[0] && (
                          <img
                            src={p.image[0]}
                            alt=""
                            className="w-7 h-7 rounded object-cover"
                          />
                        )}
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-40">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.category?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold text-lg ${(p.stock || 0) === 0 ? "text-red-600" : "text-orange-500"}`}
                      >
                        {p.stock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {fmtCur(p.price)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                      {fmtCur((p.price || 0) * (p.stock || 0))}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href="/admin/purchase-orders"
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Create PO →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Expiring */}
      {tab === "expiring" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show expiring within:
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {expiring.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <Archive className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-400" />
                <p>No items expiring within {expiryDays} days</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-red-50 dark:bg-red-900/10">
                  <tr>
                    {[
                      "Product",
                      "Batch",
                      "Quality",
                      "Quantity",
                      "Expiry Date",
                      "Days Left",
                      "Location",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {expiring.map((b, i) => {
                    const days = Math.ceil(
                      (new Date(b.expiryDate) - Date.now()) / 86400000,
                    );
                    const isExpired = days <= 0;
                    return (
                      <tr
                        key={i}
                        className={`hover:bg-red-50/30 dark:hover:bg-red-900/5 ${isExpired ? "bg-red-50/50 dark:bg-red-900/10" : days <= 7 ? "bg-orange-50/30 dark:bg-orange-900/5" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                          {b.productName || b.product?.name || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600">
                          {b.batchNumber || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${QUALITY_COLORS[b.quality] || "#6B7280"}20`,
                              color: QUALITY_COLORS[b.quality] || "#6B7280",
                            }}
                          >
                            {b.quality || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                          {fmtN(b.quantity)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(b.expiryDate).toLocaleDateString("en-NG")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-bold ${isExpired ? "text-red-600" : days <= 7 ? "text-orange-600" : "text-yellow-600"}`}
                          >
                            {isExpired ? "Expired" : `${days}d`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {[b.location?.zone, b.location?.shelf]
                            .filter(Boolean)
                            .join("-") || "—"}
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

      {/* Warehouses */}
      {tab === "warehouses" && (
        <div className="space-y-4">
          {warehouses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
              <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No warehouses configured yet</p>
              <a
                href="/admin/warehouse"
                className="text-sm text-blue-600 hover:underline mt-2 block"
              >
                Set up warehouses →
              </a>
            </div>
          ) : (
            warehouses.map((wh, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {wh.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {wh.location || wh.address || "—"}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${wh.isActive !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {wh.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Capacity", value: fmtN(wh.capacity) },
                    { label: "Zones", value: fmtN(wh.zones?.length) },
                    { label: "Manager", value: wh.manager || "—" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center"
                    >
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {s.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
