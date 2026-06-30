//admin
// src/components/layout/Header.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  RefreshCw,
  CheckCheck,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { clearAuthData } from "../../utils/api";
import { useNotifications } from "../../contexts/NotificationContext";
// Phase 3
import AdminLanguageSwitcher from "../country/AdminLanguageSwitcher.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const NOTIFICATION_TYPE_COLORS = {
  ORDER: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  SHIPMENT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  TRACKING: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  USER_REGISTRATION:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  PASSWORD_RESET:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  PRODUCT: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  STOCK:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  PRICING:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  PURCHASE_ORDER:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  SUPPORT_TICKET: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  SYSTEM: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  ANNOUNCEMENT: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  FEATURE:
    "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const PRIORITY_DOT = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-blue-500",
  low: "bg-gray-400",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const Header = ({ currentUser, darkMode, onToggleDarkMode }) => {
  const { t } = useAdminTranslation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    loadMore,
    totalPages,
    page,
  } = useNotifications();

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) await markRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const getUserAvatar = (user) => {
    if (!user) return null;
    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name}
          className="h-8 w-8 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
        <span className="text-white font-medium text-sm">
          {user.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </span>
      </div>
    );
  };

  const handleLogout = () => {
    clearAuthData();
    navigate("/");
  };
  const isITorDirector = ["IT", "DIRECTOR"].includes(currentUser?.subRole);
  const handleProfileSettings = () => {
    setShowProfileDropdown(false);
    navigate("/admin/dashboard/profile");
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-end gap-6">
        <div className="flex items-center gap-4">
          {/* Phase 3: Language switcher */}
          <AdminLanguageSwitcher />

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) fetchNotifications(1);
              }}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchNotifications(1)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      title="Refresh"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                    </button>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        title="Mark all as read"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate("/admin/dashboard/notifications");
                        setShowNotifications(false);
                      }}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      title="View all"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {loading && notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          !n.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* type badge dot */}
                          <div
                            className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[n.priority] || PRIORITY_DOT.medium}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p
                                className={`text-sm font-medium truncate ${!n.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                              >
                                {n.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id);
                                }}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {n.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${NOTIFICATION_TYPE_COLORS[n.type] || NOTIFICATION_TYPE_COLORS.default}`}
                              >
                                {n.type?.replace("_", " ")}
                              </span>
                              <span className="text-xs text-gray-400">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                          </div>
                          {!n.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {page < totalPages && (
                    <button
                      onClick={loadMore}
                      className="w-full py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Load more
                    </button>
                  )}
                </div>

                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      navigate("/admin/dashboard/notifications");
                      setShowNotifications(false);
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {currentUser && getUserAvatar(currentUser)}
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentUser?.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentUser?.email}
                  </p>
                  <span className="inline-block px-2 py-1 mt-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                    {currentUser?.role} - {currentUser?.subRole}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleProfileSettings}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" /> Profile Settings
                  </button>
                  {isITorDirector && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        navigate("/admin/settings");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" /> System Settings
                    </button>
                  )}
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showProfileDropdown || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowProfileDropdown(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
