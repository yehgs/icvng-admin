import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  MapPin,
  Loader2,
  Download,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { coffeeRoastAreaAPI } from '../../utils/api';

const CoffeeRoastAreaManagement = () => {
  const [roastAreas, setRoastAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    city: '',
    region: '',
    country: 'Italy',
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoastAreas();
  }, []);

  const fetchRoastAreas = async () => {
    setLoading(true);
    try {
      const response = await coffeeRoastAreaAPI.getCoffeeRoastAreas();
      setRoastAreas(response.data || []);
    } catch (error) {
      console.error('Error fetching roast areas:', error);
      toast.error('Failed to fetch roast areas');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (
      formData.latitude &&
      (isNaN(formData.latitude) ||
        formData.latitude < -90 ||
        formData.latitude > 90)
    ) {
      newErrors.latitude = 'Latitude must be a number between -90 and 90';
    }

    if (
      formData.longitude &&
      (isNaN(formData.longitude) ||
        formData.longitude < -180 ||
        formData.longitude > 180)
    ) {
      newErrors.longitude = 'Longitude must be a number between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (city, region, country) => {
    const parts = [city, region, country].filter(Boolean);
    return parts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const slug = generateSlug(
        formData.city,
        formData.region,
        formData.country
      );

      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        slug,
      };

      if (editingArea) {
        const updateData = {
          _id: editingArea._id,
          ...submitData,
        };
        await coffeeRoastAreaAPI.updateCoffeeRoastArea(updateData);

        // Update local state
        setRoastAreas((prev) =>
          prev.map((area) =>
            area._id === editingArea._id ? { ...area, ...submitData } : area
          )
        );
        toast.success('Roast area updated successfully!');
      } else {
        const response = await coffeeRoastAreaAPI.createCoffeeRoastArea(
          submitData
        );

        // Add new area to local state
        setRoastAreas((prev) => [...prev, response.data]);
        toast.success('Roast area created successfully!');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving roast area:', error);
      toast.error('Failed to save roast area. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setFormData({
      city: area.city || '',
      region: area.region || '',
      country: area.country || 'Italy',
      latitude: area.latitude ? area.latitude.toString() : '',
      longitude: area.longitude ? area.longitude.toString() : '',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (areaId, areaName) => {
    if (!window.confirm(`Are you sure you want to delete "${areaName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await coffeeRoastAreaAPI.deleteCoffeeRoastArea(areaId);
      setRoastAreas((prev) => prev.filter((area) => area._id !== areaId));
      toast.success('Roast area deleted successfully!');
    } catch (error) {
      console.error('Error deleting roast area:', error);
      toast.error('Failed to delete roast area. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      city: '',
      region: '',
      country: 'Italy',
      latitude: '',
      longitude: '',
    });
    setEditingArea(null);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const exportRoastAreas = () => {
    const csvContent = [
      [
        'City',
        'Region',
        'Country',
        'Latitude',
        'Longitude',
        'Slug',
        'Created Date',
      ],
      ...roastAreas.map((area) => [
        area.city || '',
        area.region || '',
        area.country,
        area.latitude || '',
        area.longitude || '',
        area.slug,
        new Date(area.createdAt).toLocaleDateString(),
      ]),
    ];

    const csvString = csvContent.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coffee_roast_areas_${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAreas = roastAreas.filter(
    (area) =>
      area.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.region?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAreaDisplayName = (area) => {
    const parts = [area.city, area.region, area.country].filter(Boolean);
    return parts.join(', ');
  };

  const areasWithCoordinates = roastAreas.filter(
    (area) => area.latitude && area.longitude
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Coffee Roast Area Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage coffee roasting locations and origins ({roastAreas.length}{' '}
            areas, {areasWithCoordinates.length} with coordinates)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportRoastAreas}
            disabled={loading || roastAreas.length === 0}
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
            Add Roast Area
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search roast areas..."
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
            <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Areas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {roastAreas.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                With Coordinates
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {areasWithCoordinates.length}
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
                {filteredAreas.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roast Areas Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading roast areas...
            </span>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No roast areas found' : 'No roast areas yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first roast area'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAreas.map((area) => (
                  <tr
                    key={area._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getAreaDisplayName(area)}
                          </div>
                          {area.city && area.region && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {area.city}, {area.region}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {area.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {area.latitude && area.longitude ? (
                        <div>
                          <div>
                            {area.latitude.toFixed(4)},{' '}
                            {area.longitude.toFixed(4)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          No coordinates
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {area.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(area.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(area)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit Roast Area"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(area._id, getAreaDisplayName(area))
                          }
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Roast Area"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Roast Area Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingArea ? 'Edit Roast Area' : 'Add New Roast Area'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingArea
                      ? 'Update roast area information'
                      : 'Add a new coffee roasting location'}
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
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.country
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter country name"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.country}
                  </p>
                )}
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region/State
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter region or state"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter city name"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={formData.latitude}
                    onChange={(e) =>
                      handleInputChange('latitude', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.latitude
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., 45.4642"
                  />
                  {errors.latitude && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.latitude}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={formData.longitude}
                    onChange={(e) =>
                      handleInputChange('longitude', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.longitude
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., 9.1900"
                  />
                  {errors.longitude && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {errors.longitude}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Coordinates are optional but help with mapping and location
                services
              </p>

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
                      {editingArea ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingArea ? 'Update Area' : 'Create Area'}
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

export default CoffeeRoastAreaManagement;
