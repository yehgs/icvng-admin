//admin
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import { getCurrentUser } from '../../utils/api';
import useMediaQuery from '../../hooks/useMediaQuery';

const DashboardLayout = () => {
  // Desktop: sidebar is always visible and can be collapsed to an icon rail.
  // Mobile/tablet (< lg): sidebar becomes an off-canvas drawer opened from the
  // header's hamburger button, so there is no "collapsed" state on mobile.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [currentUser] = useState(() => getCurrentUser());

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close the drawer on any route change (covers links that don't go through
  // handleNavigate, e.g. notification links or the profile menu).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // If the viewport grows to desktop while the drawer is open, reset it.
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // While the drawer is open: lock background scroll and allow Escape to close.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  // One handler for every "toggle the sidebar" button: opens/closes the
  // drawer on mobile, collapses/expands the rail on desktop.
  const toggleSidebar = () => {
    if (isDesktop) {
      setSidebarCollapsed((c) => !c);
    } else {
      setMobileOpen((o) => !o);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors ${
        darkMode ? 'dark' : ''
      }`}
    >
      {/* Mobile backdrop — tap to close the drawer */}
      <div
        onClick={closeMobile}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <AdminSidebar
        userRole={currentUser?.role}
        userSubRole={currentUser?.subRole}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        isCollapsed={isDesktop && sidebarCollapsed}
        isMobile={!isDesktop}
        isMobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onCloseMobile={closeMobile}
      />

      {/* Main Content Area.
          min-w-0 stops wide children (tables, charts) from stretching the
          page past the viewport; the margin only applies at lg+ because
          below that the sidebar is an overlay, not a column. */}
      <div
        className={`min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Header */}
        <Header
          currentUser={currentUser}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
        />

        {/* Page Content */}
        <main className="min-w-0 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
