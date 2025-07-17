// admin/src/components/logistics/TrackingDetailsModal.jsx
import React from 'react';
import { X, MapPin } from 'lucide-react';
const TrackingDetailsModal = ({ isOpen, onClose, tracking }) => {
  if (!isOpen || !tracking) return null;

  const getStatusColor = (status) => {
    const colors = {
      PENDING:
        'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300',
      PROCESSING:
        'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
      PICKED_UP:
        'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300',
      IN_TRANSIT:
        'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300',
      OUT_FOR_DELIVERY:
        'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300',
      DELIVERED:
        'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300',
      ATTEMPTED:
        'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300',
      RETURNED: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
      LOST: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
      CANCELLED:
        'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      colors[status] ||
      'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
      NORMAL:
        'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
      HIGH: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300',
      URGENT: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
      colors[priority] ||
      'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Tracking Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tracking.trackingNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Current Status
              </h3>
              <span
                className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStatusColor(
                  tracking.status
                )}`}
              >
                {tracking.status.replace('_', ' ')}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Priority Level
              </h3>
              <span
                className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getPriorityColor(
                  tracking.priority
                )}`}
              >
                {tracking.priority}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Carrier
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {tracking.carrier.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tracking.carrier.code}
              </p>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Order ID
                </p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {tracking.orderId?.orderId || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Order Value
                </p>
                <p className="text-lg text-gray-900 dark:text-white">
                  ₦{tracking.orderId?.totalAmt?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Payment Status
                </p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {tracking.orderId?.payment_status || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Shipping Cost
                </p>
                <p className="text-lg text-gray-900 dark:text-white">
                  ₦{tracking.shippingCost?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delivery Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recipient
                </p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {tracking.recipientInfo.name}
                </p>
                {tracking.recipientInfo.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tracking.recipientInfo.phone}
                  </p>
                )}
                {tracking.recipientInfo.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tracking.recipientInfo.email}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Delivery Address
                </p>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {tracking.deliveryAddress.addressLine && (
                    <p>{tracking.deliveryAddress.addressLine}</p>
                  )}
                  <p>
                    {tracking.deliveryAddress.city},{' '}
                    {tracking.deliveryAddress.state}
                  </p>
                  <p>
                    {tracking.deliveryAddress.postalCode}{' '}
                    {tracking.deliveryAddress.country}
                  </p>
                </div>
              </div>
            </div>

            {tracking.deliveryInstructions && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Delivery Instructions
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                  {tracking.deliveryInstructions}
                </p>
              </div>
            )}
          </div>

          {/* Package Information */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Package Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Weight
                </p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {tracking.packageInfo.weight} kg
                </p>
              </div>
              {tracking.packageInfo.dimensions && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Dimensions
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {tracking.packageInfo.dimensions.length} ×{' '}
                    {tracking.packageInfo.dimensions.width} ×{' '}
                    {tracking.packageInfo.dimensions.height}{' '}
                    {tracking.packageInfo.dimensions.unit}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Special Handling
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {tracking.packageInfo.fragile && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
                      Fragile
                    </span>
                  )}
                  {tracking.packageInfo.insured && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      Insured
                    </span>
                  )}
                  {!tracking.packageInfo.fragile &&
                    !tracking.packageInfo.insured && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        None
                      </span>
                    )}
                </div>
              </div>
              {tracking.packageInfo.insured &&
                tracking.packageInfo.insuranceValue && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Insurance Value
                    </p>
                    <p className="text-lg text-gray-900 dark:text-white">
                      ₦{tracking.packageInfo.insuranceValue.toLocaleString()}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Delivery Timeline */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delivery Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Created
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(tracking.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(tracking.createdAt).toLocaleTimeString()}
                </p>
              </div>
              {tracking.estimatedDelivery && (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Estimated Delivery
                  </p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {new Date(tracking.estimatedDelivery).toLocaleDateString()}
                  </p>
                </div>
              )}
              {tracking.actualDelivery && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Actual Delivery
                  </p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {new Date(tracking.actualDelivery).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tracking.actualDelivery).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Events */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tracking Events
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {tracking.trackingEvents.map((event, eventIdx) => {
                  const isLast =
                    eventIdx === tracking.trackingEvents.length - 1;

                  return (
                    <li key={eventIdx}>
                      <div className="relative pb-8">
                        {!isLast && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                                eventIdx === 0
                                  ? 'bg-blue-500 dark:bg-blue-600'
                                  : 'bg-gray-400 dark:bg-gray-600'
                              }`}
                            >
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {event.description}
                              </p>
                              {event.location &&
                                (event.location.city ||
                                  event.location.facility) && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                    <MapPin className="inline w-3 h-3 mr-1" />
                                    {event.location.facility &&
                                      `${event.location.facility}, `}
                                    {event.location.city &&
                                      `${event.location.city}`}
                                    {event.location.state &&
                                      `, ${event.location.state}`}
                                  </p>
                                )}
                              <div className="flex items-center mt-2 space-x-2">
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                                    event.status
                                  )}`}
                                >
                                  {event.status.replace('_', ' ')}
                                </span>
                                {!event.isCustomerVisible && (
                                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    Internal Only
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              <div className="font-medium">
                                {new Date(event.timestamp).toLocaleDateString()}
                              </div>
                              <div>
                                {new Date(event.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </div>
                              {event.updatedBy && (
                                <div className="text-xs mt-1">
                                  by {event.updatedBy.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Notes */}
          {(tracking.internalNotes || tracking.customerNotes) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tracking.internalNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Internal Notes
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      {tracking.internalNotes}
                    </p>
                  </div>
                )}
                {tracking.customerNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Customer Notes
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                      {tracking.customerNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackingDetailsModal;
