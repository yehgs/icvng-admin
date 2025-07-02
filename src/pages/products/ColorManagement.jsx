import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Palette,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { colorAPI } from '../../utils/manageApi';
import toast from 'react-hot-toast';

const ColorManagement = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingColor, setEditingColor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    hexCode: '#000000',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await colorAPI.getColors();
      if (response.success) {
        setColors(response.data);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
      toast.error('Failed to load colors');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Color name is required';
    }

    if (!formData.hexCode) {
      newErrors.hexCode = 'Hex code is required';
    } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(formData.hexCode)) {
      newErrors.hexCode = 'Please enter a valid hex code (e.g., #FF0000)';
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
      if (editingColor) {
        response = await colorAPI.updateColor({
          colorId: editingColor._id,
          ...formData,
        });
      } else {
        response = await colorAPI.createColor(formData);
      }

      if (response.success) {
        setShowModal(false);
        resetForm();
        fetchColors();
        toast.success(
          editingColor
            ? 'Color updated successfully!'
            : 'Color created successfully!'
        );
      } else {
        toast.error(response.message || 'Failed to save color');
      }
    } catch (error) {
      console.error('Error saving color:', error);
      toast.error(error.message || 'Failed to save color');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (color) => {
    setEditingColor(color);
    setFormData({
      name: color.name || '',
      hexCode: color.hexCode || '#000000',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (colorId, colorName) => {
    if (!window.confirm(`Are you sure you want to delete "${colorName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await colorAPI.deleteColor(colorId);
      if (response.success) {
        fetchColors();
        toast.success('Color deleted successfully!');
      } else {
        toast.error(response.message || 'Failed to delete color');
      }
    } catch (error) {
      console.error('Error deleting color:', error);
      toast.error(error.message || 'Failed to delete color');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      hexCode: '#000000',
    });
    setEditingColor(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const filteredColors = colors.filter((color) =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const predefinedColors = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#000000',
    '#FFFFFF',
    '#808080',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
    '#008080',
    '#C0C0C0',
    '#FFA500',
    '#A52A2A',
    '#DEB887',
    '#5F9EA0',
    '#7FFF00',
    '#D2691E',
    '#FF7F50',
    '#6495ED',
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Color Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage product colors and variations
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
          Add Color
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search colors..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Colors Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading colors...
            </span>
          </div>
        ) : filteredColors.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No colors found' : 'No colors yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first color'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {filteredColors.map((color) => (
              <div
                key={color._id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: color.hexCode }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {color.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {color.hexCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Slug: {color.slug}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Status: {color.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {new Date(color.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(color)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(color._id, color.name)}
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

      {/* Color Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingColor ? 'Edit Color' : 'Add New Color'}
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
              {/* Color Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color Name *
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
                  placeholder="Enter color name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Color Hex Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hex Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.hexCode}
                    onChange={(e) =>
                      handleInputChange('hexCode', e.target.value)
                    }
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.hexCode}
                    onChange={(e) =>
                      handleInputChange('hexCode', e.target.value)
                    }
                    className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono ${
                      errors.hexCode
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="#000000"
                  />
                </div>
                {errors.hexCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.hexCode}
                  </p>
                )}
              </div>

              {/* Predefined Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Select Colors
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {predefinedColors.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleInputChange('hexCode', color)}
                      className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                        formData.hexCode === color
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Color Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: formData.hexCode }}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formData.name || 'Color Name'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {formData.hexCode}
                    </p>
                  </div>
                </div>
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
                      {editingColor ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingColor ? 'Update Color' : 'Create Color'}
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

export default ColorManagement;
