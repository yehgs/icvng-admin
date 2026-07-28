//admin
// src/pages/reports/CountryInventoryReport.jsx
//
// Item #7 — the full InventoryReports.jsx page depends entirely on
// /warehouse/stock-summary and /stock/expiring, both HQ-only (warehouse
// custody is centrally managed, not a per-country concern). That meant a
// country-scoped admin hit a hard 403 wall instead of "an inventory report
// that concerns them, their country only."
//
// This is a lighter, self-contained report built entirely from
// /product/get-admin — which already respects countryScope (see
// getProductControllerAdmin in server/controllers/product.controller.js) —
// so it shows exactly what's relevant to a country-scoped admin: their
// market's product catalog and online stock levels, with partnerStock
// already folded in as online stock (see item #5). No warehouse/offline
// stock data is requested or shown here.
import React, { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle, TrendingDown, RefreshCw, Search, Globe } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  return res.json();
}

function onlineStockOf(p) {
  return p.partnerStock?.enabled ? (p.partnerStock?.quantity || 0) : (p.warehouseStock?.onlineStock || 0);
}

export default function CountryInventoryReport() {
  const { t } = useAdminTranslation();
  const { countryScope } = useAdminCountry();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Country scoping happens server-side (req.countryScope) — this page
      // never needs to pass a country param, it just gets what it's allowed.
      const res = await apiFetch("/product/get-admin", {
        method: "POST",
        body: JSON.stringify({ page: 1, limit: 500 }),
      });
      if (res.success) setProducts(res.data || []);
      else toast.error(res.message || "Failed to load inventory");
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.publish === "PUBLISHED").length;
  const outOfStock = products.filter((p) => onlineStockOf(p) <= 0).length;
  const lowStock = products.filter((p) => { const s = onlineStockOf(p); return s > 0 && s <= 5; }).length;
  const partnerManaged = products.filter((p) => p.partnerStock?.enabled).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" /> {t("nav.inventoryReports") || "Inventory Report"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <Globe className="w-4 h-4" /> Scoped to {countryScope} — online stock only
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Products", value: totalProducts, icon: Package, color: "blue" },
          { label: "Published", value: publishedProducts, icon: Package, color: "green" },
          { label: "Low Stock", value: lowStock, icon: TrendingDown, color: "amber" },
          { label: "Out of Stock", value: outOfStock, icon: AlertTriangle, color: "red" },
          { label: "Partner Stock", value: partnerManaged, icon: Package, color: "purple" },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <card.icon className={`w-5 h-5 text-${card.color}-500 mb-2`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Online Stock</th>
                <th className="px-4 py-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No products found.</td></tr>
              )}
              {filtered.map((p) => {
                const stock = onlineStockOf(p);
                return (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.publish}</td>
                    <td className={`px-4 py-3 font-medium ${stock <= 0 ? "text-red-500" : stock <= 5 ? "text-amber-500" : "text-gray-700 dark:text-gray-300"}`}>
                      {stock}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {p.partnerStock?.enabled ? "Partner" : "Warehouse"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
