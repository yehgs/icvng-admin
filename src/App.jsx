//admin
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { isTokenValid, getCurrentUser, clearAuthData } from './utils/api.js';
import toast, { Toaster } from 'react-hot-toast';

// Layout Component
import DashboardLayout from './components/layout/DashboardLayout';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';

// Auth Components
import AdminLogin from './pages/auth/AdminLogin';

// Dashboard Components
import DashboardOverview from './pages/dashboard/DashboardOverview';

// Product Management Components
import ProductManagement from './pages/products/ProductManagement';
import CategoryManagement from './pages/products/CategoryManagement';
import BrandManagement from './pages/products/BrandManagement';
import ColorManagement from './pages/products/ColorManagement';
import SubCategoryManagement from './pages/products/SubCategoryManagement.jsx';
import TagManagement from './pages/products/TagManagement.jsx';
import AttributeManagement from './pages/products/AttributeMangament.jsx';
import CoffeeRoastAreaManagement from './pages/products/CoffeeRoastedArea.jsx';

// Procurement Components
import SupplierManagement from './pages/suppliers/SupplierManagement';
import PurchaseOrderManagement from './pages/purchase-order/PurchaseOrderManagement';

// Inventory Components
import StockManagement from './pages/stock/StockManagement';
import StockMovements from './pages/stock/StockMovements.jsx';
import WarehouseManagement from './pages/stock/WarehouseManagement.jsx';

// Pricing Components
import PricingManagement from './pages/pricing/PricingManagement';
import PricingConfiguration from './pages/pricing/PricingConfiguration';
import PricingUtilities from './pages/pricing/PricingUtilities.jsx';
import ExchangeRates from './pages/pricing/ExchangeRates';
import PriceCalculation from './pages/pricing/PriceCalculation.jsx';
import AccountingPricingManagement from './pages/pricing/AccountingPricingManagement.jsx';

// Reports Components
import InventoryReports from './pages/reports/InventoryReports';
import PricingReports from './pages/reports/PricingReports';
import PurchaseReports from './pages/reports/PurchaseReports';

// User Management
import UserManagement from './pages/users/UserManagement';

//blog Management
import BlogPosts from './pages/blog/BlogPosts.jsx';
import BlogTags from './pages/blog/BlogTags.jsx';
import BlogCategories from './pages/blog/BlogCategories.jsx';

// logistics Components and tracking
import LogisticsManagement from './pages/logistics/LogisticsManagement';
import TrackingManagement from './pages/logistics/TrackingManagement';

// Settings & Other
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const userData = getCurrentUser();

      if (token && isTokenValid() && userData && userData.role === 'ADMIN') {
        setIsAuthenticated(true);
      } else {
        clearAuthData();
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' && !e.newValue) {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-4 shadow-lg">
            <span className="text-2xl">☕</span>
          </div>
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading I-COFFEE.NG...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main App Component
const App = () => {
  return (
    <Router>
      <div className="">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<AdminLogin />} />
          <Route path="/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard - Accessible to all admin roles */}
            <Route index element={<DashboardOverview />} />
            <Route path="dashboard" element={<DashboardOverview />} />

            {/* Product Management Routes - All admin roles */}
            <Route path="products" element={<ProductManagement />} />
            <Route
              path="categories"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <CategoryManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="brands"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <BrandManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="colors"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <ColorManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="logistics"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'LOGISTICS']}
                >
                  <LogisticsManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="tracking"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'LOGISTICS']}
                >
                  <TrackingManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="sub-categories"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <SubCategoryManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="tags"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <TagManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="attributes"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <AttributeManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="coffee-roasted-areas"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'EDITOR']}
                >
                  <CoffeeRoastAreaManagement />
                </RoleProtectedRoute>
              }
            />

            {/* Procurement Routes - Specific roles */}
            <Route
              path="suppliers"
              element={
                <RoleProtectedRoute allowedSubRoles={['DIRECTOR', 'IT']}>
                  <SupplierManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="purchase-orders"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'MANAGER', 'WAREHOUSE']}
                >
                  <PurchaseOrderManagement />
                </RoleProtectedRoute>
              }
            />

            {/* Inventory Management Routes - Warehouse and management roles */}
            <Route
              path="stock"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER']}
                >
                  <StockManagement />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="stock-movements"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER']}
                >
                  <StockMovements />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="warehouse"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'WAREHOUSE', 'MANAGER']}
                >
                  <WarehouseManagement />
                </RoleProtectedRoute>
              }
            />

            {/* Pricing Management Routes - Financial roles */}
            <Route
              path="pricing"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER']}
                >
                  <PricingManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="pricing-lists"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'ACCOUNTANT', 'MANAGER']}
                >
                  <AccountingPricingManagement />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="pricing-config"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'ACCOUNTANT']}
                >
                  <PricingConfiguration />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="price-calculation"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'ACCOUNTANT']}
                >
                  <PriceCalculation />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="price-utilities"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'ACCOUNTANT']}
                >
                  <PricingUtilities />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="exchange-rates"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['IT', 'DIRECTOR', 'ACCOUNTANT']}
                >
                  <ExchangeRates />
                </RoleProtectedRoute>
              }
            />

            {/* Blog Management Routes - Editor, IT, Director roles */}
            <Route
              path="blog"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['EDITOR', 'IT', 'DIRECTOR']}
                >
                  <BlogPosts />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="blog/categories"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['EDITOR', 'IT', 'DIRECTOR']}
                >
                  <BlogCategories />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="blog/tags"
              element={
                <RoleProtectedRoute
                  allowedSubRoles={['EDITOR', 'IT', 'DIRECTOR']}
                >
                  <BlogTags />
                </RoleProtectedRoute>
              }
            />

            {/* Reports Routes - Most roles can view reports */}
            <Route path="reports">
              <Route
                path="inventory"
                element={
                  <RoleProtectedRoute
                    allowedSubRoles={[
                      'IT',
                      'DIRECTOR',
                      'WAREHOUSE',
                      'MANAGER',
                      'ACCOUNTANT',
                    ]}
                  >
                    <InventoryReports />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="pricing"
                element={
                  <RoleProtectedRoute
                    allowedSubRoles={[
                      'IT',
                      'DIRECTOR',
                      'ACCOUNTANT',
                      'MANAGER',
                    ]}
                  >
                    <PricingReports />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="purchase"
                element={
                  <RoleProtectedRoute
                    allowedSubRoles={[
                      'IT',
                      'DIRECTOR',
                      'WAREHOUSE',
                      'MANAGER',
                      'ACCOUNTANT',
                    ]}
                  >
                    <PurchaseReports />
                  </RoleProtectedRoute>
                }
              />
            </Route>

            {/* User Management - HR, IT, Director only */}
            <Route
              path="users"
              element={
                <RoleProtectedRoute allowedSubRoles={['IT', 'DIRECTOR', 'HR']}>
                  <UserManagement />
                </RoleProtectedRoute>
              }
            />

            {/* Settings - Accessible to all admin roles */}
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Redirect Routes */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route
            path="/dashboard"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
