//admin
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { isTokenValid, getCurrentUser, clearAuthData } from "./utils/api.js";
import toast, { Toaster } from "react-hot-toast";

// Layout Component
import DashboardLayout from "./components/layout/DashboardLayout";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";

// Auth Components
import AdminLogin from "./pages/auth/AdminLogin";

// Dashboard Components
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ActivityLog from "./pages/activity/ActivityLog";

// Product Management Components
import ProductManagement from "./pages/products/ProductManagement";
import CategoryManagement from "./pages/products/CategoryManagement";
import BrandManagement from "./pages/products/BrandManagement";
import ColorManagement from "./pages/products/ColorManagement";
import SubCategoryManagement from "./pages/products/SubCategoryManagement.jsx";
import TagManagement from "./pages/products/TagManagement.jsx";
import AttributeManagement from "./pages/products/AttributeMangament.jsx";
import CoffeeRoastAreaManagement from "./pages/products/CoffeeRoastedArea.jsx";

// Procurement Components
import SupplierManagement from "./pages/suppliers/SupplierManagement";
import PurchaseOrderManagement from "./pages/purchase-order/PurchaseOrderManagement";

// Inventory Components
import StockManagement from "./pages/stock/StockManagement";
import StockMovements from "./pages/stock/StockMovements.jsx";
import WarehouseManagement from "./pages/stock/WarehouseManagement.jsx";

// Pricing Components
import PricingManagement from "./pages/pricing/PricingManagement";
import PricingConfiguration from "./pages/pricing/PricingConfiguration";
import PricingUtilities from "./pages/pricing/PricingUtilities.jsx";
import ExchangeRates from "./pages/pricing/ExchangeRates";
import PriceCalculation from "./pages/pricing/PriceCalculation.jsx";
import AccountingPricingManagement from "./pages/pricing/AccountingPricingManagement.jsx";
import DirectPricingManagement from "./pages/pricing/DirectPricingManagement.jsx";

// Reports Components
import InventoryReports from "./pages/reports/InventoryReports";
import InventoryReportsRouter from "./pages/reports/InventoryReportsRouter";
import PricingReports from "./pages/reports/PricingReports";
import PurchaseReports from "./pages/reports/PurchaseReports";
import SalesReports from "./pages/reports/SalesReports";
import StockAnalysis from "./pages/reports/StockAnalysis";

// User Management
import UserManagement from "./pages/users/UserManagement";

//blog Management
import BlogPosts from "./pages/blog/BlogPosts.jsx";
import BlogTags from "./pages/blog/BlogTags.jsx";
import BlogCategories from "./pages/blog/BlogCategories.jsx";

// logistics Components and tracking
import LogisticsManagement from "./pages/logistics/LogisticsManagement";
import TrackingManagement from "./pages/logistics/TrackingManagement";

// Settings & Other
import Settings from "./pages/settings/Settings";
import CountryManagement from "./pages/settings/CountryManagement";
import LanguageManagement from "./pages/settings/LanguageManagement";
import BankTransferSettings from "./pages/settings/BankTransferSettings";
import ForeignAdminManagement from "./pages/foreign-admins/ForeignAdminManagement";
import NotFound from "./pages/NotFound";

// Order Management
import OfflineOrderManagement from "./pages/order/OfflineOrderManagement.jsx";
import WebsiteOrderManagement from "./pages/order/WebsiteOrderManagement.jsx";

//customer Management
import CustomerManagement from "./pages/customer/CustomerManagement.jsx";

// Content Management
import SliderManagement from "./pages/content/SliderManagement.jsx";
import BannerManagement from "./pages/content/BannerManagement.jsx";
import HomeContentManagement from "./pages/content/HomeContentManagement.jsx";
import SitePagesManagement from "./pages/content/SitePagesManagement.jsx";
import FomoManagement from "./pages/content/FomoManagement.jsx";

// Product Requests
import ProductRequestManagement from "./pages/products/ProductRequestManagement.jsx";

