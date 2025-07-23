import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Tag,
  Loader2,
  Settings,
} from 'lucide-react';
import { brandAPI } from '../../utils/manageApi';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/common/ImageUploader';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    compatibleSystem: false,
  });

  const [errors, setErrors] = useState({});

  // Mock data for demonstration
  // useEffect(() => {
  //   const mockBrands = [
  //     {
  //       _id: '1',
  //       name: 'Lavazza',
  //       image: 'https://via.placeholder.com/150',
  //       compatibleSystem: true,
  //       createdAt: new Date().toISOString(),
  //     },
  //     {
  //       _id: '2',
  //       name: 'Illy',
  //       image: 'https://via.placeholder.com/150',
  //       compatibleSystem: false,
  //       createdAt: new Date().toISOString(),
  //     },
  //     {
  //       _id: '3',
  //       name: 'Nespresso',
  //       image: 'https://via.placeholder.com/150',
  //       compatibleSystem: true,
  //       createdAt: new Date().toISOString(),
  //     },
  //   ];
  //   setBrands(mockBrands);
  // }, []);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await brandAPI.getBrands();
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required';
    }

    if (!formData.image) {
      newErrors.image = 'Brand image is required';
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
      if (editingBrand) {
        const updateData = {
          _id: editingBrand._id,
          ...formData,
        };
        await brandAPI.updateBrand(updateData);

        // Update local state
        setBrands((prev) =>
          prev.map((brand) =>
            brand._id === editingBrand._id ? { ...brand, ...formData } : brand
          )
        );
        toast.success('Brand updated successfully!');
      } else {
        const response = await brandAPI.createBrand(formData);

        // Add new brand to local state
        setBrands((prev) => [...prev, response.data]);
        toast.success('Brand created successfully!');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('Failed to save brand. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (brandId, brandName) => {
    if (!window.confirm(`Are you sure you want to delete "${brandName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await brandAPI.deleteBrand(brandId);
      setBrands((prev) => prev.filter((brand) => brand._id !== brandId));
      toast.success('Brand deleted successfully!');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      image: brand.image || '',
      compatibleSystem: brand.compatibleSystem || false,
    });
    setErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      compatibleSystem: false,
    });
    setEditingBrand(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const compatibleBrands = brands.filter((brand) => brand.compatibleSystem);
  const regularBrands = brands.filter((brand) => !brand.compatibleSystem);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Brand Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage product brands and manufacturers ({brands.length} total,{' '}
            {compatibleBrands.length} compatible systems)
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
          Add Brand
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search brands..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Tag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Brands
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {brands.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Compatible Systems
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {compatibleBrands.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Tag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Regular Brands
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {regularBrands.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading brands...
            </span>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No brands found' : 'No brands yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first brand'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {filteredBrands.map((brand) => (
              <div
                key={brand._id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  brand.compatibleSystem
                    ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="aspect-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tag className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {brand.name}
                    </h3>
                    {brand.compatibleSystem && (
                      <Settings
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                        title="Compatible System"
                      />
                    )}
                  </div>

                  {brand.compatibleSystem && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs rounded-full">
                      Compatible System
                    </span>
                  )}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {new Date(brand.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id, brand.name)}
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

      {/* Brand Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
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
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Name *
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
                  placeholder="Enter brand name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Brand Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Image *
                </label>
                <ImageUploader
                  images={formData.image ? [formData.image] : []}
                  onImagesChange={(images) =>
                    handleInputChange('image', images[0] || '')
                  }
                  multiple={false}
                  maxImages={1}
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.image}
                  </p>
                )}
              </div>

              {/* Compatible System */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.compatibleSystem}
                    onChange={(e) =>
                      handleInputChange('compatibleSystem', e.target.checked)
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <Settings className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Compatible System Brand
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Mark this brand as a compatible system for product
                      integration
                    </p>
                  </div>
                </label>
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
                      {editingBrand ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingBrand ? 'Update Brand' : 'Create Brand'}
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

export default BrandManagement;
