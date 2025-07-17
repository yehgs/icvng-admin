// admin
import React from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';

const UserFilters = ({
  searchTerm,
  onSearchChange,
  filterRole,
  onRoleChange,
  filterStatus,
  onStatusChange,
  sortBy,
  sortOrder,
  onSortChange,
}) => {
  const sortOptions = [
    {
      value: 'createdAt-desc',
      label: 'Newest First',
      field: 'createdAt',
      order: 'desc',
    },
    {
      value: 'createdAt-asc',
      label: 'Oldest First',
      field: 'createdAt',
      order: 'asc',
    },
    { value: 'name-asc', label: 'Name A-Z', field: 'name', order: 'asc' },
    { value: 'name-desc', label: 'Name Z-A', field: 'name', order: 'desc' },
    {
      value: 'last_login_date-desc',
      label: 'Recent Login',
      field: 'last_login_date',
      order: 'desc',
    },
    {
      value: 'last_login_date-asc',
      label: 'Oldest Login',
      field: 'last_login_date',
      order: 'asc',
    },
    { value: 'email-asc', label: 'Email A-Z', field: 'email', order: 'asc' },
    { value: 'email-desc', label: 'Email Z-A', field: 'email', order: 'desc' },
  ];

  const handleSortChange = (e) => {
    const selectedOption = sortOptions.find(
      (option) => option.value === e.target.value
    );
    if (selectedOption) {
      onSortChange(selectedOption.field, selectedOption.order);
    }
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onRoleChange('');
    onStatusChange('');
    onSortChange('createdAt', 'desc');
  };

  const hasActiveFilters =
    searchTerm ||
    filterRole ||
    filterStatus ||
    !(sortBy === 'createdAt' && sortOrder === 'desc');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 lg:max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Users
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 lg:flex-1">
          {/* Role Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-4 w-4 text-gray-400" />
                ) : (
                  <SortDesc className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-transparent mb-1">
                Clear
              </label>
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Active filters:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-md text-xs">
                Search: "{searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <span className="sr-only">Remove search filter</span>×
                </button>
              </span>
            )}

            {filterRole && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-md text-xs">
                Role: {filterRole}
                <button
                  onClick={() => onRoleChange('')}
                  className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <span className="sr-only">Remove role filter</span>×
                </button>
              </span>
            )}

            {filterStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-md text-xs">
                Status: {filterStatus}
                <button
                  onClick={() => onStatusChange('')}
                  className="ml-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-full p-0.5"
                >
                  <span className="sr-only">Remove status filter</span>×
                </button>
              </span>
            )}

            {!(sortBy === 'createdAt' && sortOrder === 'desc') && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-md text-xs">
                Sort:{' '}
                {
                  sortOptions.find(
                    (opt) => opt.field === sortBy && opt.order === sortOrder
                  )?.label
                }
                <button
                  onClick={() => onSortChange('createdAt', 'desc')}
                  className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <span className="sr-only">Reset sort</span>×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        <span>
          {hasActiveFilters ? 'Filtered results' : 'All users'} • Use the search
          and filters above to find specific users
        </span>
      </div>
    </div>
  );
};

export default UserFilters;
