import React, { useState, useEffect } from 'react';
import { nigeriaStatesLgas } from '../../data/nigeria-states-lgas.js';

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

  const updateLocationField = (field, value) => {
    const updatedLocation = { ...location, [field]: value };

    // If updating state, also update city to match if not already set
    if (field === 'state') {
      setSelectedState(value);
      // Reset LGA when state changes
      if (location.lga && updatedLocation.lga) {
        const stateData = nigeriaStatesLgas.find(
          (s) => s.state.toLowerCase() === value.toLowerCase()
        );
        if (stateData && !stateData.lga.includes(updatedLocation.lga)) {
          updatedLocation.lga = '';
        }
      }
    }

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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Main Store, Downtown Branch"
            required
          />
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Street address"
            required
          />
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="">Select State</option>
            {nigeriaStatesLgas.map((state) => (
              <option key={state.state} value={state.state}>
                {state.state}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Local Government Area (LGA) *
          </label>
          <select
            value={location.lga || ''}
            onChange={(e) => updateLocationField('lga', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="City or town name"
            required
          />
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
          Operating Hours
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
      {location.name && location.state && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
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
    </div>
  );
};

export default PickupLocationForm;
