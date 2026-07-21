import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Save, FolderOpen, Loader2,
  LayoutGrid, List, ChevronUp, ChevronDown, Languages, ChevronRight,
} from 'lucide-react';
import ImageUploader from '../../components/common/ImageUploader.jsx';
import { subCategoryAPI } from '../../utils/manageApi.js';
import { getCategories } from '../../utils/categoryService';
import toast from 'react-hot-toast';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import InlineTranslateFields from "../../components/translations/InlineTranslateFields";

const EmptyState = ({ message, sub }) => (
  <div className="text-center py-16">
    <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
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

const SUBCATEGORY_TRANSLATE_FIELDS = ["name"];
const SUBCATEGORY_TRANSLATE_LABELS = { name: "Name" };

const TableRow = ({ sub, onEdit, onDelete, isExpanded, onToggleExpand }) => (
  <>
  <tr className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => onToggleExpand(sub._id)} title="Translations"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {sub.image ? (
          <img src={sub.image} alt={sub.name}
            className="w-9 h-9 rounded-md object-cover bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
        ) : (
          <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
            <FolderOpen className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <span className="font-medium text-gray-900 dark:text-white text-sm">{sub.name}</span>
      </div>
    </td>
    <td className="px-4 py-3">
      <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs rounded-full font-medium">
        {sub.category?.name || 'No Category'}
      </span>
    </td>
    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">{sub.slug}</td>
    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
      {new Date(sub.createdAt).toLocaleDateString()}
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(sub)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Edit">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(sub._id, sub.name)}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
        <button onClick={() => onToggleExpand(sub._id)}
          className={`p-1.5 rounded transition-colors ${isExpanded ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/30' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
          title="Translate">
          <Languages className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
  {isExpanded && (
    <tr className="border-t-0 bg-gray-50/60 dark:bg-gray-900/30">
      <td colSpan={5} className="px-4 pb-4 pt-0">
        <InlineTranslateFields
          entityType="subCategory"
          entity={sub}
          fields={SUBCATEGORY_TRANSLATE_FIELDS}
          fieldLabels={SUBCATEGORY_TRANSLATE_LABELS}
        />
      </td>
    </tr>
  )}
  </>
);

const GridCard = ({ sub, onEdit, onDelete, isExpanded, onToggleExpand }) => (
  <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all">
    <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
      {sub.image ? (
        <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
      ) : (
        <FolderOpen className="w-8 h-8 text-gray-400" />
      )}
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{sub.name}</h3>
      <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs rounded-full">
        {sub.category?.name || 'No Category'}
      </span>
      <p className="text-xs text-gray-400 font-mono truncate">{sub.slug}</p>
      <p className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleDateString()}</p>
    </div>
    <div className="flex gap-2 mt-3">
      <button onClick={() => onEdit(sub)}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Edit className="w-3 h-3" /> Edit
      </button>
      <button onClick={() => onDelete(sub._id, sub.name)}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
        <Trash2 className="w-3 h-3" /> Delete
      </button>
      <button onClick={() => onToggleExpand(sub._id)}
        className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${isExpanded ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
        title="Translate">
        <Languages className="w-3 h-3" />
      </button>
    </div>
    {isExpanded && (
      <InlineTranslateFields
        entityType="subCategory"
        entity={sub}
        fields={SUBCATEGORY_TRANSLATE_FIELDS}
        fieldLabels={SUBCATEGORY_TRANSLATE_LABELS}
      />
    )}
  </div>
);

const SubCategoryManagement = () => {
  const { t } = useAdminTranslation();
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [formData, setFormData] = useState({ name: '', image: '', category: '' });
  const [errors, setErrors] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  useEffect(() => { fetchSubCategories(); fetchCategories(); }, []);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await subCategoryAPI.getSubCategories();
      if (response.success) setSubCategories(response.data);
    } catch {
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  const handleSort = (field) =>
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'SubCategory name is required';
    if (!formData.image) newErrors.image = 'SubCategory image is required';
    if (!formData.category) newErrors.category = 'Parent category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let response;
      if (editingSubCategory) {
        response = await subCategoryAPI.updateSubCategory({ _id: editingSubCategory._id, ...formData });
      } else {
        response = await subCategoryAPI.createSubCategory(formData);
      }
      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchSubCategories();
        toast.success(editingSubCategory ? 'SubCategory updated successfully!' : 'SubCategory created successfully!');
      } else {
        toast.error(response.message || 'Failed to save subcategory');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save subcategory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({ name: subCategory.name || '', image: subCategory.image || '', category: subCategory.category?._id || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (subCategoryId, subCategoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${subCategoryName}"?`)) return;
    try {
      setLoading(true);
      const response = await subCategoryAPI.deleteSubCategory(subCategoryId);
      if (response.success) {
        fetchSubCategories();
        toast.success('SubCategory deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete subcategory');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete subcategory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setFormData({ name: '', image: '', category: '' }); setEditingSubCategory(null); setErrors({}); };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const filtered = subCategories.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !filterCategory || s.category?._id === filterCategory;
    return matchSearch && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sort.field] ?? '').toString().toLowerCase();
    const bv = (b[sort.field] ?? '').toString().toLowerCase();
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("categories.subTitle")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{subCategories.length} subcategories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add SubCategory
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t("categories.searchSub")}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">{t("products.allCategories")}</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg ml-auto">
          <button onClick={() => setViewMode('grid')} title="Grid view"
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('table')} title="Table view"
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading subcategories...</span>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            message={searchTerm || filterCategory ? 'No results found' : 'No subcategories yet'}
            sub={searchTerm || filterCategory ? 'Try clearing your filters' : 'Click "Add SubCategory" to get started'}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
            {sorted.map((sub) => (
              <GridCard key={sub._id} sub={sub} onEdit={handleEdit} onDelete={handleDelete}
                isExpanded={expandedId === sub._id} onToggleExpand={toggleExpand} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <SortTh label="SubCategory" field="name" sort={sort} onSort={handleSort} />
                  <SortTh label="Parent Category" field="category" sort={sort} onSort={handleSort} />
                  <SortTh label="Slug" field="slug" sort={sort} onSort={handleSort} />
                  <SortTh label={t("blogExt.created")} field="createdAt" sort={sort} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((sub) => (
                  <TableRow key={sub._id} sub={sub} onEdit={handleEdit} onDelete={handleDelete}
                    isExpanded={expandedId === sub._id} onToggleExpand={toggleExpand} />
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
                {editingSubCategory ? 'Edit SubCategory' : 'Add New SubCategory'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SubCategory Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Enter subcategory name"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.category ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <option value="">Select parent category...</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SubCategory Image *</label>
                <ImageUploader
                  images={formData.image ? [formData.image] : []}
                  onImagesChange={(imgs) => handleInputChange('image', imgs[0] || '')}
                  multiple={false}
                />
                {errors.image && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.image}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{editingSubCategory ? 'Updating...' : 'Creating...'}</>
                    : <><Save className="w-4 h-4" />{editingSubCategory ? 'Update SubCategory' : 'Create SubCategory'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategoryManagement;
