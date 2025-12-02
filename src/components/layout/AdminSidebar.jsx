//admin
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Package,
  Globe,
  ShoppingCart,
  Warehouse,
  DollarSign,
  Users,
  Settings,
  Palette,
  Truck,
  BarChart3,
  FileText,
  Tag,
  Menu,
  Folder,
  X,
  TrendingUp,
  Boxes,
  Home,
  Layers,
  ListTree,
  SlidersHorizontal,
  Map,
  ArrowUpDown,
  RefreshCw,
  Building2,
  Coffee,
  Edit,
  CreditCard,
  CheckSquare,
  Archive,
  AlertTriangle,
  PieChart,
  MapPin,
  Navigation,
} from 'lucide-react';

const AdminSidebar = ({
  userRole,
  userSubRole,
  currentPath,
  onNavigate,
  isCollapsed,
  onToggle,
}) => {
  const [openMenus, setOpenMenus] = useState({
    products: true,
    procurement: true,
    inventory: true,
    pricing: true,
    reports: true,
  });

  const toggleMenu = (menuKey) => {
    if (isCollapsed) return;
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  // Role-based access control helper function
  const hasAccess = (allowedSubRoles) => {
    if (!allowedSubRoles || allowedSubRoles.length === 0) return true;
    return allowedSubRoles.includes(userSubRole);
  };

  const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: Home,
      single: true,
      allowedSubRoles: [],
    },
    {
      key: 'products',
      title: 'Product Management',
      icon: Boxes,
      allowedSubRoles: [],
      items: [
        {
          title: 'Products',
          path: '/admin/products',
          icon: Package,
          allowedSubRoles: [],
        },
        {
          title: 'Categories',
          path: '/admin/categories',
          icon: Layers,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'SubCategories',
          path: '/admin/sub-categories',
          icon: ListTree,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Brands',
          path: '/admin/brands',
          icon: Coffee,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Colors',
          path: '/admin/colors',
          icon: Palette,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Tags',
          path: '/admin/tags',
          icon: Tag,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Attributes',
          path: '/admin/attributes',
          icon: SlidersHorizontal,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Coffee Roasted Areas',
          path: '/admin/coffee-roasted-areas',
          icon: Map,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
      ],
    },
    {
      key: 'procurement',
      title: 'Procurement',
      icon: ShoppingCart,
      allowedSubRoles: ['IT', 'DIRECTOR', 'MANAGER', 'WAREHOUSE'],
      items: [
        {
          title: 'Suppliers',
          path: '/admin/suppliers',
          icon: Building2,
          allowedSubRoles: ['DIRECTOR', 'IT'],
        },
        {
          title: 'Purchase Orders',
          path: '/admin/purchase-orders',
          icon: ShoppingCart,
          allowedSubRoles: ['IT', 'DIRECTOR', 'MANAGER', 'WAREHOUSE'],
        },
        // {
        //   title: 'Order Tracking',
        //   path: '/admin/order-tracking',
        //   icon: Truck,
        //   allowedSubRoles: ['IT', 'DIRECTOR', 'MANAGER', 'WAREHOUSE'],
        // },
      ],
    },

    {
      key: 'inventory',
      title: 'Inventory Management',
      icon: Warehouse,
      allowedSubRoles: [
        'IT',
        'DIRECTOR',
        'WAREHOUSE',
        'MANAGER',
        'SALES',
        'HR',
      ],
      items: [
        {
          title: 'Quality Management',
          path: '/admin/stock',
          icon: Warehouse,
          allowedSubRoles: ['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER', 'HR'],
        },
        {
          title: 'Warehouse Management',
          path: '/admin/warehouse',
          icon: Warehouse,
          allowedSubRoles: ['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER', 'HR'],
        },
        // {
        //   title: 'Stock Movements',
        //   path: '/admin/stock-movements',
        //   icon: ArrowUpDown,
        //   allowedSubRoles: ['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER'],
        // },
        {
          title: 'Manual Orders',
          path: '/admin/offline-orders',
          icon: ShoppingCart,
          allowedSubRoles: ['IT', 'DIRECTOR', 'SALES', 'MANAGER', 'HR'],
        },
        {
          title: 'Website Orders',
          path: '/admin/website-orders',
          icon: Globe,
          allowedSubRoles: ['IT', 'DIRECTOR', 'SALES', 'MANAGER', 'HR'],
        },
      ],
    },
    {
      key: 'pricing',
      title: 'Pricing Management',
      icon: DollarSign,
      allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
      items: [
        {
          title: 'Pricing Management',
          path: '/admin/pricing',
          icon: Settings,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
        {
          title: 'Price List',
          path: '/admin/pricing-lists',
          icon: Settings,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
        {
          title: 'Direct Pricing',
          path: '/admin/direct-pricing',
          icon: Edit,
          allowedSubRoles: [
            'IT',
            'DIRECTOR',
            'ACCOUNTANT',
            'EDITOR',
            'MANAGER',
          ],
        },
        {
          title: 'Pricing Configuration',
          path: '/admin/pricing-config',
          icon: Settings,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
        {
          title: 'Price Calculation',
          path: '/admin/price-calculation',
          icon: DollarSign,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
        {
          title: 'Price Utilities',
          path: '/admin/price-utilities',
          icon: DollarSign,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
        {
          title: 'Exchange Rates',
          path: '/admin/exchange-rates',
          icon: TrendingUp,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
      ],
    },
    {
      key: 'logistics',
      title: 'Logistics',
      icon: Truck,
      allowedSubRoles: ['IT', 'DIRECTOR', 'LOGISTICS', 'MANAGER'],
      items: [
        {
          title: 'Logistics Management',
          path: '/admin/logistics',
          icon: MapPin,
          allowedSubRoles: ['IT', 'DIRECTOR', 'LOGISTICS', 'MANAGER'],
        },
        {
          title: 'Tracking Management',
          path: '/admin/tracking',
          icon: Navigation,
          allowedSubRoles: ['IT', 'DIRECTOR', 'LOGISTICS', 'MANAGER'],
        },
      ],
    },
    {
      key: 'blog',
      title: 'Blog Management',
      icon: FileText,
      allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
      items: [
        {
          title: 'Blog Posts',
          path: '/admin/blog',
          icon: FileText,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Categories',
          path: '/admin/blog/categories',
          icon: Folder,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
        {
          title: 'Tags',
          path: '/admin/blog/tags',
          icon: Tag,
          allowedSubRoles: ['IT', 'DIRECTOR', 'EDITOR'],
        },
      ],
    },
    {
      key: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart3,
      allowedSubRoles: [
        'IT',
        'DIRECTOR',
        'WAREHOUSE',
        'MANAGER',
        'ACCOUNTANT',
        'SALES',
      ],
      items: [
        {
          title: 'Inventory Reports',
          path: '/admin/reports/inventory',
          icon: FileText,
          allowedSubRoles: [
            'IT',
            'DIRECTOR',
            'WAREHOUSE',
            'MANAGER',
            'ACCOUNTANT',
          ],
        },
        {
          title: 'Pricing Reports',
          path: '/admin/reports/pricing',
          icon: FileText,
          allowedSubRoles: ['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER'],
        },
        {
          title: 'Purchase Reports',
          path: '/admin/reports/purchase',
          icon: FileText,
          allowedSubRoles: [
            'IT',
            'DIRECTOR',
            'WAREHOUSE',
            'MANAGER',
            'ACCOUNTANT',
          ],
        },
        {
          title: 'Sales Reports',
          path: '/admin/reports/sales',
          icon: PieChart,
          allowedSubRoles: ['IT', 'DIRECTOR', 'SALES', 'MANAGER', 'ACCOUNTANT'],
        },
        {
          title: 'Stock Analysis',
          path: '/admin/reports/stock-analysis',
          icon: BarChart3,
          allowedSubRoles: ['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER'],
        },
      ],
    },
    {
      key: 'users',
      title: 'User Management',
      path: '/admin/users',
      icon: Users,
      single: true,
      allowedSubRoles: ['IT', 'DIRECTOR', 'HR', 'MANAGER'],
    },
    {
      key: 'customers',
      title: 'Customer Management',
      path: '/admin/customers',
      icon: Users,
      single: true,
      allowedSubRoles: ['IT', 'DIRECTOR', 'SALES', 'MANAGER', 'SALES-MANAGER'],
    },
    {
      key: 'settings',
      title: 'Settings',
      path: '/admin/settings',
      icon: Settings,
      single: true,
      allowedSubRoles: ['IT', 'DIRECTOR'],
    },
  ];

  // Filter menu items based on user's sub-role
  const filteredMenuItems = menuItems.filter((item) =>
    hasAccess(item.allowedSubRoles)
  );

  const MenuItem = ({ item, level = 0 }) => {
    const isOpen = openMenus[item.key];
    const hasItems = item.items && item.items.length > 0;
    const Icon = item.icon;
    const isActive =
      currentPath === item.path ||
      (hasItems &&
        item.items.some(
          (subItem) =>
            currentPath === subItem.path && hasAccess(subItem.allowedSubRoles)
        ));

    // Filter sub-items based on access
    const filteredSubItems = hasItems
      ? item.items.filter((subItem) => hasAccess(subItem.allowedSubRoles))
      : [];

    // If no sub-items are accessible, don't show the parent menu
    if (hasItems && filteredSubItems.length === 0) {
      return null;
    }

    if (item.single) {
      // Single menu item (no children)
      return (
        <div className="mb-1">
          <button
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 group ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            } ${level > 0 ? 'ml-4' : ''}`}
            title={isCollapsed ? item.title : ''}
          >
            <Icon
              className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            />
            {!isCollapsed && <span className="flex-1">{item.title}</span>}
          </button>
        </div>
      );
    }

    if (hasItems && filteredSubItems.length > 0) {
      return (
        <div className="mb-1">
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 group ${
              level > 0 ? 'ml-4' : ''
            } ${isActive ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
            title={isCollapsed ? item.title : ''}
          >
            <div className="flex items-center">
              <Icon
                className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              />
              {!isCollapsed && <span className="flex-1">{item.title}</span>}
            </div>
            {!isCollapsed &&
              (isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ))}
          </button>

          {(isOpen || isCollapsed) && !isCollapsed && (
            <div className="mt-1 space-y-1">
              {filteredSubItems.map((subItem, index) => (
                <button
                  key={index}
                  onClick={() => onNavigate(subItem.path)}
                  className={`w-full flex items-center px-8 py-2 text-left text-sm rounded-lg transition-all duration-200 ${
                    currentPath === subItem.path
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <subItem.icon className="w-4 h-4 mr-3" />
                  <span className="flex-1">{subItem.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  I-COFFEE.NG
                </p>
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <Menu className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* User Role Badge */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Logged in as:
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {userRole}
                  </p>
                  {userSubRole && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {userSubRole}
                    </p>
                  )}
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {userRole?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {filteredMenuItems.map((item) => (
              <MenuItem key={item.key} item={item} />
            ))}
          </nav>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                v1.0.0 | I-COFFEE.NG
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;
