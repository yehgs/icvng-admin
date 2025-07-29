//admin example of my admin app structure
// pages/Users/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  RefreshCw,
  Filter,
  Download,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { userAPI, getCurrentUser } from '../../utils/api';
import UserTable from '../../components/users/UserTable';
import CreateUserModal from '../../components/users/CreateUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import UserDetailsModal from '../../components/users/UserDetailsModal';
import UserFilters from '../../components/users/UserFilters';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const currentUser = getCurrentUser();

  // Fetch users with filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: usersPerPage,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole && { role: filterRole }),
        ...(filterStatus && { status: filterStatus }),
      };

      const response = await userAPI.getUsers(params);

      if (response.success) {
        setUsers(response.data.docs || []);
        setTotalUsers(response.data.totalDocs || 0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    usersPerPage,
    sortBy,
    sortOrder,
    searchTerm,
    filterRole,
    filterStatus,
  ]);

  // Create new user
  const handleCreateUser = async (userData) => {
    try {
      setLoading(true);
      const response = await userAPI.createUser(userData);

      if (response.success) {
        setShowCreateUser(false);
        fetchUsers(); // Refresh users list
        return { success: true, message: 'User created successfully!' };
      }
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error.message || 'Failed to create user',
      };
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const handleEditUser = async (userData) => {
    try {
      setLoading(true);
      const response = await userAPI.updateUser(selectedUser._id, userData);

      if (response.success) {
        setShowEditUser(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh users list
        return { success: true, message: 'User updated successfully!' };
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        message: error.message || 'Failed to update user',
      };
    } finally {
      setLoading(false);
    }
  };

  // Delete/Deactivate user
  const handleDeleteUser = async (userId) => {
    if (!canDeleteUser()) {
      toast.error('You do not have permission to delete users');
      return;
    }

    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        setLoading(true);
        const response = await userAPI.deleteUser(userId);

        if (response.success) {
          fetchUsers(); // Refresh users list
          toast.success('User deactivated successfully!');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(`Error: ${error.message || 'Failed to deactivate user'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Reset user password
  const handleResetPassword = async (userId) => {
    if (!canResetPassword()) {
      toast.error('You do not have permission to reset passwords');
      return;
    }

    const newPassword = prompt('Enter new temporary password:');
    if (!newPassword) return;

    try {
      setLoading(true);
      const response = await userAPI.resetPassword(userId, newPassword);

      if (response.success) {
        toast.success('Password reset successfully!');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(`Error: ${error.message || 'Failed to reset password'}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate password recovery
  const handleGenerateRecovery = async (userId) => {
    if (!canResetPassword()) {
      toast.error('You do not have permission to generate recovery links');
      return;
    }

    try {
      setLoading(true);
      const response = await userAPI.generateRecovery(userId);

      if (response.success) {
        toast.success('Recovery link generated successfully!');
      }
    } catch (error) {
      console.error('Error generating recovery:', error);
      toast.error(
        `Error: ${error.message || 'Failed to generate recovery link'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Permission checks
  const canCreateUser = (targetRole, targetSubRole) => {
    if (!currentUser) return false;
    const { subRole } = currentUser;

    if (['IT', 'DIRECTOR'].includes(subRole)) return true;
    if (
      subRole === 'HR' &&
      !(targetRole === 'ADMIN' && targetSubRole === 'DIRECTOR')
    )
      return true;
    if (targetRole === 'USER') return true;

    return false;
  };

  const canResetPassword = () => {
    return (
      currentUser && ['IT', 'DIRECTOR', 'HR'].includes(currentUser.subRole)
    );
  };

  const canDeleteUser = () => {
    return currentUser && ['IT', 'DIRECTOR'].includes(currentUser.subRole);
  };

  // Modal handlers
  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditUser(true);
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const closeModals = () => {
    setShowCreateUser(false);
    setShowEditUser(false);
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  // Export users data
  const handleExportUsers = () => {
    // Implement CSV export
    const csvContent = users
      .map(
        (user) =>
          `${user.name},${user.email},${user.role},${user.subRole},${user.status}`
      )
      .join('\n');

    const blob = new Blob([`Name,Email,Role,SubRole,Status\n${csvContent}`], {
      type: 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filterRole, filterStatus]);

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage staff and customer accounts ({totalUsers} total users)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportUsers}
            disabled={loading || users.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button
            onClick={() => setShowCreateUser(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add New User
          </button>
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
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
      />

      {/* Users Table */}
      <UserTable
        users={users}
        loading={loading}
        currentPage={currentPage}
        usersPerPage={usersPerPage}
        totalUsers={totalUsers}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onEditUser={openEditModal}
        onViewUser={openUserDetails}
        onDeleteUser={handleDeleteUser}
        onResetPassword={handleResetPassword}
        onGenerateRecovery={handleGenerateRecovery}
        canResetPassword={canResetPassword()}
        canDeleteUser={canDeleteUser()}
      />

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal
          isOpen={showCreateUser}
          onClose={closeModals}
          onSubmit={handleCreateUser}
          canCreateUser={canCreateUser}
          loading={loading}
        />
      )}

      {showEditUser && selectedUser && (
        <EditUserModal
          isOpen={showEditUser}
          onClose={closeModals}
          onSubmit={handleEditUser}
          user={selectedUser}
          canCreateUser={canCreateUser}
          loading={loading}
        />
      )}

      {showUserDetails && selectedUser && (
        <UserDetailsModal
          isOpen={showUserDetails}
          onClose={closeModals}
          user={selectedUser}
          onEdit={() => {
            setShowUserDetails(false);
            openEditModal(selectedUser);
          }}
          onResetPassword={() => {
            setShowUserDetails(false);
            handleResetPassword(selectedUser._id);
          }}
          onGenerateRecovery={() => {
            setShowUserDetails(false);
            handleGenerateRecovery(selectedUser._id);
          }}
          onDelete={() => {
            setShowUserDetails(false);
            handleDeleteUser(selectedUser._id);
          }}
          canResetPassword={canResetPassword()}
          canDeleteUser={canDeleteUser()}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
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

export default UserManagement;
