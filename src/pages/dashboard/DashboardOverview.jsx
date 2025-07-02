import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Coffee,
  CheckCircle,
  UserPlus,
  Key,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Loader2,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  Plus,
  Package,
  DollarSign,
  ShoppingCart,
  FileText,
  Database,
  Monitor,
  Palette,
  Tag,
  Folder,
  Heart,
  Star,
} from 'lucide-react';
import { authAPI, getCurrentUser } from '../../utils/api';

const DashboardOverview = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await authAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats(true);
  };

  // Common Components
  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    description,
    isLoading,
  }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">Loading...</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value || 0}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gray-50 dark:bg-gray-700`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {!isLoading && trend && (
        <div className="mt-3 flex items-center text-sm">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-green-600 dark:text-green-400 font-medium">
            {trend}
          </span>
        </div>
      )}
      {!isLoading && description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );

  const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    color,
    link,
    disabled = false,
    onClick,
  }) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      } else if (!disabled) {
        navigate(link);
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`w-full text-left p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-0.5'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </div>
      </button>
    );
  };

  const ActivityItem = ({
    icon: Icon,
    title,
    description,
    time,
    type = 'info',
  }) => {
    const typeColors = {
      success: 'text-green-600 bg-green-100 dark:bg-green-900',
      warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      error: 'text-red-600 bg-red-100 dark:bg-red-900',
      info: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
    };

    return (
      <div className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <div className={`p-2 rounded-full ${typeColors[type]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
      </div>
    );
  };

  // Get dashboard configuration based on subRole
  const getDashboardConfig = (subRole) => {
    const configs = {
      IT: {
        title: 'System Administration Dashboard',
        description:
          'Monitor system health, manage users, and maintain infrastructure',
        stats: [
          {
            title: 'Total Users',
            value: stats.overview?.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            trend: `+${stats.activity?.recentRegistrations || 0} this month`,
            description: 'All registered users',
          },
          {
            title: 'System Health',
            value: loading ? '...' : 'Optimal',
            icon: Monitor,
            color: 'text-green-600',
            description: 'All systems operational',
          },
          {
            title: 'Database',
            value: loading ? '...' : '99.9%',
            icon: Database,
            color: 'text-purple-600',
            description: 'Uptime this month',
          },
          {
            title: 'Active Sessions',
            value: stats.activity?.recentLogins,
            icon: Activity,
            color: 'text-amber-600',
            description: 'Current active users',
          },
        ],
        quickActions: [
          {
            title: 'User Management',
            description: 'Manage all user accounts and permissions',
            icon: Users,
            color: 'bg-blue-600',
            link: '/admin/users',
          },
          {
            title: 'System Settings',
            description: 'Configure system-wide settings',
            icon: Settings,
            color: 'bg-gray-600',
            link: '/admin/settings',
          },
          {
            title: 'Database Management',
            description: 'Monitor and maintain database',
            icon: Database,
            color: 'bg-purple-600',
            link: '/admin/database',
          },
          {
            title: 'Product Management',
            description: 'Manage product catalog',
            icon: Package,
            color: 'bg-green-600',
            link: '/admin/products',
          },
        ],
      },
      DIRECTOR: {
        title: 'Executive Dashboard',
        description:
          'Executive overview of business performance and strategic metrics',
        stats: [
          {
            title: 'Monthly Revenue',
            value: '$48,432',
            icon: DollarSign,
            color: 'text-green-600',
            trend: '+12% from last month',
            description: 'Total revenue',
          },
          {
            title: 'Total Users',
            value: stats.overview?.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            trend: `+${stats.activity?.recentRegistrations || 0} new users`,
            description: 'Customer base',
          },
          {
            title: 'Orders',
            value: '1,847',
            icon: ShoppingCart,
            color: 'text-purple-600',
            trend: '+8% this month',
            description: 'Total orders',
          },
          {
            title: 'Growth Rate',
            value: '15.3%',
            icon: TrendingUp,
            color: 'text-amber-600',
            description: 'Monthly growth',
          },
        ],
        quickActions: [
          {
            title: 'Analytics Overview',
            description: 'View business performance metrics',
            icon: BarChart3,
            color: 'bg-blue-600',
            link: '/admin/analytics',
          },
          {
            title: 'User Management',
            description: 'Manage all staff and customers',
            icon: Users,
            color: 'bg-green-600',
            link: '/admin/users',
          },
          {
            title: 'Financial Reports',
            description: 'Revenue and financial analytics',
            icon: DollarSign,
            color: 'bg-purple-600',
            link: '/admin/finance',
          },
          {
            title: 'Product Strategy',
            description: 'Product performance and planning',
            icon: Package,
            color: 'bg-amber-600',
            link: '/admin/products',
          },
        ],
      },
      HR: {
        title: 'Human Resources Dashboard',
        description:
          'Manage staff, recruitment, and human resources operations',
        stats: [
          {
            title: 'Total Staff',
            value: stats.overview?.totalAdmins,
            icon: Users,
            color: 'text-blue-600',
            description: 'Active employees',
          },
          {
            title: 'New Hires',
            value: stats.activity?.recentRegistrations,
            icon: UserPlus,
            color: 'text-green-600',
            description: 'This month',
          },
          {
            title: 'Departments',
            value: stats.adminsBySubRole?.length || 8,
            icon: Shield,
            color: 'text-purple-600',
            description: 'Active departments',
          },
          {
            title: 'Active Today',
            value: stats.activity?.recentLogins,
            icon: Activity,
            color: 'text-amber-600',
            description: 'Staff logged in today',
          },
        ],
        quickActions: [
          {
            title: 'Staff Management',
            description: 'Manage employee accounts',
            icon: Users,
            color: 'bg-blue-600',
            link: '/admin/users',
          },
          {
            title: 'New Employee',
            description: 'Onboard new team members',
            icon: UserPlus,
            color: 'bg-green-600',
            link: '/admin/users',
            onClick: () => navigate('/admin/users?action=create'),
          },
          {
            title: 'Employee Reports',
            description: 'Staff performance and attendance',
            icon: FileText,
            color: 'bg-purple-600',
            link: '/admin/hr-reports',
          },
          {
            title: 'Customer Accounts',
            description: 'Manage customer registrations',
            icon: Coffee,
            color: 'bg-orange-600',
            link: '/admin/customers',
          },
        ],
      },
      SALES: {
        title: 'Sales Dashboard',
        description: 'Track sales performance, customer relations, and revenue',
        stats: [
          {
            title: 'Monthly Sales',
            value: '$32,847',
            icon: DollarSign,
            color: 'text-green-600',
            trend: '+15% from last month',
            description: "This month's revenue",
          },
          {
            title: 'Orders',
            value: '1,432',
            icon: ShoppingCart,
            color: 'text-blue-600',
            trend: '+8% increase',
            description: 'Total orders',
          },
          {
            title: 'Customers',
            value: stats.overview?.totalCustomers,
            icon: Coffee,
            color: 'text-purple-600',
            description: 'Active customers',
          },
          {
            title: 'Conversion Rate',
            value: '3.2%',
            icon: TrendingUp,
            color: 'text-amber-600',
            trend: '+0.5% this week',
            description: 'Lead conversion',
          },
        ],
        quickActions: [
          {
            title: 'Customer Management',
            description: 'Manage customer accounts',
            icon: Users,
            color: 'bg-blue-600',
            link: '/admin/customers',
          },
          {
            title: 'Order Management',
            description: 'View and process orders',
            icon: ShoppingCart,
            color: 'bg-green-600',
            link: '/admin/orders',
          },
          {
            title: 'Sales Reports',
            description: 'Sales analytics and reports',
            icon: BarChart3,
            color: 'bg-purple-600',
            link: '/admin/sales-reports',
          },
          {
            title: 'Product Catalog',
            description: 'View product information',
            icon: Package,
            color: 'bg-amber-600',
            link: '/admin/products',
          },
        ],
      },
      MANAGER: {
        title: 'Operations Dashboard',
        description:
          'Oversee daily operations, team management, and service quality',
        stats: [
          {
            title: 'Team Members',
            value: '24',
            icon: Users,
            color: 'text-blue-600',
            description: 'Direct reports',
          },
          {
            title: 'Daily Operations',
            value: '98.5%',
            icon: Activity,
            color: 'text-green-600',
            description: 'Efficiency rate',
          },
          {
            title: 'Customer Satisfaction',
            value: '4.8/5',
            icon: Coffee,
            color: 'text-purple-600',
            description: 'Average rating',
          },
          {
            title: 'Tasks Completed',
            value: '147',
            icon: CheckCircle,
            color: 'text-amber-600',
            description: 'This week',
          },
        ],
        quickActions: [
          {
            title: 'Team Overview',
            description: 'Monitor team performance',
            icon: Users,
            color: 'bg-blue-600',
            link: '/admin/team',
          },
          {
            title: 'Customer Service',
            description: 'Customer support dashboard',
            icon: Coffee,
            color: 'bg-green-600',
            link: '/admin/customer-service',
          },
          {
            title: 'Operations Reports',
            description: 'Daily operations analytics',
            icon: BarChart3,
            color: 'bg-purple-600',
            link: '/admin/operations',
          },
          {
            title: 'Quality Control',
            description: 'Monitor service quality',
            icon: CheckCircle,
            color: 'bg-amber-600',
            link: '/admin/quality',
          },
        ],
      },
      ACCOUNTANT: {
        title: 'Financial Dashboard',
        description:
          'Financial management, reporting, and accounting operations',
        stats: [
          {
            title: 'Monthly Revenue',
            value: '$45,230',
            icon: DollarSign,
            color: 'text-green-600',
            trend: '+8.5% vs last month',
            description: 'Total income',
          },
          {
            title: 'Expenses',
            value: '$12,450',
            icon: FileText,
            color: 'text-red-600',
            description: 'Monthly expenses',
          },
          {
            title: 'Profit Margin',
            value: '72.5%',
            icon: TrendingUp,
            color: 'text-purple-600',
            trend: '+2.1% this month',
            description: 'Net profit margin',
          },
          {
            title: 'Outstanding',
            value: '$3,240',
            icon: Clock,
            color: 'text-amber-600',
            description: 'Pending payments',
          },
        ],
        quickActions: [
          {
            title: 'Financial Reports',
            description: 'Generate financial statements',
            icon: FileText,
            color: 'bg-blue-600',
            link: '/admin/financial-reports',
          },
          {
            title: 'Revenue Analytics',
            description: 'Track income and growth',
            icon: DollarSign,
            color: 'bg-green-600',
            link: '/admin/revenue',
          },
          {
            title: 'Expense Management',
            description: 'Monitor and categorize expenses',
            icon: BarChart3,
            color: 'bg-red-600',
            link: '/admin/expenses',
          },
          {
            title: 'Payment Processing',
            description: 'Handle payments and invoices',
            icon: CheckCircle,
            color: 'bg-purple-600',
            link: '/admin/payments',
          },
        ],
      },
      GRAPHICS: {
        title: 'Design & Graphics Dashboard',
        description:
          'Design management, brand assets, and visual content creation',
        stats: [
          {
            title: 'Design Projects',
            value: '32',
            icon: Palette,
            color: 'text-purple-600',
            description: 'Active projects',
          },
          {
            title: 'Product Images',
            value: '248',
            icon: Package,
            color: 'text-blue-600',
            description: 'Product catalog images',
          },
          {
            title: 'Brand Assets',
            value: '156',
            icon: Tag,
            color: 'text-green-600',
            description: 'Brand materials',
          },
          {
            title: 'Campaigns',
            value: '12',
            icon: TrendingUp,
            color: 'text-amber-600',
            description: 'Marketing campaigns',
          },
        ],
        quickActions: [
          {
            title: 'Product Images',
            description: 'Manage product photography',
            icon: Package,
            color: 'bg-blue-600',
            link: '/admin/product-images',
          },
          {
            title: 'Brand Management',
            description: 'Brand assets and guidelines',
            icon: Tag,
            color: 'bg-purple-600',
            link: '/admin/brands',
          },
          {
            title: 'Design Projects',
            description: 'Current design tasks',
            icon: Palette,
            color: 'bg-green-600',
            link: '/admin/design-projects',
          },
          {
            title: 'Color Management',
            description: 'Product color variations',
            icon: Palette,
            color: 'bg-indigo-600',
            link: '/admin/colors',
          },
        ],
      },
      EDITOR: {
        title: 'Content Management Dashboard',
        description: 'Content creation, editing, and publication management',
        stats: [
          {
            title: 'Content Pieces',
            value: '89',
            icon: FileText,
            color: 'text-blue-600',
            description: 'Published content',
          },
          {
            title: 'Product Descriptions',
            value: '156',
            icon: Package,
            color: 'text-green-600',
            description: 'Product content',
          },
          {
            title: 'Pending Reviews',
            value: '12',
            icon: Clock,
            color: 'text-amber-600',
            description: 'Awaiting approval',
          },
          {
            title: 'Blog Posts',
            value: '24',
            icon: FileText,
            color: 'text-purple-600',
            description: 'Published articles',
          },
        ],
        quickActions: [
          {
            title: 'Product Content',
            description: 'Edit product descriptions',
            icon: Package,
            color: 'bg-blue-600',
            link: '/admin/product-content',
          },
          {
            title: 'Blog Management',
            description: 'Create and edit blog posts',
            icon: FileText,
            color: 'bg-green-600',
            link: '/admin/blog',
          },
          {
            title: 'SEO Management',
            description: 'Optimize content for search',
            icon: TrendingUp,
            color: 'bg-purple-600',
            link: '/admin/seo',
          },
          {
            title: 'Review Queue',
            description: 'Content awaiting review',
            icon: Eye,
            color: 'bg-indigo-600',
            link: '/admin/review-queue',
          },
        ],
      },
      // Customer dashboards
      BTC: {
        title: 'Business Customer Dashboard',
        description: 'Manage your business coffee orders and account',
        stats: [
          {
            title: 'My Orders',
            value: '23',
            icon: ShoppingCart,
            color: 'text-blue-600',
            description: 'Total orders placed',
          },
          {
            title: 'Loyalty Points',
            value: '1,240',
            icon: Coffee,
            color: 'text-green-600',
            description: 'Available points',
          },
          {
            title: 'Saved Items',
            value: '8',
            icon: Heart,
            color: 'text-purple-600',
            description: 'Wishlist items',
          },
          {
            title: 'Account Status',
            value: 'Business',
            icon: Shield,
            color: 'text-amber-600',
            description: 'Customer type',
          },
        ],
        quickActions: [
          {
            title: 'Browse Products',
            description: 'Explore our coffee collection',
            icon: Coffee,
            color: 'bg-amber-600',
            link: '/products',
          },
          {
            title: 'My Orders',
            description: 'View order history and status',
            icon: ShoppingCart,
            color: 'bg-blue-600',
            link: '/my-orders',
          },
          {
            title: 'Account Settings',
            description: 'Update profile and preferences',
            icon: Settings,
            color: 'bg-gray-600',
            link: '/account/settings',
          },
          {
            title: 'Business Benefits',
            description: 'View business discounts and benefits',
            icon: Star,
            color: 'bg-green-600',
            link: '/business-benefits',
          },
        ],
      },
      BTB: {
        title: 'Customer Dashboard',
        description: 'Your personal coffee experience and order management',
        stats: [
          {
            title: 'My Orders',
            value: '12',
            icon: ShoppingCart,
            color: 'text-blue-600',
            description: 'Total orders placed',
          },
          {
            title: 'Loyalty Points',
            value: '680',
            icon: Coffee,
            color: 'text-green-600',
            description: 'Available points',
          },
          {
            title: 'Favorites',
            value: '5',
            icon: Heart,
            color: 'text-purple-600',
            description: 'Favorite products',
          },
          {
            title: 'Rewards',
            value: '3',
            icon: Star,
            color: 'text-amber-600',
            description: 'Available rewards',
          },
        ],
        quickActions: [
          {
            title: 'Browse Products',
            description: 'Explore our coffee collection',
            icon: Coffee,
            color: 'bg-amber-600',
            link: '/products',
          },
          {
            title: 'My Orders',
            description: 'View order history and status',
            icon: ShoppingCart,
            color: 'bg-blue-600',
            link: '/my-orders',
          },
          {
            title: 'Loyalty Program',
            description: 'View points and rewards',
            icon: Star,
            color: 'bg-green-600',
            link: '/loyalty',
          },
          {
            title: 'Support',
            description: 'Get help and contact support',
            icon: Users,
            color: 'bg-purple-600',
            link: '/support',
          },
        ],
      },
    };

    return configs[subRole] || configs.IT; // Default to IT if subRole not found
  };

  const config = getDashboardConfig(currentUser?.subRole);

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {config.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {config.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <div className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
            {currentUser?.subRole || 'ADMIN'}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button
              onClick={handleRefresh}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Role-specific Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {config.stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            description={stat.description}
            isLoading={loading}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  color={action.color}
                  link={action.link}
                  onClick={action.onClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-1">
            <ActivityItem
              icon={UserPlus}
              title="New user registered"
              description="Mike Johnson joined as BTC user"
              time="2 hours ago"
              type="success"
            />
            <ActivityItem
              icon={Key}
              title="Password reset requested"
              description="Sarah Wilson requested password reset"
              time="4 hours ago"
              type="warning"
            />
            <ActivityItem
              icon={CheckCircle}
              title="System backup completed"
              description="Daily backup completed successfully"
              time="6 hours ago"
              type="success"
            />
            <ActivityItem
              icon={Activity}
              title="High login activity"
              description="Above normal login volume detected"
              time="8 hours ago"
              type="info"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/admin/activity"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all activity
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Conditional System Health (only for admin roles) */}
      {[
        'IT',
        'DIRECTOR',
        'HR',
        'SALES',
        'MANAGER',
        'ACCOUNTANT',
        'GRAPHICS',
        'EDITOR',
      ].includes(currentUser?.subRole) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Server Status
                  </span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Database
                  </span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Service
                  </span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Backup System
                  </span>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {loading ? '...' : '99.9%'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Uptime
                </div>
                <div className="text-xs flex items-center justify-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +0.1%
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {loading ? '...' : '1.2s'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Response Time
                </div>
                <div className="text-xs flex items-center justify-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  -0.3s
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {loading ? '...' : stats.activity?.todayLogins || 34}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Active Sessions
                </div>
                <div className="text-xs flex items-center justify-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {loading ? '...' : '99.5%'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Success Rate
                </div>
                <div className="text-xs flex items-center justify-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  +0.2%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Today's Summary
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-blue-600" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? '...' : stats.activity?.todayLogins || 34}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentUser?.subRole === 'SALES'
                ? 'Orders Today'
                : currentUser?.subRole === 'BTC' ||
                  currentUser?.subRole === 'BTB'
                ? 'Activities'
                : 'Active Users'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {loading
                ? '...'
                : currentUser?.subRole === 'ACCOUNTANT'
                ? '$2,340'
                : currentUser?.subRole === 'GRAPHICS'
                ? '5'
                : currentUser?.subRole === 'BTC' ||
                  currentUser?.subRole === 'BTB'
                ? '3'
                : '12'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentUser?.subRole === 'ACCOUNTANT'
                ? 'Revenue'
                : currentUser?.subRole === 'GRAPHICS'
                ? 'New Designs'
                : currentUser?.subRole === 'BTC' ||
                  currentUser?.subRole === 'BTB'
                ? 'New Orders'
                : 'Completed Tasks'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {loading ? '...' : '98.5%'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentUser?.subRole === 'IT'
                ? 'System Health'
                : currentUser?.subRole === 'BTC' ||
                  currentUser?.subRole === 'BTB'
                ? 'Satisfaction'
                : 'Performance'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {loading
                ? '...'
                : currentUser?.subRole === 'BTC' ||
                  currentUser?.subRole === 'BTB'
                ? '1,240'
                : '5'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentUser?.subRole === 'BTC' || currentUser?.subRole === 'BTB'
                ? 'Loyalty Points'
                : 'Notifications'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
