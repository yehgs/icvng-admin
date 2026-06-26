//admin
// src/pages/reports/PricingReports.jsx
// Roles: IT, DIRECTOR, ACCOUNTANT, MANAGER
// Endpoints:
//   GET /api/pricing/products?page=1&limit=50  → { success, data:[{productDetails,calculatedPrices,calculatedPricesBeforeTax,costBreakdown,appliedMargins,isApproved}], totalCount }
//   GET /api/exchange-rates                    → { success, data:[] }
import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Search,
  BarChart3,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Filter,
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
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];
function fmtC(n) {
  return n != null && n > 0 ? `₦${Number(n).toLocaleString()}` : "—";
}
function fmtPct(n) {
  return n != null ? `${Number(n).toFixed(1)}%` : "—";
}

// Pull the best available price fields from a pricing record
// Record shape from /pricing/products aggregation:
//   { productDetails:{name,sku,image,category,brand}, calculatedPrices:{salePrice,btbPrice,btcPrice,price3weeksDelivery,price5weeksDelivery},
//     calculatedPricesBeforeTax:{...}, costBreakdown:{totalCostPerUnit,subPrice,exchangeRate,...},
//     appliedMargins:{salePrice,btbPrice,btcPrice,...}, isApproved }
function getProductName(r) {
  return r.productDetails?.name || r.productName || "—";
}
function getSalePrice(r) {
  return r.calculatedPrices?.salePrice || 0;
}
function getBtbPrice(r) {
  return r.calculatedPrices?.btbPrice || 0;
}
function getBtcPrice(r) {
  return r.calculatedPrices?.btcPrice || 0;
}
function getPrice3wk(r) {
  return r.calculatedPrices?.price3weeksDelivery || 0;
}
function getPrice5wk(r) {
  return r.calculatedPrices?.price5weeksDelivery || 0;
}
function getCostPerUnit(r) {
  return r.costBreakdown?.totalCostPerUnit || 0;
}
function getMarginSale(r) {
  return r.appliedMargins?.salePrice || 0;
}
function getMarginBtb(r) {
  return r.appliedMargins?.btbPrice || 0;
}
function getMarginBtc(r) {
  return r.appliedMargins?.btcPrice || 0;
}

