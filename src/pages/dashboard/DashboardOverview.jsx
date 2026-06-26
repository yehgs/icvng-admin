//admin
// src/pages/dashboard/DashboardOverview.jsx
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
  CheckCircle,
  Clock,
  Activity,
  RefreshCw,
  ArrowRight,
  BarChart3,
  FileText,
  Database,
  Monitor,
  Shield,
  Truck,
  Warehouse,
  Coffee,
  Tag,
  Palette,
  Bell,
  Star,
  Inbox,
  LifeBuoy,
  ArrowUpCircle,
  ArrowDownCircle,
  UserPlus,
  Eye,
  Search,
  PieChart,
  Zap,
  Award,
} from "lucide-react";
import { getCurrentUser } from "../../utils/api";
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
} from "recharts";
import AnnouncementPopup from "../../components/notifications/AnnouncementPopup";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken");
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  } catch {
    return { success: false };
  }
}

function fmtN(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString();
}
function fmtCur(n) {
  return n ? `₦${Number(n).toLocaleString()}` : "₦0";
}
function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Reusable stat card ──────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bg,
  trend,
  trendUp,
  sub,
  loading,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div
        className={`p-2.5 rounded-xl ${bg || "bg-blue-50 dark:bg-blue-900/20"}`}
      >
        <Icon className={`h-5 w-5 ${color || "text-blue-600"}`} />
      </div>
      {trend && (
        <span
          className={`text-xs font-medium flex items-center gap-0.5 ${trendUp !== false ? "text-green-600" : "text-red-500"}`}
        >
          {trendUp !== false ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">
      {loading ? (
        <span className="inline-block w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : (
        (value ?? "—")
      )}
    </p>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
      {title}
    </p>
    {sub && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
    )}
  </div>
);

// ── Quick action card ────────────────────────────────────────────────────────
const QuickAction = ({ title, desc, icon: Icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left w-full group"
  >
    <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
        {title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {desc}
      </p>
    </div>
    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
  </button>
);

// ── Role banner colors ───────────────────────────────────────────────────────
const ROLE_BANNERS = {
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

// ════════════════════════════════════════════════════════════════════════════
export default function DashboardOverview() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const role = currentUser?.subRole;

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch data relevant to the user's role
  const fetchData = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const results = {};

      // All roles — unread notifications count
      const notifCount = await apiFetch("/admin/notifications/count");
      results.unreadNotifications = notifCount.unreadCount || 0;

      // Role-specific fetches
      if (["DIRECTOR", "IT", "MANAGER"].includes(role)) {
        const [adminStats, orders, customers, crmStats] = await Promise.all([
          apiFetch("/admin/auth/stats"),
          apiFetch("/order/order-list?page=1&limit=5"),
          apiFetch("/admin/customers/list?page=1&limit=1"),
          apiFetch("/admin/crm/stats"),
        ]);
        results.adminStats = adminStats.data;
        results.recentOrders = orders.data || [];
        results.totalCustomers = customers.total || customers.data?.length || 0;
        results.crmStats = crmStats.data;
      }

      if (role === "DIRECTOR") {
        const [financeData, products] = await Promise.all([
          apiFetch("/admin/finance?limit=5"),
          apiFetch("/product/get?page=1&limit=1"),
        ]);
        results.financeSummary = financeData.summary;
        results.totalProducts = products.totalNoPage || 0;
      }

      if (["SALES", "SALES_MANAGER", "MANAGER", "DIRECTOR"].includes(role)) {
        const [orders, customers, crm] = await Promise.all([
          apiFetch("/order/order-list?page=1&limit=5"),
          apiFetch("/admin/customers/list?page=1&limit=1"),
          apiFetch("/admin/crm/stats"),
        ]);
        results.recentOrders = results.recentOrders || orders.data || [];
        results.totalOrders = orders.totalNoPage || orders.total || 0;
        results.totalCustomers = results.totalCustomers || customers.total || 0;
        results.crmStats = results.crmStats || crm.data;
      }

      if (["WAREHOUSE", "MANAGER", "IT", "DIRECTOR"].includes(role)) {
        const [stock, po] = await Promise.all([
          apiFetch("/stock/summary"),
          apiFetch("/purchase-orders?page=1&limit=5"),
        ]);
        results.stockSummary = stock.data || stock;
        results.recentPOs = po.data || [];
        results.totalPOs = po.total || 0;
      }

      if (["ACCOUNTANT", "MANAGER", "DIRECTOR"].includes(role)) {
        const [pricing, finance] = await Promise.all([
          apiFetch("/admin/finance?limit=1"),
          apiFetch("/admin/finance/meta"),
        ]);
        results.financeSummary = results.financeSummary || pricing.summary;
      }

      if (["LOGISTICS", "MANAGER", "DIRECTOR"].includes(role)) {
        const trackingData = await apiFetch(
          "/order/order-list?status=pending&page=1&limit=5",
        );
        results.pendingDeliveries = trackingData.data || [];
        results.totalPendingDeliveries = trackingData.total || 0;
      }

      if (["EDITOR", "IT", "DIRECTOR", "MANAGER"].includes(role)) {
        const [blogs, products] = await Promise.all([
          apiFetch("/blog/get-all-posts?page=1&limit=1"),
          apiFetch("/product/get?page=1&limit=1"),
        ]);
        results.totalBlogs = blogs.totalNoPage || 0;
        results.totalProducts =
          results.totalProducts || products.totalNoPage || 0;
      }

      if (["HR", "IT", "DIRECTOR", "MANAGER"].includes(role)) {
        const users = await apiFetch("/admin/user/users?page=1&limit=1");
        results.totalStaff = users.total || 0;
        results.staffByRole = users.bySubRole || [];
      }

      results.loadedAt = new Date();
      setData(results);
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    },
    [role],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nav = (path) => navigate(path);
  const L = loading;
  const banner = ROLE_BANNERS[role] || "from-blue-700 to-indigo-700";

  // ── Role configs ──────────────────────────────────────────────────────────
  const configs = {
    DIRECTOR: {
      title: "Executive Dashboard",
      subtitle: "Complete business overview and performance metrics",
      stats: [
        {
          title: "Total Revenue (NGN)",
          value: fmtCur(data.financeSummary?.income?.totalNGN),
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          trend: "All time",
          trendUp: true,
        },
        {
          title: "Net Balance",
          value: fmtCur(data.financeSummary?.netNGN),
          icon: TrendingUp,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Income minus expenses",
        },
        {
          title: "Total Customers",
          value: fmtN(data.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Registered customers",
        },
        {
          title: "CRM Won Deals",
          value: fmtN(data.crmStats?.wonLeads),
          icon: Award,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: `${data.crmStats?.conversionRate || 0}% conversion`,
        },
        {
          title: "Total Products",
          value: fmtN(data.totalProducts),
          icon: Package,
          color: "text-indigo-600",
          bg: "bg-indigo-50 dark:bg-indigo-900/20",
          sub: "In catalog",
        },
        {
          title: "Admin Staff",
          value: fmtN(data.adminStats?.overview?.totalAdmins),
          icon: Shield,
          color: "text-rose-600",
          bg: "bg-rose-50 dark:bg-rose-900/20",
          sub: "Active admins",
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
          desc: "Leads and deals",
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
          path: "/admin/reports/inventory",
        },
      ],
    },

    IT: {
      title: "System Administration",
      subtitle: "Infrastructure, users, and system health",
      stats: [
        {
          title: "Total Users",
          value: fmtN(data.adminStats?.overview?.totalUsers),
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All registered users",
        },
        {
          title: "Admin Staff",
          value: fmtN(data.adminStats?.overview?.totalAdmins),
          icon: Shield,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Active admin accounts",
        },
        {
          title: "Active Users",
          value: fmtN(data.adminStats?.overview?.activeUsers),
          icon: Activity,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Status: Active",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
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
      subtitle: "Full operational overview across all departments",
      stats: [
        {
          title: "Total Orders",
          value: fmtN(data.totalOrders),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All time",
        },
        {
          title: "Total Customers",
          value: fmtN(data.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Customer base",
        },
        {
          title: "CRM Leads",
          value: fmtN(data.crmStats?.totalLeads),
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: `${data.crmStats?.wonLeads || 0} won`,
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
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
          title: "CRM Pipeline",
          desc: "Leads and deals",
          icon: Users,
          color: "bg-green-600",
          path: "/admin/dashboard/crm",
        },
        {
          title: "Reports",
          desc: "Analytics & reporting",
          icon: BarChart3,
          color: "bg-purple-600",
          path: "/admin/reports/inventory",
        },
        {
          title: "Notifications",
          desc: "Send team updates",
          icon: Bell,
          color: "bg-amber-600",
          path: "/admin/dashboard/notifications",
        },
      ],
    },

    SALES_MANAGER: {
      title: "Sales Management Dashboard",
      subtitle: "Sales team performance and pipeline overview",
      stats: [
        {
          title: "Total Orders",
          value: fmtN(data.totalOrders),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All orders",
        },
        {
          title: "Customers",
          value: fmtN(data.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Total customers",
        },
        {
          title: "CRM Won",
          value: fmtN(data.crmStats?.wonLeads),
          icon: Award,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: `${data.crmStats?.conversionRate || 0}% conversion`,
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
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
          title: "Orders",
          desc: "Track customer orders",
          icon: ShoppingCart,
          color: "bg-green-600",
          path: "/admin/website-orders",
        },
        {
          title: "Customers",
          desc: "Customer accounts",
          icon: Coffee,
          color: "bg-purple-600",
          path: "/admin/customers",
        },
      ],
    },

    SALES: {
      title: "Sales Dashboard",
      subtitle: "Your sales performance and customer relationships",
      stats: [
        {
          title: "Total Orders",
          value: fmtN(data.totalOrders),
          icon: ShoppingCart,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "All orders",
        },
        {
          title: "Customers",
          value: fmtN(data.totalCustomers),
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Total registered",
        },
        {
          title: "CRM Leads",
          value: fmtN(data.crmStats?.totalLeads),
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "In pipeline",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
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
      subtitle: "Staff management and recruitment overview",
      stats: [
        {
          title: "Total Staff",
          value: fmtN(data.totalStaff),
          icon: Users,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Active admin accounts",
        },
        {
          title: "Departments",
          value: fmtN(
            data.adminStats?.adminsBySubRole?.length ||
              data.staffByRole?.length,
          ),
          icon: Shield,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Active departments",
        },
        {
          title: "Customers",
          value: fmtN(data.totalCustomers),
          icon: Coffee,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Registered customers",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
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
          desc: "Onboard new team member",
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
      subtitle: "Stock levels, movements, and warehouse operations",
      stats: [
        {
          title: "Pending Orders",
          value: fmtN(data.totalPOs),
          icon: Inbox,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Purchase orders",
        },
        {
          title: "Stock Items",
          value: fmtN(data.stockSummary?.totalProducts),
          icon: Package,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Products in stock",
        },
        {
          title: "Low Stock",
          value: fmtN(data.stockSummary?.lowStockCount),
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          sub: "Need reorder",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
      ],
      actions: [
        {
          title: "Stock Management",
          desc: "Monitor inventory levels",
          icon: Package,
          color: "bg-blue-600",
          path: "/admin/stock",
        },
        {
          title: "Warehouse",
          desc: "Warehouse layout & zones",
          icon: Warehouse,
          color: "bg-green-600",
          path: "/admin/warehouse",
        },
        {
          title: "Purchase Orders",
          desc: "Incoming stock orders",
          icon: Inbox,
          color: "bg-orange-600",
          path: "/admin/purchase-orders",
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

    ACCOUNTANT: {
      title: "Accounting Dashboard",
      subtitle: "Financial overview and pricing management",
      stats: [
        {
          title: "Total Income",
          value: fmtCur(data.financeSummary?.income?.totalNGN),
          icon: ArrowUpCircle,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "All time income",
        },
        {
          title: "Total Expenses",
          value: fmtCur(data.financeSummary?.expense?.totalNGN),
          icon: ArrowDownCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-900/20",
          sub: "All time expenses",
        },
        {
          title: "Net Balance",
          value: fmtCur(data.financeSummary?.netNGN),
          icon: DollarSign,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Income - Expenses",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
      ],
      actions: [
        {
          title: "Pricing Management",
          desc: "Manage product prices",
          icon: DollarSign,
          color: "bg-green-600",
          path: "/admin/pricing",
        },
        {
          title: "Price Lists",
          desc: "View all price lists",
          icon: FileText,
          color: "bg-blue-600",
          path: "/admin/pricing-lists",
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
      ],
    },

    LOGISTICS: {
      title: "Logistics Dashboard",
      subtitle: "Delivery management and tracking overview",
      stats: [
        {
          title: "Pending Deliveries",
          value: fmtN(data.totalPendingDeliveries),
          icon: Truck,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Awaiting dispatch",
        },
        {
          title: "Total Orders",
          value: fmtN(data.totalOrders),
          icon: ShoppingCart,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "All orders",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
        {
          title: "Support Tickets",
          icon: LifeBuoy,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Open tickets",
        },
      ],
      actions: [
        {
          title: "Logistics",
          desc: "Manage shipping methods",
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
      subtitle: "Products, blog, and content publishing overview",
      stats: [
        {
          title: "Total Products",
          value: fmtN(data.totalProducts),
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "In catalog",
        },
        {
          title: "Blog Posts",
          value: fmtN(data.totalBlogs),
          icon: FileText,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Published posts",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
        {
          title: "Support Tickets",
          icon: LifeBuoy,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Open tickets",
        },
      ],
      actions: [
        {
          title: "Products",
          desc: "Manage product content",
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
      subtitle: "Visual content and brand asset management",
      stats: [
        {
          title: "Total Products",
          value: fmtN(data.totalProducts),
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          sub: "Products with images",
        },
        {
          title: "Notifications",
          value: fmtN(data.unreadNotifications),
          icon: Bell,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-900/20",
          sub: "Unread",
        },
        {
          title: "Support Tickets",
          icon: LifeBuoy,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-900/20",
          sub: "Open tickets",
        },
        {
          title: "Sliders",
          icon: PieChart,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-900/20",
          sub: "Active banners",
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
          icon: Star,
          color: "bg-pink-600",
          path: "/admin/banners",
        },
        {
          title: "Colors",
          desc: "Product color management",
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

  const config = configs[role] || configs.IT;

  return (
    <div className="space-y-6">
      <AnnouncementPopup />

      {/* ── Banner ── */}
      <div className={`bg-gradient-to-r ${banner} rounded-2xl p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <p className="text-white/80 text-sm mt-1">{config.subtitle}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                {currentUser?.name}
              </span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                {role}
              </span>
              {data.unreadNotifications > 0 && (
                <span className="text-xs bg-red-500 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Bell className="h-3 w-3" /> {data.unreadNotifications} new
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`h-5 w-5 text-white ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        {lastUpdated && (
          <p className="text-white/50 text-xs mt-3">
            Last updated: {timeAgo(lastUpdated)}
          </p>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {config.stats.map((s, i) => (
          <StatCard key={i} {...s} loading={L} />
        ))}
      </div>

      {/* ── Quick actions + Recent activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Quick Actions
          </h2>
          {config.actions.map((a, i) => (
            <QuickAction
              key={i}
              title={a.title}
              desc={a.desc}
              icon={a.icon}
              color={a.color}
              onClick={() => nav(a.path)}
            />
          ))}
        </div>

        {/* Recent Orders (if relevant) */}
        {data.recentOrders?.length > 0 && (
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
              {data.recentOrders.slice(0, 5).map((order, i) => (
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
                        {order.userId?.name || order.name || "Customer"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {timeAgo(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {fmtCur(order.totalAmt || order.subTotalAmt)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        order.order_status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.order_status === "Cancel"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.order_status || "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock alerts (warehouse/manager) */}
        {data.stockSummary && !data.recentOrders?.length && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Stock Overview
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total Products",
                  value: data.stockSummary?.totalProducts,
                  color: "text-blue-600",
                },
                {
                  label: "In Stock",
                  value: data.stockSummary?.inStockCount,
                  color: "text-green-600",
                },
                {
                  label: "Low / Out",
                  value: data.stockSummary?.lowStockCount,
                  color: "text-red-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <p className={`text-2xl font-bold ${s.color}`}>
                    {fmtN(s.value)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Default info panel */}
        {!data.recentOrders?.length && !data.stockSummary && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div
              className={`p-4 rounded-full bg-gradient-to-br ${banner} bg-opacity-10`}
            >
              <Coffee className="h-8 w-8 text-white opacity-70" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs">
              Welcome to the I-COFFEE.NG admin panel. Use the quick actions to
              get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
