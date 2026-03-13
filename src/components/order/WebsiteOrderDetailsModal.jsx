// icvng-admin/src/components/order/WebsiteOrderDetailsModal.jsx
import React, { useState } from "react";
import { adminOrderAPI } from "../../utils/api";
import { generateOrderPDF } from "../../utils/pdfGenerator";
import toast from "react-hot-toast";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  Truck,
  Globe,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Send,
  ExternalLink,
  CheckCircle,
  Hash,
  Layers,
  ShieldCheck,
  Map,
  Navigation,
  Home,
  Building2,
  StickyNote,
  Milestone,
  Clock,
  Copy,
  Download,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    amount || 0,
  );

const formatDate = (date, long = false) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─────────────────────────────────────────────────────────────
// Rider Delivery Slip PDF generator (self-contained, no server)
// ─────────────────────────────────────────────────────────────
const generateAddressPDF = async (
  address,
  customerName,
  orderGroupId,
  mainOrder,
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  const ln = (extra = 0) => {
    y += 5 + extra;
  };
  const rule = (color = [200, 200, 200]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };
  const label = (text, value, indent = 0) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(text, margin + indent, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(
      value || "—",
      pageWidth - margin * 2 - indent - 28,
    );
    doc.text(lines, margin + indent + 28, y);
    y += Math.max(5, lines.length * 4.5);
  };

  // ── Header ──
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("DELIVERY SLIP", pageWidth / 2, 10, { align: "center" });
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("I-COFFEE NIGERIA  •  i-coffee.ng", pageWidth / 2, 15, {
    align: "center",
  });
  y = 24;

  // ── Recipient ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text("DELIVER TO", margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(customerName || "—", margin, y);
  y += 6;

  if (address.mobile) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`📞  ${address.mobile}`, margin, y);
    y += 5.5;
  }
  if (address.landline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Tel: ${address.landline}`, margin, y);
    y += 5;
  }
  y += 2;
  rule([41, 128, 185]);

  // ── Address ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(41, 128, 185);
  doc.text("ADDRESS", margin, y);
  y += 6;
  doc.setTextColor(30, 30, 30);

  const addrLines = [
    address.address_line,
    address.address_line_2,
    address.area,
    address.city,
    address.lga ? `${address.lga} LGA` : null,
    address.state,
    address.postal_code ? `Postal Code: ${address.postal_code}` : null,
    address.country || "Nigeria",
  ].filter(Boolean);

  addrLines.forEach((line) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const split = doc.splitTextToSize(line, pageWidth - margin * 2);
    doc.text(split, margin, y);
    y += split.length * 5;
  });

  y += 2;
  rule();

  // ── Landmark & Instructions ──
  if (address.landmark) {
    doc.setFillColor(255, 248, 220);
    doc.setDrawColor(230, 180, 0);
    doc.roundedRect(
      margin,
      y - 1,
      pageWidth - margin * 2,
      5 +
        doc.splitTextToSize(address.landmark, pageWidth - margin * 2 - 22)
          .length *
          4.5,
      2,
      2,
      "FD",
    );
    label("📍 Landmark:", address.landmark, 0);
    y += 2;
  }

  if (address.delivery_instructions) {
    doc.setFillColor(255, 245, 235);
    doc.setDrawColor(230, 130, 0);
    const instLines = doc.splitTextToSize(
      address.delivery_instructions,
      pageWidth - margin * 2 - 22,
    );
    doc.roundedRect(
      margin,
      y - 1,
      pageWidth - margin * 2,
      5 + instLines.length * 4.5,
      2,
      2,
      "FD",
    );
    label("📋 Instructions:", address.delivery_instructions, 0);
    y += 2;
  }

  rule();

  // ── Order reference ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(41, 128, 185);
  doc.text("ORDER REFERENCE", margin, y);
  y += 6;

  label("Group ID:", orderGroupId);
  if (mainOrder?.orderId) label("Order ID:", mainOrder.orderId);
  if (mainOrder?.invoiceNumber) label("Invoice #:", mainOrder.invoiceNumber);
  label("Date:", formatDate(mainOrder?.createdAt, true));

  // GPS if available
  if (address.coordinates?.latitude && address.coordinates?.longitude) {
    y += 2;
    rule();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(41, 128, 185);
    doc.text("GPS COORDINATES", margin, y);
    y += 6;
    label("Lat:", address.coordinates.latitude.toFixed(6));
    label("Lng:", address.coordinates.longitude.toFixed(6));

    const mapsUrl = `https://maps.google.com/?q=${address.coordinates.latitude},${address.coordinates.longitude}`;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    const urlLines = doc.splitTextToSize(mapsUrl, pageWidth - margin * 2);
    doc.text(urlLines, margin, y);
    y += urlLines.length * 4;
  }

  // ── Footer ──
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generated ${new Date().toLocaleString("en-GB")}  •  customercare@i-coffee.ng  •  +234 803 982 7194`,
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  const filename = `DeliverySlip_${orderGroupId}_${Date.now()}.pdf`;
  doc.save(filename);
  return { success: true, filename };
};

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];
const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "PENDING_BANK_TRANSFER",
  "FAILED",
  "REFUNDED",
  "PARTIAL",
];

const ORDER_STATUS_COLORS = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  PROCESSING:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  SHIPPED:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  DELIVERED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  RETURNED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const PAYMENT_STATUS_COLORS = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  PENDING_BANK_TRANSFER:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  PARTIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

// ─────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, type = "order" }) => {
  const colorMap =
    type === "order" ? ORDER_STATUS_COLORS : PAYMENT_STATUS_COLORS;
  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${colorMap[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const SectionTitle = ({
  icon: Icon,
  title,
  iconClass = "text-gray-500 dark:text-gray-400",
}) => (
  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
    <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />
    {title}
  </h4>
);

const SummaryLine = ({ label, value, bold, valueClass, icon: Icon }) => (
  <div className="flex items-center justify-between text-sm">
    <span
      className={`flex items-center gap-1.5 ${bold ? "font-semibold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </span>
    <span
      className={`font-medium ${bold ? "text-base font-bold text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"} ${valueClass || ""}`}
    >
      {value}
    </span>
  </div>
);

const OrderStatusSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
  >
    {ORDER_STATUSES.map((s) => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
  </select>
);

const PaymentStatusSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
  >
    {PAYMENT_STATUSES.map((s) => (
      <option key={s} value={s}>
        {s.replace(/_/g, " ")}
      </option>
    ))}
  </select>
);

// ─────────────────────────────────────────────────────────────
// Shipping Address Details Modal (nested, z-[60])
// ─────────────────────────────────────────────────────────────
const ShippingAddressDetailsModal = ({
  address,
  customerName,
  onClose,
  orderGroupId,
  mainOrder,
}) => {
  const [copied, setCopied] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);

  if (!address) return null;

  const handleDownloadSlip = async () => {
    try {
      setSlipLoading(true);
      await generateAddressPDF(address, customerName, orderGroupId, mainOrder);
      toast.success("Delivery slip downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate delivery slip");
    } finally {
      setSlipLoading(false);
    }
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const openMaps = () => {
    const { latitude, longitude } = address.coordinates || {};
    if (latitude && longitude) {
      window.open(
        `https://www.google.com/maps?q=${latitude},${longitude}`,
        "_blank",
      );
    } else {
      const q = encodeURIComponent(
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
      window.open(`https://www.google.com/maps/search/${q}`, "_blank");
    }
  };

  const addressTypeConfig = {
    home: {
      icon: Home,
      label: "Home",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
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
  const typeCfg =
    addressTypeConfig[address.address_type] || addressTypeConfig.other;
  const TypeIcon = typeCfg.icon;

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

  const CopyBtn = ({ text, label }) => (
    <button
      onClick={() => copy(text, label)}
      className="ml-auto flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      title={`Copy ${label}`}
    >
      {copied === label ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400" />
      )}
    </button>
  );

  const InfoRow = ({ label, value, icon: Icon, copyText }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
      {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
          {label}
        </p>
        <p className="text-sm text-gray-900 dark:text-white break-words">
          {value || (
            <span className="text-gray-400 italic text-xs">Not provided</span>
          )}
        </p>
      </div>
      {copyText && value && <CopyBtn text={copyText} label={label} />}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Shipping Address
              </h3>
              {customerName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
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

        {/* Hero */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
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
              <button
                onClick={openMaps}
                className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Google Maps
              </button>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeCfg.color}`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                {typeCfg.label}
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
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Contact */}
          <div>
            <SectionTitle
              icon={Phone}
              title="Contact"
              iconClass="text-blue-600 dark:text-blue-400"
            />
            <div className="space-y-2">
              <InfoRow
                label="Mobile"
                value={address.mobile}
                icon={Phone}
                copyText={address.mobile}
              />
              {address.landline && (
                <InfoRow
                  label="Landline"
                  value={address.landline}
                  icon={Phone}
                  copyText={address.landline}
                />
              )}
            </div>
          </div>

          {/* Address breakdown */}
          <div>
            <SectionTitle
              icon={MapPin}
              title="Address Details"
              iconClass="text-indigo-600 dark:text-indigo-400"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="sm:col-span-2">
                <InfoRow
                  label="Address Line 1"
                  value={address.address_line}
                  icon={Home}
                  copyText={address.address_line}
                />
              </div>
              {address.address_line_2 && (
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Address Line 2"
                    value={address.address_line_2}
                    icon={Home}
                  />
                </div>
              )}
              {address.area && (
                <InfoRow label="Area / Ward" value={address.area} icon={Map} />
              )}
              <InfoRow
                label="City / Town"
                value={address.city}
                icon={Building2}
              />
              <InfoRow label="LGA" value={address.lga} icon={Layers} />
              <InfoRow label="State" value={address.state} icon={Globe} />
              <InfoRow
                label="Postal Code"
                value={address.postal_code}
                icon={Hash}
                copyText={address.postal_code}
              />
              <InfoRow
                label="Country"
                value={address.country || "Nigeria"}
                icon={Globe}
              />
            </div>
            {/* Full address copy block */}
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Full Address
                </p>
                <p className="text-sm text-gray-900 dark:text-white leading-relaxed break-words">
                  {fullAddress}
                </p>
              </div>
              <CopyBtn text={fullAddress} label="Full address" />
            </div>
          </div>

          {/* Landmark */}
          {address.landmark && (
            <div>
              <SectionTitle
                icon={Milestone}
                title="Landmark"
                iconClass="text-amber-600 dark:text-amber-400"
              />
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Milestone className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-300 flex-1">
                  {address.landmark}
                </p>
                <CopyBtn text={address.landmark} label="Landmark" />
              </div>
            </div>
          )}

          {/* Delivery Instructions */}
          {address.delivery_instructions && (
            <div>
              <SectionTitle
                icon={StickyNote}
                title="Delivery Instructions"
                iconClass="text-orange-600 dark:text-orange-400"
              />
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <StickyNote className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-900 dark:text-orange-300 leading-relaxed flex-1">
                  {address.delivery_instructions}
                </p>
              </div>
            </div>
          )}

          {/* GPS */}
          {address.coordinates?.latitude && address.coordinates?.longitude && (
            <div>
              <SectionTitle
                icon={Navigation}
                title="GPS Coordinates"
                iconClass="text-green-600 dark:text-green-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <InfoRow
                  label="Latitude"
                  value={address.coordinates.latitude.toFixed(6)}
                  icon={Navigation}
                />
                <InfoRow
                  label="Longitude"
                  value={address.coordinates.longitude.toFixed(6)}
                  icon={Navigation}
                />
              </div>
            </div>
          )}

          {/* Shipping Zone */}
          {address.shipping_zone && (
            <div>
              <SectionTitle
                icon={Layers}
                title="Shipping Zone"
                iconClass="text-purple-600 dark:text-purple-400"
              />
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                    {address.shipping_zone?.name || "Assigned Zone"}
                  </p>
                  {address.shipping_zone?.code && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Code: {address.shipping_zone.code}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <SectionTitle icon={ShieldCheck} title="Address Status" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
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
                    className={`text-sm font-medium ${address.is_verified ? "text-green-700 dark:text-green-400" : "text-yellow-700 dark:text-yellow-400"}`}
                  >
                    {address.is_verified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </div>
              {address.createdAt && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Added On
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(address.createdAt, true)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={openMaps}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Map className="w-4 h-4" />
              View on Map
            </button>
            <button
              onClick={handleDownloadSlip}
              disabled={slipLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              title="Download rider delivery slip PDF"
            >
              {slipLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Rider Slip
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// WebsiteOrderDetailsModal
// ─────────────────────────────────────────────────────────────
const WebsiteOrderDetailsModal = ({
  orderGroup,
  onClose,
  onUpdate,
  currentUser,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [updateMode, setUpdateMode] = useState("collective"); // 'collective' | 'individual'
  const [updating, setUpdating] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expandProducts, setExpandProducts] = useState(true);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Collective form state
  const [collectiveForm, setCollectiveForm] = useState({
    order_status: orderGroup?.summary?.order_status || "PENDING",
    payment_status: orderGroup?.summary?.payment_status || "PENDING",
    notes: "",
  });

  // Per-order form state
  const [perOrderForm, setPerOrderForm] = useState(() => {
    const m = {};
    orderGroup?.allOrders?.forEach((o) => {
      m[o._id] = {
        order_status: o.order_status,
        payment_status: o.payment_status,
        notes: o.admin_notes || "",
      };
    });
    return m;
  });

  if (!orderGroup) return null;

  const mainOrder = orderGroup.parentOrder || orderGroup.allOrders[0];
  const hasMultiple = orderGroup.summary.totalItems > 1;
  const deliveryAddr = mainOrder?.delivery_address;

  // ── Permissions ───────────────────────────────────────────
  const canUpdate = ["IT", "MANAGER", "DIRECTOR", "SALES"].includes(
    currentUser?.subRole,
  );
  const canGenInvoice =
    currentUser?.subRole === "SALES" && !mainOrder?.invoiceGenerated;

  // ── Handlers ─────────────────────────────────────────────
  const handleCollectiveUpdate = async () => {
    try {
      setUpdating(true);
      await Promise.all(
        orderGroup.allOrders.map((o) =>
          adminOrderAPI.updateOrderStatus(o._id, collectiveForm),
        ),
      );
      toast.success(
        `Updated ${orderGroup.allOrders.length} order${orderGroup.allOrders.length > 1 ? "s" : ""}`,
      );
      setEditMode(false);
      onUpdate();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleIndividualUpdate = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one order");
      return;
    }
    try {
      setUpdating(true);
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          adminOrderAPI.updateOrderStatus(id, perOrderForm[id]),
        ),
      );
      toast.success(`Updated ${selectedIds.size} order(s)`);
      setEditMode(false);
      setSelectedIds(new Set());
      onUpdate();
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleInvoice = async (sendEmail = false) => {
    try {
      setInvoiceLoading(true);
      const res = await adminOrderAPI.generateInvoice(mainOrder._id, sendEmail);
      if (res.success) {
        toast.success(
          sendEmail ? "Invoice generated & sent" : "Invoice generated",
        );
        onUpdate();
      }
    } catch (err) {
      toast.error(err.message || "Invoice failed");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      await generateOrderPDF(orderGroup);
      toast.success("Invoice PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const toggleOrderId = (id) => {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  };

  const toggleAllIds = () =>
    setSelectedIds(
      selectedIds.size === orderGroup.allOrders.length
        ? new Set()
        : new Set(orderGroup.allOrders.map((o) => o._id)),
    );

  const updatePerOrder = (id, field, val) =>
    setPerOrderForm((p) => ({ ...p, [id]: { ...p[id], [field]: val } }));

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedIds(new Set());
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto flex flex-col">
          {/* ── Sticky Header ── */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Order Details
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {orderGroup.orderGroupId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Hero Banner ── */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  Order Group
                </p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono break-all">
                  {orderGroup.orderGroupId}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(orderGroup.summary.createdAt, true)}
                </p>
                {mainOrder?.invoiceNumber && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                    <FileText className="w-3.5 h-3.5" />
                    Invoice:{" "}
                    <span className="font-mono font-medium">
                      {mainOrder.invoiceNumber}
                    </span>
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Grand Total
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(orderGroup.summary.totals.grandTotal)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {orderGroup.summary.totalItems} item
                  {orderGroup.summary.totalItems !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mt-4">
              <StatusBadge
                status={orderGroup.summary.order_status}
                type="order"
              />
              <StatusBadge
                status={orderGroup.summary.payment_status}
                type="payment"
              />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Globe className="w-3 h-3" />
                Website Order
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                <CreditCard className="w-3 h-3" />
                {mainOrder?.payment_method?.replace(/_/g, " ")}
              </span>
              {mainOrder?.orderType && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                  {mainOrder.orderType}
                </span>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-6 space-y-8 flex-1">
            {/* Customer + Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <div>
                <SectionTitle
                  icon={User}
                  title="Customer Information"
                  iconClass="text-blue-600 dark:text-blue-400"
                />
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {mainOrder?.userId?.name || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Website Customer
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    {mainOrder?.userId?.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {mainOrder.userId.email}
                        </span>
                      </p>
                    )}
                    {mainOrder?.userId?.mobile && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {mainOrder.userId.mobile}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <SectionTitle
                  icon={MapPin}
                  title="Delivery Address"
                  iconClass="text-indigo-600 dark:text-indigo-400"
                />
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 h-full">
                  {deliveryAddr ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                        {deliveryAddr.address_line}
                      </p>
                      {deliveryAddr.address_line_2 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {deliveryAddr.address_line_2}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {[deliveryAddr.area, deliveryAddr.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {deliveryAddr.lga && `${deliveryAddr.lga} LGA, `}
                        {deliveryAddr.state}
                        {deliveryAddr.postal_code &&
                          ` — ${deliveryAddr.postal_code}`}
                      </p>
                      {deliveryAddr.mobile && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          {deliveryAddr.mobile}
                        </p>
                      )}
                      {deliveryAddr.landmark && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-1.5 mt-2">
                          <span className="font-semibold whitespace-nowrap">
                            Landmark:
                          </span>
                          {deliveryAddr.landmark}
                        </div>
                      )}
                      {deliveryAddr.delivery_instructions && (
                        <div className="flex items-start gap-1.5 text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2.5 py-1.5">
                          <span className="font-semibold whitespace-nowrap">
                            Note:
                          </span>
                          <span className="line-clamp-2">
                            {deliveryAddr.delivery_instructions}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setShowAddrModal(true)}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-xs font-medium"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Full Address Details
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        No delivery address recorded
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            {mainOrder?.shipping_details && (
              <div>
                <SectionTitle
                  icon={Truck}
                  title="Shipping Details"
                  iconClass="text-orange-600 dark:text-orange-400"
                />
                <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {mainOrder.shipping_details?.method_name && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                          Method
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {mainOrder.shipping_details.method_name}
                        </p>
                      </div>
                    )}
                    {mainOrder.shipping_details?.carrier?.name && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                          Carrier
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {mainOrder.shipping_details.carrier.name}
                        </p>
                      </div>
                    )}
                    {mainOrder.tracking_number && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                          Tracking #
                        </p>
                        <p className="font-mono text-xs font-medium text-gray-900 dark:text-white">
                          {mainOrder.tracking_number}
                        </p>
                      </div>
                    )}
                    {mainOrder.estimated_delivery && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                          Est. Delivery
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(
                            mainOrder.estimated_delivery,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {mainOrder.actual_delivery && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                          Delivered
                        </p>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          {new Date(
                            mainOrder.actual_delivery,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Details */}
            {mainOrder?.bank_transfer_details?.reference && (
              <div>
                <SectionTitle
                  icon={CreditCard}
                  title="Bank Transfer Details"
                  iconClass="text-green-600 dark:text-green-400"
                />
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
                  {mainOrder.bank_transfer_details.bankName && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bank
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {mainOrder.bank_transfer_details.bankName}
                      </p>
                    </div>
                  )}
                  {mainOrder.bank_transfer_details.accountName && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Account Name
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {mainOrder.bank_transfer_details.accountName}
                      </p>
                    </div>
                  )}
                  {mainOrder.bank_transfer_details.accountNumber && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Account Number
                      </p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">
                        {mainOrder.bank_transfer_details.accountNumber}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reference
                    </p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">
                      {mainOrder.bank_transfer_details.reference}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle
                  icon={Package}
                  title={`Products (${orderGroup.summary.totalItems})`}
                  iconClass="text-green-600 dark:text-green-400"
                />
                {hasMultiple && (
                  <button
                    onClick={() => setExpandProducts((v) => !v)}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium -mt-3"
                  >
                    {expandProducts ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Expand
                      </>
                    )}
                  </button>
                )}
              </div>

              {expandProducts && (
                <div className="space-y-3">
                  {orderGroup.allOrders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 flex items-start gap-4"
                    >
                      {/* Product image */}
                      <div className="w-16 h-16 bg-white dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        {order.productId?.image?.[0] ? (
                          <img
                            src={order.productId.image[0]}
                            alt={order.productId.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {order.productId?.name ||
                                order.product_details?.name ||
                                "Unknown Product"}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                              {order.orderId}
                            </p>
                            <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                              <span>
                                Qty:{" "}
                                <strong className="text-gray-900 dark:text-white">
                                  {order.quantity || 1}
                                </strong>
                              </span>
                              <span>
                                Unit:{" "}
                                <strong className="text-gray-900 dark:text-white">
                                  {formatCurrency(order.unitPrice)}
                                </strong>
                              </span>
                              {order.product_details?.priceOption &&
                                order.product_details.priceOption !==
                                  "regular" && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full font-medium">
                                    {order.product_details.priceOption}
                                  </span>
                                )}
                              {order.productId?.sku && (
                                <span className="text-gray-400 font-mono">
                                  SKU: {order.productId.sku}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatCurrency(order.totalAmt)}
                            </p>
                            <div className="flex flex-col items-end gap-1 mt-1.5">
                              <StatusBadge
                                status={order.order_status}
                                type="order"
                              />
                              <StatusBadge
                                status={order.payment_status}
                                type="payment"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <SectionTitle
                icon={FileText}
                title="Order Summary"
                iconClass="text-green-600 dark:text-green-400"
              />
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-2.5">
                <SummaryLine
                  label="Subtotal"
                  value={formatCurrency(orderGroup.summary.totals.subTotal)}
                />
                {orderGroup.summary.totals.totalShipping > 0 && (
                  <SummaryLine
                    label="Shipping"
                    value={formatCurrency(
                      orderGroup.summary.totals.totalShipping,
                    )}
                    icon={Truck}
                  />
                )}
                {orderGroup.summary.totals.totalTax > 0 && (
                  <SummaryLine
                    label="Tax"
                    value={formatCurrency(orderGroup.summary.totals.totalTax)}
                  />
                )}
                {orderGroup.summary.totals.totalDiscount > 0 && (
                  <SummaryLine
                    label="Discount"
                    value={`−${formatCurrency(orderGroup.summary.totals.totalDiscount)}`}
                    valueClass="text-green-600 dark:text-green-400"
                  />
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2.5 mt-1">
                  <SummaryLine
                    label="Grand Total"
                    value={formatCurrency(orderGroup.summary.totals.grandTotal)}
                    bold
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            {(mainOrder?.notes ||
              mainOrder?.customer_notes ||
              mainOrder?.admin_notes) && (
              <div>
                <SectionTitle icon={StickyNote} title="Notes" />
                <div className="space-y-2">
                  {mainOrder.customer_notes && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        Customer Note
                      </p>
                      <p className="text-sm text-blue-900 dark:text-blue-300">
                        {mainOrder.customer_notes}
                      </p>
                    </div>
                  )}
                  {mainOrder.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Order Note
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {mainOrder.notes}
                      </p>
                    </div>
                  )}
                  {mainOrder.admin_notes && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                        Admin Note
                      </p>
                      <p className="text-sm text-amber-900 dark:text-amber-300">
                        {mainOrder.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Status Update ── */}
            {canUpdate && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle
                    icon={Edit}
                    title="Update Order Status"
                    iconClass="text-orange-600 dark:text-orange-400"
                  />
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors -mt-3"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Status
                    </button>
                  )}
                </div>

                {editMode && (
                  <div className="space-y-5">
                    {/* Mode tabs */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                      {["collective", "individual"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setUpdateMode(m)}
                          className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${
                            updateMode === m
                              ? "bg-blue-600 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                        >
                          {m} Update
                        </button>
                      ))}
                    </div>

                    {updateMode === "collective" ? (
                      /* ── Collective ── */
                      <>
                        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            Applies the same status to all{" "}
                            <strong>{orderGroup.allOrders.length}</strong> order
                            {orderGroup.allOrders.length > 1 ? "s" : ""} in this
                            group.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Order Status
                            </label>
                            <OrderStatusSelect
                              value={collectiveForm.order_status}
                              onChange={(v) =>
                                setCollectiveForm((p) => ({
                                  ...p,
                                  order_status: v,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Payment Status
                            </label>
                            <PaymentStatusSelect
                              value={collectiveForm.payment_status}
                              onChange={(v) =>
                                setCollectiveForm((p) => ({
                                  ...p,
                                  payment_status: v,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Admin Notes
                          </label>
                          <textarea
                            rows={3}
                            value={collectiveForm.notes}
                            onChange={(e) =>
                              setCollectiveForm((p) => ({
                                ...p,
                                notes: e.target.value,
                              }))
                            }
                            placeholder="Internal notes…"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleCollectiveUpdate}
                            disabled={updating}
                            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
                          >
                            {updating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating…
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Update All
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ── Individual ── */
                      <>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                          <p className="text-xs text-blue-800 dark:text-blue-300">
                            {selectedIds.size} of {orderGroup.allOrders.length}{" "}
                            selected
                          </p>
                          <button
                            onClick={toggleAllIds}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {selectedIds.size === orderGroup.allOrders.length
                              ? "Deselect All"
                              : "Select All"}
                          </button>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-0.5">
                          {orderGroup.allOrders.map((order) => {
                            const isSel = selectedIds.has(order._id);
                            return (
                              <div
                                key={order._id}
                                className={`border-2 rounded-xl p-4 transition-colors ${
                                  isSel
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() => toggleOrderId(order._id)}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1.5">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {order.productId?.name || "Product"}
                                        </p>
                                        <p className="text-xs text-gray-400 font-mono">
                                          {order.orderId}
                                        </p>
                                      </div>
                                      <div className="flex flex-col gap-1 items-end">
                                        <StatusBadge
                                          status={order.order_status}
                                          type="order"
                                        />
                                        <StatusBadge
                                          status={order.payment_status}
                                          type="payment"
                                        />
                                      </div>
                                    </div>

                                    {isSel && (
                                      <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Order Status
                                          </label>
                                          <OrderStatusSelect
                                            value={
                                              perOrderForm[order._id]
                                                .order_status
                                            }
                                            onChange={(v) =>
                                              updatePerOrder(
                                                order._id,
                                                "order_status",
                                                v,
                                              )
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Payment Status
                                          </label>
                                          <PaymentStatusSelect
                                            value={
                                              perOrderForm[order._id]
                                                .payment_status
                                            }
                                            onChange={(v) =>
                                              updatePerOrder(
                                                order._id,
                                                "payment_status",
                                                v,
                                              )
                                            }
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Notes
                                          </label>
                                          <textarea
                                            rows={2}
                                            value={
                                              perOrderForm[order._id].notes
                                            }
                                            onChange={(e) =>
                                              updatePerOrder(
                                                order._id,
                                                "notes",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Notes for this item…"
                                            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleIndividualUpdate}
                            disabled={updating || selectedIds.size === 0}
                            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
                          >
                            {updating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating…
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Update ({selectedIds.size})
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sticky Footer ── */}
          <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 rounded-b-xl flex-shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
              Updated: {formatDate(mainOrder?.updatedAt)}
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              {/* Download PDF – available to all roles */}
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 text-xs font-medium transition-colors"
                title="Download order invoice as PDF"
              >
                {pdfLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download PDF
              </button>
              {canGenInvoice && mainOrder?.userId?.email && (
                <button
                  onClick={() => handleInvoice(true)}
                  disabled={invoiceLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-xs font-medium transition-colors"
                >
                  {invoiceLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Invoice
                </button>
              )}
              {canGenInvoice && (
                <button
                  onClick={() => handleInvoice(false)}
                  disabled={invoiceLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 text-xs font-medium transition-colors"
                >
                  {invoiceLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  Generate Invoice
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nested: Shipping Address Modal ── */}
      {showAddrModal && deliveryAddr && (
        <ShippingAddressDetailsModal
          address={deliveryAddr}
          customerName={mainOrder?.userId?.name}
          orderGroupId={orderGroup.orderGroupId}
          mainOrder={mainOrder}
          onClose={() => setShowAddrModal(false)}
        />
      )}
    </>
  );
};

export default WebsiteOrderDetailsModal;
