//admin
// src/pages/reports/PricingReports.jsx
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
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

function fmtCur(n, sym = "₦") {
  return n != null ? `${sym}${Number(n).toLocaleString()}` : "—";
}

export default function PricingReports() {
  const [products, setProducts] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [priceConfigs, setPriceConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [sortDir, setSortDir] = useState("desc");
  const [tab, setTab] = useState("prices");

  const fetch = useCallback(async () => {
    setLoading(true);
    const [prods, rates] = await Promise.all([
      api("/product/get?page=1&limit=100"),
      api("/exchange-rates"),
    ]);
    setProducts(prods.data || []);
    setExchangeRates(rates.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const sorted = [...products]
    .filter(
      (p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const va = a[sortBy] || 0,
        vb = b[sortBy] || 0;
      return sortDir === "desc" ? vb - va : va - vb;
    });

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  // Price distribution buckets
  const priceBuckets = [
    {
      label: "< ₦5k",
      count: products.filter((p) => (p.price || 0) < 5000).length,
    },
    {
      label: "₦5k–20k",
      count: products.filter(
        (p) => (p.price || 0) >= 5000 && (p.price || 0) < 20000,
      ).length,
    },
    {
      label: "₦20k–50k",
      count: products.filter(
        (p) => (p.price || 0) >= 20000 && (p.price || 0) < 50000,
      ).length,
    },
    {
      label: "₦50k–100k",
      count: products.filter(
        (p) => (p.price || 0) >= 50000 && (p.price || 0) < 100000,
      ).length,
    },
    {
      label: "> ₦100k",
      count: products.filter((p) => (p.price || 0) >= 100000).length,
    },
  ];

  const avgPrice = products.length
    ? products.reduce((s, p) => s + (p.price || 0), 0) / products.length
    : 0;
  const maxPrice = Math.max(...products.map((p) => p.price || 0));
  const minPrice = Math.min(
    ...products.filter((p) => p.price > 0).map((p) => p.price || 0),
  );

  const exportCSV = () => {
    const rows = [
      ["Name", "Category", "Price (₦)", "Selling Price (₦)", "Margin"],
    ];
    sorted.forEach((p) =>
      rows.push([
        p.name,
        p.category?.name || "",
        p.price || 0,
        p.sellingPrice || p.price || 0,
        "—",
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "pricing_report.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" /> Pricing Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Product pricing analysis and exchange rate monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetch}
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

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Products",
            value: products.length.toLocaleString(),
            icon: BarChart3,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Average Price",
            value: fmtCur(Math.round(avgPrice)),
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Highest Price",
            value: fmtCur(maxPrice),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-900/20",
          },
          {
            label: "Lowest Price",
            value: fmtCur(minPrice),
            icon: TrendingDown,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
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
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {["prices", "distribution", "exchange-rates"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "prices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => toggleSort("price")}
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      Price <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : (
                  sorted.slice(0, 50).map((p, i) => (
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
                              className="w-7 h-7 rounded object-cover"
                            />
                          )}
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-48">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.category?.name || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {fmtCur(p.price)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {p.stock || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "distribution" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Price Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceBuckets}>
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
      )}

      {tab === "exchange-rates" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {exchangeRates.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No exchange rates configured</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {["Pair", "Rate", "Last Updated", "Status"].map((h) => (
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
                {exchangeRates.map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {r.baseCurrency}/{r.targetCurrency}
                    </td>
                    <td className="px-4 py-3 text-green-600 font-semibold">
                      {r.rate?.toLocaleString()}
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
