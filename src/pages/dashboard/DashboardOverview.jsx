//admin
// src/pages/dashboard/DashboardOverview.jsx — FIXED with verified API shapes
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  BarChart3,
  FileText,
  Monitor,
  Shield,
  Truck,
  Warehouse,
  Coffee,
  Tag,
  Palette,
  Bell,
  Inbox,
  LifeBuoy,
  ArrowUpCircle,
  ArrowDownCircle,
  UserPlus,
  Eye,
  Zap,
  Award,
} from "lucide-react";
import { getCurrentUser } from "../../utils/api";
import AnnouncementPopup from "../../components/notifications/AnnouncementPopup";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken");
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { success: false, _status: res.status };
    return res.json();
  } catch {
    return { success: false };
  }
}

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");
const fmtC = (n) => (n ? `₦${Number(n).toLocaleString()}` : "₦0");
function ago(d) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const BANNERS = {
  DIRECTOR: "from-purple-700 to-indigo-700",
  IT: "from-blue-700 to-cyan-700",
  MANAGER: "from-indigo-600 to-blue-600",
  SALES_MANAGER: "from-emerald-600 to-teal-600",
  SALES: "from-green-600 to-emerald-600",
  HR: "from-pink-600 to-rose-600",
  WAREHOUSE: "from-orange-600 to-amber-600",
  ACCOUNTANT: "from-teal-600 to-green-600",
  LOGISTICS: "from-cyan-600 to-blue-600",
  EDITOR: "from-violet-600 to-purple-600",
  DESIGNER: "from-rose-500 to-pink-600",
};

