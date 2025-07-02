import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/api';
import { AlertCircle } from 'lucide-react';

const RoleProtectedRoute = ({
  children,
  allowedSubRoles = [],
  fallbackPath = '/admin/dashboard',
}) => {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // If no specific roles are required, allow access
  if (allowedSubRoles.length === 0) {
    return children;
  }

  // Check if user's subRole is in the allowed list
  if (!allowedSubRoles.includes(currentUser.subRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page. Your current role (
            {currentUser.subRole}) is not authorized for this section.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleProtectedRoute;
