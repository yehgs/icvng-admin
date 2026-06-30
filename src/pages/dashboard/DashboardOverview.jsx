//admin
// src/pages/dashboard/DashboardOverview.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, ShoppingCart, Package, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, RefreshCw, ArrowRight, BarChart3, FileText, Monitor,
  Shield, Truck, Warehouse, Coffee, Tag, Palette, Bell, Inbox,
  LifeBuoy, ArrowUpCircle, ArrowDownCircle, UserPlus, Eye, Zap, Award,
  Globe, MapPin, Activity,
} from "lucide-react";
import { getCurrentUser } from "../../utils/api";
import AnnouncementPopup from "../../components/notifications/AnnouncementPopup";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import CountryScopeBanner from "../../components/country/CountryScopeBanner.jsx";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

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

const Stat = ({ title, value, icon: Icon, color = "text-blue-600", bg = "bg-blue-50", sub, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
    <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">
      {loading ? <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : value}
    </p>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Action = ({ title, desc, icon: Icon, color, onClick }) => (
  <button onClick={onClick}
    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 transition-all text-left w-full group">
    <div className={`p-2.5 rounded-xl ${color} flex-shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{title}</p>
      <p className="text-xs text-gray-500 truncate">{desc}</p>
    </div>
    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
  </button>
);

/** Country breakdown table — for DIRECTOR/IT global view */
const CountryBreakdown = ({ data, formatPrice }) => {
  if (!data?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4" /> Country Breakdown
      </h2>
      <div className="space-y-3">
        {data.map((row) => (
          <div key={row._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{row.flagEmoji || "🏳️"}</span>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{row.name || row._id}</p>
                <p className="text-xs text-gray-400">{fmt(row.totalOrders)} orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {row.currency ? `${row.currency.symbol}${fmt(row.totalRevenue)}` : fmt(row.totalRevenue)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardOverview() {
  const nav = useNavigate();
  const user = getCurrentUser();
  const role = user?.subRole;

  const {
    formatPrice, buildScopeQuery, countryScope, activeCountry,

  } = useAdminCountry();
  const { t } = useAdminTranslation();

  const fmtC = (n) => formatPrice(n ?? 0);

  const [d, setD] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const r = {};

    // Notifications — every role
    const nc = await apiFetch("/admin/notifications/count");
    r.notif = nc.unreadCount || 0;

    // ── DIRECTOR ─────────────────────────────────────────────────────────────
    if (role === "DIRECTOR") {
      const [globalStats, orders, custs, crm, fin, prods, countryData] = await Promise.all([
        apiFetch("/admin/dashboard/global-stats"),
        apiFetch("/admin/orders/list?page=1&limit=5"),
        apiFetch("/admin/customers/list?page=1&limit=1"),
        apiFetch("/admin/crm/stats"),
        apiFetch("/admin/finance?limit=1"),
        apiFetch("/product/get?page=1&limit=1"),
        apiFetch("/admin/dashboard/countries"),
      ]);
      // Global totals
      r.totalUsers = globalStats.data?.globalTotals?.totalAdmins ?? "—";
      r.totalOrders = orders.data?.totalDocs ?? "—";
      r.recentOrders = orders.data?.docs ?? [];
      r.totalCustomers = globalStats.data?.globalTotals?.totalCustomers ?? custs.data?.totalDocs ?? "—";
      r.wonLeads = crm.data?.wonLeads ?? "—";
      r.convRate = crm.data?.conversionRate ?? 0;
      r.income = fin.summary?.income?.totalNGN ?? 0;
      r.netNGN = fin.summary?.netNGN ?? 0;
      r.totalProducts = prods.totalNoPage ?? "—";
      r.totalGlobalOrders = globalStats.data?.globalTotals?.totalOrders ?? "—";
      r.totalGlobalRevenue = globalStats.data?.globalTotals?.totalRevenue ?? 0;
      // Per-country breakdown
      r.countryBreakdown = countryData.data ?? globalStats.data?.perCountry ?? [];
    }

    // ── IT ────────────────────────────────────────────────────────────────────
    else if (role === "IT") {
      const [stats, prods, globalStats, countryData] = await Promise.all([
        apiFetch("/admin/auth/stats"),
        apiFetch("/product/get?page=1&limit=1"),
        apiFetch("/admin/dashboard/global-stats"),
        apiFetch("/admin/dashboard/countries"),
      ]);
      r.totalUsers = stats.data?.overview?.totalUsers ?? "—";
      r.totalAdmins = stats.data?.overview?.totalAdmins ?? "—";
      r.activeUsers = stats.data?.overview?.activeUsers ?? "—";
      r.totalProducts = prods.totalNoPage ?? "—";
      r.totalGlobalOrders = globalStats.data?.globalTotals?.totalOrders ?? "—";
      r.totalGlobalRevenue = globalStats.data?.globalTotals?.totalRevenue ?? 0;
      r.countryBreakdown = countryData.data ?? globalStats.data?.perCountry ?? [];
    }


    // ── MANAGER ───────────────────────────────────────────────────────────────
    else if (role === "MANAGER") {
      const [orders, custs, crm, wh] = await Promise.all([
        apiFetch("/admin/orders/list?page=1&limit=5"),
        apiFetch("/admin/customers/list?page=1&limit=1"),
        apiFetch("/admin/crm/stats"),
        apiFetch("/warehouse/stock-summary"),
      ]);
      r.totalOrders = orders.data?.totalDocs ?? "—";
      r.recentOrders = orders.data?.docs ?? [];
      r.totalCustomers = custs.data?.totalDocs ?? "—";
      r.totalLeads = crm.data?.totalLeads ?? "—";
      r.wonLeads = crm.data?.wonLeads ?? "—";
      r.lowStock = wh.data?.lowStockItems ?? "—";
      r.outOfStock = wh.data?.outOfStockItems ?? "—";
    }

    // ── SALES_MANAGER ─────────────────────────────────────────────────────────
    else if (role === "SALES_MANAGER") {
      const [custs, crm] = await Promise.all([
        apiFetch("/admin/customers/list?page=1&limit=1"),
        apiFetch("/admin/crm/stats"),
      ]);
      r.totalCustomers = custs.data?.totalDocs ?? "—";
      r.totalLeads = crm.data?.totalLeads ?? "—";
      r.wonLeads = crm.data?.wonLeads ?? "—";
      r.convRate = crm.data?.conversionRate ?? 0;
    }

    // ── SALES ─────────────────────────────────────────────────────────────────
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

    // ── HR ────────────────────────────────────────────────────────────────────
    else if (role === "HR") {
      const [stats, custs] = await Promise.all([
        apiFetch("/admin/auth/stats"),
        apiFetch("/admin/customers/list?page=1&limit=1"),
      ]);
      r.totalAdmins = stats.data?.overview?.totalAdmins ?? "—";
      r.deptCount = stats.data?.adminsBySubRole?.length ?? "—";
      r.totalCustomers = custs.data?.totalDocs ?? "—";
    }

    // ── WAREHOUSE ─────────────────────────────────────────────────────────────
    else if (role === "WAREHOUSE") {
      const [wh, pos] = await Promise.all([
        apiFetch("/warehouse/stock-summary"),
        apiFetch("/purchase-orders?page=1&limit=1"),
      ]);
      r.totalProducts = wh.data?.totalProducts ?? "—";
      r.lowStock = wh.data?.lowStockItems ?? "—";
      r.outOfStock = wh.data?.outOfStockItems ?? "—";
      r.totalPOs = pos.totalCount ?? "—";
    }

    // ── ACCOUNTANT ────────────────────────────────────────────────────────────
    else if (role === "ACCOUNTANT") {
      const fin = await apiFetch("/admin/finance?limit=1");
      r.income = fin.summary?.income?.totalNGN ?? 0;
      r.expense = fin.summary?.expense?.totalNGN ?? 0;
      r.netNGN = fin.summary?.netNGN ?? 0;
    }

    // ── LOGISTICS ─────────────────────────────────────────────────────────────
    else if (role === "LOGISTICS") {
      const orders = await apiFetch("/admin/orders/list?page=1&limit=5");
      r.totalOrders = orders.data?.totalDocs ?? "—";
      r.recentOrders = orders.data?.docs ?? [];
      r.pendingOrders = (orders.data?.docs ?? []).filter(
        (o) => !["Delivered", "Cancel"].includes(o.order_status)
      ).length;
    }

    // ── EDITOR ────────────────────────────────────────────────────────────────
    else if (role === "EDITOR") {
      const [prods, blogs] = await Promise.all([
        apiFetch("/product/get?page=1&limit=1"),
        apiFetch("/blog/get-all-posts?page=1&limit=1"),
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
  }, [role, countryScope]);

  useEffect(() => { load(); }, [load]);

  const L = loading;
  const bannerGradient = BANNERS[role] || "from-blue-700 to-indigo-700";
  const banner = (key) => t(`dashboardBanner.${role || "IT"}.${key}`);

  // ── Config per role ───────────────────────────────────────────────────────

  const configs = {
    DIRECTOR: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Global Orders",    value: fmt(d.totalGlobalOrders), icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50",   sub: "All countries combined" },
        { title: "Global Revenue",   value: fmtC(d.totalGlobalRevenue), icon: DollarSign, color: "text-green-600",  bg: "bg-green-50",  sub: "All countries combined" },
        { title: "Total Customers",  value: fmt(d.totalCustomers),    icon: Users,        color: "text-purple-600", bg: "bg-purple-50", sub: "Registered customers" },
        { title: "CRM Deals Won",    value: fmt(d.wonLeads),          icon: Award,        color: "text-amber-600",  bg: "bg-amber-50",  sub: `${d.convRate || 0}% conversion` },
      ],
      actions: [
        { title: "Finance Manager",   desc: "Review P&L and entries",       icon: DollarSign, color: "bg-green-600",  path: "/admin/dashboard/finance" },
        { title: "CRM Pipeline",      desc: "Leads and deal tracking",       icon: Users,      color: "bg-blue-600",   path: "/admin/dashboard/crm" },
        { title: "User Management",   desc: "Staff and admin accounts",      icon: Shield,     color: "bg-purple-600", path: "/admin/users" },
        { title: "Country Admins",    desc: "Manage foreign admin access",   icon: Globe,      color: "bg-sky-600",    path: "/admin/users" },
      ],
    },

    IT: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Users",     value: fmt(d.totalUsers),          icon: Users,        color: "text-blue-600",   bg: "bg-blue-50",   sub: "All registered users" },
        { title: "Admin Staff",     value: fmt(d.totalAdmins),         icon: Shield,       color: "text-purple-600", bg: "bg-purple-50", sub: "Active admin accounts" },
        { title: "Global Orders",   value: fmt(d.totalGlobalOrders),   icon: ShoppingCart, color: "text-green-600",  bg: "bg-green-50",  sub: "Across all countries" },
        { title: "Notifications",   value: fmt(d.notif),               icon: Bell,         color: "text-amber-600",  bg: "bg-amber-50",  sub: "Unread" },
      ],
      actions: [
        { title: "User Management",   desc: "Staff and admin accounts",    icon: Users,    color: "bg-blue-600",   path: "/admin/users" },
        { title: "Country Admins",    desc: "Foreign admin management",    icon: Globe,    color: "bg-sky-600",    path: "/admin/users" },
        { title: "Password Vault",    desc: "Secure credentials",          icon: Shield,   color: "bg-gray-700",   path: "/admin/dashboard/password-vault" },
        { title: "System Settings",   desc: "Server & platform config",    icon: Monitor,  color: "bg-indigo-600", path: "/admin/settings" },
      ],
    },

MANAGER: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Orders",    value: fmt(d.totalOrders),   icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50",   sub: "All orders" },
        { title: "Customers",       value: fmt(d.totalCustomers), icon: Users,        color: "text-purple-600", bg: "bg-purple-50", sub: "Registered" },
        { title: "CRM Won",         value: fmt(d.wonLeads),       icon: Award,        color: "text-green-600",  bg: "bg-green-50",  sub: `of ${d.totalLeads || 0} leads` },
        { title: "Low Stock Items", value: fmt(d.lowStock),       icon: AlertCircle,  color: "text-orange-600", bg: "bg-orange-50", sub: `${d.outOfStock || 0} out of stock` },
      ],
      actions: [
        { title: "Orders",            desc: "Website orders view",    icon: ShoppingCart, color: "bg-blue-600",   path: "/admin/website-orders" },
        { title: "CRM",               desc: "Leads and pipeline",     icon: Users,        color: "bg-green-600",  path: "/admin/dashboard/crm" },
        { title: "Country Admins",    desc: "Manage foreign admins",  icon: Globe,        color: "bg-sky-600",    path: "/admin/users" },
        { title: "Reports",           desc: "Analytics overview",     icon: BarChart3,    color: "bg-purple-600", path: "/admin/reports/inventory" },
      ],
    },

    SALES_MANAGER: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Customers", value: fmt(d.totalCustomers), icon: Users,      color: "text-blue-600",   bg: "bg-blue-50",   sub: "Registered customers" },
        { title: "Total Leads",     value: fmt(d.totalLeads),     icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50", sub: "In CRM pipeline" },
        { title: "Won Deals",       value: fmt(d.wonLeads),       icon: Award,      color: "text-green-600",  bg: "bg-green-50",  sub: `${d.convRate || 0}% conversion` },
        { title: "Notifications",   value: fmt(d.notif),          icon: Bell,       color: "text-amber-600",  bg: "bg-amber-50",  sub: "Unread" },
      ],
      actions: [
        { title: "CRM Pipeline",  desc: "Leads and deal tracking",  icon: Users,    color: "bg-blue-600",   path: "/admin/dashboard/crm" },
        { title: "Web Scraper",   desc: "Prospect research tool",   icon: Zap,      color: "bg-yellow-500", path: "/admin/dashboard/scraper" },
        { title: "Customers",     desc: "Customer management",      icon: Coffee,   color: "bg-green-600",  path: "/admin/customers" },
        { title: "Sales Reports", desc: "Performance analytics",    icon: BarChart3,color: "bg-purple-600", path: "/admin/reports/sales" },
      ],
    },

    SALES: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Orders",   value: fmt(d.totalOrders),    icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50",   sub: "All orders" },
        { title: "Customers",      value: fmt(d.totalCustomers), icon: Users,        color: "text-purple-600", bg: "bg-purple-50", sub: "Total registered" },
        { title: "CRM Leads",      value: fmt(d.totalLeads),     icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50",  sub: "Active pipeline" },
        { title: "Won Deals",      value: fmt(d.wonLeads),       icon: Award,        color: "text-amber-600",  bg: "bg-amber-50",  sub: "Closed deals" },
      ],
      actions: [
        { title: "CRM Pipeline",    desc: "Track leads",       icon: Users,       color: "bg-blue-600",   path: "/admin/dashboard/crm" },
        { title: "Web Scraper",     desc: "Find prospects",    icon: Zap,         color: "bg-yellow-500", path: "/admin/dashboard/scraper" },
        { title: "Customers",       desc: "Manage accounts",   icon: Coffee,      color: "bg-green-600",  path: "/admin/customers" },
        { title: "Orders",          desc: "Track orders",      icon: ShoppingCart,color: "bg-purple-600", path: "/admin/website-orders" },
      ],
    },

    HR: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Staff",     value: fmt(d.totalAdmins),   icon: Users,  color: "text-blue-600",   bg: "bg-blue-50",   sub: "Admin accounts" },
        { title: "Departments",     value: fmt(d.deptCount),     icon: Shield, color: "text-purple-600", bg: "bg-purple-50", sub: "Active departments" },
        { title: "Customers",       value: fmt(d.totalCustomers),icon: Coffee, color: "text-green-600",  bg: "bg-green-50",  sub: "Registered customers" },
        { title: "Notifications",   value: fmt(d.notif),         icon: Bell,   color: "text-amber-600",  bg: "bg-amber-50",  sub: "Unread" },
      ],
      actions: [
        { title: "User Management", desc: "Staff accounts",       icon: Users,    color: "bg-blue-600",   path: "/admin/users" },
        { title: "Add Employee",    desc: "Create new staff",     icon: UserPlus, color: "bg-green-600",  path: "/admin/users" },
        { title: "Customers",       desc: "Customer accounts",    icon: Coffee,   color: "bg-orange-600", path: "/admin/customers" },
        { title: "Support Tickets", desc: "HR support queue",     icon: LifeBuoy, color: "bg-red-600",    path: "/admin/dashboard/support-tickets" },
      ],
    },

    WAREHOUSE: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Products",  value: fmt(d.totalProducts), icon: Package,    color: "text-blue-600",   bg: "bg-blue-50",   sub: "In catalog" },
        { title: "Purchase Orders", value: fmt(d.totalPOs),      icon: Inbox,      color: "text-green-600",  bg: "bg-green-50",  sub: "Total POs" },
        { title: "Low Stock",       value: fmt(d.lowStock),      icon: AlertCircle,color: "text-orange-600", bg: "bg-orange-50", sub: "Need reorder" },
        { title: "Out of Stock",    value: fmt(d.outOfStock),    icon: AlertCircle,color: "text-red-600",    bg: "bg-red-50",    sub: "Zero units" },
      ],
      actions: [
        { title: "Stock Management",   desc: "Inventory control",    icon: Package,  color: "bg-blue-600",   path: "/admin/stock" },
        { title: "Warehouse",          desc: "Warehouse overview",   icon: Warehouse,color: "bg-green-600",  path: "/admin/warehouse" },
        { title: "Purchase Orders",    desc: "Order management",     icon: Inbox,    color: "bg-orange-600", path: "/admin/purchase-orders" },
        { title: "Stock Analysis",     desc: "Reports & trends",     icon: BarChart3,color: "bg-purple-600", path: "/admin/reports/stock-analysis" },
      ],
    },

    ACCOUNTANT: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Income",   value: fmtC(d.income),  icon: ArrowUpCircle,  color: "text-green-600", bg: "bg-green-50", sub: "All-time income" },
        { title: "Total Expenses", value: fmtC(d.expense), icon: ArrowDownCircle,color: "text-red-600",   bg: "bg-red-50",   sub: "All-time expenses" },
        { title: "Net Balance",    value: fmtC(d.netNGN),  icon: DollarSign,     color: "text-blue-600",  bg: "bg-blue-50",  sub: "Income minus expenses" },
        { title: "Notifications",  value: fmt(d.notif),    icon: Bell,           color: "text-amber-600", bg: "bg-amber-50", sub: "Unread" },
      ],
      actions: [
        { title: "Pricing",         desc: "Manage price config",   icon: DollarSign, color: "bg-green-600",  path: "/admin/pricing" },
        { title: "Exchange Rates",  desc: "Currency rates",        icon: TrendingUp, color: "bg-purple-600", path: "/admin/exchange-rates" },
        { title: "Pricing Reports", desc: "Analytics",             icon: BarChart3,  color: "bg-indigo-600", path: "/admin/reports/pricing" },
        { title: "Purchase Reports",desc: "Procurement tracking",  icon: FileText,   color: "bg-blue-600",   path: "/admin/reports/purchase" },
      ],
    },

    LOGISTICS: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Orders",    value: fmt(d.totalOrders),   icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50",   sub: "All orders" },
        { title: "Pending Dispatch",value: fmt(d.pendingOrders), icon: Truck,        color: "text-orange-600", bg: "bg-orange-50", sub: "Not yet delivered" },
        { title: "Notifications",   value: fmt(d.notif),         icon: Bell,         color: "text-amber-600",  bg: "bg-amber-50",  sub: "Unread" },
        { title: "Support Tickets", value: "—",                  icon: LifeBuoy,     color: "text-purple-600", bg: "bg-purple-50", sub: "Open issues" },
      ],
      actions: [
        { title: "Logistics",    desc: "Zones & methods",  icon: Truck,       color: "bg-blue-600",   path: "/admin/logistics" },
        { title: "Tracking",     desc: "Shipment tracking",icon: Eye,         color: "bg-green-600",  path: "/admin/tracking" },
        { title: "Orders",       desc: "View all orders",  icon: ShoppingCart,color: "bg-purple-600", path: "/admin/website-orders" },
        { title: "Support",      desc: "Open tickets",     icon: LifeBuoy,    color: "bg-red-600",    path: "/admin/dashboard/support-tickets" },
      ],
    },

    EDITOR: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Products", value: fmt(d.totalProducts), icon: Package,  color: "text-blue-600",   bg: "bg-blue-50",   sub: "In catalog" },
        { title: "Blog Posts",     value: fmt(d.totalBlogs),    icon: FileText, color: "text-green-600",  bg: "bg-green-50",  sub: "Published posts" },
        { title: "Notifications",  value: fmt(d.notif),         icon: Bell,     color: "text-amber-600",  bg: "bg-amber-50",  sub: "Unread" },
        { title: "Support Tickets",value: "—",                  icon: LifeBuoy, color: "text-purple-600", bg: "bg-purple-50", sub: "Open tickets" },
      ],
      actions: [
        { title: "Products",  desc: "Edit catalog",      icon: Package,  color: "bg-blue-600",   path: "/admin/products" },
        { title: "Blog",      desc: "Manage posts",      icon: FileText, color: "bg-green-600",  path: "/admin/blog" },
        { title: "Sliders",   desc: "Homepage sliders",  icon: Palette,  color: "bg-purple-600", path: "/admin/sliders" },
        { title: "Support",   desc: "Editor tickets",    icon: LifeBuoy, color: "bg-red-600",    path: "/admin/dashboard/support-tickets" },
      ],
    },

    DESIGNER: {
      title: banner("title"), subtitle: banner("subtitle"),
      stats: [
        { title: "Total Products", value: fmt(d.totalProducts), icon: Package,  color: "text-blue-600",   bg: "bg-blue-50",   sub: "In catalog" },
        { title: "Notifications",  value: fmt(d.notif),         icon: Bell,     color: "text-amber-600",  bg: "bg-amber-50",  sub: "Unread" },
        { title: "Support Tickets",value: "—",                  icon: LifeBuoy, color: "text-purple-600", bg: "bg-purple-50", sub: "Open tickets" },
        { title: "Active Sliders", value: "—",                  icon: Palette,  color: "text-green-600",  bg: "bg-green-50",  sub: "Homepage banners" },
      ],
      actions: [
        { title: "Sliders",  desc: "Manage sliders",   icon: Palette, color: "bg-purple-600", path: "/admin/sliders" },
        { title: "Banners",  desc: "Banner management",icon: Palette, color: "bg-pink-600",   path: "/admin/banners" },
        { title: "Colors",   desc: "Color swatches",   icon: Palette, color: "bg-indigo-600", path: "/admin/colors" },
        { title: "Brands",   desc: "Brand management", icon: Tag,     color: "bg-blue-600",   path: "/admin/brands" },
      ],
    },
  };

  const cfg = configs[role] || configs.IT;

  const showCountryBreakdown =
    (role === "DIRECTOR" || role === "IT") && d.countryBreakdown?.length > 0;

  return (
    <div className="space-y-6">
      <AnnouncementPopup />
      <CountryScopeBanner />

      {/* Banner */}
      <div className={`bg-gradient-to-r ${bannerGradient} rounded-2xl p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-2xl font-bold">{cfg.title}</h1>
            <p className="text-white/80 text-sm mt-1">{cfg.subtitle}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">{user?.name}</span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">{role}</span>
              {countryScope && (
                <span className="text-xs bg-white/30 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {user.assignedCountry}
                </span>
              )}
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                  +{""}
                </span>
              )}
              {d.notif > 0 && (
                <span className="text-xs bg-red-500 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Bell className="h-3 w-3" /> {d.notif} new
                </span>
              )}
            </div>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            <RefreshCw className={`h-5 w-5 text-white ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {updated && <p className="text-white/40 text-xs mt-3">Updated just now</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cfg.stats.map((s, i) => <Stat key={i} {...s} loading={L} />)}
      </div>

      {/* Actions + Recent orders / Country breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quick Actions</h2>
          {cfg.actions.map((a, i) => <Action key={i} {...a} onClick={() => nav(a.path)} />)}
        </div>

        {/* Right column: country breakdown for DIRECTOR/IT, recent orders for others */}
        <div className="lg:col-span-2 space-y-4">
          {showCountryBreakdown && (
            <CountryBreakdown data={d.countryBreakdown} formatPrice={formatPrice} />
          )}

          {d.recentOrders?.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Orders</h2>
                <button onClick={() => nav("/admin/website-orders")}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {d.recentOrders.slice(0, 5).map((o, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-36">
                          {o.userId?.name || o.customerId?.name || "Customer"}
                        </p>
                        <p className="text-xs text-gray-400">{ago(o.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmtC(o.totalAmt || o.subTotalAmt)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.order_status === "Delivered" ? "bg-green-100 text-green-700" : o.order_status === "Cancel" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {o.order_status || "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !showCountryBreakdown ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center gap-3">
              <Coffee className="h-10 w-10 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, {user?.name}</p>
            </div>
          ) : null}

          {countryScope && d.topProducts?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Top Products in {d.countryMeta?.name}</h2>
              <div className="space-y-2">
                {d.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-48">{p.name || "Product"}</p>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{fmt(p.totalSold)} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
