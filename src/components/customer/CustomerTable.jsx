// src/components/customer/CustomerTable.jsx
import React from 'react';
import {
  Building2,
  User,
  Globe,
  Smartphone,
  Eye,
  Edit,
  UserPlus,
  Star,
} from 'lucide-react';

const CustomerTable = ({
  customers,
  onViewDetails,
  onEdit,
  onAssign,
  onToggleFeatured,
  currentUser,
}) => {
  const canEdit = (customer) => {
    const allowedRoles = ['DIRECTOR', 'IT', 'MANAGER'];
    if (allowedRoles.includes(currentUser?.subRole)) {
      return true;
    }
    // Can edit if they created it or are assigned to it
    return (
      customer.createdBy?._id === currentUser?._id ||
      customer.assignedTo?.some((user) => user._id === currentUser?._id)
    );
  };

  const canFeature = () => {
    return ['EDITOR', 'IT', 'DIRECTOR'].includes(currentUser?.subRole);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type & Mode
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Orders
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {customers.map((customer) => (
            <tr
              key={customer._id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 relative">
                    {customer.image ? (
                      <img
                        src={customer.image}
                        alt={customer.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        {customer.customerType === 'BTB' ? (
                          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    )}
                    {customer.isFeatured && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                        <Star className="h-3 w-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {customer.displayName || customer.name}
                      {customer.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.email}
                    </div>
                    {customer.customerType === 'BTB' &&
                      customer.registrationNumber && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          CAC: {customer.registrationNumber}
                        </div>
                      )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.customerType === 'BTB'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {customer.customerType === 'BTB' ? (
                      <Building2 className="h-3 w-3 mr-1" />
                    ) : (
                      <User className="h-3 w-3 mr-1" />
                    )}
                    {customer.customerType}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.customerMode === 'ONLINE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {customer.customerMode}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white flex items-center">
                  <Smartphone className="h-4 w-4 mr-1 text-gray-400" />
                  {customer.mobile}
                </div>
                {customer.address?.city && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {customer.address.city}, {customer.address.state}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {customer.totalOrders || 0} orders
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ₦{(customer.totalOrderValue || 0).toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {customer.isWebsiteCustomer
                    ? 'Website'
                    : customer.createdBy?.name || 'Unknown'}
                </div>
                {customer.assignedTo && customer.assignedTo.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Assigned: {customer.assignedTo.length} user
                    {customer.assignedTo.length > 1 ? 's' : ''}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    customer.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : customer.status === 'INACTIVE'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {customer.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetails(customer)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {canEdit(customer) && (
                    <button
                      onClick={() => onEdit(customer)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                      title="Edit customer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {onAssign && (
                    <button
                      onClick={() => onAssign(customer)}
                      className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                      title="Assign customer"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  )}
                  {canFeature() && customer.image && (
                    <button
                      onClick={() => onToggleFeatured(customer)}
                      className={`transition-colors ${
                        customer.isFeatured
                          ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
                          : 'text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400'
                      }`}
                      title={
                        customer.isFeatured
                          ? 'Remove from featured'
                          : 'Add to featured'
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          customer.isFeatured ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
 
export default CustomerTable;