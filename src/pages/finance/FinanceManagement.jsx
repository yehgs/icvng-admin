//admin
// src/pages/finance/FinanceManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Edit, Trash2,
  RefreshCw, Search, Filter, Upload, X, Eye, EyeOff,
  CreditCard, Building2, Wallet, ChevronDown, ChevronUp,
  PieChart, BarChart3, Calendar, Paperclip, Image, FileText,
  ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../../utils/api';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';
const FILE_UPLOAD = `${API_BASE}/file/upload`;

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  return res.json();
}

async function uploadFile(file) {
  const token = localStorage.getItem('accessToken');
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(FILE_UPLOAD, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  return res.json();
}

const CATEGORY_COLORS = [
  '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4',
  '#F97316','#84CC16','#EC4899','#14B8A6','#6366F1','#78716C',
];

const TYPE_GRADIENT = {
  income: 'from-emerald-500 to-teal-600',
  expense: 'from-red-500 to-rose-600',
};

const PAYMENT_ICONS = {
  'Cash': Wallet,
  'Bank Transfer': Building2,
  'POS / Debit Card': CreditCard,
  'Credit Card': CreditCard,
  'Mobile Money': DollarSign,
  default: DollarSign,
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatNGN(val) {
  if (!val && val !== 0) return '₦0';
  return `₦${Number(val).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCurrency(val, code, symbol) {
  if (!val && val !== 0) return `${symbol || ''}0`;
  return `${symbol || code || ''}${Number(val).toLocaleString()}`;
}

const EMPTY_FORM = {
  type: 'income', title: '', description: '', amount: '',
  currency: 'NGN', exchangeRateToNGN: 1, category: '',
  customCategory: '', paymentMethod: 'Cash', transactionDate: new Date().toISOString().split('T')[0],
  referenceNumber: '', tags: '', notes: '', isRecurring: false, recurringPeriod: null,
  bankDetails: { bankName: '', accountName: '', accountNumber: '', sortCode: '' },
  cardDetails: { cardType: 'Visa', cardholderName: '', last4Digits: '', expiryMonth: '', expiryYear: '', bankName: '', cardColor: '#3B82F6' },
};

export default function FinanceManagement() {
  const { t } = useAdminTranslation();
  const currentUser = getCurrentUser();
  const [meta, setMeta] = useState({ INCOME_CATEGORIES: [], EXPENSE_CATEGORIES: [], CURRENCIES: [], PAYMENT_METHODS: [] });
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ income: { totalNGN: 0, count: 0 }, expense: { totalNGN: 0, count: 0 }, netNGN: 0 });
  const [monthly, setMonthly] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeChart, setActiveChart] = useState('trend'); // trend | category | type

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);

  // Attachments for create form (pre-upload)
  const [pendingFiles, setPendingFiles] = useState([]);
  const fileInputRef = useRef();

  // Detail view
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchMeta = useCallback(async () => {
    const data = await apiFetch('/admin/finance/meta');
    if (data.success) setMeta(data.data);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filterType) params.set('type', filterType);
      if (filterCategory) params.set('category', filterCategory);
      if (filterCurrency) params.set('currency', filterCurrency);
      if (filterPayment) params.set('paymentMethod', filterPayment);
      if (search) params.set('search', search);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const data = await apiFetch(`/admin/finance?${params}`);
      if (data.success) {
        setEntries(data.data);
        setSummary(data.summary || { income: { totalNGN: 0, count: 0 }, expense: { totalNGN: 0, count: 0 }, netNGN: 0 });
        setMonthly(data.monthly || []);
        setCategoryBreakdown(data.categoryBreakdown || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, filterCurrency, filterPayment, search, startDate, endDate]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Auto-fetch exchange rate when currency changes
  const handleCurrencyChange = async (currency) => {
    setForm((f) => ({ ...f, currency }));
    if (currency === 'NGN') { setForm((f) => ({ ...f, exchangeRateToNGN: 1 })); return; }
    setLoadingRate(true);
    try {
      const data = await apiFetch(`/admin/finance/exchange-rate/${currency}`);
      if (data.success && data.rate) {
        setForm((f) => ({ ...f, exchangeRateToNGN: data.rate }));
        toast.success(`Rate loaded: 1 ${currency} = ₦${data.rate?.toLocaleString()}`);
      } else {
        toast('Rate not found — enter manually', { icon: '⚠️' });
      }
    } catch (e) { /* silent */ } finally {
      setLoadingRate(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount || !form.category) {
      toast.error('Title, amount and category are required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        bankDetails: showBankDetails ? form.bankDetails : null,
        cardDetails: showCardDetails ? form.cardDetails : null,
      };
      let data;
      if (editEntry) {
        data = await apiFetch(`/admin/finance/${editEntry._id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        data = await apiFetch('/admin/finance', { method: 'POST', body: JSON.stringify(payload) });
      }
      if (!data.success) { toast.error(data.message || 'Failed'); return; }

      // Upload pending attachments
      if (pendingFiles.length > 0 && data.data?._id) {
        for (const file of pendingFiles) {
          const uploadRes = await uploadFile(file);
          if (uploadRes.success) {
            const token = localStorage.getItem('accessToken');
            await fetch(`${API_BASE}/admin/finance/${data.data._id}/attachment`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: (() => { const fd = new FormData(); fd.append('image', file); return fd; })(),
            });
          }
        }
      }

      toast.success(editEntry ? 'Entry updated' : 'Entry created');
      setShowForm(false); setEditEntry(null); setForm(EMPTY_FORM); setPendingFiles([]);
      setShowBankDetails(false); setShowCardDetails(false);
      fetchEntries();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry?')) return;
    const data = await apiFetch(`/admin/finance/${id}`, { method: 'DELETE' });
    if (data.success) { toast.success('Entry removed'); fetchEntries(); }
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      type: entry.type, title: entry.title, description: entry.description || '',
      amount: entry.amount.toString(), currency: entry.currency,
      exchangeRateToNGN: entry.exchangeRateToNGN || 1, category: entry.category,
      customCategory: entry.customCategory || '', paymentMethod: entry.paymentMethod,
      transactionDate: entry.transactionDate ? entry.transactionDate.split('T')[0] : '',
      referenceNumber: entry.referenceNumber || '', tags: (entry.tags || []).join(', '),
      notes: entry.notes || '', isRecurring: entry.isRecurring || false,
      recurringPeriod: entry.recurringPeriod || null,
      bankDetails: entry.bankDetails || { bankName: '', accountName: '', accountNumber: '', sortCode: '' },
      cardDetails: entry.cardDetails || { cardType: 'Visa', cardholderName: '', last4Digits: '', expiryMonth: '', expiryYear: '', bankName: '', cardColor: '#3B82F6' },
    });
    setShowBankDetails(!!entry.bankDetails?.bankName);
    setShowCardDetails(!!entry.cardDetails?.last4Digits);
    setShowForm(true);
  };

  // Build monthly chart data
  const chartData = (() => {
    const map = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      map[key] = { month: MONTH_NAMES[d.getMonth()], income: 0, expense: 0 };
    }
    monthly.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (map[key]) map[key][m._id.type] = m.total;
    });
    return Object.values(map);
  })();

  const incomeCats = categoryBreakdown.filter((c) => c._id.type === 'income').slice(0, 8);
  const expenseCats = categoryBreakdown.filter((c) => c._id.type === 'expense').slice(0, 8);

  const currentCurrency = meta.CURRENCIES.find((c) => c.code === form.currency) || { symbol: '₦', code: 'NGN' };
  const categories = form.type === 'income' ? meta.INCOME_CATEGORIES : meta.EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" /> Finance Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Income & Expense Tracker — Director Access Only</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchEntries} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setEditEntry(null); setForm(EMPTY_FORM); setShowBankDetails(false); setShowCardDetails(false); setPendingFiles([]); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg"><ArrowUpCircle className="h-5 w-5" /></div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{summary.income.count} entries</span>
          </div>
          <p className="text-sm text-white/80">{t("finance.totalIncome")}</p>
          <p className="text-2xl font-bold mt-1">{formatNGN(summary.income.totalNGN)}</p>
        </div>
        {/* Expense */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg"><ArrowDownCircle className="h-5 w-5" /></div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{summary.expense.count} entries</span>
          </div>
          <p className="text-sm text-white/80">{t("finance.totalExpenses")}</p>
          <p className="text-2xl font-bold mt-1">{formatNGN(summary.expense.totalNGN)}</p>
        </div>
        {/* Net */}
        <div className={`bg-gradient-to-br ${summary.netNGN >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600'} rounded-xl p-5 text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Net</span>
          </div>
          <p className="text-sm text-white/80">{t("stats.netBalance")}</p>
          <p className="text-2xl font-bold mt-1">{formatNGN(Math.abs(summary.netNGN))}</p>
          <p className="text-xs text-white/70 mt-0.5">{summary.netNGN >= 0 ? 'Profit' : 'Deficit'}</p>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t("finance2.analytics")}</h3>
          <div className="flex gap-1">
            {['trend', 'category'].map((c) => (
              <button key={c} onClick={() => setActiveChart(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${activeChart === c ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {activeChart === 'trend' && (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `₦${(v/1000000).toFixed(1)}M` : v >= 1000 ? `₦${(v/1000).toFixed(0)}K` : `₦${v}`} />
              <Tooltip formatter={(v) => formatNGN(v)} />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#incomeGrad)" strokeWidth={2} name={t("finance2.income")} />
              <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} name={t("finance2.expense")} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'category' && (
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Income by Category', data: incomeCats, color: '#10B981' }, { label: 'Expense by Category', data: expenseCats, color: '#EF4444' }].map(({ label, data, color }) => (
              <div key={label}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPie>
                    <Pie data={data} dataKey="total" nameKey="_id.category" cx="50%" cy="50%" outerRadius={70} label={({ _id, percent }) => `${_id?.category?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {data.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatNGN(v)} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("notifications.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <option value="">{t("orders.allTypes")}</option>
            <option value="income">{t("finance2.income")}</option>
            <option value="expense">{t("finance2.expense")}</option>
          </select>
          <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <option value="">{t("pricing.allCurrencies")}</option>
            {meta.CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          {(filterType || filterCategory || filterCurrency || filterPayment || search || startDate || endDate) && (
            <button onClick={() => { setFilterType(''); setFilterCategory(''); setFilterCurrency(''); setFilterPayment(''); setSearch(''); setStartDate(''); setEndDate(''); }}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1">{t("common.clear")}</button>
          )}
        </div>
      </div>

      {/* ── Entry List ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{total} entries</span>
        </div>
        {loading && entries.length === 0 ? (
          <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No entries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {entries.map((entry) => {
              const currInfo = meta.CURRENCIES.find((c) => c.code === entry.currency) || { symbol: '₦' };
              const PayIcon = PAYMENT_ICONS[entry.paymentMethod] || PAYMENT_ICONS.default;
              const isIncome = entry.type === 'income';
              return (
                <div key={entry._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Type indicator */}
                    <div className={`w-2 self-stretch rounded-full flex-shrink-0 ${isIncome ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className={`p-2 rounded-xl flex-shrink-0 ${isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      {isIncome ? <ArrowUpCircle className={`h-5 w-5 ${isIncome ? 'text-emerald-600' : 'text-red-600'}`} /> : <ArrowDownCircle className="h-5 w-5 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{entry.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">{entry.category}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <PayIcon className="h-3 w-3" /> {entry.paymentMethod}
                            </span>
                            {entry.referenceNumber && <span className="text-xs text-gray-400">#{entry.referenceNumber}</span>}
                            {entry.attachments?.length > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-blue-400">
                                <Paperclip className="h-3 w-3" /> {entry.attachments.length}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(entry.transactionDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(entry.amount, entry.currency, currInfo.symbol)}
                          </p>
                          {entry.currency !== 'NGN' && (
                            <p className="text-xs text-gray-400">{formatNGN(entry.amountInNGN)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setSelectedEntry(entry)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(entry)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(entry._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className={`p-5 rounded-t-xl bg-gradient-to-r ${TYPE_GRADIENT[form.type]}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{editEntry ? 'Edit Entry' : 'Add Finance Entry'}</h2>
                <button onClick={() => { setShowForm(false); setEditEntry(null); }} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Type toggle */}
              <div className="flex gap-2 mt-3">
                {['income', 'expense'].map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, type: t, category: '' }))}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${form.type === t ? 'bg-white text-gray-800' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                    {t === 'income' ? '↑ Income' : '↓ Expense'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Monthly Salary Payment"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
              </div>

              {/* Amount + Currency */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("common.currency")}</label>
                  <select value={form.currency} onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {meta.CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currentCurrency.symbol}</span>
                    <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-8 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>
              </div>

              {/* Exchange rate (only if non-NGN) */}
              {form.currency !== 'NGN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exchange Rate to ₦ (1 {form.currency} = ?)
                    {loadingRate && <span className="ml-2 text-blue-500 text-xs">{t("common.loading")}</span>}
                  </label>
                  <input type="number" value={form.exchangeRateToNGN}
                    onChange={(e) => setForm((f) => ({ ...f, exchangeRateToNGN: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                  {form.amount && form.exchangeRateToNGN && (
                    <p className="text-xs text-gray-400 mt-1">= {formatNGN(parseFloat(form.amount) * form.exchangeRateToNGN)}</p>
                  )}
                </div>
              )}

              {/* Category + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <option value="">{t("finance2.selectCategory")}</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("finance.transactionDate")}</label>
                  <input type="date" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("finance2.paymentMethod")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {meta.PAYMENT_METHODS.map((m) => {
                    const Icon = PAYMENT_ICONS[m] || PAYMENT_ICONS.default;
                    return (
                      <button key={m} onClick={() => setForm((f) => ({ ...f, paymentMethod: m }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          form.paymentMethod === m
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}>
                        <Icon className="h-3.5 w-3.5" /> {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank details toggle */}
              <div>
                <button onClick={() => setShowBankDetails(!showBankDetails)}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <Building2 className="h-4 w-4" />
                  {showBankDetails ? 'Hide' : 'Add'} Bank Details
                  {showBankDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showBankDetails && (
                  <div className="mt-3 grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {['bankName', 'accountName', 'accountNumber', 'sortCode'].map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                        <input value={form.bankDetails[field] || ''} onChange={(e) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, [field]: e.target.value } }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card details toggle */}
              <div>
                <button onClick={() => setShowCardDetails(!showCardDetails)}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  <CreditCard className="h-4 w-4" />
                  {showCardDetails ? 'Hide' : 'Add'} Card Details
                  {showCardDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showCardDetails && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                    {/* Card visual preview */}
                    <div className="rounded-xl p-4 text-white text-xs font-mono shadow-lg" style={{ background: `linear-gradient(135deg, ${form.cardDetails.cardColor || '#3B82F6'}, ${form.cardDetails.cardColor || '#3B82F6'}99)` }}>
                      <p className="text-white/60 mb-2">{form.cardDetails.cardType || 'Card'}</p>
                      <p className="text-lg tracking-widest">•••• •••• •••• {form.cardDetails.last4Digits || '0000'}</p>
                      <div className="flex items-end justify-between mt-3">
                        <div><p className="text-white/60 text-xs">Cardholder</p><p>{form.cardDetails.cardholderName || '—'}</p></div>
                        <div><p className="text-white/60 text-xs">Expires</p><p>{form.cardDetails.expiryMonth || 'MM'}/{form.cardDetails.expiryYear || 'YY'}</p></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("passwords.cardType")}</label>
                        <select value={form.cardDetails.cardType} onChange={(e) => setForm((f) => ({ ...f, cardDetails: { ...f.cardDetails, cardType: e.target.value } }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {['Visa','Mastercard','Verve','Amex','Other'].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("passwords.cardColour")}</label>
                        <input type="color" value={form.cardDetails.cardColor || '#3B82F6'}
                          onChange={(e) => setForm((f) => ({ ...f, cardDetails: { ...f.cardDetails, cardColor: e.target.value } }))}
                          className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("passwords.cardholderName")}</label>
                        <input value={form.cardDetails.cardholderName || ''} onChange={(e) => setForm((f) => ({ ...f, cardDetails: { ...f.cardDetails, cardholderName: e.target.value } }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last 4 Digits</label>
                        <input value={form.cardDetails.last4Digits || ''} maxLength={4}
                          onChange={(e) => setForm((f) => ({ ...f, cardDetails: { ...f.cardDetails, last4Digits: e.target.value } }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expiry Month</label>
                        <input value={form.cardDetails.expiryMonth || ''} placeholder="MM" maxLength={2}
                          onChange={(e) => setForm((f) => ({ ...f, cardDetails: { ...f.cardDetails, expiryMonth: e.target.value } }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expiry Year</label>
                        <input value={form.cardDetails.expiryYear || ''} placeholder="YY" maxLength={2}
                          onChange={(e) => setForm((f) => ({ ...f, cardDetails: { ...f.cardDetails, expiryYear: e.target.value } }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description + Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("common.description")}</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("purchaseOrder.referenceNumber")}</label>
                  <input value={form.referenceNumber} onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                    placeholder="INV-001"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="q4, salary, online"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                    className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Recurring</span>
                </label>
                {form.isRecurring && (
                  <select value={form.recurringPeriod || ''} onChange={(e) => setForm((f) => ({ ...f, recurringPeriod: e.target.value || null }))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <option value="">{t("finance2.selectPeriod")}</option>
                    {['daily','weekly','monthly','quarterly','yearly'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments (receipts, invoices)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to upload images or PDFs</p>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*,application/pdf" className="hidden"
                  onChange={(e) => setPendingFiles((prev) => [...prev, ...Array.from(e.target.files)])} />
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                        {f.type.startsWith('image/') ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {f.name}
                        <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { setShowForm(false); setEditEntry(null); }} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{t("common.cancel")}</button>
              <button onClick={handleSave} disabled={saving}
                className={`px-6 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 bg-gradient-to-r ${TYPE_GRADIENT[form.type]} hover:opacity-90`}>
                {saving ? 'Saving...' : editEntry ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full overflow-y-auto shadow-2xl">
            <div className={`p-5 bg-gradient-to-r ${TYPE_GRADIENT[selectedEntry.type]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs uppercase">{selectedEntry.type}</p>
                  <h3 className="text-white font-bold text-lg">{selectedEntry.title}</h3>
                </div>
                <button onClick={() => setSelectedEntry(null)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-white text-2xl font-bold mt-2">
                {(() => { const c = meta.CURRENCIES.find((cc) => cc.code === selectedEntry.currency) || {}; return formatCurrency(selectedEntry.amount, selectedEntry.currency, c.symbol); })()}
              </p>
              {selectedEntry.currency !== 'NGN' && <p className="text-white/70 text-sm">{formatNGN(selectedEntry.amountInNGN)}</p>}
            </div>
            <div className="p-5 space-y-4">
              {[
                ['Category', selectedEntry.category],
                ['Payment Method', selectedEntry.paymentMethod],
                ['Date', new Date(selectedEntry.transactionDate).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                ['Reference', selectedEntry.referenceNumber || '—'],
                ['Currency', `${selectedEntry.currency} (Rate: ${selectedEntry.exchangeRateToNGN})`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 text-right max-w-xs">{val}</span>
                </div>
              ))}
              {selectedEntry.description && (
                <div><p className="text-xs text-gray-500 mb-1">{t("common.description")}</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedEntry.description}</p></div>
              )}
              {selectedEntry.notes && (
                <div><p className="text-xs text-gray-500 mb-1">{t("common.notes")}</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedEntry.notes}</p></div>
              )}
              {selectedEntry.bankDetails?.bankName && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t("passwords.bankDetails")}</p>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1 text-sm">
                    {Object.entries(selectedEntry.bankDetails).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-800 dark:text-gray-200 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedEntry.cardDetails?.last4Digits && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t("passwords.cardDetails")}</p>
                  <div className="rounded-xl p-4 text-white text-sm font-mono shadow-md" style={{ background: `linear-gradient(135deg, ${selectedEntry.cardDetails.cardColor || '#3B82F6'}, ${selectedEntry.cardDetails.cardColor || '#3B82F6'}99)` }}>
                    <p className="text-white/60 text-xs">{selectedEntry.cardDetails.cardType}</p>
                    <p className="text-lg tracking-widest mt-1">•••• •••• •••• {selectedEntry.cardDetails.last4Digits}</p>
                    <div className="flex justify-between mt-3 text-xs">
                      <span>{selectedEntry.cardDetails.cardholderName}</span>
                      <span>{selectedEntry.cardDetails.expiryMonth}/{selectedEntry.cardDetails.expiryYear}</span>
                    </div>
                  </div>
                </div>
              )}
              {selectedEntry.attachments?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t("support.attachments")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEntry.attachments.map((a, i) => (
                      a.type === 'image' ? (
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer">
                          <img src={a.url} alt={a.name} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        </a>
                      ) : (
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-blue-600 hover:underline">
                          <FileText className="h-4 w-4" /> {a.name}
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
