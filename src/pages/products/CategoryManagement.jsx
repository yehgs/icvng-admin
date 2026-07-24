import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, X, Save, Folder, Loader2,
  LayoutGrid, List, ChevronUp, ChevronDown, Languages, ChevronRight,
} from 'lucide-react';
import ImageUploader from '../../components/common/ImageUploader';
import { categoryAPI } from '../../utils/manageApi';
import { getCategories, clearCategoryCache } from '../../utils/categoryService';
import toast from 'react-hot-toast';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import InlineTranslateFields from "../../components/translations/InlineTranslateFields";

const EmptyState = ({ message, sub }) => (
  <div className="text-center py-16">
    <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
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

const CATEGORY_TRANSLATE_FIELDS = ["name"];
const CATEGORY_TRANSLATE_LABELS = { name: "Name" };

const TableRow = ({ category, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  const { t } = useAdminTranslation();
  return (
  <>
    <tr className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => onToggleExpand(category._id)} title={t("categories.translations")}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {category.image ? (
            <img src={category.image} alt={category.name}
              className="w-9 h-9 rounded-md object-cover bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
          ) : (
            <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
              <Folder className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-white text-sm">{category.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">{category.slug}</td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
        {new Date(category.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(category)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title={t("common.edit")}>
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(category._id, category.name)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title={t("common.delete")}>
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => onToggleExpand(category._id)}
            className={`p-1.5 rounded transition-colors ${isExpanded ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/30' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
            title={t("categories.translate")}>
            <Languages className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
    {isExpanded && (
      <tr className="border-t-0 bg-gray-50/60 dark:bg-gray-900/30">
        <td colSpan={4} className="px-4 pb-4 pt-0">
          <InlineTranslateFields
            entityType="category"
            entity={category}
            fields={CATEGORY_TRANSLATE_FIELDS}
            fieldLabels={CATEGORY_TRANSLATE_LABELS}
          />
        </td>
      </tr>
    )}
  </>
  );
};

const GridCard = ({ category, onEdit, onDelete, isExpanded, onToggleExpand }) => {
  const { t } = useAdminTranslation();
  return (
  <div className="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all">
    <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
      {category.image ? (
        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
      ) : (
        <Folder className="w-8 h-8 text-gray-400" />
      )}
    </div>
    <div className="space-y-1">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{category.name}</h3>
      <p className="text-xs text-gray-400 font-mono truncate">{category.slug}</p>
      <p className="text-xs text-gray-400">{new Date(category.createdAt).toLocaleDateString()}</p>
    </div>
    <div className="flex gap-2 mt-3">
      <button onClick={() => onEdit(category)}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Edit className="w-3 h-3" /> {t("common.edit")}
      </button>
      <button onClick={() => onDelete(category._id, category.name)}
        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
        <Trash2 className="w-3 h-3" /> {t("common.delete")}
      </button>
      <button onClick={() => onToggleExpand(category._id)}
        className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${isExpanded ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
        title={t("categories.translate")}>
        <Languages className="w-3 h-3" />
      </button>
    </div>
    {isExpanded && (
      <InlineTranslateFields
        entityType="category"
        entity={category}
        fields={CATEGORY_TRANSLATE_FIELDS}
        fieldLabels={CATEGORY_TRANSLATE_LABELS}
      />
    )}
  </div>
  );
};

const CategoryManagement = () => {
  const { t } = useAdminTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [formData, setFormData] = useState({ name: '', image: '' });
  const [errors, setErrors] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const cats = await getCategories();
      setCategories(cats);
    } catch {
      toast.error(t("categories.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) =>
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t("categories.categoryNameRequired");
    if (!formData.image) newErrors.image = t("categories.categoryImageRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let response;
      if (editingCategory) {
        response = await categoryAPI.updateCategory({ _id: editingCategory._id, ...formData });
      } else {
        response = await categoryAPI.createCategory(formData);
      }
      if (response.success) {
        setShowModal(false);
        resetForm();
        clearCategoryCache();
        fetchCategories();
        toast.success(editingCategory ? t("categories.categoryUpdated") : t("categories.categoryCreated"));
      } else {
        toast.error(response.message || t("categories.saveFailed"));
      }
    } catch (error) {
      toast.error(error.message || t("categories.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name || '', image: category.image || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(t("categories.confirmDelete", { name: categoryName }))) return;
    try {
      setLoading(true);
      const response = await categoryAPI.deleteCategory(categoryId);
      if (response.success) {
        clearCategoryCache();
        fetchCategories();
        toast.success(t("categories.categoryDeleted"));
      } else {
        toast.error(response.message || t("categories.deleteFailed"));
      }
    } catch (error) {
      toast.error(error.message || t("categories.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setFormData({ name: '', image: '' }); setEditingCategory(null); setErrors({}); };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const searched = categories.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const sorted = [...searched].sort((a, b) => {
    const av = (a[sort.field] ?? '').toString().toLowerCase();
    const bv = (b[sort.field] ?? '').toString().toLowerCase();
    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("categories.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{t("categories.categoryCount", { count: categories.length })}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> {t("categories.addCategory")}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t("categories.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button onClick={() => setViewMode('grid')} title={t("categories.gridView")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('table')} title={t("categories.tableView")}
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
            <span className="ml-2 text-gray-500 dark:text-gray-400">{t("categories.loadingCategories")}</span>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            message={searchTerm ? t("categories.noCategoriesFound") : t("categories.noCategoriesYet")}
            sub={searchTerm ? t("categories.tryDifferentSearch") : t("categories.clickAddCategory")}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
            {sorted.map((category) => (
              <GridCard key={category._id} category={category} onEdit={handleEdit} onDelete={handleDelete}
                isExpanded={expandedId === category._id} onToggleExpand={toggleExpand} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <SortTh label={t("categories.categoryColumn")} field="name" sort={sort} onSort={handleSort} />
                  <SortTh label={t("categories.slugColumn")} field="slug" sort={sort} onSort={handleSort} />
                  <SortTh label={t("blogExt.created")} field="createdAt" sort={sort} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((category) => (
                  <TableRow key={category._id} category={category} onEdit={handleEdit} onDelete={handleDelete}
                    isExpanded={expandedId === category._id} onToggleExpand={toggleExpand} />
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
                {editingCategory ? t("categories.editCategory") : t("categories.addNewCategory")}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("categories.categoryName")} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder={t("categories.categoryNamePlaceholder")}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("categories.categoryImage")} *</label>
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
                  {t("common.cancel")}
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{editingCategory ? t("common.update") + "…" : t("common.create") + "…"}</>
                    : <><Save className="w-4 h-4" />{editingCategory ? t("categories.updateCategory") : t("categories.createCategory")}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
