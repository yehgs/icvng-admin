//admin
// src/pages/reports/PurchaseReports.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Package,
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

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
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

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  ordered: "bg-indigo-100 text-indigo-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  partial: "bg-orange-100 text-orange-700",
};

export default function PurchaseReports() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [tab, setTab] = useState("overview");

  const fetch = useCallback(async () => {
    setLoading(true);
    const [ords, st] = await Promise.all([
      api("/purchase-orders?page=1&limit=100"),
      api("/purchase-orders/stats"),
    ]);
    setOrders(ords.data || []);
    // /purchase-orders/stats → { success, data: { statusStats, monthlyStats, logisticsStats } }
    const statsData = st.data || {};
    setStats({
      statusStats: statsData.statusStats || [],
      monthlyStats: statsData.monthlyStats || [],
      logisticsStats: statsData.logisticsStats || [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = orders.filter(
    (o) =>
      (!search ||
        o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.supplier?.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterStatus || o.status === filterStatus),
  );

  // Monthly trend data from orders
  const monthlyMap = {};
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en", { month: "short" });
    monthlyMap[key] = monthlyMap[key] || { label, total: 0, count: 0 };
    monthlyMap[key].total += o.totalAmount || 0;
    monthlyMap[key].count++;
  });
  const monthlyData = Object.values(monthlyMap).slice(-6);

  // Status breakdown
  const statusMap = {};
  orders.forEach((o) => {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({
    name,
    value,
  }));

  const totalValue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const receivedValue = orders
    .filter((o) => o.status === "received")
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  const exportCSV = () => {
    const rows = [
      ["PO Number", "Supplier", "Status", "Items", "Total (₦)", "Created"],
    ];
    filtered.forEach((o) =>
      rows.push([
        o.poNumber || "",
        o.supplier?.name || "",
        o.status || "",
        o.items?.length || 0,
        o.totalAmount || 0,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-NG") : "",
      ]),
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "purchase_report.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox className="h-6 w-6 text-indigo-600" /> Purchase Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Purchase order analysis and supplier metrics
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Orders",
            value: fmtN(orders.length),
            icon: Inbox,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "Total Value",
            value: fmtCur(totalValue),
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-900/20",
          },
          {
            label: "Received",
            value: fmtN(orders.filter((o) => o.status === "received").length),
            icon: CheckCircle,
            color: "text-teal-600",
            bg: "bg-teal-50 dark:bg-teal-900/20",
          },
          {
            label: "Pending",
            value: fmtN(
              orders.filter((o) =>
                ["pending", "approved", "ordered"].includes(o.status),
              ).length,
            ),
            icon: Clock,
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
        {["overview", "orders", "suppliers"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Monthly PO Value (₦)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : v
                  }
                />
                <Tooltip formatter={(v) => fmtCur(v)} />
                <Bar
                  dataKey="total"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  name="Total Value"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Status Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
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
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO number or supplier..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Status</option>
              {[
                "pending",
                "approved",
                "ordered",
                "received",
                "partial",
                "cancelled",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    "PO Number",
                    "Supplier",
                    "Items",
                    "Total",
                    "Status",
                    "Created",
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 50).map((o, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600 text-sm">
                        {o.poNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {o.supplier?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {o.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                        {fmtCur(o.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {o.status}
                        </span>
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

      {tab === "suppliers" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(() => {
            const suppMap = {};
            orders.forEach((o) => {
              const name = o.supplier?.name || "Unknown";
              suppMap[name] = suppMap[name] || {
                name,
                orders: 0,
                total: 0,
                received: 0,
              };
              suppMap[name].orders++;
              suppMap[name].total += o.totalAmount || 0;
              if (o.status === "received") suppMap[name].received++;
            });
            const suppList = Object.values(suppMap).sort(
              (a, b) => b.total - a.total,
            );
            return (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {[
                      "Supplier",
                      "Total Orders",
                      "Received",
                      "Total Value",
                      "Completion",
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
                  {suppList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-400"
                      >
                        No supplier data
                      </td>
                    </tr>
                  ) : (
                    suppList.map((s, i) => {
                      const rate = s.orders
                        ? Math.round((s.received / s.orders) * 100)
                        : 0;
                      return (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                            {s.name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {s.orders}
                          </td>
                          <td className="px-4 py-3 text-green-600 font-medium">
                            {s.received}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                            {fmtCur(s.total)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-16">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}
    </div>
  );
}
