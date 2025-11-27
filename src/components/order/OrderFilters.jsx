// icvng-admin/src/components/order/OrderFilters.jsx
import React from 'react';
import { Search } from 'lucide-react';

const OrderFilters = ({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterMode,
  setFilterMode,
  filterStatus,
  setFilterStatus,
  filterPaymentStatus,
  setFilterPaymentStatus,
  filterWebsiteOrder,
  setFilterWebsiteOrder,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="BTC">BTC</option>
          <option value="BTB">BTB</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterPaymentStatus}
          onChange={(e) => setFilterPaymentStatus(e.target.value)}
        >
          <option value="">Payment Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterWebsiteOrder}
          onChange={(e) => setFilterWebsiteOrder(e.target.value)}
        >
          <option value="">All Sources</option>
          <option value="true">Website Orders</option>
          <option value="false">Admin Orders</option>
        </select>
      </div>
    </div>
  );
};

export default OrderFilters;
