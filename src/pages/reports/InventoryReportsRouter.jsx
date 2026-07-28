//admin
// src/pages/reports/InventoryReportsRouter.jsx
//
// Item #7: /admin/reports/inventory needs to work for BOTH global HQ admins
// (full warehouse-based InventoryReports) and country-scoped/"foreign"
// admins (CountryInventoryReport — product/online-stock only, no warehouse
// internals). Same subRole (e.g. MANAGER) can be either, so the split has
// to be on scope, not subRole — this tiny wrapper is that split point.
import React from "react";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import InventoryReports from "./InventoryReports.jsx";
import CountryInventoryReport from "./CountryInventoryReport.jsx";

export default function InventoryReportsRouter() {
  const { isGlobalAdmin } = useAdminCountry();
  return isGlobalAdmin ? <InventoryReports /> : <CountryInventoryReport />;
}
