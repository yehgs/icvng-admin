// admin/src/components/product/ProductExportModal.jsx
import React, { useState } from 'react';
import {
  X, Download, FileSpreadsheet, FileText, Info,
  Loader2, CheckCircle, ChevronDown, ChevronUp, Filter
} from 'lucide-react';

// All available columns with labels and grouping
const ALL_COLUMNS = [
  { key: 'name',              label: 'Product Name',        group: 'Core',     always: true },
  { key: 'sku',               label: 'SKU',                 group: 'Core',     always: true },
  { key: 'category',          label: 'Category',            group: 'Core',     always: false },
  { key: 'subCategory',       label: 'Sub Category',        group: 'Core',     always: false },
  { key: 'brand',             label: 'Brand(s)',            group: 'Core',     always: false },
  { key: 'compatibleSystem',  label: 'Compatible System',   group: 'Core',     always: false },
  { key: 'producer',          label: 'Producer',            group: 'Core',     always: false },
  { key: 'productType',       label: 'Product Type',        group: 'Core',     always: false },
  { key: 'publish',           label: 'Publish Status',      group: 'Core',     always: false },
  { key: 'featured',          label: 'Featured',            group: 'Core',     always: false },
  { key: 'visibleInShop',     label: 'Visible in Shop',     group: 'Core',     always: false },
  { key: 'btbPrice',          label: 'BTB Price (₦)',       group: 'Pricing',  always: false },
  { key: 'btcPrice',          label: 'BTC Price (₦)',       group: 'Pricing',  always: false },
  { key: 'price3weeks',       label: '3-Week Price (₦)',    group: 'Pricing',  always: false },
  { key: 'price5weeks',       label: '5-Week Price (₦)',    group: 'Pricing',  always: false },
  { key: 'onlineStock',       label: 'Online Stock',        group: 'Stock',    always: false },
  { key: 'offlineStock',      label: 'Offline Stock',       group: 'Stock',    always: false },
  { key: 'partnerEnabled',    label: 'Partner Stock Enabled', group: 'Stock',  always: false },
  { key: 'partnerQty',        label: 'Partner Stock Qty',   group: 'Stock',    always: false },
  { key: 'roastLevel',        label: 'Roast Level',         group: 'Coffee',   always: false },
  { key: 'blend',             label: 'Blend',               group: 'Coffee',   always: false },
  { key: 'intensity',         label: 'Intensity',           group: 'Coffee',   always: false },
  { key: 'coffeeOrigin',      label: 'Coffee Origin',       group: 'Coffee',   always: false },
  { key: 'aromaticProfile',   label: 'Aromatic Profile',    group: 'Coffee',   always: false },
  { key: 'weight',            label: 'Weight',              group: 'Details',  always: false },
  { key: 'unit',              label: 'Unit',                group: 'Details',  always: false },
  { key: 'packaging',         label: 'Packaging',           group: 'Details',  always: false },
  { key: 'seoTitle',          label: 'SEO Title',           group: 'SEO',      always: false },
  { key: 'seoDescription',    label: 'SEO Description',     group: 'SEO',      always: false },
  { key: 'shortDescription',  label: 'Short Description',   group: 'Details',  always: false },
  { key: 'createdAt',         label: 'Created At',          group: 'Details',  always: false },
];

const COLUMN_PRESETS = [
  {
    id: 'all',
    label: 'All Columns',
    description: 'Every available column',
    keys: ALL_COLUMNS.map(c => c.key),
  },
  {
    id: 'essential',
    label: 'Essential',
    description: 'Name, SKU, Category, Brand, Type, Status',
    keys: ['name','sku','category','brand','productType','publish','visibleInShop'],
  },
  {
    id: 'pricing',
    label: 'Pricing Focus',
    description: 'Core + all price columns',
    keys: ['name','sku','category','brand','btbPrice','btcPrice','price3weeks','price5weeks','publish'],
  },
  {
    id: 'stock',
    label: 'Stock Focus',
    description: 'Core + stock & partner info',
    keys: ['name','sku','category','brand','onlineStock','offlineStock','partnerEnabled','partnerQty','visibleInShop'],
  },
  {
    id: 'coffee',
    label: 'Coffee Details',
    description: 'Core + all coffee-specific fields',
    keys: ['name','sku','category','brand','productType','roastLevel','blend','intensity','coffeeOrigin','aromaticProfile','weight'],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Choose exactly which columns to include',
    keys: null, // user picks
  },
];

