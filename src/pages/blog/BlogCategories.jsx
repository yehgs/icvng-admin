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

const BlogCategories = () => {
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
      toast.error(handleApiError(error, 'Failed to fetch categories'));
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
            ? 'Category updated successfully!'
            : 'Category created successfully!'
        );
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(handleApiError(error, 'Failed to save category'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? This action cannot be undone.'
      )
    )
      return;

    try {
      const response = await blogAPI.deleteCategory(categoryId);

      if (response.success) {
        fetchCategories();
        toast.success('Category deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(handleApiError(error, 'Failed to delete category'));
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
            Blog Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organize your blog content with categories for better navigation and
            SEO
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="btn-outline flex items-center gap-2"
            disabled={categories.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Categories
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
                Active Categories
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
                Total Posts
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
                Avg Posts/Category
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
                placeholder="Search categories by name or description..."
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
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
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
                      Name
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slug
                    </label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 font-mono">
                      /{viewingCategory.slug}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <div className="mt-1">
                      <span
                        className={`badge ${getStatusBadgeClass(
                          viewingCategory.status
                        )}`}
                      >
                        {viewingCategory.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Post Count
                    </label>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {viewingCategory.postCount || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category Image
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
                      Created
                    </label>
                    <p className="mt-1 text-gray-600 dark:text-gray-400 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(viewingCategory.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Updated
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
                  Description
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {viewingCategory.description || 'No description provided'}
                </p>
              </div>

              {/* SEO Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  SEO Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SEO Title
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.seoTitle || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SEO Description
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.seoDescription || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      SEO Keywords
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {viewingCategory.seoKeywords || 'Not set'}
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
                  Edit Category
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
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">Posts</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Created</th>
              <th className="px-6 py-3 text-left">Actions</th>
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
                      No categories found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchTerm || statusFilter
                        ? 'Try adjusting your search criteria'
                        : 'Create your first blog category to get started'}
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
                        Create First Category
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
                        {category.description || 'No description'}
                      </p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-blue-600 mr-2">
                        {category.postCount || 0}
                      </span>
                      <span className="text-sm text-gray-500">posts</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${getStatusBadgeClass(
                        category.status
                      )}`}
                    >
                      {category.status}
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
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
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
              Previous
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
              Next
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
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category Name *
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
                      placeholder="e.g., Coffee Origins, Brewing Tips..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
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
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
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
                    placeholder="Brief description of this category..."
                    maxLength="500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Image
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
                  SEO Settings
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Title
                      <span className="text-xs text-gray-500 ml-1">
                        (60 chars max)
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
                      placeholder="SEO optimized title for search engines"
                      maxLength="60"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">
                        {formData.seoTitle.length}/60 characters
                      </span>
                      <span
                        className={`${
                          formData.seoTitle.length > 50
                            ? 'text-orange-500'
                            : 'text-green-500'
                        }`}
                      >
                        {formData.seoTitle.length > 50
                          ? 'Getting long'
                          : 'Good length'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Description
                      <span className="text-xs text-gray-500 ml-1">
                        (160 chars max)
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
                      placeholder="Meta description that appears in search results"
                      maxLength="160"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">
                        {formData.seoDescription.length}/160 characters
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
                          ? 'Getting long'
                          : formData.seoDescription.length > 120
                          ? 'Good length'
                          : 'Could be longer'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SEO Keywords
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
                      placeholder="coffee, origins, arabica, brewing (separate with commas)"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Separate keywords with commas. Focus on 3-5 relevant
                      keywords.
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Search Engine Preview
                </h4>
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                    {formData.seoTitle || formData.name || 'Category Title'}
                  </div>
                  <div className="text-green-700 text-sm">
                    https://i-coffee.ng/blog/category/
                    {formData.name.toLowerCase().replace(/\s+/g, '-') ||
                      'category-slug'}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {formData.seoDescription ||
                      formData.description ||
                      'Category description will appear here in search results.'}
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
                  Cancel
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
                  {editingCategory ? 'Update Category' : 'Create Category'}
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
