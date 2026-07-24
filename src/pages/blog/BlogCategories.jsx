import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Eye,
  FileText,
  Image,
  Globe,
  X,
  Save,
  Download,
  Folder,
  BarChart3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { blogAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/common/ImageUploader';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import InlineTranslateFields from "../../components/translations/InlineTranslateFields";

const BlogCategories = () => {
  const { t } = useAdminTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    status: 'ACTIVE',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      };

      const response = await blogAPI.getCategories(params);

      if (response.success) {
        setCategories(response.data);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(handleApiError(error, t("blogCategoriesMgt.fetchFailed")));
      // Fallback data for development
      setCategories([
        {
          _id: '1',
          name: 'Coffee Origins',
          slug: 'coffee-origins',
          description:
            'Explore the fascinating origins of coffee beans from around the world',
          image:
            'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=200&fit=crop',
          status: 'ACTIVE',
          postCount: 10,
          seoTitle: 'Coffee Origins - Learn About Coffee Bean Origins',
          seoDescription:
            'Discover the rich history and unique characteristics of coffee beans from different regions.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Brewing Techniques',
          slug: 'brewing-techniques',
          description:
            'Master the art of coffee brewing with expert tips and techniques',
          image:
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
          status: 'ACTIVE',
          postCount: 8,
          seoTitle: 'Coffee Brewing Techniques & Tips',
          seoDescription:
            'Learn professional coffee brewing techniques to make the perfect cup at home.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '3',
          name: 'Coffee Culture',
          slug: 'coffee-culture',
          description:
            'Dive into the rich culture and traditions surrounding coffee',
          image:
            'https://images.unsplash.com/photo-1442550528053-c431ecb55509?w=400&h=200&fit=crop',
          status: 'INACTIVE',
          postCount: 6,
          seoTitle: 'Coffee Culture & Traditions',
          seoDescription:
            'Explore coffee culture and traditions from around the world.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (editingCategory) {
        response = await blogAPI.updateCategory(editingCategory._id, formData);
      } else {
        response = await blogAPI.createCategory(formData);
      }

      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchCategories();
        toast.success(
          editingCategory
            ? t("blogCategoriesMgt.categoryUpdated")
            : t("blogCategoriesMgt.categoryCreated")
        );
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(handleApiError(error, t("blogCategoriesMgt.saveFailed")));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (
      !confirm(t("blogCategoriesMgt.confirmDelete"))
    )
      return;

    try {
      const response = await blogAPI.deleteCategory(categoryId);

      if (response.success) {
        fetchCategories();
        toast.success(t("blogCategoriesMgt.categoryDeleted"));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(handleApiError(error, t("blogCategoriesMgt.deleteFailed")));
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
      status: category.status || 'ACTIVE',
      seoTitle: category.seoTitle || '',
      seoDescription: category.seoDescription || '',
      seoKeywords: category.seoKeywords || '',
    });
    setShowModal(true);
  };

  const handleView = (category) => {
    setViewingCategory(category);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
      status: 'ACTIVE',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setEditingCategory(null);
  };

  const handleImageUpload = (images) => {
    if (images && images.length > 0) {
      setFormData((prev) => ({ ...prev, image: images[0] }));
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      [
        'Name',
        'Slug',
        'Description',
        'Status',
        'Post Count',
        'Created Date',
        'SEO Title',
      ],
      ...categories.map((category) => [
        category.name,
        category.slug,
        category.description || '',
        category.status,
        category.postCount || 0,
        new Date(category.createdAt).toLocaleDateString(),
        category.seoTitle || '',
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-categories.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'INACTIVE':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Folder className="w-8 h-8 mr-3 text-amber-600" />
            {t("blogCategoriesMgt.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("blogCategoriesMgt.subtitle")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="btn-outline flex items-center gap-2"
            disabled={categories.length === 0}
          >
            <Download className="w-4 h-4" />
            {t("common.export")}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("blogCategoriesMgt.addCategory")}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("blogCategoriesMgt.totalCategories")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {categories.length}
              </p>
            </div>
            <Folder className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("blogCategoriesMgt.activeCategories")}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {categories.filter((cat) => cat.status === 'ACTIVE').length}
              </p>
            </div>
            <Tag className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("blogCategoriesMgt.totalPosts")}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0)}
              </p>
            </div>
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("blogCategoriesMgt.avgPostsPerCategory")}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {categories.length > 0
                  ? Math.round(
                      categories.reduce(
                        (sum, cat) => sum + (cat.postCount || 0),
                        0
                      ) / categories.length
                    )
                  : 0}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t("categories.searchPlaceholder")}
                className="form-input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="min-w-40">
            <select
              className="form-select w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("products.allStatus")}</option>
              <option value="ACTIVE">{t("common.active")}</option>
              <option value="INACTIVE">{t("common.inactive")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Details Modal */}
      {viewingCategory && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-container max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mr-4">
                  <Folder className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {viewingCategory.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    /{viewingCategory.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("common.name")}
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("categories.slugColumn")}
                    </label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 font-mono">
                      /{viewingCategory.slug}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("common.status")}
                    </label>
                    <div className="mt-1">
                      <span
                        className={`badge ${getStatusBadgeClass(
                          viewingCategory.status
                        )}`}
                      >
                        {viewingCategory.status === 'ACTIVE' ? t("common.active") : t("common.inactive")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("blogCategoriesMgt.postCount")}
                    </label>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {viewingCategory.postCount || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("blogCategoriesMgt.categoryImage")}
                    </label>
                    {viewingCategory.image ? (
                      <div className="mt-2">
                        <img
                          src={viewingCategory.image}
                          alt={viewingCategory.name}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    ) : (
                      <div className="mt-2 w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("blogExt.created")}
                    </label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(viewingCategory.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("blogCategoriesMgt.lastUpdated")}
                    </label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(viewingCategory.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("common.description")}
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {viewingCategory.description || t("blogCategoriesMgt.noDescriptionProvided")}
                </p>
              </div>

              {/* SEO Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  {t("blogCategoriesMgt.seoInformation")}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("products.seoTitle")}
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.seoTitle || t("blogCategoriesMgt.notSet")}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("products.seoDescription")}
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.seoDescription || t("blogCategoriesMgt.notSet")}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("blogCategoriesMgt.seoKeywords")}
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.seoKeywords || t("blogCategoriesMgt.notSet")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setViewingCategory(null);
                    handleEdit(viewingCategory);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t("blogCategoriesMgt.editCategory")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-3 text-left">{t("common.category")}</th>
              <th className="px-6 py-3 text-left">{t("common.description")}</th>
              <th className="px-6 py-3 text-left">{t("blogExt.posts")}</th>
              <th className="px-6 py-3 text-left">{t("common.status")}</th>
              <th className="px-6 py-3 text-left">{t("blogExt.created")}</th>
              <th className="px-6 py-3 text-left">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="spinner w-8 h-8 mx-auto"></div>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Folder className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t("blogCategoriesMgt.noCategoriesFound")}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchTerm || statusFilter
                        ? t("blogCategoriesMgt.tryAdjustingCriteria")
                        : t("blogCategoriesMgt.createFirstCategoryHint")}
                    </p>
                    {!searchTerm && !statusFilter && (
                      <button
                        onClick={() => {
                          resetForm();
                          setShowModal(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {t("blogCategoriesMgt.createFirstCategory")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="w-16 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Folder className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          /{category.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {category.description || t("blogCategoriesMgt.noDescription")}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-blue-600 mr-2">
                        {category.postCount || 0}
                      </span>
                      <span className="text-sm text-gray-500">{t("blogCategoriesMgt.postsLabel")}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${getStatusBadgeClass(
                        category.status
                      )}`}
                    >
                      {category.status === 'ACTIVE' ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(category.createdAt)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(category)}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title={t("blogCategoriesMgt.viewDetails")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title={t("common.edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title={t("common.delete")}
                        disabled={category.postCount > 0}
                      >
                        {category.postCount > 0 ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t("pagination.previous")}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t("pagination.next")}
            </button>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-container max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? t("blogCategoriesMgt.editCategory") : t("blogCategoriesMgt.addNewCategory")}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  {t("blogCategoriesMgt.basicInfo")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("blogCategoriesMgt.categoryName")} *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder={t("blogCategoriesMgt.categoryNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("common.status")}
                    </label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="ACTIVE">{t("common.active")}</option>
                      <option value="INACTIVE">{t("common.inactive")}</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("common.description")}
                  </label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t("blogCategoriesMgt.descriptionPlaceholder")}
                    maxLength="500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {t("blogCategoriesMgt.charactersCount", { count: formData.description.length, max: 500 })}
                  </div>
                  {editingCategory && (
                    <InlineTranslateFields
                      entityType="blogCategory"
                      entity={editingCategory}
                      fields={["name", "description", "seoTitle", "seoDescription"]}
                      fieldLabels={{
                        name: "Category Name",
                        description: "Description",
                        seoTitle: "SEO Title",
                        seoDescription: "SEO Description",
                      }}
                    />
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("blogCategoriesMgt.categoryImage")}
                  </label>
                  <ImageUploader
                    images={formData.image ? [formData.image] : []}
                    onImagesChange={handleImageUpload}
                    multiple={false}
                    className="mb-4"
                  />
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  {t("blogCategoriesMgt.seoSettings")}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.seoTitle")}
                      <span className="text-xs text-gray-500 ml-1">
                        {t("blogCategoriesMgt.charsMax", { max: 60 })}
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.seoTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seoTitle: e.target.value,
                        }))
                      }
                      placeholder={t("blogCategoriesMgt.seoTitlePlaceholder")}
                      maxLength="60"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">
                        {t("blogCategoriesMgt.charactersCount", { count: formData.seoTitle.length, max: 60 })}
                      </span>
                      <span
                        className={`${
                          formData.seoTitle.length > 50
                            ? 'text-orange-500'
                            : 'text-green-500'
                        }`}
                      >
                        {formData.seoTitle.length > 50
                          ? t("blogCategoriesMgt.gettingLong")
                          : t("blogCategoriesMgt.goodLength")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("products.seoDescription")}
                      <span className="text-xs text-gray-500 ml-1">
                        {t("blogCategoriesMgt.charsMax", { max: 160 })}
                      </span>
                    </label>
                    <textarea
                      rows="3"
                      className="form-textarea"
                      value={formData.seoDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seoDescription: e.target.value,
                        }))
                      }
                      placeholder={t("blogCategoriesMgt.seoDescPlaceholder")}
                      maxLength="160"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">
                        {t("blogCategoriesMgt.charactersCount", { count: formData.seoDescription.length, max: 160 })}
                      </span>
                      <span
                        className={`${
                          formData.seoDescription.length > 140
                            ? 'text-orange-500'
                            : formData.seoDescription.length > 120
                            ? 'text-green-500'
                            : 'text-gray-500'
                        }`}
                      >
                        {formData.seoDescription.length > 140
                          ? t("blogCategoriesMgt.gettingLong")
                          : formData.seoDescription.length > 120
                          ? t("blogCategoriesMgt.goodLength")
                          : t("blogCategoriesMgt.couldBeLonger")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("blogCategoriesMgt.seoKeywords")}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.seoKeywords}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seoKeywords: e.target.value,
                        }))
                      }
                      placeholder={t("blogCategoriesMgt.seoKeywordsPlaceholder")}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {t("blogCategoriesMgt.seoKeywordsHelp")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  {t("blogCategoriesMgt.searchEnginePreview")}
                </h4>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                    {formData.seoTitle || formData.name || t("blogCategoriesMgt.categoryTitleFallback")}
                  </div>
                  <div className="text-green-700 text-sm">
                    https://i-coffee.ng/blog/category/
                    {formData.name.toLowerCase().replace(/\s+/g, '-') ||
                      t("blogCategoriesMgt.categorySlugFallback")}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {formData.seoDescription ||
                      formData.description ||
                      t("blogCategoriesMgt.categoryDescFallback")}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-outline"
                  disabled={loading}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingCategory ? t("blogCategoriesMgt.updateCategory") : t("blogCategoriesMgt.createCategory")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogCategories;