const GROUPS = ['Core', 'Pricing', 'Stock', 'Coffee', 'Details', 'SEO'];

export default function ProductExportModal({
  isOpen,
  onClose,
  onExport,
  totalProducts,
  currentPageCount,
  activeFilterCount,
  currentPage,
  totalPages,
}) {
  const [config, setConfig] = useState({
    format: 'csv',
    scope: 'filtered',     // 'page' | 'filtered' | 'all' | 'custom'
    customLimit: 100,
    customPage: 1,
    preset: 'all',
    selectedColumns: ALL_COLUMNS.map(c => c.key),
    exporting: false,
    done: false,
    exportedCount: 0,
  });
  const [expandedGroups, setExpandedGroups] = useState({ Core: true });

  if (!isOpen) return null;

  const set = (patch) => setConfig(p => ({ ...p, ...patch }));

  const applyPreset = (presetId) => {
    const preset = COLUMN_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    set({
      preset: presetId,
      selectedColumns: preset.keys
        ? preset.keys
        : config.selectedColumns,  // keep existing for 'custom'
    });
  };

  const toggleColumn = (key) => {
    const col = ALL_COLUMNS.find(c => c.key === key);
    if (col?.always) return; // can't deselect always-on columns
    set({
      preset: 'custom',
      selectedColumns: config.selectedColumns.includes(key)
        ? config.selectedColumns.filter(k => k !== key)
        : [...config.selectedColumns, key],
    });
  };

  const toggleGroup = (group) => {
    const groupKeys = ALL_COLUMNS.filter(c => c.group === group && !c.always).map(c => c.key);
    const allSelected = groupKeys.every(k => config.selectedColumns.includes(k));
    set({
      preset: 'custom',
      selectedColumns: allSelected
        ? config.selectedColumns.filter(k => !groupKeys.includes(k))
        : [...new Set([...config.selectedColumns, ...groupKeys])],
    });
  };

  const toggleGroupExpand = (group) =>
    setExpandedGroups(p => ({ ...p, [group]: !p[group] }));

  const scopeLabel = () => {
    switch (config.scope) {
      case 'page': return `Current page (${currentPageCount} products)`;
      case 'filtered': return `All filtered results (${totalProducts} products)`;
      case 'all': return `All products in catalog`;
      case 'custom': return `Custom: ${config.customLimit} products from page ${config.customPage}`;
      default: return '';
    }
  };

  const handleExport = async () => {
    set({ exporting: true });
    try {
      const count = await onExport({
        format: config.format,
        scope: config.scope,
        customLimit: config.customLimit,
        customPage: config.customPage,
        selectedColumns: config.selectedColumns,
      });
      set({ exporting: false, done: true, exportedCount: count || 0 });
    } catch {
      set({ exporting: false });
    }
  };

  if (config.done) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Export Complete</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {config.exportedCount} products exported as {config.format.toUpperCase()}
          </p>
          <button
            onClick={() => { set({ done: false }); onClose(); }}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Products</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure and download your product data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── 1. Format ── */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              1. Export Format
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'csv',  icon: <FileSpreadsheet className="w-5 h-5" />, title: 'CSV',  sub: 'Excel / Google Sheets' },
                { id: 'pdf',  icon: <FileText className="w-5 h-5" />,        title: 'PDF',  sub: 'Printable report with colour status' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => set({ format: f.id })}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    config.format === f.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className={config.format === f.id ? 'text-green-600' : 'text-gray-400'}>{f.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{f.sub}</p>
                  </div>
                  {config.format === f.id && (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* PDF colour info */}
            {config.format === 'pdf' && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" /> PDF Stock Colour Indicators
                </p>
                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full inline-block" />Out of stock</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded-full inline-block" />Low stock (≤5)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block" />In stock</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-400 rounded-full inline-block" />Hidden/pending</span>
                </div>
              </div>
            )}
          </section>

          {/* ── 2. Scope ── */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              2. What to Export
            </h4>
            <div className="space-y-2">
              {[
                { id: 'page',     label: `Current page only`,               badge: `${currentPageCount} products`,  badgeColor: 'blue' },
                { id: 'filtered', label: `All filtered / search results`,    badge: `${totalProducts} products`,     badgeColor: 'green' },
                { id: 'all',      label: `Entire product catalog`,           badge: null,                            badgeColor: 'purple' },
                { id: 'custom',   label: `Custom amount`,                    badge: null,                            badgeColor: 'orange' },
              ].map(s => (
                <label
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    config.scope === s.id
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="scope"
                      value={s.id}
                      checked={config.scope === s.id}
                      onChange={() => set({ scope: s.id })}
                      className="accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.label}</span>
                  </div>
                  {s.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold bg-${s.badgeColor}-100 text-${s.badgeColor}-700 dark:bg-${s.badgeColor}-900/30 dark:text-${s.badgeColor}-300`}>
                      {s.badge}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* Custom inputs */}
            {config.scope === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Products per export
                  </label>
                  <select
                    value={config.customLimit}
                    onChange={(e) => set({ customLimit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
                  >
                    {[25, 50, 100, 200, 500, 1000].map(n => (
                      <option key={n} value={n}>{n} products</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Starting from page
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={totalPages || 1}
                    value={config.customPage}
                    onChange={(e) => set({ customPage: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{totalPages} pages total</p>
                </div>
              </div>
            )}

            {/* Active filters notice */}
            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                <Filter className="w-3 h-3 flex-shrink-0" />
                {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''} applied — "Filtered results" respects these filters
              </div>
            )}
          </section>

          {/* ── 3. Columns ── */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              3. Columns
            </h4>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {COLUMN_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  title={p.description}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    config.preset === p.id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Column picker by group */}
            <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {GROUPS.map(group => {
                const groupCols = ALL_COLUMNS.filter(c => c.group === group);
                const selectedInGroup = groupCols.filter(c => config.selectedColumns.includes(c.key)).length;
                const isExpanded = expandedGroups[group];

                return (
                  <div key={group} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                    {/* Group header */}
                    <div
                      className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => toggleGroupExpand(group)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={groupCols.filter(c => !c.always).every(c => config.selectedColumns.includes(c.key))}
                          onChange={() => toggleGroup(group)}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-green-600"
                        />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{group}</span>
                        <span className="text-xs text-gray-400">{selectedInGroup}/{groupCols.length}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {/* Group columns */}
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-0 px-4 py-2 bg-white dark:bg-gray-800">
                        {groupCols.map(col => (
                          <label
                            key={col.key}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${col.always ? 'opacity-60' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={config.selectedColumns.includes(col.key)}
                              onChange={() => toggleColumn(col.key)}
                              disabled={col.always}
                              className="accent-green-600 flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {col.label}
                              {col.always && <span className="text-xs text-gray-400 ml-1">(required)</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              {config.selectedColumns.length} of {ALL_COLUMNS.length} columns selected
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {/* Summary */}
          <div className="flex items-center gap-2 p-3 mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            <Info className="w-4 h-4 flex-shrink-0 text-green-500" />
            <span>
              Exporting <strong className="text-gray-800 dark:text-gray-200">{scopeLabel()}</strong> as{' '}
              <strong className="text-gray-800 dark:text-gray-200">{config.format.toUpperCase()}</strong> with{' '}
              <strong className="text-gray-800 dark:text-gray-200">{config.selectedColumns.length} columns</strong>
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={config.exporting}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={config.exporting || config.selectedColumns.length === 0}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {config.exporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Exporting…</>
              ) : (
                <><Download className="w-4 h-4" />Export {config.format.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
