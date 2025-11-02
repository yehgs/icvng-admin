// src/pages/customer/CustomerManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { customerAPI, getCurrentUser } from '../../utils/api';
import toast from 'react-hot-toast';

import CustomerFilters from '../../components/customer/CustomerFilters';
import CustomerTable from '../../components/customer/CustomerTable';
import CustomerModal from '../../components/customer/CustomerModal';
import CustomerDetailsModal from '../../components/customer/CustomerDetailsModal';
import AssignCustomerModal from '../../components/customer/AssignCustomerModal';
import Pagination from '../../components/common/Pagination';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    searchTerm: '',
    filterType: '',
    filterMode: '',
    filterStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const currentUser = getCurrentUser();

  // Check permissions
  const canCreate = ['DIRECTOR', 'IT', 'EDITOR', 'MANAGER', 'SALES'].includes(
    currentUser?.subRole
  );
  const canExport = ['DIRECTOR', 'IT'].includes(currentUser?.subRole);
  const canAssign = ['DIRECTOR', 'IT', 'MANAGER'].includes(
    currentUser?.subRole
  );

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: customersPerPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.filterType && { customerType: filters.filterType }),
        ...(filters.filterMode && { customerMode: filters.filterMode }),
        ...(filters.filterStatus && { status: filters.filterStatus }),
      };

      const response = await customerAPI.getCustomers(params);

      if (response.success) {
        setCustomers(response.data.docs || []);
        setTotalCustomers(response.data.totalDocs || 0);
      } else {
        throw new Error(response.message || 'Failed to load customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      const errorMessage = error.message || 'Failed to load customers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, customersPerPage, filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchCustomers();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  // Export customers
  const handleExportCustomers = async () => {
    if (!canExport) {
      toast.error('Only directors and IT can export customer data');
      return;
    }

    try {
      setLoading(true);
      const response = await customerAPI.exportCustomers();

      if (response.success) {
        // Convert to CSV and download
        const csvContent = response.data
          .map((row) =>
            Object.values(row)
              .map((field) => `"${field}"`)
              .join(',')
          )
          .join('\n');

        const headers = Object.keys(response.data[0]).join(',');
        const csv = `${headers}\n${csvContent}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('Customer data exported successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to export customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleAssign = (customer) => {
    setSelectedCustomer(customer);
    setShowAssignModal(true);
  };

  const handleToggleFeatured = async (customer) => {
    // Validation: Check if customer has an image
    if (!customer.image || customer.image === '') {
      toast.error('Only customers with images can be featured');
      return;
    }

    try {
      setLoading(true);
      const response = await customerAPI.toggleFeaturedCustomer(customer._id);

      if (response.success) {
        toast.success(
          customer.isFeatured
            ? 'Customer removed from featured'
            : 'Customer added to featured'
        );
        fetchCustomers();
      } else {
        toast.error(response.message || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Toggle featured error:', error);
      toast.error(error.message || 'Failed to update featured status');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowAssignModal(false);
    setSelectedCustomer(null);
  };

  const handleSuccess = () => {
    handleModalClose();
    fetchCustomers();
  };

  const totalPages = Math.ceil(totalCustomers / customersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customer Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage customer accounts ({totalCustomers} total customers)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchCustomers()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {canExport && (
            <button
              onClick={handleExportCustomers}
              disabled={loading || customers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <CustomerFilters filters={filters} setFilters={setFilters} />

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Loading customers...
            </p>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No customers found
            </p>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Customer
              </button>
            )}
          </div>
        ) : (
          <>
            <CustomerTable
              customers={customers}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onAssign={canAssign ? handleAssign : null}
              onToggleFeatured={handleToggleFeatured}
              currentUser={currentUser}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCustomers}
                itemsPerPage={customersPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CustomerModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          customer={null}
        />
      )}

      {showEditModal && (
        <CustomerModal
          isOpen={showEditModal}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          customer={selectedCustomer}
        />
      )}

      {showDetailsModal && (
        <CustomerDetailsModal
          isOpen={showDetailsModal}
          onClose={handleModalClose}
          customer={selectedCustomer}
        />
      )}

      {showAssignModal && (
        <AssignCustomerModal
          isOpen={showAssignModal}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          customer={selectedCustomer}
        />
      )}

      {/* Loading Overlay */}
      {loading && customers.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-900 dark:text-white">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;