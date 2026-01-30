// admin/src/pages/pricing/PricingConfiguration.jsx - PART 1
import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle,
  Clock,
  AlertTriangle,
  Percent,
  DollarSign,
  TrendingUp,
  Loader2,
  History,
  User,
  Calendar,
  Receipt, // NEW: Tax icon
} from "lucide-react";
import toast from "react-hot-toast";
import { pricingAPI, pricingUtils } from "../../utils/api";
import RoleBasedAccess from "../../components/layout/RoleBaseAccess";
import RoleBasedButton from "../../components/layout/RoleBasedButton";

const PricingConfiguration = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [formData, setFormData] = useState({
    margins: {
      salePrice: 15,
      btbPrice: 10,
      btcPrice: 8,
      price3weeksDelivery: 20,
      price5weeksDelivery: 25,
    },
    overheadPercentage: 15,
    taxPercentage: 7.5, // NEW: Tax percentage
    autoUpdateOnExchangeRateChange: true,
  });

  useEffect(() => {
    fetchPricingConfig();
  }, []);

  const fetchPricingConfig = async () => {
    setLoading(true);
    try {
      const data = await pricingAPI.getPricingConfig();
      if (data.success) {
        setConfig(data.data);
        setFormData({
          margins: data.data.margins,
          overheadPercentage: data.data.overheadPercentage,
          taxPercentage: data.data.taxPercentage || 7.5, // NEW
          autoUpdateOnExchangeRateChange:
            data.data.autoUpdateOnExchangeRateChange,
        });
      } else {
        toast.error(data.message || "Failed to fetch pricing configuration");
      }
    } catch (error) {
      console.error("Error fetching pricing config:", error);
      toast.error("Failed to fetch pricing configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleMarginChange = (priceType, value) => {
    setFormData((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        [priceType]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = await pricingAPI.updatePricingConfig(formData);
      if (data.success) {
        toast.success(
          "Pricing configuration updated successfully. Awaiting director approval.",
        );
        await fetchPricingConfig();
      } else {
        toast.error(data.message || "Failed to update pricing configuration");
      }
    } catch (error) {
      console.error("Error updating pricing config:", error);
      toast.error("Failed to update pricing configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setShowApprovalModal(false);
    setSaving(true);
    try {
      const data = await pricingAPI.approvePricingConfig();
      if (data.success) {
        toast.success(
          "Pricing configuration approved successfully! All product prices have been updated.",
        );
        await fetchPricingConfig();
      } else {
        toast.error(data.message || "Failed to approve pricing configuration");
      }
    } catch (error) {
      console.error("Error approving pricing config:", error);
      toast.error("Failed to approve pricing configuration");
    } finally {
      setSaving(false);
    }
  };

  const priceTypes = [
    {
      key: "salePrice",
      label: "Sale Price",
      description: "Standard retail sale price",
    },
    {
      key: "btbPrice",
      label: "BTB Price",
      description: "Business-to-Business price",
    },
    {
      key: "btcPrice",
      label: "BTC Price",
      description: "Business-to-Consumer price",
    },
    {
      key: "price3weeksDelivery",
      label: "3 Weeks Delivery",
      description: "Price for 3 weeks delivery option",
    },
    {
      key: "price5weeksDelivery",
      label: "5 Weeks Delivery",
      description: "Price for 5 weeks delivery option",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading pricing configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Pricing Configuration
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure profit margins, overhead, and tax percentages for
            different price types
          </p>
        </div>

        <div className="flex items-center gap-3">
          {config && (
            <div className="flex items-center gap-4">
              {/* Status Display */}
              <div className="flex items-center gap-2">
                {config.isApproved ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">
                      Pending Approval
                    </span>
                  </div>
                )}
              </div>

              {/* Director Approval Button */}
              {!config.isApproved && (
                <RoleBasedAccess allowedRoles={["DIRECTOR"]}>
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Configuration
                  </button>
                </RoleBasedAccess>
              )}
            </div>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>
      </div>

      {/* Configuration Status */}
      {config && (
        <div
          className={`rounded-lg p-6 ${
            config.isApproved
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                {config.isApproved ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600 mr-3" />
                )}
                <h3
                  className={`text-lg font-semibold ${
                    config.isApproved
                      ? "text-green-900 dark:text-green-200"
                      : "text-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {config.isApproved
                    ? "Configuration Approved"
                    : "Awaiting Director Approval"}
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div
                  className={
                    config.isApproved
                      ? "text-green-700 dark:text-green-300"
                      : "text-yellow-700 dark:text-yellow-300"
                  }
                >
                  <strong>Last Updated:</strong>{" "}
                  {new Date(config.updatedAt).toLocaleString()} by{" "}
                  {config.lastUpdatedBy?.name}
                </div>

                {config.isApproved && config.approvedBy && (
                  <div className="text-green-700 dark:text-green-300">
                    <strong>Approved:</strong>{" "}
                    {new Date(config.approvedAt).toLocaleString()} by{" "}
                    {config.approvedBy.name}
                  </div>
                )}

                {!config.isApproved && (
                  <div className="text-yellow-700 dark:text-yellow-300">
                    <strong>Status:</strong> Configuration changes require
                    Director approval before taking effect. Product prices will
                    be updated automatically after approval.
                  </div>
                )}

                {/* Current Configuration Summary */}
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Current Configuration
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Sale Price:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.margins.salePrice}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        BTB Price:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.margins.btbPrice}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        BTC Price:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.margins.btcPrice}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        3 Weeks:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.margins.price3weeksDelivery}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        5 Weeks:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.margins.price5weeksDelivery}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Overhead:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.overheadPercentage}%
                      </span>
                    </div>
                    {/* NEW: Tax display */}
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Tax:
                      </span>
                      <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                        {config.taxPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Auto-update on exchange rate changes:
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full font-medium ${
                        config.autoUpdateOnExchangeRateChange
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {config.autoUpdateOnExchangeRateChange
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Director Approval Section */}
            {!config.isApproved && (
              <div className="ml-6">
                <RoleBasedAccess allowedRoles={["DIRECTOR"]}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-yellow-300 dark:border-yellow-600 p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Director Approval Required
                    </h4>

                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <p>• Review the configuration changes above</p>
                      <p>
                        • Approval will update all product prices automatically
                      </p>
                      <p>• This action cannot be undone</p>
                    </div>

                    <button
                      onClick={() => setShowApprovalModal(true)}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve & Update All Prices
                    </button>
                  </div>
                </RoleBasedAccess>

                {/* Non-Director Message */}
                <RoleBasedAccess
                  allowedRoles={["ACCOUNTANT", "IT"]}
                  fallback={true}
                >
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="font-medium">Awaiting Approval</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only Directors can approve pricing configuration changes.
                      Contact a Director to review and approve these changes.
                    </p>
                  </div>
                </RoleBasedAccess>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <RoleBasedAccess
        allowedRoles={["ACCOUNTANT", "DIRECTOR", "IT", "MANAGER"]}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profit Margins */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Percent className="h-5 w-5 mr-2" />
              Profit Margins (%)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {priceTypes.map((priceType) => (
                <div key={priceType.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {priceType.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.margins[priceType.key]}
                      onChange={(e) =>
                        handleMarginChange(priceType.key, e.target.value)
                      }
                      className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {priceType.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Overhead & Tax Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Overhead & Tax Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overhead Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={formData.overheadPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        overheadPercentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  General overhead applied to all products before profit margins
                </p>
              </div>

              {/* NEW: Tax Percentage Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Receipt className="h-4 w-4 mr-1" />
                  Tax Percentage (VAT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.taxPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        taxPercentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tax added to all calculated prices (e.g., 7.5% VAT)
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.autoUpdateOnExchangeRateChange}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoUpdateOnExchangeRateChange: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-update on Exchange Rate Change
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically recalculate product prices when exchange rates
                  change
                </p>
              </div>
            </div>
          </div>

          {/* Price Calculation Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Price Calculation Preview (With Tax)
            </h3>

            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <p>
                <strong>Formula:</strong> Final Price = ((Cost + Logistics) × (1
                + Overhead%) × (1 + Profit Margin%)) × (1 + Tax%)
              </p>
              <p className="mb-4">
                <strong>Example:</strong> If cost is ₦1,000 + ₦100 logistics,
                with {formData.overheadPercentage}% overhead and{" "}
                {formData.taxPercentage}% tax:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {priceTypes.slice(0, 3).map((priceType) => {
                  const baseCost = 1100; // 1000 + 100 logistics
                  const withOverhead =
                    baseCost * (1 + formData.overheadPercentage / 100);
                  const withMargin =
                    withOverhead * (1 + formData.margins[priceType.key] / 100);
                  const finalPriceWithTax =
                    withMargin * (1 + formData.taxPercentage / 100);

                  return (
                    <div
                      key={priceType.key}
                      className="bg-white dark:bg-gray-800 rounded p-3"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {priceType.label}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        Before Tax: ₦{withMargin.toLocaleString()}
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ₦{finalPriceWithTax.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        +{formData.margins[priceType.key]}% margin +
                        {formData.taxPercentage}% tax
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <RoleBasedButton disabledRoles={["MANAGER"]}>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </RoleBasedButton>
          </div>
        </form>
      </RoleBasedAccess>

      {/* Configuration History */}
      {showHistory &&
        config?.configHistory &&
        config.configHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <History className="h-5 w-5 mr-2" />
              Configuration History
            </h3>

            <div className="space-y-4">
              {config.configHistory
                .slice(-5)
                .reverse()
                .map((history, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {history.updatedBy?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(history.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Overhead:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {history.overheadPercentage}%
                        </span>
                      </div>
                      {priceTypes.slice(0, 2).map((priceType) => (
                        <div key={priceType.key}>
                          <span className="text-gray-600 dark:text-gray-400">
                            {priceType.label}:
                          </span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">
                            {history.margins[priceType.key]}%
                          </span>
                        </div>
                      ))}
                    </div>

                    {history.approvedBy && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved by {history.approvedBy.name} on{" "}
                          {new Date(history.approvedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Configuration History */}
      {showHistory && config?.configHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <History className="h-5 w-5 mr-2" />
              Configuration History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {config.configHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No configuration history available
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {config.configHistory.map((history, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(history.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {history.changedBy?.name || "Unknown"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Sale:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.margins.salePrice}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        BTB:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.margins.btbPrice}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        BTC:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.margins.btcPrice}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        3 Weeks:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.margins.price3weeksDelivery}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        5 Weeks:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.margins.price5weeksDelivery}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Overhead:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.overheadPercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Tax:
                      </span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {history.taxPercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Auto-Update:
                      </span>
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          history.autoUpdateOnExchangeRateChange
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {history.autoUpdateOnExchangeRateChange ? "On" : "Off"}
                      </span>
                    </div>
                  </div>

                  {history.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {history.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Approve Pricing Configuration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action will update all product prices
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Important Information
                </h4>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  <li>• All product prices will be recalculated immediately</li>
                  <li>• This process may take a few moments</li>
                  <li>• Price history will be preserved</li>
                  <li>
                    • Tax of {config?.taxPercentage || 0}% will be applied to
                    all prices
                  </li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              {config && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    Configuration to be Approved
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-blue-800 dark:text-blue-300">
                      Sale Price: <strong>{config.margins.salePrice}%</strong>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300">
                      BTB Price: <strong>{config.margins.btbPrice}%</strong>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300">
                      BTC Price: <strong>{config.margins.btcPrice}%</strong>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300">
                      3 Weeks:{" "}
                      <strong>{config.margins.price3weeksDelivery}%</strong>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300">
                      5 Weeks:{" "}
                      <strong>{config.margins.price5weeksDelivery}%</strong>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300">
                      Overhead: <strong>{config.overheadPercentage}%</strong>
                    </div>
                    <div className="text-blue-800 dark:text-blue-300">
                      Tax: <strong>{config.taxPercentage || 0}%</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Yes, Approve & Update Prices
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingConfiguration;
