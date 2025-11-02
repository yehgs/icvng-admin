// src/components/customer/CustomerDetailsModal.jsx
import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Calendar,
  ShoppingCart,
  DollarSign,
  Globe,
  Users as UsersIcon,
  Star,
} from 'lucide-react';

const CustomerDetailsModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customer Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex-shrink-0 relative">
              {customer.image ? (
                <>
                  <img
                    src={customer.image}
                    alt={customer.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  {customer.isFeatured && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                  )}
                </>
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  {customer.customerType === 'BTB' ? (
                    <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {customer.displayName || customer.name}
                </h4>
                {customer.isFeatured && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.customerType === 'BTB'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}
                >
                  {customer.customerType}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.customerMode === 'ONLINE'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {customer.customerMode}
                </span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : customer.status === 'INACTIVE'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {customer.email}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900 dark:text-white">
                  {customer.mobile}
                </span>
              </div>
              {customer.address &&
                (customer.address.street ||
                  customer.address.city ||
                  customer.address.state ||
                  customer.address.lga) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-gray-900 dark:text-white">
                      {[
                        customer.address.street,
                        customer.address.city,
                        customer.address.lga,
                        customer.address.state,
                        customer.address.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Business Information (BTB only) */}
          {customer.customerType === 'BTB' && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Business Information
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Company:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {customer.companyName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    CAC Registration:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {customer.registrationNumber}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Order Statistics */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Order Statistics
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Orders
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {customer.totalOrders || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Total Value
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₦{(customer.totalOrderValue || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {customer.lastOrderDate && (
              <div className="flex items-center gap-2 text-sm mt-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Last order:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(customer.lastOrderDate)}
                </span>
              </div>
            )}
          </div>

          {/* Management Information */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Management Information
            </h5>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Created by:
                  </span>
                  <span className="text-gray-900 dark:text-white ml-2 font-medium">
                    {customer.isWebsiteCustomer
                      ? 'Website'
                      : customer.createdBy?.name || 'Unknown'}
                  </span>
                  {!customer.isWebsiteCustomer && customer.createdBy?.subRole && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      ({customer.createdBy.subRole})
                    </span>
                  )}
                </div>
              </div>
              {customer.assignedTo && customer.assignedTo.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <UsersIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Assigned to:
                    </span>
                    <div className="mt-1 space-y-1">
                      {customer.assignedTo.map((user) => (
                        <div
                          key={user._id}
                          className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs mr-1"
                        >
                          {user.name}
                          {user.subRole && (
                            <span className="ml-1 text-gray-500 dark:text-gray-400">
                              ({user.subRole})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Created:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Notes
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {customer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;