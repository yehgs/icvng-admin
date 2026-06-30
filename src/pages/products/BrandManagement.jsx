import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Save, Tag, Loader2, Settings,
  LayoutGrid, List, ChevronUp, ChevronDown,
} from 'lucide-react';
import { brandAPI } from '../../utils/manageApi';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/common/ImageUploader';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const EmptyState = ({ icon: Icon, message, sub }) => (
  <div className="text-center py-16">
    <Icon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
    <p className="text-base font-medium text-gray-600 dark:text-gray-400">{message}</p>
    {sub && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const SortTh = ({ label, field, sort, onSort }) => (
  <th
    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {label}
      <span className="flex flex-col -space-y-1">
        <ChevronUp className={`w-3 h-3 ${sort.field === field && sort.dir === 'asc' ? 'text-blue-500' : 'text-gray-300'}`} />
        <ChevronDown className={`w-3 h-3 ${sort.field === field && sort.dir === 'desc' ? 'text-blue-500' : 'text-gray-300'}`} />
      </span>
    </div>
  </th>
);

const TableRow = ({ brand, onEdit, onDelete }) => (
  <tr className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        {brand.image ? (
          <img src={brand.image} alt={brand.name}
            className="w-9 h-9 rounded-md object-contain bg-gray-100 dark:bg-gray-700 p-0.5 border border-gray-200 dark:border-gray-600" />
        ) : (
          <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
            <Tag className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <span className="font-medium text-gray-900 dark:text-white text-sm">{brand.name}</span>
      </div>
    </td>
    <td className="px-4 py-3">
      {brand.compatibleSystem ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs rounded-full font-medium">
          <Settings className="w-3 h-3" /> Compatible System
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">
          Regular
        </span>
      )}
    </td>
    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
      {new Date(brand.createdAt).toLocaleDateString()}
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(brand)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Edit">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(brand._id, brand.name)}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

const GridCard = ({ brand, onEdit, onDelete }) => (
  <div className={`border rounded-xl p-4 hover:shadow-md transition-all ${
    brand.compatibleSystem
      ? 'border-green-200 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/10'
      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
  }`}>
    <div className="aspect-video mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
      {brand.image ? (
        <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-2" />
      ) : (
        <Tag className="w-8 h-8 text-gray-400" />
      )}
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{brand.name}</h3>
        {brand.compatibleSystem && <Settings className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />}
      </div>
      {brand.compatibleSystem && (
        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
          Compatible System
        </span>
      )}
      <p className="text-xs text-gray-400">{new Date(brand.createdAt).toLocaleDateString()}</p>
    </div>
    <div className="flex gap-2 mt-3">
      <button onClick={() => onEdit(brand)}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Edit className="w-3 h-3" /> Edit
      </button>
      <button onClick={() => onDelete(brand._id, brand.name)}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
        <Trash2 className="w-3 h-3" /> Delete
      </button>
    </div>
  </div>
);

const BrandManagement = () => {
  const { t } = useAdminTranslation();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('brands');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [formData, setFormData] = useState({ name: '', image: '', compatibleSystem: false });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await brandAPI.getBrands();
      setBrands(response.data || []);
    } catch (error) {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) =>
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Brand name is required';
    if (!formData.image) newErrors.image = 'Brand image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingBrand) {
        await brandAPI.updateBrand({ _id: editingBrand._id, ...formData });
        setBrands((prev) => prev.map((b) => b._id === editingBrand._id ? { ...b, ...formData } : b));
        toast.success('Brand updated successfully!');
      } else {
        const response = await brandAPI.createBrand(formData);
        setBrands((prev) => [...prev, response.data]);
        toast.success('Brand created successfully!');
      }
      setShowModal(false);
      resetForm();
    } catch {
      toast.error('Failed to save brand. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (brandId, brandName) => {
    if (!window.confirm(`Are you sure you want to delete "${brandName}"?`)) return;
    try {
      setLoading(true);
      await brandAPI.deleteBrand(brandId);
      setBrands((prev) => prev.filter((b) => b._id !== brandId));
      toast.success('Brand deleted successfully!');
    } catch {
      toast.error('Failed to delete brand.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name || '', image: brand.image || '', compatibleSystem: brand.compatibleSystem || false });
    setErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', image: '', compatibleSystem: false });
    setEditingBrand(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const regularCount = brands.filter((b) => !b.compatibleSystem).length;
  const compatibleCount = brands.filter((b) => b.compatibleSystem).length;

  const tabFiltered = brands.filter((b) => activeTab === 'brands' ? !b.compatibleSystem : b.compatibleSystem);
  const searched = tabFiltered.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const sorted = [...searched].sort((a, b) => {
    const av = (a[sort.field] ?? '').toString().toLowerCase();
    const bv = (b[sort.field] ?? '').toString().toLowerCase();
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const TABS = [
    { key: 'brands', label: 'Brands', count: regularCount, icon: Tag },
    { key: 'compatible', label: 'Compatible Systems', count: compatibleCount, icon: Settings },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("brands.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {brands.length} total &middot; {regularCount} regular &middot; {compatibleCount} compatible systems
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'brands' ? 'brands' : 'compatible systems'}...`}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Table view"
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List / Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading brands...</span>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={activeTab === 'brands' ? Tag : Settings}
            message={searchTerm ? 'No results found' : `No ${activeTab === 'brands' ? 'brands' : 'compatible systems'} yet`}
            sub={searchTerm ? 'Try a different search term' : 'Click "Add Brand" to get started'}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
            {sorted.map((brand) => (
              <GridCard key={brand._id} brand={brand} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <SortTh label="Brand" field="name" sort={sort} onSort={handleSort} />
                  <SortTh label="Type" field="compatibleSystem" sort={sort} onSort={handleSort} />
                  <SortTh label={t("blogExt.created")} field="createdAt" sort={sort} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((brand) => (
                  <TableRow key={brand._id} brand={brand} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Enter brand name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand Image *</label>
                <ImageUploader
                  images={formData.image ? [formData.image] : []}
                  onImagesChange={(imgs) => handleInputChange('image', imgs[0] || '')}
                  multiple={false}
                  maxImages={1}
                />
                {errors.image && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.image}</p>}
              </div>
              <div className={`rounded-lg p-4 border transition-colors ${formData.compatibleSystem ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.compatibleSystem}
                    onChange={(e) => handleInputChange('compatibleSystem', e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Compatible System Brand</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Mark as a compatible system (e.g. Nespresso&reg;, Dolce Gusto&reg;). Products can then reference this brand as their compatible system.
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{editingBrand ? 'Updating...' : 'Creating...'}</>
                    : <><Save className="w-4 h-4" />{editingBrand ? 'Update Brand' : 'Create Brand'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManagement;
