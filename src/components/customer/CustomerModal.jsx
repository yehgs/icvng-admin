// src/components/customer/CustomerModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Building2 } from 'lucide-react';
import { customerAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import ImageUploader from '../common/ImageUploader';
import { nigeriaStatesLgas } from '../../data/nigeria-states-lgas';

const CustomerModal = ({ isOpen, onClose, onSuccess, customer }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    image: '',
    customerType: 'BTC',
    customerMode: 'OFFLINE',
    companyName: '',
    registrationNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      lga: '',
      postalCode: '',
    },
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedStateLgas, setSelectedStateLgas] = useState([]);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        mobile: customer.mobile || '',
        image: customer.image || '',
        customerType: customer.customerType || 'BTC',
        customerMode: customer.customerMode || 'OFFLINE',
        companyName: customer.companyName || '',
        registrationNumber: customer.registrationNumber || '',
        address: {
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          lga: customer.address?.lga || '',
          postalCode: customer.address?.postalCode || '',
        },
        notes: customer.notes || '',
      });

      // Set LGAs for the selected state
      if (customer.address?.state) {
        const stateData = nigeriaStatesLgas.find(
          (s) => s.state === customer.address.state
        );
        setSelectedStateLgas(stateData?.lga || []);
      }
    }
  }, [customer]);

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const stateData = nigeriaStatesLgas.find((s) => s.state === selectedState);

    setFormData({
      ...formData,
      address: {
        ...formData.address,
        state: selectedState,
        lga: '', // Reset LGA when state changes
      },
    });

    setSelectedStateLgas(stateData?.lga || []);
  };

const handleImageChange = (images) => {
  console.log('=== CUSTOMER IMAGE UPLOAD DEBUG ===');
  console.log('1. Images parameter received:', images);
  console.log('2. Type:', typeof images);
  console.log('3. Is Array?', Array.isArray(images));
  console.log('4. Length (if array):', Array.isArray(images) ? images.length : 'N/A');
  
  try {
    let imageUrl = '';
    
    // Handle array format (expected from ImageUploader)
    if (Array.isArray(images)) {
      if (images.length > 0) {
        imageUrl = images[0];
        console.log('5. Extracted image URL from array:', imageUrl);
      } else {
        console.log('5. Empty array received');
      }
    } 
    // Handle direct string format (fallback)
    else if (typeof images === 'string' && images.length > 0) {
      imageUrl = images;
      console.log('5. Direct string URL received:', imageUrl);
    }
    // Handle null/undefined
    else if (!images) {
      console.log('5. No images provided (null/undefined)');
    }
    // Unexpected format
    else {
      console.warn('5. Unexpected image format:', images);
    }
    
    console.log('6. Final URL to set in formData:', imageUrl);
    
    // Update state
    setFormData((prev) => {
      const newData = { ...prev, image: imageUrl };
      console.log('7. Updated formData state:', newData);
      return newData;
    });
    
    // User feedback
    if (imageUrl) {
      console.log('8. ✅ Image set successfully');
      toast.success('Image uploaded successfully!');
    } else {
      console.log('8. ⚠️ No valid image URL to set');
    }
    
  } catch (error) {
    console.error('❌ Error in handleImageChange:', error);
    toast.error('Failed to process image');
  }
  
  console.log('=== END IMAGE UPLOAD DEBUG ===');
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation
      if (formData.customerType === 'BTB') {
        if (!formData.companyName || !formData.registrationNumber) {
          toast.error(
            'Company name and registration number (CAC) are required for BTB customers'
          );
          setSubmitting(false);
          return;
        }
      }

      // Validate state and LGA if provided
      if (formData.address.state && !formData.address.lga) {
        toast.error('Please select an LGA for the selected state');
        setSubmitting(false);
        return;
      }

      const response = customer
        ? await customerAPI.updateCustomer(customer._id, formData)
        : await customerAPI.createCustomer(formData);

      if (response.success) {
        toast.success(
          customer
            ? 'Customer updated successfully'
            : 'Customer created successfully'
        );
        onSuccess();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {customer ? 'Edit Customer' : 'Create New Customer'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
         <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Customer Image (Optional)
  </label>
  <ImageUploader
    images={formData.image ? [formData.image] : []}
    onImagesChange={handleImageChange}
    multiple={false}
    maxImages={1}
  />
  
  {/* DEBUG: Show current image state */}
  {formData.image && (
    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
      <p className="text-xs text-green-700 dark:text-green-300 font-medium">
        ✓ Image uploaded successfully
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-all">
        URL: {formData.image}
      </p>
    </div>
  )}
  
  {!formData.image && (
    <p className="text-xs text-gray-500 mt-2">
      No image uploaded yet
    </p>
  )}
</div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile *
              </label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Type *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.customerType}
                onChange={(e) =>
                  setFormData({ ...formData, customerType: e.target.value })
                }
              >
                <option value="BTC">BTC (Business to Consumer)</option>
                <option value="BTB">BTB (Business to Business)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Mode *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.customerMode}
                onChange={(e) =>
                  setFormData({ ...formData, customerMode: e.target.value })
                }
              >
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>

          {/* BTB specific fields */}
          {formData.customerType === 'BTB' && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                  Business Information
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Registration Number (CAC) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., RC123456"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Street"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value },
                  })
                }
              />
              <input
                type="text"
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />

              {/* State Select */}
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.state}
                onChange={handleStateChange}
              >
                <option value="">Select State</option>
                {nigeriaStatesLgas.map((stateData) => (
                  <option key={stateData.state} value={stateData.state}>
                    {stateData.state}
                  </option>
                ))}
              </select>

              {/* LGA Select */}
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.lga}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, lga: e.target.value },
                  })
                }
                disabled={!formData.address.state}
              >
                <option value="">Select LGA</option>
                {selectedStateLgas.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Postal Code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address.postalCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      postalCode: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {customer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;