//admin
// src/pages/reports/InventoryReports.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Download,
  RefreshCw,
  Search,
  BarChart3,
  Archive,
  Warehouse,
  Globe,
  Store,
  Users,
  Truck,
} from "lucide-react";

import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
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
} from "recharts";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const tok = () => localStorage.getItem("accessToken");
const api = async (p) => {
  try {
    const r = await fetch(`${API_BASE}${p}`, {
      headers: { Authorization: `Bearer ${tok()}` },
    });
    if (!r.ok) return { success: false };
    return r.json();
  } catch {
    return { success: false };
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
function fmtN(n) {
  return n != null ? Number(n).toLocaleString() : "—";
}
function fmtC(n) {
  return n != null && n > 0 ? `₦${Number(n).toLocaleString()}` : "—";
}

// Resolve the effective stock figures from a product document
function resolveStock(p) {
  const wh = p.warehouseStock;
  const ps = p.partnerStock;

  if (ps?.enabled) {
    // Partner-managed: all stock is "online" from partner
    return {
      source: "Partner",
      total: ps.quantity || 0,
      online: ps.quantity || 0,
      offline: 0,
      damaged: 0,
      expired: 0,
      refurb: 0,
    };
  }
  if (wh?.enabled) {
    return {
      source: "Warehouse",
      total: wh.finalStock || 0,
      online: wh.onlineStock || 0,
      offline: wh.offlineStock || 0,
      damaged: wh.damagedQty || 0,
      expired: wh.expiredQty || 0,
      refurb: wh.refurbishedQty || 0,
    };
  }
  // Fallback: legacy stock field
  return {
    source: "Default",
    total: p.stock || 0,
    online: p.stock || 0,
    offline: 0,
    damaged: 0,
    expired: 0,
    refurb: 0,
  };
}

// Source badge config
const SOURCE_BADGES = {
  Partner: "bg-purple-100 text-purple-700",
  Warehouse: "bg-blue-100 text-blue-700",
  Default: "bg-gray-100 text-gray-500",
};
const SOURCE_ICONS = {
  Partner: Truck,
  Warehouse: Warehouse,
  Default: Store,
};

export default function InventoryReports() {
  const { t } = useAdminTranslation();

  // Source key → translated display label (keys stay English for logic)
  const SOURCE_LABELS = {
    Partner: t("reports2.partner"),
    Warehouse: t("reports2.warehouse"),
    Default: t("reports2.default"),
  };

  const [whSummary, setWhSummary] = useState(null); // /warehouse/stock-summary data object
  const [products, setProducts] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [tab, setTab] = useState("overview");
  const [expiryDays, setExpiryDays] = useState("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [wh, prods, exp] = await Promise.all([
      api("/warehouse/stock-summary"), // { data:{ totalProducts, totalStock, onlineStock, offlineStock, lowStockItems, outOfStockItems, damagedItems, refurbishedItems, expiredItems } }
      api("/product/get?page=1&limit=200"), // { data:[], totalNoPage }
      api(`/stock/expiring?days=${expiryDays}`), // { data:[] }
    ]);
    setWhSummary(wh.data || null);
    setProducts(Array.isArray(prods.data) ? prods.data : []);
    setExpiring(Array.isArray(exp.data) ? exp.data : []);
    setLoading(false);
  }, [expiryDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Enrich products with resolved stock
  const enriched = products.map((p) => ({ ...p, _stock: resolveStock(p) }));

  const filtered = enriched.filter((p) => {
    const sm = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const fm = !filterSource || p._stock.source === filterSource;
    return sm && fm;
  });

  // Aggregated stock figures
  const totalOnline = enriched.reduce((s, p) => s + p._stock.online, 0);
  const totalOffline = enriched.reduce((s, p) => s + p._stock.offline, 0);
  const totalPartner = enriched
    .filter((p) => p._stock.source === "Partner")
    .reduce((s, p) => s + p._stock.total, 0);
  const lowStock = enriched.filter(
    (p) => p._stock.total > 0 && p._stock.total <= 10,
  );
  const outOfStock = enriched.filter((p) => p._stock.total === 0);

  // Category breakdown
  const catMap = {};
  enriched.forEach((p) => {
    const cat = p.category?.name || "Uncategorised";
    catMap[cat] = catMap[cat] || {
      name: cat,
      total: 0,
      online: 0,
      offline: 0,
      partner: 0,
    };
    catMap[cat].total += p._stock.total;
    catMap[cat].online += p._stock.online;
    catMap[cat].offline += p._stock.offline;
    catMap[cat].partner += p._stock.source === "Partner" ? p._stock.total : 0;
  });
  const catData = Object.values(catMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Stock source breakdown
  const sourceData = [
    { name: "Online (Warehouse)", value: totalOnline },
    { name: "Offline (In-store)", value: totalOffline },
    { name: "Partner Stock", value: totalPartner },
  ].filter((d) => d.value > 0);

  const exportCSV = () => {
    const rows = [
      [
        "Product",
        "Category",
        "Stock Source",
        "Total Stock",
        t("customer.online"),
        t("customer.offline"),
        "Damaged",
        "Expired",
        "Sale Price",
        "B2B Price",
        "B2C Price",
      ],
    ];
    filtered.forEach((p) =>
      rows.push([
        `"${p.name}"`,
        p.category?.name || "",
        p._stock.source,
        p._stock.total,
        p._stock.online,
        p._stock.offline,
        p._stock.damaged,
        p._stock.expired,
        p.salePrice || p.price || 0,
        p.btbPrice || 0,
        p.btcPrice || 0,
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "inventory_report.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" /> {t("reports.inventoryReport")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Online, offline and partner stock with product-level breakdown
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> {t("reports.exportCsv")}
          </button>
        </div>
      </div>

      {/* Stock type legend */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          {
            icon: Globe,
            label: t("products.onlineStock"),
            desc: "Warehouse → onlineStock. Available on website.",
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            icon: Store,
            label: t("products.offlineStock"),
            desc: "Warehouse → offlineStock. In-store / walk-in only.",
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            icon: Truck,
            label: "Partner Stock",
            desc: "partnerStock.quantity. Held by partner, sold online.",
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-900/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-xl p-3 border border-white/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className={`font-semibold ${s.color}`}>{s.label}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Summary cards — from /warehouse/stock-summary + computed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            value: fmtN(whSummary?.totalProducts ?? products.length),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            sub: "In catalog",
          },
          {
            label: "Online Stock Units",
            value: fmtN(whSummary?.onlineStock ?? totalOnline),
            icon: Globe,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
            sub: "Website-available units",
          },
          {
            label: t("products.offlineStock"),
            value: fmtN(whSummary?.offlineStock ?? totalOffline),
            icon: Store,
            color: "text-indigo-600",
            bg: "bg-indigo-50 dark:bg-indigo-900/20",
            sub: "In-store only units",
          },
          {
            label: "Low / Out of Stock",
            value: `${fmtN(whSummary?.lowStockItems ?? lowStock.length)} / ${fmtN(whSummary?.outOfStockItems ?? outOfStock.length)}`,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20",
            sub: "Low (≤10) / Zero stock",
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
            <p className="text-xs font-medium text-gray-500 mt-0.5">
              {s.label}
            </p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Extra warehouse summary row */}
      {whSummary && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: "Total Stock",
              value: fmtN(whSummary.totalStock),
              color: "text-gray-800 dark:text-gray-200",
            },
            {
              label: "Damaged",
              value: fmtN(whSummary.damagedItems),
              color: "text-red-600",
            },
            {
              label: "Refurbished",
              value: fmtN(whSummary.refurbishedItems),
              color: "text-yellow-600",
            },
            {
              label: "Expired",
              value: fmtN(whSummary.expiredItems),
              color: "text-orange-600",
            },
            {
              label: "Manual Override",
              value: fmtN(whSummary.manualOverrideCount),
              color: "text-blue-600",
            },
            {
              label: "Batch-tracked",
              value: fmtN(whSummary.stockBatchCount),
              color: "text-green-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center"
            >
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "overview", label: "Overview" },
          { id: "products", label: `Products (${products.length})` },
          {
            id: "low-stock",
            label: `Low Stock${lowStock.length > 0 ? ` (${lowStock.length})` : ""}`,
          },
          {
            id: "expiring",
            label: `Expiring${expiring.length > 0 ? ` (${expiring.length})` : ""}`,
          },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview charts */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Stock by Category (Online + Offline + Partner)
            </h3>
            {catData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                {t("common.noData")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
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
                  <Tooltip />
                  <Bar
                    dataKey="online"
                    fill="#3B82F6"
                    stackId="a"
                    name={t("customer.online")}
                  />
                  <Bar
                    dataKey="offline"
                    fill="#10B981"
                    stackId="a"
                    name={t("customer.offline")}
                  />
                  <Bar
                    dataKey="partner"
                    fill="#8B5CF6"
                    stackId="a"
                    name={t("reports2.partner")}
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Stock Channel Distribution
            </h3>
            {sourceData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                {t("common.noData")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    fontSize={11}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtN(v) + " units"} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Products table */}
      {tab === "products" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("products.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">{t("crm.allSources")}</option>
              <option value="Warehouse">{t("reports2.warehouse")}</option>
              <option value="Partner">{t("reports2.partner")}</option>
              <option value="Default">{t("reports2.default")}</option>
            </select>
            <span className="text-sm text-gray-400 self-center">
              {filtered.length} products
            </span>
          </div>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                    Online
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-500 uppercase tracking-wide">
                    Offline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Damaged
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sale Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-green-500 uppercase tracking-wide">
                    B2B
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-500 uppercase tracking-wide">
                    B2C
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
                      colSpan={10}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 100).map((p, i) => {
                    const s = p._stock;
                    const SrcIcon = SOURCE_ICONS[s.source] || Store;
                    const total = s.total;
                    const status =
                      total === 0
                        ? { l: "Out of Stock", cls: "bg-red-100 text-red-700" }
                        : total <= 10
                          ? {
                              l: t("products.lowStock"),
                              cls: "bg-orange-100 text-orange-700",
                            }
                          : {
                              l: t("products.inStock"),
                              cls: "bg-green-100 text-green-700",
                            };
                    return (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
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
                                {p.category?.name || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${SOURCE_BADGES[s.source]}`}
                          >
                            <SrcIcon className="h-3 w-3" />
                            {SOURCE_LABELS[s.source] || s.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600">
                          {fmtN(s.online)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          {fmtN(s.offline)}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">
                          {fmtN(total)}
                        </td>
                        <td className="px-4 py-3 text-red-500">
                          {s.damaged > 0 ? fmtN(s.damaged) : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {fmtC(p.salePrice || p.price)}
                        </td>
                        <td className="px-4 py-3 text-green-600">
                          {fmtC(p.btbPrice)}
                        </td>
                        <td className="px-4 py-3 text-purple-600">
                          {fmtC(p.btcPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}
                          >
                            {status.l}
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

      {/* Low stock */}
      {tab === "low-stock" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {lowStock.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-400" />
              <p>{t("stock.allGoodStock")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-orange-50 dark:bg-orange-900/10">
                <tr>
                  {[
                    "Product",
                    "Category",
                    "Source",
                    t("customer.online"),
                    t("customer.offline"),
                    t("common.total"),
                    "Sale Price",
                    t("logistics2.action"),
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
                {lowStock
                  .sort((a, b) => a._stock.total - b._stock.total)
                  .map((p, i) => {
                    const s = p._stock;
                    return (
                      <tr
                        key={i}
                        className={`${s.total === 0 ? "bg-red-50/30 dark:bg-red-900/5" : ""} hover:bg-orange-50/30 dark:hover:bg-orange-900/5`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {p.category?.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGES[s.source]}`}
                          >
                            {SOURCE_LABELS[s.source] || s.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-blue-600 font-semibold">
                          {fmtN(s.online)}
                        </td>
                        <td className="px-4 py-3 text-green-600 font-semibold">
                          {fmtN(s.offline)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold text-lg ${s.total === 0 ? "text-red-600" : "text-orange-500"}`}
                          >
                            {s.total}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {fmtC(p.salePrice || p.price)}
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
                    );
                  })}
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
              {["7", "14", "30", "60", "90"].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
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
                      "Qty",
                      "Expiry Date",
                      "Days Left",
                      t("supplier2.location"),
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
                    return (
                      <tr
                        key={i}
                        className={`${days <= 0 ? "bg-red-50/50 dark:bg-red-900/10" : days <= 7 ? "bg-orange-50/30" : ""} hover:bg-red-50/30`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                          {b.productName || b.product?.name || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600">
                          {b.batchNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {b.quality || "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {fmtN(b.quantity)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {new Date(b.expiryDate).toLocaleDateString("en-NG")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm font-bold ${days <= 0 ? "text-red-600" : days <= 7 ? "text-orange-600" : "text-yellow-600"}`}
                          >
                            {days <= 0 ? "Expired" : `${days}d`}
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
    </div>
  );
}
