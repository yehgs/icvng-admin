// admin/src/pages/BlogTags.jsx
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Palette,
  X,
  Save,
  Download,
} from 'lucide-react';
import { blogAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const BlogTags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    status: 'ACTIVE',
  });

  const predefinedColors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#6366F1',
    '#14B8A6',
    '#F43F5E',
    '#8B4513',
    '#DC143C',
    '#228B22',
    '#FFD700',
    '#32CD32',
    '#90EE90',
    '#2F4F4F',
    '#A0522D',
  ];

  useEffect(() => {
    fetchTags();
  }, [currentPage, searchTerm]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await blogAPI.getTags(params);

      if (response.success) {
        setTags(response.data);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error(handleApiError(error, 'Failed to fetch tags'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (editingTag) {
        response = await blogAPI.updateTag(editingTag._id, formData);
      } else {
        response = await blogAPI.createTag(formData);
      }

      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchTags();
        toast.success(
          editingTag ? 'Tag updated successfully!' : 'Tag created successfully!'
        );
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      toast.error(handleApiError(error, 'Failed to save tag'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tagId) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const response = await blogAPI.deleteTag(tagId);

      if (response.success) {
        fetchTags();
        toast.success('Tag deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error(handleApiError(error, 'Failed to delete tag'));
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name || '',
      description: tag.description || '',
      color: tag.color || '#3B82F6',
      status: tag.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      status: 'ACTIVE',
    });
    setEditingTag(null);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Description', 'Color', 'Post Count', 'Status', 'Created Date'],
      ...tags.map((tag) => [
        tag.name,
        tag.description || '',
        tag.color,
        tag.postCount || 0,
        tag.status,
        new Date(tag.createdAt).toLocaleDateString(),
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blog-tags.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Blog Tags
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tags for better content categorization and discovery
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="btn-outline flex items-center gap-2"
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
            Add Tag
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tags..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-md">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No tags found
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first tag to get started with content organization.
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            Create First Tag
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tags.map((tag) => (
              <div
                key={tag._id}
                className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border-l-4"
                style={{ borderLeftColor: tag.color }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {tag.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {tag.description || 'No description'}
                    </p>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0 ml-2"
                    style={{ backgroundColor: tag.color }}
                    title={`Color: ${tag.color}`}
                  ></div>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-500">
                    {tag.postCount || 0} posts
                  </span>
                  <span
                    className={`badge text-xs ${
                      tag.status === 'ACTIVE'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {tag.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="flex-1 p-2 text-green-600 hover:bg-green-50 rounded text-center transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag._id)}
                    className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded text-center transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tag Form Modal */}
      {showModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-container max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTag ? 'Edit Tag' : 'Add New Tag'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tag Name *
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Arabica, Ethiopia, Single Origin"
                />
              </div>

              <div>
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
                  placeholder="Brief description of this tag..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tag Color
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                    />
                    <input
                      type="text"
                      className="form-input flex-1"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      placeholder="#3B82F6"
                    />
                    <div
                      className="w-10 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    ></div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Quick Colors:</p>
                    <div className="grid grid-cols-10 gap-2">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, color }))
                          }
                          className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                            formData.color === color
                              ? 'border-gray-800'
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
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

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <span
                  className="inline-block px-3 py-1 text-sm rounded-full text-white font-medium"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.name || 'Tag Name'}
                </span>
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
                  disabled={loading}
                >
                  {loading ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogTags;
