// icvng-admin/src/components/order/ShippingAddressDetailsModal.jsx
import React, { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Home,
  Building2,
  Navigation,
  StickyNote,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Layers,
  Hash,
  Map,
  Milestone,
  User,
  Mail,
  ShieldCheck,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const ShippingAddressDetailsModal = ({ address, onClose, customerName }) => {
  const [copiedField, setCopiedField] = useState(null);

  if (!address) return null;

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const openInMaps = () => {
    if (address.coordinates?.latitude && address.coordinates?.longitude) {
      const url = `https://www.google.com/maps?q=${address.coordinates.latitude},${address.coordinates.longitude}`;
      window.open(url, "_blank");
    } else {
      const query = encodeURIComponent(
        [
          address.address_line,
          address.city,
          address.lga,
          address.state,
          "Nigeria",
        ]
          .filter(Boolean)
          .join(", "),
      );
      window.open(`https://www.google.com/maps/search/${query}`, "_blank");
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAddressTypeConfig = (type) => {
    const configs = {
      home: {
        icon: Home,
        label: "Home",
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      },
      office: {
        icon: Building2,
        label: "Office",
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      },
      warehouse: {
        icon: Layers,
        label: "Warehouse",
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      },
      pickup_point: {
        icon: Navigation,
        label: "Pickup Point",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      },
      other: {
        icon: MapPin,
        label: "Other",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      },
    };
    return configs[type] || configs.other;
  };

  const typeConfig = getAddressTypeConfig(address.address_type);
  const TypeIcon = typeConfig.icon;

  const fullAddress = [
    address.address_line,
    address.address_line_2,
    address.area,
    address.city,
    address.lga ? `${address.lga} LGA` : null,
    address.state,
    address.postal_code,
    address.country || "Nigeria",
  ]
    .filter(Boolean)
    .join(", ");

  const CopyButton = ({ text, fieldName }) => (
    <button
      onClick={() => copyToClipboard(text, fieldName)}
      className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
      title={`Copy ${fieldName}`}
    >
      {copiedField === fieldName ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Shipping Address Details
              </h3>
              {customerName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {customerName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                {address.address_line}
              </p>
              {address.address_line_2 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {address.address_line_2}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {[address.area, address.city].filter(Boolean).join(", ")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {address.lga && `${address.lga} LGA, `}
                {address.state}
                {address.postal_code && ` — ${address.postal_code}`}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig.color}`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                {typeConfig.label}
              </span>

              {address.is_primary && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Primary
                </span>
              )}

              {address.is_verified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Open in Maps Button */}
          <button
            onClick={openInMaps}
            className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Google Maps
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <Section
            title="Contact Information"
            icon={
              <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            }
          >
            <div className="grid grid-cols-1 gap-3">
              <InfoRow
                label="Mobile Number"
                value={address.mobile}
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                copyButton={
                  address.mobile ? (
                    <CopyButton text={address.mobile} fieldName="Mobile" />
                  ) : null
                }
              />
              {address.landline && (
                <InfoRow
                  label="Landline"
                  value={address.landline}
                  icon={<Phone className="w-4 h-4 text-gray-400" />}
                  copyButton={
                    <CopyButton text={address.landline} fieldName="Landline" />
                  }
                />
              )}
            </div>
          </Section>

          {/* Full Address Breakdown */}
          <Section
            title="Address Details"
            icon={
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow
                label="Address Line 1"
                value={address.address_line}
                icon={<Home className="w-4 h-4 text-gray-400" />}
                copyButton={
                  <CopyButton text={address.address_line} fieldName="Address" />
                }
                className="sm:col-span-2"
              />
              {address.address_line_2 && (
                <InfoRow
                  label="Address Line 2"
                  value={address.address_line_2}
                  icon={<Home className="w-4 h-4 text-gray-400" />}
                  className="sm:col-span-2"
                />
              )}
              {address.area && (
                <InfoRow
                  label="Area / Ward"
                  value={address.area}
                  icon={<Map className="w-4 h-4 text-gray-400" />}
                />
              )}
              <InfoRow
                label="City / Town"
                value={address.city}
                icon={<Building2 className="w-4 h-4 text-gray-400" />}
              />
              <InfoRow
                label="LGA"
                value={address.lga}
                icon={<Layers className="w-4 h-4 text-gray-400" />}
              />
              <InfoRow
                label="State"
                value={address.state}
                icon={<Globe className="w-4 h-4 text-gray-400" />}
              />
              <InfoRow
                label="Postal Code"
                value={address.postal_code}
                icon={<Hash className="w-4 h-4 text-gray-400" />}
                copyButton={
                  address.postal_code ? (
                    <CopyButton
                      text={address.postal_code}
                      fieldName="Postal Code"
                    />
                  ) : null
                }
              />
              <InfoRow
                label="Country"
                value={address.country || "Nigeria"}
                icon={<Globe className="w-4 h-4 text-gray-400" />}
              />
            </div>

            {/* Full Address Copy Row */}
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Full Address
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                    {fullAddress}
                  </p>
                </div>
                <CopyButton text={fullAddress} fieldName="Full address" />
              </div>
            </div>
          </Section>

          {/* Landmark */}
          {address.landmark && (
            <Section
              title="Landmark"
              icon={
                <Milestone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              }
            >
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Milestone className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-300 flex-1">
                  {address.landmark}
                </p>
                <CopyButton text={address.landmark} fieldName="Landmark" />
              </div>
            </Section>
          )}

          {/* Delivery Instructions / Notes */}
          {address.delivery_instructions && (
            <Section
              title="Delivery Instructions"
              icon={
                <StickyNote className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              }
            >
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <StickyNote className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-900 dark:text-orange-300 leading-relaxed flex-1">
                  {address.delivery_instructions}
                </p>
              </div>
            </Section>
          )}

          {/* GPS Coordinates */}
          {address.coordinates?.latitude && address.coordinates?.longitude && (
            <Section
              title="GPS Coordinates"
              icon={
                <Navigation className="w-4 h-4 text-green-600 dark:text-green-400" />
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <InfoRow
                  label="Latitude"
                  value={address.coordinates.latitude.toFixed(6)}
                  icon={<Navigation className="w-4 h-4 text-gray-400" />}
                />
                <InfoRow
                  label="Longitude"
                  value={address.coordinates.longitude.toFixed(6)}
                  icon={<Navigation className="w-4 h-4 text-gray-400" />}
                />
              </div>
            </Section>
          )}

          {/* Shipping Zone */}
          {address.shipping_zone && (
            <Section
              title="Shipping Zone"
              icon={
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              }
            >
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                    {address.shipping_zone?.name || "Assigned Zone"}
                  </p>
                  {address.shipping_zone?.code && (
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      Code: {address.shipping_zone.code}
                    </p>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Verification & Meta Info */}
          <Section
            title="Address Status"
            icon={
              <ShieldCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {address.is_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Verification
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      address.is_verified
                        ? "text-green-700 dark:text-green-400"
                        : "text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {address.is_verified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </div>

              {address.is_verified && address.verified_at && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Verified At
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(address.verified_at)}
                    </p>
                  </div>
                </div>
              )}

              {address.createdAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added On
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(address.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button
            onClick={openInMaps}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Map className="w-4 h-4" />
            View on Map
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────

const Section = ({ title, icon, children }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {children}
  </div>
);

const InfoRow = ({ label, value, icon, copyButton, className = "" }) => (
  <div
    className={`flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${className}`}
  >
    {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-900 dark:text-white truncate">
        {value || <span className="text-gray-400 italic">Not provided</span>}
      </p>
    </div>
    {copyButton}
  </div>
);

export default ShippingAddressDetailsModal;
