// admin/src/components/logistics/PickupLocationForm.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { nigeriaStatesLgas } from '../../data/nigeria-states-lgas.js';
import { AlertCircle } from 'lucide-react';

const PickupLocationForm = ({
  location,
  index,
  onUpdate,
  onRemove,
  isZoneLocation = false,
  zoneIndex = null,
}) => {
  const [selectedState, setSelectedState] = useState(location?.state || '');
  const [availableLgas, setAvailableLgas] = useState([]);
  const [errors, setErrors] = useState({});

  // Update available LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      const stateData = nigeriaStatesLgas.find(
        (s) => s.state.toLowerCase() === selectedState.toLowerCase()
      );
      if (stateData) {
        setAvailableLgas(stateData.lga);
      } else {
        setAvailableLgas([]);
      }
    } else {
      setAvailableLgas([]);
    }
  }, [selectedState]);

  // Initialize state on component mount
  useEffect(() => {
    if (location?.state && !selectedState) {
      setSelectedState(location.state);
    }
  }, [location?.state]);

  // FIXED: Validate required fields
  const validateLocation = (updatedLocation) => {
    const newErrors = {};

    if (!updatedLocation.name || !updatedLocation.name.trim()) {
      newErrors.name = 'Location name is required';
    }
    if (!updatedLocation.address || !updatedLocation.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!updatedLocation.city || !updatedLocation.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!updatedLocation.state || !updatedLocation.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!updatedLocation.lga || !updatedLocation.lga.trim()) {
      newErrors.lga = 'LGA is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateLocationField = (field, value) => {
    const updatedLocation = { ...location, [field]: value };

    // If updating state, reset LGA
    if (field === 'state') {
      setSelectedState(value);
      // Reset LGA when state changes since available LGAs change
      const stateData = nigeriaStatesLgas.find(
        (s) => s.state.toLowerCase() === value.toLowerCase()
      );
      if (stateData && location.lga && !stateData.lga.includes(location.lga)) {
        updatedLocation.lga = '';
      }
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate before updating
    validateLocation(updatedLocation);

    onUpdate(index, updatedLocation, isZoneLocation, zoneIndex);
  };

  const updateOperatingHours = (day, timeType, value) => {
    const updatedLocation = {
      ...location,
      operatingHours: {
        ...location.operatingHours,
        [day]: {
          ...location.operatingHours[day],
          [timeType]: value,
        },
      },
    };
    onUpdate(index, updatedLocation, isZoneLocation, zoneIndex);
  };

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h6 className="font-medium text-gray-700 dark:text-gray-300">
          Location #{index + 1}
        </h6>
        <button
          type="button"
          onClick={() => onRemove(index, isZoneLocation, zoneIndex)}
          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
        >
          Remove
        </button>
      </div>

      {/* Basic Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location Name *
          </label>
          <input
            type="text"
            value={location.name || ''}
            onChange={(e) => updateLocationField('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.name
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="e.g., Main Store, Downtown Branch"
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={location.phone || ''}
            onChange={(e) => updateLocationField('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="+234 xxx xxx xxxx"
          />
        </div>
      </div>

      {/* Address Info */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address *
          </label>
          <input
            type="text"
            value={location.address || ''}
            onChange={(e) => updateLocationField('address', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.address
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Street address"
            required
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.address}
            </p>
          )}
        </div>
      </div>

      {/* State and LGA Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            State *
          </label>
          <select
            value={selectedState}
            onChange={(e) => updateLocationField('state', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.state
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            required
          >
            <option value="">Select State</option>
            {nigeriaStatesLgas.map((state) => (
              <option key={state.state} value={state.state}>
                {state.state}
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.state}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Local Government Area (LGA) *
          </label>
          <select
            value={location.lga || ''}
            onChange={(e) => updateLocationField('lga', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.lga
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={!selectedState || availableLgas.length === 0}
            required
          >
            <option value="">Select LGA</option>
            {availableLgas.map((lga) => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </select>
          {errors.lga && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.lga}
            </p>
          )}
          {!selectedState && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Please select a state first
            </p>
          )}
        </div>
      </div>

      {/* City and Postal Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City/Town *
          </label>
          <input
            type="text"
            value={location.city || ''}
            onChange={(e) => updateLocationField('city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
              errors.city
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="City or town name"
            required
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.city}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Can be same as LGA or more specific location within the LGA
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Postal Code
          </label>
          <input
            type="text"
            value={location.postalCode || ''}
            onChange={(e) => updateLocationField('postalCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="6-digit postal code"
            maxLength="6"
          />
        </div>
      </div>

      {/* Active Status */}
      <div className="mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={location.isActive !== false}
            onChange={(e) => updateLocationField('isActive', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Active Location
          </span>
        </label>
      </div>

      {/* Operating Hours */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Operating Hours (Optional)
        </label>
        <div className="space-y-2">
          {days.map((day) => (
            <div key={day} className="grid grid-cols-4 gap-2 items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {day}
              </div>
              <input
                type="time"
                value={location.operatingHours?.[day]?.open || ''}
                onChange={(e) =>
                  updateOperatingHours(day, 'open', e.target.value)
                }
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Open"
              />
              <input
                type="time"
                value={location.operatingHours?.[day]?.close || ''}
                onChange={(e) =>
                  updateOperatingHours(day, 'close', e.target.value)
                }
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Close"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {location.operatingHours?.[day]?.open &&
                location.operatingHours?.[day]?.close
                  ? 'Open'
                  : 'Closed'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Leave time fields empty for days when the location is closed
        </p>
      </div>

      {/* Location Summary */}
      {location.name && location.state && location.lga && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
            Location Summary
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>{location.name}</strong>
            <br />
            {location.address && `${location.address}, `}
            {location.city && `${location.city}, `}
            {location.lga && `${location.lga}, `}
            {location.state}
            {location.postalCode && ` ${location.postalCode}`}
            {location.phone && (
              <>
                <br />
                📞 {location.phone}
              </>
            )}
          </p>
        </div>
      )}

      {/* Validation Warning */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                Required Fields Missing
              </h4>
              <p className="text-xs text-red-800 dark:text-red-200">
                Please fill in all required fields: Name, Address, City, State,
                and LGA
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupLocationForm;
