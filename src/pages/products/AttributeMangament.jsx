import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Settings,
  Loader2,
  Download,
  Tag,
} from 'lucide-react';
import { attributeAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const AttributeManagement = () => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    values: [''],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const response = await attributeAPI.getAttributes();
      setAttributes(response.data || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('Failed to fetch attributes');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Attribute name is required';
    }

    const validValues = formData.values.filter((value) => value.trim() !== '');
    if (validValues.length === 0) {
      newErrors.values = 'At least one attribute value is required';
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
      // Filter out empty values
      const validValues = formData.values.filter(
        (value) => value.trim() !== ''
      );

      const submitData = {
        name: formData.name,
        values: validValues,
      };

      if (editingAttribute) {
        const updateData = {
          _id: editingAttribute._id,
          ...submitData,
        };
        await attributeAPI.updateAttribute(updateData);

        // Update local state
        setAttributes((prev) =>
          prev.map((attr) =>
            attr._id === editingAttribute._id
              ? { ...attr, name: formData.name, values: validValues }
              : attr
          )
        );
        toast.success('Attribute updated successfully!');
      } else {
        const response = await attributeAPI.createAttribute(submitData);

        // Add new attribute to local state
        setAttributes((prev) => [...prev, response.data]);
        toast.success('Attribute created successfully!');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast.error('Failed to save attribute. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = (attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name || '',
      values: [...attribute.values, ''], // Add empty field for new values
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (attributeId, attributeName) => {
    if (
      !window.confirm(`Are you sure you want to delete "${attributeName}"?`)
    ) {
      return;
    }

    try {
      setLoading(true);
      await attributeAPI.deleteAttribute(attributeId);
      setAttributes((prev) => prev.filter((attr) => attr._id !== attributeId));
      toast.success('Attribute deleted successfully!');
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error('Failed to delete attribute. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      values: [''],
    });
    setEditingAttribute(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleValueChange = (index, value) => {
    const newValues = [...formData.values];
    newValues[index] = value;
    setFormData((prev) => ({ ...prev, values: newValues }));

    if (errors.values) {
      setErrors((prev) => ({ ...prev, values: '' }));
    }
  };

  const addValueField = () => {
    setFormData((prev) => ({
      ...prev,
      values: [...prev.values, ''],
    }));
  };

  const removeValueField = (index) => {
    if (formData.values.length > 1) {
      const newValues = formData.values.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, values: newValues }));
    }
  };

  const exportAttributes = () => {
    const csvContent = [
      ['Name', 'Values', 'Value Count', 'Created Date'],
      ...attributes.map((attr) => [
        attr.name,
        attr.values.join('; '),
        attr.values.length,
        new Date(attr.createdAt).toLocaleDateString(),
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attributes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAttributes = attributes.filter(
    (attr) =>
      attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attr.values.some((value) =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const totalValues = attributes.reduce(
    (sum, attr) => sum + attr.values.length,
    0
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attribute Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage product attributes and their values ({attributes.length}{' '}
            attributes, {totalValues} total values)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportAttributes}
            disabled={loading || attributes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Attribute
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search attributes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Attributes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {attributes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Tag className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Values
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalValues}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Search Results
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredAttributes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading attributes...
            </span>
          </div>
        ) : filteredAttributes.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No attributes found' : 'No attributes yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first attribute'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAttributes.map((attribute) => (
              <div
                key={attribute._id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {attribute.name}
                      </h3>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">
                        {attribute.values.length} values
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {attribute.values.map((value, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                        >
                          {value}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created:{' '}
                      {new Date(attribute.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(attribute)}
                      className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Edit Attribute"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(attribute._id, attribute.name)
                      }
                      className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Attribute"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attribute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingAttribute
                      ? 'Update attribute information'
                      : 'Create a new product attribute'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Attribute Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attribute Name *
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
                  placeholder="Enter attribute name (e.g., Size, Color)"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Attribute Values */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Attribute Values *
                </label>
                <div className="space-y-2">
                  {formData.values.map((value, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handleValueChange(index, e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder={`Value ${index + 1}`}
                      />
                      {formData.values.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeValueField(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addValueField}
                  className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  Add Value
                </button>

                {errors.values && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.values}
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
                      {editingAttribute ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingAttribute
                        ? 'Update Attribute'
                        : 'Create Attribute'}
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

export default AttributeManagement;
