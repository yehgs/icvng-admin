// icvng-admin/src/components/order/OrderFilters.jsx
import React from 'react';
import { Search } from 'lucide-react';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

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
  const { t } = useAdminTranslation();
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
          <option value="">{t("orders.allTypes")}</option>
          <option value="BTC">BTC</option>
          <option value="BTB">BTB</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
        >
          <option value="">{t("customer.allModes")}</option>
          <option value="ONLINE">{t("customer.online")}</option>
          <option value="OFFLINE">{t("customer.offline")}</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">{t("products.allStatus")}</option>
          <option value="PENDING">{t("orders.statuses.Pending")}</option>
          <option value="CONFIRMED">{t("orders.statuses.Confirmed")}</option>
          <option value="PROCESSING">{t("orders.statuses.Processing")}</option>
          <option value="SHIPPED">{t("orders.statuses.Shipped")}</option>
          <option value="DELIVERED">{t("orders.statuses.Delivered")}</option>
          <option value="CANCELLED">{t("orders.statuses.Cancelled")}</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterPaymentStatus}
          onChange={(e) => setFilterPaymentStatus(e.target.value)}
        >
          <option value="">{t("order.paymentStatus")}</option>
          <option value="PENDING">{t("orders.statuses.Pending")}</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">{t("orders.statuses.FAILED")}</option>
          <option value="REFUNDED">{t("orders.statuses.Refunded")}</option>
        </select>

        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterWebsiteOrder}
          onChange={(e) => setFilterWebsiteOrder(e.target.value)}
        >
          <option value="">{t("order.allSources")}</option>
          <option value="true">{t("order.websiteOrders")}</option>
          <option value="false">{t("order.adminOrders")}</option>
        </select>
      </div>
    </div>
  );
};

export default OrderFilters;