export default function PricingReports() {
  const [records, setRecords] = useState([]); // ProductPricing records
  const [rates, setRates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState("");
  const [sortCol, setSortCol] = useState("salePrice");
  const [sortDir, setSortDir] = useState("desc");
  const [tab, setTab] = useState("prices");
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PER_PAGE });
    if (search) params.set("search", search);
    if (filterApproved) params.set("isApproved", filterApproved);

    const [pricing, ratesRes] = await Promise.all([
      api(`/pricing/products?${params}`),
      api("/exchange-rates"),
    ]);

    // /pricing/products → { success, data:[], totalCount }
    setRecords(Array.isArray(pricing.data) ? pricing.data : []);
    setTotal(pricing.totalCount || 0);
    setRates(Array.isArray(ratesRes.data) ? ratesRes.data : []);
    setLoading(false);
  }, [search, filterApproved, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sorted = [...records].sort((a, b) => {
    const getVal = (r) => {
      if (sortCol === "salePrice") return getSalePrice(r);
      if (sortCol === "btbPrice") return getBtbPrice(r);
      if (sortCol === "btcPrice") return getBtcPrice(r);
      if (sortCol === "cost") return getCostPerUnit(r);
      if (sortCol === "marginSale") return getMarginSale(r);
      return getSalePrice(r);
    };
    return sortDir === "desc" ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  // Summary stats
  const avgSalePrice = records.length
    ? records.reduce((s, r) => s + getSalePrice(r), 0) / records.length
    : 0;
  const avgBtbPrice = records.length
    ? records.reduce((s, r) => s + getBtbPrice(r), 0) / records.length
    : 0;
  const avgBtcPrice = records.length
    ? records.reduce((s, r) => s + getBtcPrice(r), 0) / records.length
    : 0;
  const approved = records.filter((r) => r.isApproved).length;

  // Price comparison chart data (top 10 by sale price)
  const chartData = [...records]
    .sort((a, b) => getSalePrice(b) - getSalePrice(a))
    .slice(0, 10)
    .map((r) => ({
      name: (getProductName(r) || "").substring(0, 16),
      Sale: getSalePrice(r),
      B2B: getBtbPrice(r),
      B2C: getBtcPrice(r),
      "3wk Delivery": getPrice3wk(r),
    }));

  // Margin distribution
  const marginBuckets = [
    {
      label: "0–10%",
      count: records.filter((r) => getMarginSale(r) < 10).length,
    },
    {
      label: "10–20%",
      count: records.filter(
        (r) => getMarginSale(r) >= 10 && getMarginSale(r) < 20,
      ).length,
    },
    {
      label: "20–30%",
      count: records.filter(
        (r) => getMarginSale(r) >= 20 && getMarginSale(r) < 30,
      ).length,
    },
    {
      label: "30–50%",
      count: records.filter(
        (r) => getMarginSale(r) >= 30 && getMarginSale(r) < 50,
      ).length,
    },
    {
      label: "50%+",
      count: records.filter((r) => getMarginSale(r) >= 50).length,
    },
  ];

  const exportCSV = () => {
    const rows = [
      [
        "Product",
        "SKU",
        "Cost/Unit",
        "Sale Price",
        "B2B Price",
        "B2C Price",
        "3wk Price",
        "5wk Price",
        "Sale Margin%",
        "B2B Margin%",
        "B2C Margin%",
        "Approved",
      ],
    ];
    sorted.forEach((r) =>
      rows.push([
        `"${getProductName(r)}"`,
        r.productDetails?.sku || "",
        getCostPerUnit(r),
        getSalePrice(r),
        getBtbPrice(r),
        getBtcPrice(r),
        getPrice3wk(r),
        getPrice5wk(r),
        getMarginSale(r).toFixed(1),
        getMarginBtb(r).toFixed(1),
        getMarginBtc(r).toFixed(1),
        r.isApproved ? "Yes" : "No",
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "pricing_report.csv";
    a.click();
  };

  const SortTh = ({ col, label }) => (
    <th
      className="px-4 py-3 text-left cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{" "}
        <ArrowUpDown
          className={`h-3 w-3 ${sortCol === col ? "text-blue-500" : ""}`}
        />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" /> Pricing Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            B2B, B2C and delivery pricing with margins and cost breakdown
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
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Avg Sale Price (B2C retail)",
            value: fmtC(Math.round(avgSalePrice)),
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            sub: "With tax, retail",
          },
          {
            label: "Avg B2B Price",
            value: fmtC(Math.round(avgBtbPrice)),
            icon: TrendingDown,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
            sub: "Business-to-Business",
          },
          {
            label: "Avg B2C Price",
            value: fmtC(Math.round(avgBtcPrice)),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            sub: "Business-to-Consumer",
          },
          {
            label: "Approved Pricing Records",
            value: `${approved}/${records.length}`,
            icon: CheckCircle,
            color: "text-teal-600",
            bg: "bg-teal-50 dark:bg-teal-900/20",
            sub: `${total} total records`,
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

      {/* Explanation banner */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-medium mb-1">Price Types Explained</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-blue-700 dark:text-blue-400">
          {[
            ["Sale Price", "Standard retail price with tax (BTC customers)"],
            ["B2B Price", "Business-to-Business: bulk buyers, resellers"],
            ["B2C Price", "Business-to-Consumer: direct consumer rate"],
            ["3wk Delivery", "Pre-order price: 3 weeks delivery lead time"],
            ["5wk Delivery", "Pre-order price: 5 weeks delivery lead time"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="bg-blue-100/50 dark:bg-blue-900/20 rounded-lg p-2"
            >
              <p className="font-semibold">{k}</p>
              <p className="opacity-80 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {["prices", "comparison", "margins", "exchange-rates"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Prices table */}
      {tab === "prices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterApproved}
              onChange={(e) => {
                setFilterApproved(e.target.value);
                setPage(1);
              }}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Status</option>
              <option value="true">Approved</option>
              <option value="false">Pending Approval</option>
            </select>
            <span className="text-sm text-gray-400 self-center">
              {total} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <SortTh col="cost" label="Cost/Unit" />
                  <SortTh col="salePrice" label="Sale Price" />
                  <SortTh col="btbPrice" label="B2B Price" />
                  <SortTh col="btcPrice" label="B2C Price" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    3wk Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    5wk Delivery
                  </th>
                  <SortTh col="marginSale" label="Margin %" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading pricing data...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No pricing records found
                    </td>
                  </tr>
                ) : (
                  sorted.map((r, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.productDetails?.image?.[0] && (
                            <img
                              src={r.productDetails.image[0]}
                              alt=""
                              className="w-8 h-8 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-44">
                              {getProductName(r)}
                            </p>
                            {r.productDetails?.sku && (
                              <p className="text-xs text-gray-400 font-mono">
                                {r.productDetails.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {fmtC(getCostPerUnit(r))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {fmtC(getSalePrice(r))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {fmtC(getBtbPrice(r))}
                      </td>
                      <td className="px-4 py-3 font-semibold text-purple-600">
                        {fmtC(getBtcPrice(r))}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {fmtC(getPrice3wk(r))}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {fmtC(getPrice5wk(r))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-blue-600">
                            S: {fmtPct(getMarginSale(r))}
                          </span>
                          <span className="text-xs text-green-600">
                            B2B: {fmtPct(getMarginBtb(r))}
                          </span>
                          <span className="text-xs text-purple-600">
                            B2C: {fmtPct(getMarginBtc(r))}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit ${r.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                          {r.isApproved ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {r.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {total > PER_PAGE && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Page {page} of {Math.ceil(total / PER_PAGE)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(Math.ceil(total / PER_PAGE), p + 1))
                  }
                  disabled={page >= Math.ceil(total / PER_PAGE)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price comparison chart */}
      {tab === "comparison" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Top 10 Products — Price Comparison (₦)
            </h3>
            {chartData.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₦${(v / 1000).toFixed(0)}K` : `₦${v}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(v) => `₦${Number(v).toLocaleString()}`}
                  />
                  <Bar
                    dataKey="Sale"
                    fill="#3B82F6"
                    radius={[0, 3, 3, 0]}
                    name="Sale Price"
                  />
                  <Bar
                    dataKey="B2B"
                    fill="#10B981"
                    radius={[0, 3, 3, 0]}
                    name="B2B Price"
                  />
                  <Bar
                    dataKey="B2C"
                    fill="#8B5CF6"
                    radius={[0, 3, 3, 0]}
                    name="B2C Price"
                  />
                  <Bar
                    dataKey="3wk Delivery"
                    fill="#F59E0B"
                    radius={[0, 3, 3, 0]}
                    name="3wk Delivery"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
              {[
                ["Sale Price", "#3B82F6"],
                ["B2B Price", "#10B981"],
                ["B2C Price", "#8B5CF6"],
                ["3wk Delivery", "#F59E0B"],
              ].map(([l, c]) => (
                <span
                  key={l}
                  className="flex items-center gap-1.5 text-xs text-gray-500"
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: c }}
                  />
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Margin analysis */}
      {tab === "margins" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Sale Price Margin Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={marginBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  name="Products"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Avg Margins by Price Type
            </h3>
            {records.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data</p>
            ) : (
              <div className="space-y-4 mt-2">
                {[
                  {
                    label: "Sale Price Margin",
                    value:
                      records.reduce((s, r) => s + getMarginSale(r), 0) /
                      records.length,
                    color: "bg-blue-500",
                  },
                  {
                    label: "B2B Margin",
                    value:
                      records.reduce((s, r) => s + getMarginBtb(r), 0) /
                      records.length,
                    color: "bg-green-500",
                  },
                  {
                    label: "B2C Margin",
                    value:
                      records.reduce((s, r) => s + getMarginBtc(r), 0) /
                      records.length,
                    color: "bg-purple-500",
                  },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {m.label}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {fmtPct(m.value)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.color}`}
                        style={{ width: `${Math.min(m.value, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exchange rates */}
      {tab === "exchange-rates" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {rates.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No exchange rates configured</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    "Currency Pair",
                    "Rate (to NGN)",
                    "Last Updated",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rates.map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-gray-800 dark:text-gray-200 text-base">
                      {r.baseCurrency}/{r.targetCurrency}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600 text-lg">
                      ₦{Number(r.rate).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.lastUpdated
                        ? new Date(r.lastUpdated).toLocaleString("en-NG")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
