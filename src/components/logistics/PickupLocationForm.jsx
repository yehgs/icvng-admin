import React from 'react';

const PickupLocationForm = ({
  location,
  index,
  onUpdate,
  onRemove,
  isZoneLocation = false,
  zoneIndex = null,
}) => {
  const updateLocationField = (field, value) => {
    const updatedLocation = { ...location, [field]: value };
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City *
          </label>
          <input
            type="text"
            value={location.city || ''}
            onChange={(e) => updateLocationField('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="City"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            State *
          </label>
          <input
            type="text"
            value={location.state || ''}
            onChange={(e) => updateLocationField('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="State"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Postal Code
          </label>
          <input
            type="text"
            value={location.postalCode || ''}
            onChange={(e) => updateLocationField('postalCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Postal code"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={location.isActive !== false}
              onChange={(e) =>
                updateLocationField('isActive', e.target.checked)
              }
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active Location
            </span>
          </label>
        </div>
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
      </div>
    </div>
  );
};

export default PickupLocationForm;
