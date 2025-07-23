import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import ImageUploader from '../../components/common/ImageUploader.jsx';
import { subCategoryAPI, categoryAPI } from '../../utils/manageApi.js';
import toast from 'react-hot-toast';

const SubCategoryManagement = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    category: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSubCategories();
    fetchCategories();
  }, []);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await subCategoryAPI.getSubCategories();
      if (response.success) {
        setSubCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'SubCategory name is required';
    }

    if (!formData.image) {
      newErrors.image = 'SubCategory image is required';
    }

    if (!formData.category) {
      newErrors.category = 'Parent category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (editingSubCategory) {
        response = await subCategoryAPI.updateSubCategory({
          _id: editingSubCategory._id,
          ...formData,
        });
      } else {
        response = await subCategoryAPI.createSubCategory(formData);
      }

      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchSubCategories();
        toast.success(
          editingSubCategory
            ? 'SubCategory updated successfully!'
            : 'SubCategory created successfully!'
        );
      } else {
        toast.error(response.message || 'Failed to save subcategory');
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast.error(error.message || 'Failed to save subcategory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name || '',
      image: subCategory.image || '',
      category: subCategory.category?._id || '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (subCategoryId, subCategoryName) => {
    if (
      !window.confirm(`Are you sure you want to delete "${subCategoryName}"?`)
    ) {
      return;
    }

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
      console.error('Error deleting subcategory:', error);
      toast.error(error.message || 'Failed to delete subcategory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      category: '',
    });
    setEditingSubCategory(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const filteredSubCategories = subCategories.filter(
    (subCategory) =>
      subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subCategory.category?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SubCategory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage product subcategories and classifications
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add SubCategory
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search subcategories..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* SubCategories Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading subcategories...
            </span>
          </div>
        ) : filteredSubCategories.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No subcategories found' : 'No subcategories yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first subcategory'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {filteredSubCategories.map((subCategory) => (
              <div
                key={subCategory._id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {subCategory.image ? (
                    <img
                      src={subCategory.image}
                      alt={subCategory.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {subCategory.name}
                  </h3>

                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {subCategory.category?.name || 'No Category'}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Slug: {subCategory.slug}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created:{' '}
                    {new Date(subCategory.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(subCategory)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(subCategory._id, subCategory.name)
                    }
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SubCategory Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingSubCategory
                  ? 'Edit SubCategory'
                  : 'Add New SubCategory'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* SubCategory Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SubCategory Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.name
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter subcategory name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange('category', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.category
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select parent category...</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.category}
                  </p>
                )}
              </div>

              {/* SubCategory Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SubCategory Image *
                </label>
                <ImageUploader
                  images={formData.image ? [formData.image] : []}
                  onImagesChange={(images) =>
                    handleInputChange('image', images[0] || '')
                  }
                  multiple={false}
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.image}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingSubCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingSubCategory
                        ? 'Update SubCategory'
                        : 'Create SubCategory'}
                    </>
                  )}
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
