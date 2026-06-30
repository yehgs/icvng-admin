//admin
// src/pages/reports/SalesReports.jsx
// Roles: IT, DIRECTOR, SALES, SALES_MANAGER, MANAGER, ACCOUNTANT
import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Search,
  Filter,
  ChevronDown,
  Award,
  Target,
} from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
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
  "#EC4899",
];
const STATUS_COLORS = {
  Pending: "#3B82F6",
  Processing: "#8B5CF6",
  Shipping: "#06B6D4",
  Delivered: "#10B981",
  Cancel: "#EF4444",
};

function fmtCur(n) {
  return n != null ? `₦${Number(n).toLocaleString()}` : "₦0";
}
function fmtN(n) {
  return n != null ? Number(n).toLocaleString() : "—";
}
function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SalesReports() {
  const { t } = useAdminTranslation();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [crmStats, setCrmStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateRange, setDateRange] = useState("all"); // all | 30 | 90 | 365

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [ords, custs, crm] = await Promise.all([
      api("/admin/orders/list?page=1&limit=200"),
      api("/admin/customers/list?page=1&limit=500"),
      api("/admin/crm/stats"),
    ]);
    setOrders(ords.data?.docs || []);
    setCustomers(custs.data?.docs || []);
    setCrmStats(crm.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply date range filter
  const cutoff =
    dateRange === "all"
      ? null
      : new Date(Date.now() - parseInt(dateRange) * 86400000);
  const filteredOrders = orders.filter((o) => {
    const inRange = !cutoff || new Date(o.createdAt) >= cutoff;
    const statusMatch = !filterStatus || o.order_status === filterStatus;
    const searchMatch =
      !search ||
      o._id?.toLowerCase().includes(search.toLowerCase()) ||
      o.userId?.name?.toLowerCase().includes(search.toLowerCase());
    return inRange && statusMatch && searchMatch;
  });

  // ── Aggregations ─────────────────────────────────────────────────────────
  const totalRevenue = filteredOrders
    .filter((o) => o.order_status !== "Cancel")
    .reduce((s, o) => s + (o.totalAmt || o.subTotalAmt || 0), 0);

  const deliveredOrders = filteredOrders.filter(
    (o) => o.order_status === t("orders.statuses.Delivered"),
  );
  const cancelledOrders = filteredOrders.filter(
    (o) => o.order_status === "Cancel",
  );
  const pendingOrders = filteredOrders.filter(
    (o) => ![t("orders.statuses.Delivered"), "Cancel"].includes(o.order_status),
  );

  // Monthly revenue trend (last 12 months)
  const monthlyMap = {};
  filteredOrders.forEach((o) => {
    if (!o.createdAt || o.order_status === "Cancel") return;
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
    monthlyMap[key] = monthlyMap[key] || { key, label, revenue: 0, orders: 0 };
    monthlyMap[key].revenue += o.totalAmt || o.subTotalAmt || 0;
    monthlyMap[key].orders++;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => v);

  // Status breakdown for pie
  const statusMap = {};
  filteredOrders.forEach((o) => {
    const s = o.order_status || t("reports.unknown");
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Top customers by spend
  const custSpend = {};
  filteredOrders
    .filter((o) => o.order_status !== "Cancel")
    .forEach((o) => {
      const name = o.userId?.name || o.name || t("reports.unknown");
      custSpend[name] =
        (custSpend[name] || 0) + (o.totalAmt || o.subTotalAmt || 0);
    });
  const topCustomers = Object.entries(custSpend)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const exportCSV = () => {
    const rows = [
      [
        t("orders.orderId"),
        t("reports.customerCol"),
        t("common.status"),
        t("reports.amountCol"),
        t("common.date"),
      ],
    ];
    filteredOrders.forEach((o) =>
      rows.push([
        o._id || "",
        o.userId?.name || "",
        o.order_status || "",
        o.totalAmt || o.subTotalAmt || 0,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-NG") : "",
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sales_report.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-green-600" /> Sales Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Revenue, order performance and customer analytics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <option value="all">{t("reports.allTime")}</option>
            <option value="30">{t("reports.last30Days")}</option>
            <option value="90">{t("reports.last90Days")}</option>
            <option value="365">{t("reports.last12Months")}</option>
          </select>
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
            label: t("reports.totalRevenue"),
            value: loading ? "..." : fmtCur(totalRevenue),
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
            sub: `${filteredOrders.filter((o) => o.order_status !== "Cancel").length} paid orders`,
          },
          {
            label: t("reports.totalOrders"),
            value: loading ? "..." : fmtN(filteredOrders.length),
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            sub: `${pendingOrders.length} pending`,
          },
          {
            label: t("orders.statuses.Delivered"),
            value: loading ? "..." : fmtN(deliveredOrders.length),
            icon: Award,
            color: "text-teal-600",
            bg: "bg-teal-50 dark:bg-teal-900/20",
            sub: `${filteredOrders.length ? ((deliveredOrders.length / filteredOrders.length) * 100).toFixed(0) : 0}% fulfilment rate`,
          },
          {
            label: t("orders.statuses.Cancelled"),
            value: loading ? "..." : fmtN(cancelledOrders.length),
            icon: Target,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-900/20",
            sub: `${filteredOrders.length ? ((cancelledOrders.length / filteredOrders.length) * 100).toFixed(0) : 0}% cancellation rate`,
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

      {/* CRM summary row (if accessible) */}
      {crmStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: t("reports.totalLeads"),
              value: fmtN(crmStats.totalLeads),
              color: "text-blue-600",
            },
            {
              label: t("reports.wonDeals"),
              value: fmtN(crmStats.wonLeads),
              color: "text-green-600",
            },
            {
              label: t("reports.lostLeads"),
              value: fmtN(crmStats.lostLeads),
              color: "text-red-500",
            },
            {
              label: t("reports.conversionRate"),
              value: `${crmStats.conversionRate || 0}%`,
              color: "text-purple-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className={`text-xl font-bold ${s.color}`}>
                {loading ? "..." : s.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {["overview", "orders", "customers"].map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === tabKey ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {tabKey}
          </button>
        ))}
      </div>

      {/* Overview: charts */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Monthly Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `₦${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                        ? `₦${(v / 1000).toFixed(0)}K`
                        : `₦${v}`
                  }
                />
                <Tooltip formatter={(v) => fmtCur(v)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                  name={t("reports.revenueNgn")}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Monthly Orders
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="orders"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    name={t("reports.orderCount")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Order Status Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent }) =>
                      `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    fontSize={10}
                  >
                    {statusData.map(({ name }, i) => (
                      <Cell
                        key={i}
                        fill={STATUS_COLORS[name] || COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Orders table */}
      {tab === "orders" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order ID or customer..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">{t("products.allStatus")}</option>
              {Object.keys(STATUS_COLORS).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400 self-center">
              {filteredOrders.length} results
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    t("orders.orderId"),
                    t("reports.customerCol"),
                    t("common.status"),
                    t("orders.amount"),
                    t("common.date"),
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
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.slice(0, 100).map((o, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 truncate max-w-32">
                        {o._id || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {o.userId?.name || o.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[o.order_status] || "#6B7280"}20`,
                            color: STATUS_COLORS[o.order_status] || "#6B7280",
                          }}
                        >
                          {o.order_status || t("orders.statuses.Pending")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {fmtCur(o.totalAmt || o.subTotalAmt)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {timeAgo(o.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customers / Top spenders */}
      {tab === "customers" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Top Customers by Spend
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    "Rank",
                    t("reports.customerCol"),
                    "Total Spend",
                    "Share",
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
                {topCustomers.map((c, i) => {
                  const share = totalRevenue
                    ? ((c.total / totalRevenue) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-500"}`}
                        >
                          #{i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {fmtCur(c.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-20">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {topCustomers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No customer data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Customer registration trend */}
          {customers.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Customer Growth
              </h3>
              {(() => {
                const cMap = {};
                customers.forEach((c) => {
                  if (!c.createdAt) return;
                  const d = new Date(c.createdAt);
                  const label = d.toLocaleString("en", {
                    month: "short",
                    year: "2-digit",
                  });
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                  cMap[key] = cMap[key] || { key, label, count: 0 };
                  cMap[key].count++;
                });
                const cData = Object.entries(cMap)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-12)
                  .map(([, v]) => v);
                return (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={cData}>
                      <defs>
                        <linearGradient
                          id="custGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8B5CF6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8B5CF6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8B5CF6"
                        fill="url(#custGrad)"
                        strokeWidth={2}
                        name="New Customers"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
