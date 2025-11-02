// src/components/customer/AssignCustomerModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, Loader2, Check } from 'lucide-react';
import { customerAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const AssignCustomerModal = ({ isOpen, onClose, onSuccess, customer }) => {
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssignableUsers();
      if (customer && customer.assignedTo) {
        setSelectedUserIds(customer.assignedTo.map((user) => user._id));
      }
    }
  }, [isOpen, customer]);

  const fetchAssignableUsers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAssignableUsers();
      if (response.success) {
        setAssignableUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      setSubmitting(true);
      const response = await customerAPI.assignCustomer(customer._id, {
        userIds: selectedUserIds,
      });

      if (response.success) {
        toast.success('Customer assigned successfully');
        onSuccess();
      } else {
        toast.error(response.message || 'Failed to assign customer');
      }
    } catch (error) {
      console.error('Assign error:', error);
      toast.error(error.message || 'Failed to assign customer');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Assign Customer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {customer?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assignableUsers.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No users available for assignment
                </p>
              ) : (
                assignableUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => handleToggleUser(user._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {user.subRole}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''}{' '}
              selected
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedUserIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Assign
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCustomerModal;