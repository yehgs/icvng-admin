// admin/src/pages/products/ProductRequestManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  MessageSquare,
  ChevronDown,
  Filter,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall, getCurrentUser, handleApiError } from '../../utils/api';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: RefreshCw },
  COMPLETED:  { label: 'Completed',  color: 'bg-green-100 text-green-800 border-green-200',     icon: CheckCircle },
  REJECTED:   { label: 'Rejected',   color: 'bg-red-100 text-red-800 border-red-200',           icon: XCircle },
};

const ProductRequestManagement = () => {
  const { t } = useAdminTranslation();
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]         = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [adminNotes, setAdminNotes]     = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const currentUser = getCurrentUser();
  const subRole = currentUser?.subRole || currentUser?.role || '';
  const canManage = ['SALES', 'IT', 'DIRECTOR'].includes(subRole);

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/product-request/all');
      if (res.success) setRequests(res.data || []);
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to load product requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    if (!canManage) {
      toast.error('You do not have permission to update requests.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiCall('/product-request/update-status', {
        method: 'PUT',
        body: { requestId, status: newStatus, adminNotes },
      });
      if (res.success) {
        toast.success(`Request marked as ${newStatus.toLowerCase()}`);
        setShowModal(false);
        setSelected(null);
        setAdminNotes('');
        fetchRequests();
      } else {
        toast.error(res.message || 'Update failed');
      }
    } catch (err) {
      toast.error(handleApiError(err, 'Failed to update request'));
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (req) => {
    setSelected(req);
    setAdminNotes(req.adminNotes || '');
    setShowModal(true);
  };

  const filtered = requests.filter((r) => {
    const matchSearch =
      !searchTerm ||
      r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      requests.length,
    pending:    requests.filter((r) => r.status === 'PENDING').length,
    processing: requests.filter((r) => r.status === 'PROCESSING').length,
    completed:  requests.filter((r) => r.status === 'COMPLETED').length,
    rejected:   requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-600" />
            Product Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customer requests for unavailable products
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',      value: stats.total,      color: 'bg-gray-50  border-gray-200',   text: 'text-gray-700'  },
          { label: 'Pending',    value: stats.pending,    color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700'},
          { label: 'Processing', value: stats.processing, color: 'bg-blue-50  border-blue-200',    text: 'text-blue-700'  },
          { label: 'Completed',  value: stats.completed,  color: 'bg-green-50 border-green-200',   text: 'text-green-700' },
          { label: 'Rejected',   value: stats.rejected,   color: 'bg-red-50   border-red-200',     text: 'text-red-700'   },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-lg border ${s.color}`}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className={`text-xs font-medium ${s.text} mt-1`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("scraper.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm appearance-none bg-white dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("orders.allStatuses")}</option>
            {Object.keys(STATUS_CONFIG).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-500">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Inbox className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  {['Customer', 'Product', 'Qty', 'Message', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((req) => {
                  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-xs">
                              {req.user?.name || 'Unknown'}
                            </p>
                            <p className="text-gray-400 text-xs">{req.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {req.product?.image?.[0] ? (
                            <img src={req.product.image[0]} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-900 dark:text-white text-xs max-w-[140px] truncate">
                            {req.product?.name || 'Unknown Product'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                        {req.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-600 dark:text-gray-400 text-xs max-w-[160px] truncate" title={req.message}>
                          {req.message || <span className="italic text-gray-400">No message</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal(req)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                        >
                          <Eye className="w-3 h-3" />
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Action Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("support.requestDetails")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Product */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {selected.product?.image?.[0] ? (
                  <img src={selected.product.image[0]} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selected.product?.name}</p>
                  <p className="text-sm text-gray-500">Qty requested: <strong>{selected.quantity}</strong></p>
                </div>
              </div>

              {/* Customer */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.user?.name}</p>
                  <p className="text-xs text-gray-500">{selected.user?.email}</p>
                  {selected.user?.mobile && <p className="text-xs text-gray-500">{selected.user.mobile}</p>}
                </div>
              </div>

              {/* Customer message */}
              {selected.message && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex-1">
                    {selected.message}
                  </p>
                </div>
              )}

              {/* Current status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Current status:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[selected.status]?.color}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>

              {/* Admin notes */}
              {canManage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Notes <span className="text-gray-400 font-normal">(optional — sent to customer)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="E.g. We'll have stock in 2 weeks, we'll contact you…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            {canManage && (
              <div className="flex flex-wrap gap-2 p-5 pt-0">
                {selected.status !== 'PROCESSING' && (
                  <button
                    onClick={() => handleUpdateStatus(selected._id, 'PROCESSING')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Mark Processing
                  </button>
                )}
                {selected.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleUpdateStatus(selected._id, 'COMPLETED')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Completed
                  </button>
                )}
                {selected.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleUpdateStatus(selected._id, 'REJECTED')}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="ml-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRequestManagement;