import CrmManagement from "./pages/crm/CrmManagement";
import ContactMessages from "./pages/contact/ContactMessages";
import ProfilePage from "./pages/profile/ProfilePage";
import ScraperTool from "./pages/scraper/ScraperTool";
import { NotificationProvider } from "./contexts/NotificationContext";
import { CapabilitiesProvider } from "./contexts/CapabilitiesContext";
import NotificationManagement from "./pages/notifications/NotificationManagement";
import SupportTicketManagement from "./pages/support/SupportTicketManagement";
import PasswordVaultManagement from "./pages/passwords/PasswordVaultManagement";
import FinanceManagement from "./pages/finance/FinanceManagement.jsx";
import AnnouncementPopup from "./components/notifications/AnnouncementPopup";
import { useAdminTranslation } from "./hooks/useAdminTranslation.js";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { t } = useAdminTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userData = getCurrentUser();

      if (token && isTokenValid() && userData && userData.role === "ADMIN") {
        setIsAuthenticated(true);
      } else {
        clearAuthData();
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === "accessToken" && !e.newValue) {
        setIsAuthenticated(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full mb-4 shadow-lg">
            <span className="text-2xl">☕</span>
          </div>
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t("app.loading")}</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Main App Component
const App = () => {
  return (
    <NotificationProvider>
      <CapabilitiesProvider>
      <div>
        <Router>
          <div className="">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: "#363636", color: "#fff" },
                success: {
                  duration: 3000,
                  theme: { primary: "green", secondary: "black" },
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
                {/* Dashboard */}
                <Route index element={<DashboardOverview />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                {/* Activity Log — item #4: IT/DIRECTOR (global) + MANAGER
                    (country-scoped server-side). Previously unguarded on
                    the frontend entirely. */}
                <Route
                  path="activity"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR", "MANAGER"]}>
                      <ActivityLog />
                    </RoleProtectedRoute>
                  }
                />

                {/* Notifications, Support, Password Vault — nested inside /admin */}
                <Route
                  path="dashboard/notifications"
                  element={<NotificationManagement />}
                />
                <Route path="dashboard/profile" element={<ProfilePage />} />
                <Route
                  path="dashboard/support-tickets"
                  element={<SupportTicketManagement />}
                />
                <Route
                  path="dashboard/password-vault"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR"]}>
                      <PasswordVaultManagement />
                    </RoleProtectedRoute>
                  }
                />

                <Route
                  path="dashboard/finance"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["DIRECTOR"]}>
                      <FinanceManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Product Management Routes */}
                <Route path="products" element={<ProductManagement />} />
                <Route
                  path="categories"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <CategoryManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="brands"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <BrandManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="colors"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR"]}
                    >
                      <ColorManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="logistics"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "LOGISTICS",
                        "SALES_MANAGER",
                        "MANAGER",
                      ]}
                      blockForeign={true}
                    >
                      <LogisticsManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="tracking"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "LOGISTICS",
                        "SALES_MANAGER",
                        "MANAGER",
                      ]}
                      blockForeign={true}
                    >
                      <TrackingManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="sub-categories"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <SubCategoryManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="tags"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR"]}
                    >
                      <TagManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="attributes"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR"]}
                    >
                      <AttributeManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="coffee-roasted-areas"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR"]}
                    >
                      <CoffeeRoastAreaManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Procurement */}
                <Route
                  path="suppliers"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["DIRECTOR", "IT"]}>
                      <SupplierManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="purchase-orders"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "MANAGER",
                        "WAREHOUSE",
                      ]}
                    >
                      <PurchaseOrderManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Inventory */}
                <Route
                  path="stock"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "WAREHOUSE",
                        "MANAGER",
                        "HR",
                      ]}
                    >
                      <StockManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="stock-movements"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "WAREHOUSE",
                        "MANAGER",
                      ]}
                    >
                      <StockMovements />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="warehouse"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "WAREHOUSE",
                        "MANAGER",
                        "HR",
                      ]}
                    >
                      <WarehouseManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="offline-orders"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "SALES",
                        "SALES_MANAGER",
                        "MANAGER",
                        "HR",
                      ]}
                    >
                      <OfflineOrderManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="website-orders"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "SALES",
                        "SALES_MANAGER",
                        "MANAGER",
                        "HR",
                      ]}
                    >
                      <WebsiteOrderManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Customers */}
                <Route
                  path="customers"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "SALES",
                        "SALES_MANAGER",
                        "MANAGER",
                        "GRAPHICS",
                      ]}
                    >
                      <CustomerManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Pricing */}
                <Route
                  path="pricing"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "MANAGER",
                      ]}
                    >
                      <PricingManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="direct-pricing"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "EDITOR",
                        "MANAGER",
                      ]}
                    >
                      <DirectPricingManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="pricing-lists"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "MANAGER",
                      ]}
                    >
                      <AccountingPricingManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="pricing-config"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "MANAGER",
                      ]}
                    >
                      <PricingConfiguration />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="price-calculation"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "MANAGER",
                      ]}
                    >
                      <PriceCalculation />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="price-utilities"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "MANAGER",
                      ]}
                    >
                      <PricingUtilities />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="exchange-rates"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "IT",
                        "DIRECTOR",
                        "ACCOUNTANT",
                        "MANAGER",
                      ]}
                    >
                      <ExchangeRates />
                    </RoleProtectedRoute>
                  }
                />

                {/* Blog */}
                <Route
                  path="blog"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["EDITOR", "IT", "DIRECTOR", "MANAGER"]}
                    >
                      <BlogPosts />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="blog/categories"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["EDITOR", "IT", "DIRECTOR", "MANAGER"]}
                    >
                      <BlogCategories />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="blog/tags"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["EDITOR", "IT", "DIRECTOR", "MANAGER"]}
                    >
                      <BlogTags />
                    </RoleProtectedRoute>
                  }
                />

                {/* Reports */}
                <Route path="reports">
                  <Route
                    path="inventory"
                    element={
                      <RoleProtectedRoute
                        allowedSubRoles={[
                          "IT",
                          "DIRECTOR",
                          "WAREHOUSE",
                          "MANAGER",
                          "ACCOUNTANT",
                        ]}
                      >
                        <InventoryReportsRouter />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="pricing"
                    element={
                      <RoleProtectedRoute
                        allowedSubRoles={[
                          "IT",
                          "DIRECTOR",
                          "ACCOUNTANT",
                          "MANAGER",
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
                          "IT",
                          "DIRECTOR",
                          "WAREHOUSE",
                          "MANAGER",
                          "ACCOUNTANT",
                        ]}
                      >
                        <PurchaseReports />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="sales"
                    element={
                      <RoleProtectedRoute
                        allowedSubRoles={[
                          "IT",
                          "DIRECTOR",
                          "SALES",
                          "SALES_MANAGER",
                          "MANAGER",
                          "ACCOUNTANT",
                        ]}
                      >
                        <SalesReports />
                      </RoleProtectedRoute>
                    }
                  />
                  <Route
                    path="stock-analysis"
                    element={
                      <RoleProtectedRoute
                        allowedSubRoles={[
                          "IT",
                          "DIRECTOR",
                          "WAREHOUSE",
                          "MANAGER",
                        ]}
                      >
                        <StockAnalysis />
                      </RoleProtectedRoute>
                    }
                  />
                </Route>

                {/* Users */}
                <Route
                  path="users"
                  element={
                    // MANAGER (HQ or country-scoped) intentionally excluded — see #8.
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "HR"]}
                    >
                      <UserManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Foreign/country-scoped admin management — IT/DIRECTOR
                    only (self-gated inside the controller too — see
                    foreignAdmin.controller.js's ALLOWED_CREATORS/
                    ALLOWED_DELETERS). Was built (page + backend
                    controller) but never actually reachable: the route
                    file mounting its API was never wired into
                    server/index.js, and this page was never added to the
                    router — both fixed. */}
                <Route
                  path="foreign-admins"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR"]}>
                      <ForeignAdminManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Settings — IT and Director only */}
                <Route
                  path="settings"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR"]}>
                      <Settings />
                    </RoleProtectedRoute>
                  }
                />

                {/* PHASE 6: Country management — HQ IT/Director (countries.manage) */}
                <Route
                  path="countries"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR"]}>
                      <CountryManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Language lib — the platform's supported-language list
                    (translations.manage/.view holders: IT/DIRECTOR/MANAGER/
                    EDITOR — same audience as the rest of the content
                    translation system). hqOnly on the backend guard. */}
                <Route
                  path="languages"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR"]}>
                      <LanguageManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Country-scoped Direct Bank Transfer settings — HQ IT/Director only */}
                <Route
                  path="settings/bank-transfer"
                  element={
                    <RoleProtectedRoute allowedSubRoles={["IT", "DIRECTOR"]}>
                      <BankTransferSettings />
                    </RoleProtectedRoute>
                  }
                />

                {/* Content */}
                <Route
                  path="sliders"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <SliderManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="banners"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <BannerManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="home-content"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <HomeContentManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="site-pages"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR", "GRAPHICS"]}
                    >
                      <SitePagesManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="fomo"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={["IT", "DIRECTOR", "MANAGER", "EDITOR"]}
                    >
                      <FomoManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Product Requests */}
                <Route
                  path="product-requests"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "SALES",
                        "SALES_MANAGER",
                        "IT",
                        "DIRECTOR",
                      ]}
                    >
                      <ProductRequestManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* CRM Pipeline */}
                <Route
                  path="dashboard/crm"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "SALES",
                        "SALES_MANAGER",
                        "MANAGER",
                        "IT",
                        "EDITOR",
                        "DIRECTOR",
                      ]}
                    >
                      <CrmManagement />
                    </RoleProtectedRoute>
                  }
                />

                {/* Contact & Subscribers — item #1. Same subRoles that hold
                    the backend's contact.view permission (config/roles.js):
                    MANAGER/SALES_MANAGER/SALES, plus IT/DIRECTOR (wildcard). */}
                <Route
                  path="dashboard/contact-messages"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "SALES",
                        "SALES_MANAGER",
                        "MANAGER",
                        "IT",
                        "DIRECTOR",
                      ]}
                    >
                      <ContactMessages />
                    </RoleProtectedRoute>
                  }
                />

                {/* Web Scraper */}
                <Route
                  path="dashboard/scraper"
                  element={
                    <RoleProtectedRoute
                      allowedSubRoles={[
                        "SALES",
                        "SALES_MANAGER",
                        "MANAGER",
                        "IT",
                        "EDITOR",
                        "DIRECTOR",
                      ]}
                    >
                      <ScraperTool />
                    </RoleProtectedRoute>
                  }
                />

                {/* Phase 3: Country Admin Management */}
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
      </div>
      </CapabilitiesProvider>
    </NotificationProvider>
  );
};

export default App;
