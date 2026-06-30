//admin
import React, { useState } from "react";
import {
  ChevronDown, ChevronRight, Package, Globe, ShoppingCart,
  Warehouse, DollarSign, Users, Settings, Palette, Truck,
  BarChart3, FileText, Tag, Menu, Folder, X, TrendingUp,
  Boxes, Home, Layers, ListTree, SlidersHorizontal, Map,
  ArrowUpDown, RefreshCw, Building2, Activity, Coffee,
  Edit, CreditCard, CheckSquare, Archive, AlertTriangle,
  PieChart, MapPin, Navigation, Image, Layout, Zap, Inbox,
  Bell, LifeBuoy, Lock,
} from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

const AdminSidebar = ({ userRole, userSubRole, currentPath, onNavigate, isCollapsed, onToggle }) => {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope } = useAdminCountry();

  const [openMenus, setOpenMenus] = useState({
    products: true, procurement: true, inventory: true, pricing: true, reports: true,
  });

  const toggleMenu = (key) => { if (isCollapsed) return; setOpenMenus(p => ({ ...p, [key]: !p[key] })); };

  // hasAccess — standard subRole check, no country-scope special-casing.
  const hasAccess = (roles) => {
    if (!roles || roles.length === 0) return true;
    return roles.includes(userSubRole);
  };

  const isLogisticsItem = (key) => ["logistics"].includes(key);

  const menuItems = [
    { key: "dashboard", title: t("nav.dashboard"), path: "/admin/dashboard", icon: Home, single: true, allowedSubRoles: [] },
    {
      key: "products", title: t("nav.productManagement"), icon: Boxes, allowedSubRoles: [],
      items: [
        { title: t("nav.products"),           path: "/admin/products",             icon: Package,          allowedSubRoles: [] },
        { title: t("nav.productRequests"),    path: "/admin/product-requests",     icon: Inbox,            allowedSubRoles: ["SALES","SALES_MANAGER","IT","DIRECTOR"] },
        { title: t("nav.categories"),         path: "/admin/categories",           icon: Layers,           allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.subCategories"),      path: "/admin/sub-categories",       icon: ListTree,         allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.brands"),             path: "/admin/brands",               icon: Coffee,           allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.colors"),             path: "/admin/colors",               icon: Palette,          allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.tags"),               path: "/admin/tags",                 icon: Tag,              allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.attributes"),         path: "/admin/attributes",           icon: SlidersHorizontal,allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.coffeeRoastedAreas"), path: "/admin/coffee-roasted-areas", icon: Map,              allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
      ],
    },
    { key: "crm",           title: t("nav.crmPipeline"),   path: "/admin/dashboard/crm",           icon: Users,   single: true, allowedSubRoles: ["SALES","SALES_MANAGER","MANAGER","IT","EDITOR","DIRECTOR"] },
    { key: "scraper",       title: t("nav.webScraper"),    path: "/admin/dashboard/scraper",        icon: Zap,     single: true, allowedSubRoles: ["SALES","SALES_MANAGER","MANAGER","IT","EDITOR","DIRECTOR"] },
    { key: "translations",  title: t("nav.translations"),  path: "/admin/translations",             icon: Edit,    single: true, allowedSubRoles: ["IT","DIRECTOR","EDITOR","MANAGER"] },
    { key: "notifications", title: t("nav.notifications"), path: "/admin/dashboard/notifications",  icon: Bell,    single: true, allowedSubRoles: [] },
    { key: "support-tickets",title: t("nav.supportTickets"),path: "/admin/dashboard/support-tickets",icon: LifeBuoy,single: true, allowedSubRoles: ["IT","DIRECTOR","MANAGER","SALES_MANAGER","HR","SALES","WAREHOUSE","ACCOUNTANT","LOGISTICS","EDITOR","DESIGNER"] },
    { key: "password-vault",title: t("nav.passwordVault"), path: "/admin/dashboard/password-vault", icon: Lock,    single: true, allowedSubRoles: ["IT","DIRECTOR"] },
    {
      key: "content", title: t("nav.contentManagement"), icon: Layout, allowedSubRoles: ["IT","DIRECTOR","EDITOR","DESIGNER"],
      items: [
        { title: t("nav.sliderManagement"), path: "/admin/sliders", icon: Image,  allowedSubRoles: ["IT","DIRECTOR","EDITOR","DESIGNER"] },
        { title: t("nav.bannerManagement"), path: "/admin/banners", icon: Layout, allowedSubRoles: ["IT","DIRECTOR","EDITOR","DESIGNER"] },
        { title: t("nav.fomoWidget"),       path: "/admin/fomo",    icon: Zap,    allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
      ],
    },
    {
      key: "procurement", title: t("nav.procurement"), icon: ShoppingCart, allowedSubRoles: ["IT","DIRECTOR","MANAGER","WAREHOUSE"],
      items: [
        { title: t("nav.suppliers"),     path: "/admin/suppliers",       icon: Building2,   allowedSubRoles: ["DIRECTOR","IT"] },
        { title: t("nav.purchaseOrders"),path: "/admin/purchase-orders", icon: ShoppingCart,allowedSubRoles: ["IT","DIRECTOR","MANAGER","WAREHOUSE"] },
      ],
    },
    {
      // COUNTRY-scoped admins can see orders + customers
      key: "inventory", title: t("nav.inventoryManagement"), icon: Warehouse,
      allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","MANAGER","SALES","HR"],
      items: [
        { title: t("nav.qualityManagement"),   path: "/admin/stock",          icon: Warehouse,   allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","MANAGER","HR"] },
        { title: t("nav.warehouseManagement"), path: "/admin/warehouse",      icon: Warehouse,   allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","MANAGER","HR"] },
        { title: t("nav.manualOrders"),        path: "/admin/offline-orders", icon: ShoppingCart,allowedSubRoles: ["IT","DIRECTOR","SALES","SALES_MANAGER","MANAGER","HR"] },
        { title: t("nav.websiteOrders"),       path: "/admin/website-orders", icon: Globe,       allowedSubRoles: ["IT","DIRECTOR","SALES","SALES_MANAGER","MANAGER","HR"] },
      ],
    },
    {
      key: "pricing", title: t("nav.pricingManagement"), icon: DollarSign,
      allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"],
      items: [
        { title: t("nav.pricingManagement"),    path: "/admin/pricing",           icon: Settings,  allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
        { title: t("nav.priceList"),            path: "/admin/pricing-lists",     icon: Settings,  allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
        { title: t("nav.directPricing"),        path: "/admin/direct-pricing",    icon: Edit,      allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","EDITOR","MANAGER"] },
        { title: t("nav.pricingConfiguration"), path: "/admin/pricing-config",    icon: Settings,  allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
        { title: t("nav.priceCalculation"),     path: "/admin/price-calculation", icon: DollarSign,allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
        { title: t("nav.priceUtilities"),       path: "/admin/price-utilities",   icon: DollarSign,allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
        { title: t("nav.exchangeRates"),        path: "/admin/exchange-rates",    icon: TrendingUp,allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
      ],
    },
    {
      // Logistics is only for HQ (IT, DIRECTOR, LOGISTICS subRole)
      // The hasAccess function + isLogisticsItem double-guard this.
      key: "logistics", title: t("nav.logistics"), icon: Truck,
      allowedSubRoles: ["IT","DIRECTOR","LOGISTICS","SALES_MANAGER","MANAGER"],
      items: [
        { title: t("nav.logisticsManagement"), path: "/admin/logistics", icon: MapPin,    allowedSubRoles: ["IT","DIRECTOR","LOGISTICS","SALES_MANAGER","MANAGER"] },
        { title: t("nav.trackingManagement"),  path: "/admin/tracking",  icon: Navigation,allowedSubRoles: ["IT","DIRECTOR","LOGISTICS","SALES_MANAGER","MANAGER"] },
      ],
    },
    {
      key: "blog", title: t("nav.blogManagement"), icon: FileText,
      allowedSubRoles: ["IT","DIRECTOR","EDITOR"],
      items: [
        { title: t("nav.blogPosts"),      path: "/admin/blog",            icon: FileText, allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.blogCategories"), path: "/admin/blog/categories", icon: Folder,   allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
        { title: t("nav.blogTags"),       path: "/admin/blog/tags",       icon: Tag,      allowedSubRoles: ["IT","DIRECTOR","EDITOR"] },
      ],
    },
    {
      key: "reports", title: t("nav.reportsAnalytics"), icon: BarChart3,
      allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","SALES_MANAGER","MANAGER","ACCOUNTANT","SALES"],
      items: [
        { title: t("nav.inventoryReports"), path: "/admin/reports/inventory",     icon: FileText, allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","MANAGER","ACCOUNTANT"] },
        { title: t("nav.pricingReports"),   path: "/admin/reports/pricing",       icon: FileText, allowedSubRoles: ["IT","DIRECTOR","ACCOUNTANT","MANAGER"] },
        { title: t("nav.purchaseReports"),  path: "/admin/reports/purchase",      icon: FileText, allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","MANAGER","ACCOUNTANT"] },
        { title: t("nav.salesReports"),     path: "/admin/reports/sales",         icon: PieChart, allowedSubRoles: ["IT","DIRECTOR","SALES","SALES_MANAGER","MANAGER","ACCOUNTANT"] },
        { title: t("nav.stockAnalysis"),    path: "/admin/reports/stock-analysis",icon: BarChart3,allowedSubRoles: ["IT","DIRECTOR","WAREHOUSE","MANAGER"] },
      ],
    },
    { key: "customers",   title: t("nav.customerManagement"), path: "/admin/customers", icon: Users,    single: true, allowedSubRoles: ["IT","DIRECTOR","SALES","SALES_MANAGER","MANAGER"] },
    { key: "users",       title: t("nav.userManagement"),     path: "/admin/users",     icon: Users,    single: true, allowedSubRoles: ["IT","DIRECTOR","HR","MANAGER"] },
    { key: "activity-log",title: t("nav.activityLog"),        path: "/admin/activity",  icon: Activity, single: true, allowedSubRoles: ["IT","DIRECTOR"] },
    { key: "settings",    title: t("nav.settings"),           path: "/admin/settings",  icon: Settings, single: true, allowedSubRoles: ["IT","DIRECTOR"] },
  ];

  // Filter top-level items:
  // 1. Standard hasAccess check
  // 2. Country-scoped admins cannot see HQ-only sections
  const filteredMenuItems = menuItems.filter(item => {

    return hasAccess(item.allowedSubRoles);
  });

  const MenuItem = ({ item }) => {
    const isOpen = openMenus[item.key];
    const hasItems = item.items?.length > 0;
    const Icon = item.icon;
    const isActive = currentPath === item.path ||
      (hasItems && item.items.some(s => currentPath === s.path && hasAccess(s.allowedSubRoles)));

    // Filter sub-items:
    // Country-scoped admins never see logistics sub-items
    const filteredSubs = hasItems
      ? item.items.filter(s => {
          if (!isGlobalAdmin && (s.path?.includes("/logistics") || s.path?.includes("/tracking"))) return false;
          return hasAccess(s.allowedSubRoles);
        })
      : [];

    if (hasItems && filteredSubs.length === 0) return null;

    const activeClass = "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500";
    const inactiveClass = "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";
    const iconActive = "text-blue-600 dark:text-blue-400";
    const iconInactive = "text-gray-500 dark:text-gray-400";

    if (item.single) {
      return (
        <div className="mb-1">
          <button onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? activeClass : inactiveClass}`}
            title={isCollapsed ? item.title : ""}>
            <Icon className={`w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"} ${isActive ? iconActive : iconInactive}`} />
            {!isCollapsed && <span className="flex-1">{item.title}</span>}
          </button>
        </div>
      );
    }

    return (
      <div className="mb-1">
        <button onClick={() => toggleMenu(item.key)}
          className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 ${isActive ? "bg-gray-50 dark:bg-gray-800" : ""}`}
          title={isCollapsed ? item.title : ""}>
          <div className="flex items-center">
            <Icon className={`w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"} ${isActive ? iconActive : iconInactive}`} />
            {!isCollapsed && <span className="flex-1">{item.title}</span>}
          </div>
          {!isCollapsed && (isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
        </button>
        {isOpen && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {filteredSubs.map((sub, i) => (
              <button key={i} onClick={() => onNavigate(sub.path)}
                className={`w-full flex items-center px-8 py-2 text-left text-sm rounded-lg transition-all duration-200 ${currentPath === sub.path ? activeClass : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"}`}>
                <sub.icon className="w-4 h-4 mr-3" />
                <span className="flex-1">{sub.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("common.adminPanel")}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">I-COFFEE.NG</p>
              </div>
            )}
            <button onClick={onToggle}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User Badge */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t("common.loggedInAs")}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{userRole}</p>
                  {userSubRole && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{userSubRole}</p>}

                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{userRole?.charAt(0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {filteredMenuItems.map(item => <MenuItem key={item.key} item={item} />)}
          </nav>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("common.version")} | I-COFFEE.NG</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
