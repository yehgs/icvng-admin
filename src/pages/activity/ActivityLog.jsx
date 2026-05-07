// admin/src/pages/activity/ActivityLog.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity, Download, RefreshCw, Search,
  User, Clock, ChevronDown, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle, XCircle,
} from 'lucide-react';
import { getCurrentUser, activityLogAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ADD:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CHANGE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  CANCEL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  LOGIN:  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const getActionColor = (action = '') => {
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return cls;
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

const StatusIcon = ({ status }) => {
  if (status === 'SUCCESS') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'FAILED')  return <XCircle className="w-4 h-4 text-red-500" />;
  return <AlertCircle className="w-4 h-4 text-yellow-500" />;
};

const formatAction = (action = '') =>
  action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (d) =>
  new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

const RESOURCE_TYPES = [
  'Product','Order','Customer','User','Stock','Batch',
  'ExchangeRate','Price','Logistics','Shipment','Category',
  'Brand','PurchaseOrder','Setting','Blog','Warehouse','Other',
];

export default function ActivityLog() {
  const currentUser = getCurrentUser();
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionTypes, setActionTypes] = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [expanded, setExpanded]       = useState(null);

  const [filters, setFilters] = useState({
    search: '', action: '', resourceType: '', status: '',
    dateFrom: '', dateTo: '', page: 1, limit: 50,
  });

  // Guard: only DIRECTOR and IT
  if (!['DIRECTOR', 'IT'].includes(currentUser?.subRole)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Access Restricted</h2>
          <p className="text-gray-500 mt-2">This page is only visible to Directors and IT administrators.</p>
        </div>
      </div>
    );
  }

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await activityLogAPI.getLogs(filters);
      if (data.success) {
        setLogs(data.data || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(data.message || 'Failed to fetch activity logs');
      }
    } catch (e) {
      console.error('Activity log fetch error:', e);
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchActionTypes = async () => {
    try {
      const data = await activityLogAPI.getActionTypes();
      if (data.success) setActionTypes(data.data || []);
    } catch (e) {
      console.error('Failed to fetch action types:', e);
    }
  };

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchActionTypes(); }, []);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const resetFilters = () =>
    setFilters({ search: '', action: '', resourceType: '', status: '', dateFrom: '', dateTo: '', page: 1, limit: 50 });

  const exportCSV = () => {
    const headers = ['Date', 'User', 'Role', 'Email', 'Action', 'Description', 'Resource', 'Resource Name', 'Status'];
    const rows = logs.map((l) => [
      formatDate(l.createdAt),
      l.user?.name || 'Unknown',
      l.user?.subRole || '',
      l.user?.email || '',
      l.action,
      l.description,
      l.resourceType,
      l.resourceName || '',
      l.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalCount.toLocaleString()} total records · Directors &amp; IT only
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={logs.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search description or resource..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <select value={filters.action} onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value="">All Actions</option>
            {actionTypes.map((a) => <option key={a} value={a}>{formatAction(a)}</option>)}
          </select>

          <select value={filters.resourceType} onChange={(e) => handleFilterChange('resourceType', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value="">All Resources</option>
            {RESOURCE_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PARTIAL">Partial</option>
          </select>

          <input type="date" value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input type="date" value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <select value={filters.limit} onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <button onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No activity logs found</p>
            <p className="text-sm mt-1">Logs are recorded as admins perform actions in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Description', 'Resource', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((log) => (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-xs">{log.user?.name || 'Unknown'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">{log.user?.subRole || log.user?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-gray-800 dark:text-gray-200 text-xs truncate" title={log.description}>
                          {log.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{log.resourceType}</span>
                          {log.resourceName && (
                            <span className="text-gray-500 dark:text-gray-400 block truncate max-w-[120px]" title={log.resourceName}>
                              {log.resourceName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <StatusIcon status={log.status} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{log.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(log.changes?.before || log.changes?.after || log.metadata?.ip) && (
                          <button
                            onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                            title="View details"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded === log._id ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expanded === log._id && (
                      <tr className="bg-indigo-50/40 dark:bg-indigo-900/10">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {log.metadata?.ip && (
                              <div>
                                <p className="font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide text-xs">Request Info</p>
                                <p className="text-gray-700 dark:text-gray-300">IP: {log.metadata.ip}</p>
                                <p className="text-gray-500 dark:text-gray-500 truncate mt-1" title={log.metadata.userAgent}>{log.metadata.userAgent}</p>
                              </div>
                            )}
                            {log.changes?.before && (
                              <div>
                                <p className="font-semibold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wide text-xs">Before</p>
                                <pre className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2 overflow-auto max-h-36 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                  {JSON.stringify(log.changes.before, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.changes?.after && (
                              <div>
                                <p className="font-semibold text-green-600 dark:text-green-400 mb-1 uppercase tracking-wide text-xs">After</p>
                                <pre className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2 overflow-auto max-h-36 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                  {JSON.stringify(log.changes.after, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {filters.page} of {totalPages} · {totalCount.toLocaleString()} records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={filters.page <= 1}
                className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = Math.max(1, Math.min(filters.page - 2, totalPages - 4)) + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p}
                    onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                    className={`w-8 h-8 text-sm rounded border ${p === filters.page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'
                    }`}>
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setFilters((p) => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                disabled={filters.page >= totalPages}
                className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
