import React, { useState, useEffect } from 'react';
import {
  Check,
  Clock,
  Truck,
  AlertCircle,
  X,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const StatusUpdateComponent = ({
  orderId,
  currentStatus,
  userRole,
  onStatusUpdate,
  orderData,
}) => {
  const [allowedStatuses, setAllowedStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Status configuration
  const statusConfig = {
    DRAFT: {
      color: 'bg-gray-100 text-gray-800',
      icon: <AlertCircle className="w-4 h-4" />,
      label: 'Draft',
      description: 'Order is being prepared',
    },
    PENDING: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Clock className="w-4 h-4" />,
      label: 'Pending Approval',
      description: 'Waiting for approval',
    },
    APPROVED: {
      color: 'bg-green-100 text-green-800',
      icon: <Check className="w-4 h-4" />,
      label: 'Approved',
      description: 'Order has been approved',
    },
    DELIVERED: {
      color: 'bg-blue-100 text-blue-800',
      icon: <Truck className="w-4 h-4" />,
      label: 'Delivered',
      description: 'Items have been delivered',
    },
    COMPLETED: {
      color: 'bg-purple-100 text-purple-800',
      icon: <Check className="w-4 h-4" />,
      label: 'Completed',
      description: 'Order process completed',
    },
    CANCELLED: {
      color: 'bg-red-100 text-red-800',
      icon: <X className="w-4 h-4" />,
      label: 'Cancelled',
      description: 'Order has been cancelled',
    },
  };

  // Fetch allowed status updates
  useEffect(() => {
    fetchAllowedStatuses();
    fetchStatusHistory();
  }, [orderId, userRole]);

  const fetchAllowedStatuses = async () => {
    try {
      const response = await fetch(
        `/api/purchase-orders/${orderId}/allowed-statuses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setAllowedStatuses(data.data.allowedStatuses || []);
      }
    } catch (error) {
      console.error('Error fetching allowed statuses:', error);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(
        `/api/purchase-orders/${orderId}/status-history`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setStatusHistory(data.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes,
          reason: selectedStatus === 'CANCELLED' ? reason : notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update parent component
        if (onStatusUpdate) {
          onStatusUpdate(data.data);
        }

        // Reset form
        setSelectedStatus('');
        setNotes('');
        setReason('');
        setShowUpdateForm(false);

        // Refresh data
        fetchAllowedStatuses();
        fetchStatusHistory();

        alert(`Order status updated to ${selectedStatus} successfully!`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      IT: 'IT Admin',
      DIRECTOR: 'Director',
      WAREHOUSE: 'Warehouse Staff',
      ACCOUNT: 'Accountant',
    };
    return roleNames[role] || role;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatusConfig = statusConfig[currentStatus] || statusConfig.DRAFT;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Current Status Display */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatusConfig.color}`}
          >
            {currentStatusConfig.icon}
            <span className="ml-2">{currentStatusConfig.label}</span>
          </div>
          <div className="text-sm text-gray-600">
            {currentStatusConfig.description}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>

          {allowedStatuses.length > 0 && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Update Status
            </button>
          )}
        </div>
      </div>

      {/* Status Update Form */}
      {showUpdateForm && (
        <div className="border-t pt-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Update Order Status</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select new status...</option>
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusConfig[status]?.label || status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Role
              </label>
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                <User className="w-4 h-4 inline mr-2" />
                {getRoleDisplayName(userRole)}
              </div>
            </div>
          </div>

          {selectedStatus === 'CANCELLED' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select reason...</option>
                <option value="Supplier unavailable">
                  Supplier unavailable
                </option>
                <option value="Budget constraints">Budget constraints</option>
                <option value="Requirements changed">
                  Requirements changed
                </option>
                <option value="Better alternative found">
                  Better alternative found
                </option>
                <option value="Project cancelled">Project cancelled</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes about this status change..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleStatusUpdate}
              disabled={
                !selectedStatus ||
                isUpdating ||
                (selectedStatus === 'CANCELLED' && !reason)
              }
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </button>

            <button
              onClick={() => {
                setShowUpdateForm(false);
                setSelectedStatus('');
                setNotes('');
                setReason('');
              }}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status History */}
      {showHistory && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Status History</h3>

          {statusHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">No status changes yet.</p>
          ) : (
            <div className="space-y-4">
              {statusHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md"
                >
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      statusConfig[entry.newStatus]?.color ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusConfig[entry.newStatus]?.icon}
                    <span className="ml-1">
                      {statusConfig[entry.newStatus]?.label || entry.newStatus}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium">
                        {entry.changedBy?.name || 'Unknown User'}
                      </span>
                      <span className="text-gray-500">
                        ({getRoleDisplayName(entry.userRole)})
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(entry.changedAt)}
                      </span>
                    </div>

                    {entry.previousStatus && (
                      <div className="text-xs text-gray-600 mt-1">
                        Changed from{' '}
                        {statusConfig[entry.previousStatus]?.label ||
                          entry.previousStatus}
                      </div>
                    )}

                    {(entry.notes || entry.reason) && (
                      <div className="text-xs text-gray-700 mt-2 bg-white p-2 rounded border-l-2 border-blue-200">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {entry.reason || entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Permissions Info */}
      {allowedStatuses.length === 0 && (
        <div className="border-t pt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-800">
                <strong>Limited Permissions:</strong> Your role (
                {getRoleDisplayName(userRole)}) cannot update this order from
                its current status ({currentStatusConfig.label}).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusUpdateComponent;
