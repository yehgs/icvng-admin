import React from 'react';

const OrderTable = ({
  orders,
  loading,
  currentUser,
  onViewOrder,
  onEditOrder,
  onGenerateInvoice,
  formatCurrency,
  formatDate,
}) => {
  const getStatusBadge = (status, type = 'order') => {
    const statusClasses = {
      order: {
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        CONFIRMED:
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        PROCESSING:
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        SHIPPED:
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        DELIVERED:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      },
      payment: {
        PENDING:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        REFUNDED:
          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        PARTIAL:
          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      },
    };

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[type][status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type & Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading orders...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-gray-500">No orders found</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          📦
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.orderId}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          📅 {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 text-lg">
                        {order.customerId?.customerType === 'BTB' ? '🏢' : '👤'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.customerId?.displayName ||
                            order.customerId?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {order.customerId?.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.orderType === 'BTB'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {order.orderType}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.orderMode === 'ONLINE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {order.orderMode === 'ONLINE' ? '🌐' : '📱'}{' '}
                          {order.orderMode}
                        </span>
                        {order.isWebsiteOrder && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                            WEB
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white flex items-center">
                      💰 {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.totalItems || order.items?.length || 0} items
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(order.orderStatus, 'order')}
                      {getStatusBadge(order.paymentStatus, 'payment')}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {order.isWebsiteOrder
                        ? 'Website'
                        : order.createdBy?.name || 'Unknown'}
                    </div>
                    {order.invoiceGenerated && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Invoice: {order.invoiceNumber}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-lg"
                        title="View details"
                      >
                        👁️
                      </button>

                      {currentUser?.subRole === 'SALES' &&
                        !order.invoiceGenerated && (
                          <button
                            onClick={() => onGenerateInvoice(order._id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-lg"
                            title="Generate invoice"
                          >
                            🧾
                          </button>
                        )}

                      <button
                        onClick={() => onEditOrder(order)}
                        className="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 text-lg"
                        title="Edit order"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
