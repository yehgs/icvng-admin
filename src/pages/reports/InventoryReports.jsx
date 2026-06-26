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
  Filter,
  ChevronDown,
  BarChart3,
  Archive,
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
} from "recharts";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";
const token = () => localStorage.getItem("accessToken");
const apiFetch = async (p) => {
  const r = await fetch(`${API_BASE}${p}`, {
    headers: { Authorization: `Bearer ${token()}` },
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
  "#EC4899",
];

function fmtN(n) {
  return n != null ? Number(n).toLocaleString() : "—";
}
function fmtCur(n) {
  return n ? `₦${Number(n).toLocaleString()}` : "₦0";
}

export default function InventoryReports() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");

  const fetch = useCallback(async () => {
    setLoading(true);
    const [sum, prods, exp] = await Promise.all([
      apiFetch("/stock/summary"),
      apiFetch("/product/get?page=1&limit=50"),
      apiFetch("/stock/expiring?days=30"),
    ]);
    setSummary(sum.data || sum);
    setProducts(prods.data || []);
    setExpiring(exp.data || []);
    setLowStock((prods.data || []).filter((p) => (p.stock || 0) <= 10));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = products.filter(
    (p) => !search || p.name?.toLowerCase().includes(search.toLowerCase()),
  );

  // Build category breakdown from products
  const catMap = {};
  products.forEach((p) => {
    const cat = p.category?.name || p.category || "Uncategorised";
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catData = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const exportCSV = () => {
    const rows = [["Name", "Category", "Stock", "Price", "Status"]];
    filtered.forEach((p) =>
      rows.push([
        p.name,
        p.category?.name || "",
        p.stock || 0,
        p.price || 0,
        (p.stock || 0) === 0
          ? "Out of Stock"
          : (p.stock || 0) <= 10
            ? "Low Stock"
            : "In Stock",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" /> Inventory Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Stock levels, product availability and expiry
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
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
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "In Stock",
            value: fmtN(
              summary?.inStockCount ||
                products.filter((p) => (p.stock || 0) > 10).length,
            ),
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Low Stock (≤10)",
            value: fmtN(lowStock.length),
            color: "text-orange-600",
            bg: "bg-orange-50 dark:bg-orange-900/20",
          },
          {
            label: "Expiring (30d)",
            value: fmtN(expiring.length),
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
              <Package className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {loading ? "..." : s.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {["overview", "products", "low-stock", "expiring"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t.replace("-", " ")}
            {t === "low-stock" && lowStock.length > 0 && (
              <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                {lowStock.length}
              </span>
            )}
            {t === "expiring" && expiring.length > 0 && (
              <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                {expiring.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Products by Category
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  name="Products"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catData.slice(0, 6)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}
                >
                  {catData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "products" && (
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
                  {["Product", "Category", "Stock", "Price (₦)", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 50).map((p, i) => {
                    const stock = p.stock || 0;
                    const status =
                      stock === 0
                        ? {
                            label: "Out of Stock",
                            cls: "bg-red-100 text-red-700",
                          }
                        : stock <= 10
                          ? {
                              label: "Low Stock",
                              cls: "bg-orange-100 text-orange-700",
                            }
                          : {
                              label: "In Stock",
                              cls: "bg-green-100 text-green-700",
                            };
                    return (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image?.[0] && (
                              <img
                                src={p.image[0]}
                                alt=""
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-48">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {p.category?.name || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">{fmtN(stock)}</td>
                        <td className="px-4 py-3">{fmtCur(p.price)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}
                          >
                            {status.label}
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

      {tab === "low-stock" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {lowStock.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No low stock items</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-orange-50 dark:bg-orange-900/10">
                <tr>
                  {["Product", "Category", "Stock", "Price", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-orange-600 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lowStock.map((p, i) => (
                  <tr
                    key={i}
                    className="hover:bg-orange-50/50 dark:hover:bg-orange-900/5"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.category?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-orange-600 font-bold">
                        {p.stock || 0}
                      </span>{" "}
                      units
                    </td>
                    <td className="px-4 py-3">{fmtCur(p.price)}</td>
                    <td className="px-4 py-3">
                      <a
                        href="/admin/purchase-orders"
                        className="text-xs text-blue-600 hover:underline"
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

      {tab === "expiring" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {expiring.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No items expiring within 30 days</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-red-50 dark:bg-red-900/10">
                <tr>
                  {["Product", "Batch", "Qty", "Expiry Date", "Days Left"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ),
                  )}
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
                      className={`hover:bg-red-50/50 dark:hover:bg-red-900/5 ${days < 7 ? "bg-red-50/30 dark:bg-red-900/5" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {b.productName || b.product?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {b.batchNumber || "—"}
                      </td>
                      <td className="px-4 py-3">{fmtN(b.quantity)}</td>
                      <td className="px-4 py-3">
                        {new Date(b.expiryDate).toLocaleDateString("en-NG")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${days < 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
                        >
                          {days}d left
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