const Stat = ({
  title,
  value,
  icon: Icon,
  color = "text-blue-600",
  bg = "bg-blue-50 dark:bg-blue-900/20",
  sub,
  loading,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
    <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">
      {loading ? (
        <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        value
      )}
    </p>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
      {title}
    </p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Action = ({ title, desc, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 transition-all text-left w-full group"
  >
    <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
        {title}
      </p>
      <p className="text-xs text-gray-500 truncate">{desc}</p>
    </div>
    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
  </button>
);

export default function DashboardOverview() {
  const nav = useNavigate();
  const user = getCurrentUser();
  const role = user?.subRole;

  const [d, setD] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const r = {};

      // ── every role: notification count ─────────────────────────────────────
      // GET /api/admin/notifications/count → { success, unreadCount }
      const nc = await apiFetch("/admin/notifications/count");
      r.notif = nc.unreadCount || 0;

      // ── DIRECTOR ────────────────────────────────────────────────────────────
      if (role === "DIRECTOR") {
        const [stats, orders, custs, crm, fin, prods] = await Promise.all([
          apiFetch("/admin/auth/stats"), // { data:{ overview:{totalUsers,totalAdmins,totalCustomers,activeUsers} } }
          apiFetch("/admin/orders/list?page=1&limit=5"), // { data:{ docs:[], totalDocs } }
          apiFetch("/admin/customers/list?page=1&limit=1"), // { data:{ totalDocs } }
          apiFetch("/admin/crm/stats"), // { data:{ totalLeads, wonLeads, conversionRate } }
          apiFetch("/admin/finance?limit=1"), // { summary:{ income:{totalNGN}, expense:{totalNGN}, netNGN } }
          apiFetch("/product/get?page=1&limit=1"), // { totalNoPage }
        ]);
        r.totalUsers = stats.data?.overview?.totalUsers ?? "—";
        r.totalAdmins = stats.data?.overview?.totalAdmins ?? "—";
        r.totalOrders = orders.data?.totalDocs ?? "—";
        r.recentOrders = orders.data?.docs ?? [];
        r.totalCustomers = custs.data?.totalDocs ?? "—";
        r.wonLeads = crm.data?.wonLeads ?? "—";
        r.convRate = crm.data?.conversionRate ?? 0;
        r.income = fin.summary?.income?.totalNGN ?? 0;
        r.netNGN = fin.summary?.netNGN ?? 0;
        r.totalProducts = prods.totalNoPage ?? "—";
      }

      // ── IT ──────────────────────────────────────────────────────────────────
      else if (role === "IT") {
        const [stats, prods] = await Promise.all([
          apiFetch("/admin/auth/stats"),
          apiFetch("/product/get?page=1&limit=1"),
        ]);
        r.totalUsers = stats.data?.overview?.totalUsers ?? "—";
        r.totalAdmins = stats.data?.overview?.totalAdmins ?? "—";
        r.activeUsers = stats.data?.overview?.activeUsers ?? "—";
        r.totalProducts = prods.totalNoPage ?? "—";
      }

      // ── MANAGER ─────────────────────────────────────────────────────────────
      else if (role === "MANAGER") {
        const [orders, custs, crm, wh] = await Promise.all([
          apiFetch("/admin/orders/list?page=1&limit=5"),
          apiFetch("/admin/customers/list?page=1&limit=1"),
          apiFetch("/admin/crm/stats"),
          apiFetch("/warehouse/stock-summary"), // { data:{ totalProducts, lowStockItems, outOfStockItems } }
        ]);
        r.totalOrders = orders.data?.totalDocs ?? "—";
        r.recentOrders = orders.data?.docs ?? [];
        r.totalCustomers = custs.data?.totalDocs ?? "—";
        r.totalLeads = crm.data?.totalLeads ?? "—";
        r.wonLeads = crm.data?.wonLeads ?? "—";
        r.lowStock = wh.data?.lowStockItems ?? "—";
        r.outOfStock = wh.data?.outOfStockItems ?? "—";
      }

      // ── SALES_MANAGER ────────────────────────────────────────────────────────
      else if (role === "SALES_MANAGER") {
        // SALES_MANAGER is blocked on admin/orders (only SALES, IT, MANAGER, DIRECTOR allowed)
        // So we use customers and CRM only
        const [custs, crm] = await Promise.all([
          apiFetch("/admin/customers/list?page=1&limit=1"),
          apiFetch("/admin/crm/stats"),
        ]);
        r.totalCustomers = custs.data?.totalDocs ?? "—";
        r.totalLeads = crm.data?.totalLeads ?? "—";
        r.wonLeads = crm.data?.wonLeads ?? "—";
        r.convRate = crm.data?.conversionRate ?? 0;
      }

      // ── SALES ────────────────────────────────────────────────────────────────
      else if (role === "SALES") {
        const [orders, custs, crm] = await Promise.all([
          apiFetch("/admin/orders/list?page=1&limit=5"),
          apiFetch("/admin/customers/list?page=1&limit=1"),
          apiFetch("/admin/crm/stats"),
        ]);
        r.totalOrders = orders.data?.totalDocs ?? "—";
        r.recentOrders = orders.data?.docs ?? [];
        r.totalCustomers = custs.data?.totalDocs ?? "—";
        r.totalLeads = crm.data?.totalLeads ?? "—";
        r.wonLeads = crm.data?.wonLeads ?? "—";
      }

      // ── HR ───────────────────────────────────────────────────────────────────
      else if (role === "HR") {
        const [stats, custs] = await Promise.all([
          apiFetch("/admin/auth/stats"),
          apiFetch("/admin/customers/list?page=1&limit=1"),
        ]);
        r.totalAdmins = stats.data?.overview?.totalAdmins ?? "—";
        r.deptCount = stats.data?.adminsBySubRole?.length ?? "—";
        r.totalCustomers = custs.data?.totalDocs ?? "—";
      }

      // ── WAREHOUSE ────────────────────────────────────────────────────────────
      else if (role === "WAREHOUSE") {
        const [wh, pos] = await Promise.all([
          apiFetch("/warehouse/stock-summary"), // { data:{ totalProducts, lowStockItems, outOfStockItems } }
          apiFetch("/purchase-orders?page=1&limit=1"), // { totalCount }
        ]);
        r.totalProducts = wh.data?.totalProducts ?? "—";
        r.lowStock = wh.data?.lowStockItems ?? "—";
        r.outOfStock = wh.data?.outOfStockItems ?? "—";
        r.totalPOs = pos.totalCount ?? "—";
      }

      // ── ACCOUNTANT ───────────────────────────────────────────────────────────
      else if (role === "ACCOUNTANT") {
        const fin = await apiFetch("/admin/finance?limit=1");
        r.income = fin.summary?.income?.totalNGN ?? 0;
        r.expense = fin.summary?.expense?.totalNGN ?? 0;
        r.netNGN = fin.summary?.netNGN ?? 0;
      }

      // ── LOGISTICS ────────────────────────────────────────────────────────────
      else if (role === "LOGISTICS") {
        const orders = await apiFetch("/admin/orders/list?page=1&limit=5");
        r.totalOrders = orders.data?.totalDocs ?? "—";
        r.recentOrders = orders.data?.docs ?? [];
        r.pendingOrders = (orders.data?.docs ?? []).filter(
          (o) => !["Delivered", "Cancel"].includes(o.order_status),
        ).length;
      }

      // ── EDITOR ───────────────────────────────────────────────────────────────
      else if (role === "EDITOR") {
        const [prods, blogs] = await Promise.all([
          apiFetch("/product/get?page=1&limit=1"),
          apiFetch("/blog/get-all-posts?page=1&limit=1"), // { pagination:{ total } }
        ]);
        r.totalProducts = prods.totalNoPage ?? "—";
        r.totalBlogs = blogs.pagination?.total ?? "—";
      }

      // ── DESIGNER ─────────────────────────────────────────────────────────────
      else if (role === "DESIGNER") {
        const prods = await apiFetch("/product/get?page=1&limit=1");
        r.totalProducts = prods.totalNoPage ?? "—";
      }

      setD(r);
      setUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [role],
  );

  useEffect(() => {
    load();
  }, [load]);

  const L = loading;
  const banner = BANNERS[role] || "from-blue-700 to-indigo-700";

  const configs = {
    DIRECTOR: {
      title: "Executive Dashboard",
      subtitle: "Complete business overview",
      stats: [
        {
          title: "Total Revenue",
          value: fmtC(d.income),
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "All-time income",
        },
        {
          title: "Net Balance",
          value: fmtC(d.netNGN),
          icon: TrendingUp,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Income minus expenses",
        },
        {
          title: "Total Customers",
          value: fmt(d.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Registered customers",
        },
        {
          title: "CRM Deals Won",
          value: fmt(d.wonLeads),
          icon: Award,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: `${d.convRate || 0}% conversion`,
        },
      ],
      actions: [
        {
          title: "Finance Manager",
          desc: "Income & expense records",
          icon: DollarSign,
          color: "bg-green-600",
          path: "/admin/dashboard/finance",
        },
        {
          title: "CRM Pipeline",
          desc: "Leads and sales pipeline",
          icon: Users,
          color: "bg-blue-600",
          path: "/admin/dashboard/crm",
        },
        {
          title: "User Management",
          desc: "Manage all staff",
          icon: Shield,
          color: "bg-purple-600",
          path: "/admin/users",
        },
        {
          title: "Reports",
          desc: "Business analytics",
          icon: BarChart3,
          color: "bg-indigo-600",
          path: "/admin/reports/sales",
        },
      ],
    },
    IT: {
      title: "System Administration",
      subtitle: "Infrastructure, users, and system health",
      stats: [
        {
          title: "Total Users",
          value: fmt(d.totalUsers),
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All registered users",
        },
        {
          title: "Admin Staff",
          value: fmt(d.totalAdmins),
          icon: Shield,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Active admin accounts",
        },
        {
          title: "Active Users",
          value: fmt(d.activeUsers),
          icon: Monitor,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Status: Active",
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
      ],
      actions: [
        {
          title: "User Management",
          desc: "Manage all user accounts",
          icon: Users,
          color: "bg-blue-600",
          path: "/admin/users",
        },
        {
          title: "Password Vault",
          desc: "Secure credentials store",
          icon: Shield,
          color: "bg-gray-700",
          path: "/admin/dashboard/password-vault",
        },
        {
          title: "Support Tickets",
          desc: "Resolve technical issues",
          icon: LifeBuoy,
          color: "bg-red-600",
          path: "/admin/dashboard/support-tickets",
        },
        {
          title: "System Settings",
          desc: "Platform configuration",
          icon: Monitor,
          color: "bg-indigo-600",
          path: "/admin/settings",
        },
      ],
    },
    MANAGER: {
      title: "Operations Dashboard",
      subtitle: "Full operational overview",
      stats: [
        {
          title: "Total Orders",
          value: fmt(d.totalOrders),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All orders",
        },
        {
          title: "Customers",
          value: fmt(d.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Registered",
        },
        {
          title: "CRM Won",
          value: fmt(d.wonLeads),
          icon: Award,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: `of ${d.totalLeads || 0} leads`,
        },
        {
          title: "Low Stock Items",
          value: fmt(d.lowStock),
          icon: AlertCircle,
          color: "text-orange-600",
          bg: "bg-orange-50 dark:bg-orange-900/20",
          sub: `${d.outOfStock || 0} out of stock`,
        },
      ],
      actions: [
        {
          title: "Orders",
          desc: "Monitor all orders",
          icon: ShoppingCart,
          color: "bg-blue-600",
          path: "/admin/website-orders",
        },
        {
          title: "CRM",
          desc: "Leads and deals",
          icon: Users,
          color: "bg-green-600",
          path: "/admin/dashboard/crm",
        },
        {
          title: "Reports",
          desc: "Analytics",
          icon: BarChart3,
          color: "bg-purple-600",
          path: "/admin/reports/inventory",
        },
        {
          title: "Notifications",
          desc: "Team updates",
          icon: Bell,
          color: "bg-amber-600",
          path: "/admin/dashboard/notifications",
        },
      ],
    },
    SALES_MANAGER: {
      title: "Sales Management Dashboard",
      subtitle: "Sales pipeline and performance",
      stats: [
        {
          title: "Total Customers",
          value: fmt(d.totalCustomers),
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Registered customers",
        },
        {
          title: "Total Leads",
          value: fmt(d.totalLeads),
          icon: TrendingUp,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "In CRM pipeline",
        },
        {
          title: "Won Deals",
          value: fmt(d.wonLeads),
          icon: Award,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: `${d.convRate || 0}% conversion`,
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
      ],
      actions: [
        {
          title: "CRM Pipeline",
          desc: "Manage leads & deals",
          icon: Users,
          color: "bg-blue-600",
          path: "/admin/dashboard/crm",
        },
        {
          title: "Web Scraper",
          desc: "Find new leads",
          icon: Zap,
          color: "bg-yellow-500",
          path: "/admin/dashboard/scraper",
        },
        {
          title: "Customers",
          desc: "Customer accounts",
          icon: Coffee,
          color: "bg-green-600",
          path: "/admin/customers",
        },
        {
          title: "Sales Reports",
          desc: "Your performance",
          icon: BarChart3,
          color: "bg-purple-600",
          path: "/admin/reports/sales",
        },
      ],
    },
    SALES: {
      title: "Sales Dashboard",
      subtitle: "Your sales performance",
      stats: [
        {
          title: "Total Orders",
          value: fmt(d.totalOrders),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All orders",
        },
        {
          title: "Customers",
          value: fmt(d.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Total registered",
        },
        {
          title: "CRM Leads",
          value: fmt(d.totalLeads),
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Active pipeline",
        },
        {
          title: "Won Deals",
          value: fmt(d.wonLeads),
          icon: Award,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Closed deals",
        },
      ],
      actions: [
        {
          title: "CRM Pipeline",
          desc: "Manage your leads",
          icon: Users,
          color: "bg-blue-600",
          path: "/admin/dashboard/crm",
        },
        {
          title: "Web Scraper",
          desc: "Find new prospects",
          icon: Zap,
          color: "bg-yellow-500",
          path: "/admin/dashboard/scraper",
        },
        {
          title: "Customers",
          desc: "Customer management",
          icon: Coffee,
          color: "bg-green-600",
          path: "/admin/customers",
        },
        {
          title: "Orders",
          desc: "Track orders",
          icon: ShoppingCart,
          color: "bg-purple-600",
          path: "/admin/website-orders",
        },
      ],
    },
    HR: {
      title: "Human Resources Dashboard",
      subtitle: "Staff and recruitment overview",
      stats: [
        {
          title: "Total Staff",
          value: fmt(d.totalAdmins),
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Admin accounts",
        },
        {
          title: "Departments",
          value: fmt(d.deptCount),
          icon: Shield,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Active departments",
        },
        {
          title: "Customers",
          value: fmt(d.totalCustomers),
          icon: Coffee,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Registered customers",
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
      ],
      actions: [
        {
          title: "User Management",
          desc: "Manage staff accounts",
          icon: Users,
          color: "bg-blue-600",
          path: "/admin/users",
        },
        {
          title: "Add Employee",
          desc: "Onboard new member",
          icon: UserPlus,
          color: "bg-green-600",
          path: "/admin/users",
        },
        {
          title: "Customer Accounts",
          desc: "Customer management",
          icon: Coffee,
          color: "bg-orange-600",
          path: "/admin/customers",
        },
        {
          title: "Support Tickets",
          desc: "HR support requests",
          icon: LifeBuoy,
          color: "bg-red-600",
          path: "/admin/dashboard/support-tickets",
        },
      ],
    },
    WAREHOUSE: {
      title: "Warehouse Dashboard",
      subtitle: "Stock levels and operations",
      stats: [
        {
          title: "Total Products",
          value: fmt(d.totalProducts),
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "In catalog",
        },
        {
          title: "Purchase Orders",
          value: fmt(d.totalPOs),
          icon: Inbox,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Total POs",
        },
        {
          title: "Low Stock",
          value: fmt(d.lowStock),
          icon: AlertCircle,
          color: "text-orange-600",
          bg: "bg-orange-50 dark:bg-orange-900/20",
          sub: "Need reorder (≤threshold)",
        },
        {
          title: "Out of Stock",
          value: fmt(d.outOfStock),
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          sub: "Zero units",
        },
      ],
      actions: [
        {
          title: "Stock Management",
          desc: "Monitor levels",
          icon: Package,
          color: "bg-blue-600",
          path: "/admin/stock",
        },
        {
          title: "Warehouse",
          desc: "Zones & layout",
          icon: Warehouse,
          color: "bg-green-600",
          path: "/admin/warehouse",
        },
        {
          title: "Purchase Orders",
          desc: "Incoming stock",
          icon: Inbox,
          color: "bg-orange-600",
          path: "/admin/purchase-orders",
        },
        {
          title: "Stock Analysis",
          desc: "Batch & expiry report",
          icon: BarChart3,
          color: "bg-purple-600",
          path: "/admin/reports/stock-analysis",
        },
      ],
    },
    ACCOUNTANT: {
      title: "Accounting Dashboard",
      subtitle: "Financial overview and pricing",
      stats: [
        {
          title: "Total Income",
          value: fmtC(d.income),
          icon: ArrowUpCircle,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "All-time income",
        },
        {
          title: "Total Expenses",
          value: fmtC(d.expense),
          icon: ArrowDownCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          sub: "All-time expenses",
        },
        {
          title: "Net Balance",
          value: fmtC(d.netNGN),
          icon: DollarSign,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Income − Expenses",
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
      ],
      actions: [
        {
          title: "Pricing",
          desc: "Manage product prices",
          icon: DollarSign,
          color: "bg-green-600",
          path: "/admin/pricing",
        },
        {
          title: "Exchange Rates",
          desc: "Currency rates",
          icon: TrendingUp,
          color: "bg-purple-600",
          path: "/admin/exchange-rates",
        },
        {
          title: "Pricing Reports",
          desc: "Financial analytics",
          icon: BarChart3,
          color: "bg-indigo-600",
          path: "/admin/reports/pricing",
        },
        {
          title: "Purchase Reports",
          desc: "Supplier analytics",
          icon: FileText,
          color: "bg-blue-600",
          path: "/admin/reports/purchase",
        },
      ],
    },
    LOGISTICS: {
      title: "Logistics Dashboard",
      subtitle: "Delivery management and tracking",
      stats: [
        {
          title: "Total Orders",
          value: fmt(d.totalOrders),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All orders",
        },
        {
          title: "Pending Dispatch",
          value: fmt(d.pendingOrders),
          icon: Truck,
          color: "text-orange-600",
          bg: "bg-orange-50 dark:bg-orange-900/20",
          sub: "Not yet delivered",
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
        {
          title: "Support Tickets",
          value: "—",
          icon: LifeBuoy,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Open issues",
        },
      ],
      actions: [
        {
          title: "Logistics",
          desc: "Shipping methods",
          icon: Truck,
          color: "bg-blue-600",
          path: "/admin/logistics",
        },
        {
          title: "Tracking",
          desc: "Track shipments",
          icon: Eye,
          color: "bg-green-600",
          path: "/admin/tracking",
        },
        {
          title: "Orders",
          desc: "View all orders",
          icon: ShoppingCart,
          color: "bg-purple-600",
          path: "/admin/website-orders",
        },
        {
          title: "Support Tickets",
          desc: "Technical requests",
          icon: LifeBuoy,
          color: "bg-red-600",
          path: "/admin/dashboard/support-tickets",
        },
      ],
    },
    EDITOR: {
      title: "Content Management Dashboard",
      subtitle: "Products, blog and publishing",
      stats: [
        {
          title: "Total Products",
          value: fmt(d.totalProducts),
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "In catalog",
        },
        {
          title: "Blog Posts",
          value: fmt(d.totalBlogs),
          icon: FileText,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Published posts",
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
        {
          title: "Support Tickets",
          value: "—",
          icon: LifeBuoy,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Open tickets",
        },
      ],
      actions: [
        {
          title: "Products",
          desc: "Manage content",
          icon: Package,
          color: "bg-blue-600",
          path: "/admin/products",
        },
        {
          title: "Blog",
          desc: "Create & edit posts",
          icon: FileText,
          color: "bg-green-600",
          path: "/admin/blog",
        },
        {
          title: "Sliders",
          desc: "Homepage banners",
          icon: Palette,
          color: "bg-purple-600",
          path: "/admin/sliders",
        },
        {
          title: "Support Tickets",
          desc: "Technical support",
          icon: LifeBuoy,
          color: "bg-red-600",
          path: "/admin/dashboard/support-tickets",
        },
      ],
    },
    DESIGNER: {
      title: "Design Dashboard",
      subtitle: "Visual content and brand assets",
      stats: [
        {
          title: "Total Products",
          value: fmt(d.totalProducts),
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "In catalog",
        },
        {
          title: "Notifications",
          value: fmt(d.notif),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
        {
          title: "Support Tickets",
          value: "—",
          icon: LifeBuoy,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Open tickets",
        },
        {
          title: "Active Sliders",
          value: "—",
          icon: Palette,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Homepage banners",
        },
      ],
      actions: [
        {
          title: "Sliders",
          desc: "Hero banners",
          icon: Palette,
          color: "bg-purple-600",
          path: "/admin/sliders",
        },
        {
          title: "Banners",
          desc: "Promotional banners",
          icon: Palette,
          color: "bg-pink-600",
          path: "/admin/banners",
        },
        {
          title: "Colors",
          desc: "Colour management",
          icon: Palette,
          color: "bg-indigo-600",
          path: "/admin/colors",
        },
        {
          title: "Brands",
          desc: "Brand management",
          icon: Tag,
          color: "bg-blue-600",
          path: "/admin/brands",
        },
      ],
    },
  };

  const cfg = configs[role] || configs.IT;

  return (
    <div className="space-y-6">
      <AnnouncementPopup />

      {/* Banner */}
      <div className={`bg-gradient-to-r ${banner} rounded-2xl p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="text-2xl font-bold">{cfg.title}</h1>
            <p className="text-white/80 text-sm mt-1">{cfg.subtitle}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                {user?.name}
              </span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                {role}
              </span>
              {d.notif > 0 && (
                <span className="text-xs bg-red-500 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Bell className="h-3 w-3" /> {d.notif} new
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`h-5 w-5 text-white ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        {updated && (
          <p className="text-white/40 text-xs mt-3">Updated {ago(updated)}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cfg.stats.map((s, i) => (
          <Stat key={i} {...s} loading={L} />
        ))}
      </div>

      {/* Actions + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Quick Actions
          </h2>
          {cfg.actions.map((a, i) => (
            <Action key={i} {...a} onClick={() => nav(a.path)} />
          ))}
        </div>

        {d.recentOrders?.length > 0 ? (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent Orders
              </h2>
              <button
                onClick={() => nav("/admin/website-orders")}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {d.recentOrders.slice(0, 5).map((o, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-36">
                        {o.userId?.name || o.customerId?.name || "Customer"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ago(o.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {fmtC(o.totalAmt || o.subTotalAmt)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.order_status === "Delivered" ? "bg-green-100 text-green-700" : o.order_status === "Cancel" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {o.order_status || "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center gap-3">
            <Coffee className="h-10 w-10 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Welcome back, {user?.name}. Use the quick actions to navigate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
