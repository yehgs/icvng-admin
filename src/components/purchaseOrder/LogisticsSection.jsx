// components/PurchaseOrder/LogisticsSection.jsx
import React from 'react';
import { Truck, Plane, Ship, Train } from 'lucide-react';

const LogisticsSection = ({ logistics, updateFormData, currency }) => {
  const transportModes = [
    { value: 'AIR', label: 'Air Freight', icon: Plane },
    { value: 'SEA', label: 'Sea Freight', icon: Ship },
    { value: 'LAND', label: 'Land Transport', icon: Truck },
    { value: 'RAIL', label: 'Rail Transport', icon: Train },
    { value: 'MULTIMODAL', label: 'Multimodal', icon: Truck },
  ];

  const updateLogistics = (field, value) => {
    const newLogistics = {
      ...logistics,
      [field]: field === 'transportMode' ? value : parseFloat(value) || 0,
    };

    // Calculate total logistics cost for cost fields
    if (
      ['freightCost', 'clearanceCost', 'otherLogisticsCost'].includes(field)
    ) {
      newLogistics.totalLogisticsCost =
        (newLogistics.freightCost || 0) +
        (newLogistics.clearanceCost || 0) +
        (newLogistics.otherLogisticsCost || 0);
    }

    updateFormData('logistics', newLogistics);
  };

  const handleTransportModeClick = (value) => {
    updateLogistics('transportMode', value);
  };

  const getCurrencySymbol = () => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      CNY: '¥',
    };
    return symbols[currency?.code] || '$';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5 text-orange-600" />
        Logistics & Shipping
      </h4>

      <div className="space-y-4">
        {/* Transport Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transport Mode
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {transportModes.map((mode) => {
              const IconComponent = mode.icon;
              const isSelected = logistics.transportMode === mode.value;

              return (
                <div
                  key={mode.value}
                  className={`relative p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => handleTransportModeClick(mode.value)}
                >
                  <input
                    type="radio"
                    name="transportMode"
                    value={mode.value}
                    checked={isSelected}
                    onChange={(e) =>
                      updateLogistics('transportMode', e.target.value)
                    }
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center">
                    <IconComponent
                      className={`w-6 h-6 mb-2 ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        isSelected
                          ? 'text-blue-600'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {mode.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Freight Cost ({currency?.code || 'USD'})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={logistics.freightCost || 0}
                onChange={(e) => updateLogistics('freightCost', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clearance Cost ({currency?.code || 'USD'})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={logistics.clearanceCost || 0}
                onChange={(e) =>
                  updateLogistics('clearanceCost', e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Other Logistics Cost ({currency?.code || 'USD'})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">
                {getCurrencySymbol()}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={logistics.otherLogisticsCost || 0}
                onChange={(e) =>
                  updateLogistics('otherLogisticsCost', e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Total Logistics Cost Display */}
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Logistics Cost:
            </span>
            <span className="text-lg font-bold text-orange-600">
              {getCurrencySymbol()}
              {(
                (logistics.freightCost || 0) +
                (logistics.clearanceCost || 0) +
                (logistics.otherLogisticsCost || 0)
              ).toFixed(2)}
            </span>
          </div>

          {/* Breakdown */}
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Freight:</span>
              <span>
                {getCurrencySymbol()}
                {(logistics.freightCost || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Clearance:</span>
              <span>
                {getCurrencySymbol()}
                {(logistics.clearanceCost || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Other:</span>
              <span>
                {getCurrencySymbol()}
                {(logistics.otherLogisticsCost || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Transport Mode Info */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Transport Mode Guidelines
          </h5>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {logistics.transportMode === 'AIR' && (
              <p>
                • Air freight: Fastest but most expensive. Best for urgent or
                high-value items.
              </p>
            )}
            {logistics.transportMode === 'SEA' && (
              <p>
                • Sea freight: Most economical for large volumes. Longer transit
                times.
              </p>
            )}
            {logistics.transportMode === 'LAND' && (
              <p>
                • Land transport: Good for regional deliveries. Moderate cost
                and speed.
              </p>
            )}
            {logistics.transportMode === 'RAIL' && (
              <p>
                • Rail transport: Eco-friendly option for continental shipments.
              </p>
            )}
            {logistics.transportMode === 'MULTIMODAL' && (
              <p>
                • Multimodal: Combination of transport modes for optimal
                cost-efficiency.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsSection;
