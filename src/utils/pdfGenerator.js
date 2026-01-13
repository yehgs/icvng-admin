// icvng-admin/src/utils/pdfGenerator.js
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import companyLogoPNG from "../assets/web-logo.png";

/**
 * Generate PDF invoice for website orders
 * @param {Object} orderGroup - Order group object with all orders
 * @returns {Promise<Object>}
 */
export const generateOrderPDF = async (orderGroup) => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // ===== HEADER WITH LOGO =====
    try {
      const logoImage = await loadImage(companyLogoPNG);
      doc.addImage(logoImage, "PNG", margin, yPos, 40, 15);
    } catch (error) {
      console.warn("Logo failed to load, continuing without it:", error);
    }

    // Company info (right side)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const companyInfo = [
      "I-COFFEE NIGERIA",
      "www.i-coffee.ng",
      "customercare@i-coffee.ng",
      "+234 803 982 7194",
    ];

    let companyYPos = yPos;
    companyInfo.forEach((line) => {
      doc.text(line, pageWidth - margin, companyYPos, { align: "right" });
      companyYPos += 4.5;
    });

    yPos += 25;

    // ===== INVOICE TITLE =====
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER INVOICE", pageWidth / 2, yPos, { align: "center" });
    yPos += 12;

    // ===== ORDER INFO =====
    const mainOrder = orderGroup.parentOrder || orderGroup.allOrders[0];
    const summary = orderGroup.summary;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");

    // Invoice details - Two column layout with better spacing
    const invoiceDetails = [];

    if (mainOrder.invoiceNumber) {
      invoiceDetails.push(["Invoice Number:", mainOrder.invoiceNumber]);
    }

    invoiceDetails.push(
      ["Order Group ID:", orderGroup.orderGroupId],
      ["Order Date:", formatDate(summary.createdAt)],
      ["Order Status:", summary.order_status],
      ["Payment Status:", summary.payment_status],
      ["Payment Method:", mainOrder.payment_method],
      ["Total Items:", summary.totalItems.toString()]
    );

    const leftCol = margin;
    const rightCol = pageWidth / 2 + 5;
    const labelWidth = 32;
    const valueWidth = 55;

    invoiceDetails.forEach((detail, index) => {
      const x = index % 2 === 0 ? leftCol : rightCol;

      // Label (bold)
      doc.setFont("helvetica", "bold");
      doc.text(detail[0], x, yPos);

      // Value (normal) - with text wrapping for long values
      doc.setFont("helvetica", "normal");
      const valueText = detail[1];
      const splitValue = doc.splitTextToSize(valueText, valueWidth);
      doc.text(splitValue, x + labelWidth, yPos);

      if (index % 2 === 1) yPos += Math.max(5, splitValue.length * 4);
    });

    if (invoiceDetails.length % 2 === 1) yPos += 5;
    yPos += 8;

    // ===== CUSTOMER INFORMATION =====
    checkPageBreak(40);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER INFORMATION", margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const customer = mainOrder.userId;
    const customerInfo = [
      `Name: ${customer?.name || "N/A"}`,
      `Email: ${customer?.email || "N/A"}`,
      `Phone: ${customer?.mobile || "N/A"}`,
    ];

    customerInfo.forEach((info) => {
      doc.text(info, margin, yPos);
      yPos += 5;
    });

    // ✅ DELIVERY ADDRESS - FIXED
    if (mainOrder.delivery_address) {
      yPos += 2;
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Address:", margin, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");

      const address = mainOrder.delivery_address;
      const addressLines = [];

      // ✅ Build address lines - handle both field name variations
      if (address.address_line || address.street) {
        addressLines.push(address.address_line || address.street);
      }
      if (address.city) {
        addressLines.push(address.city);
      }
      if (address.lga) {
        addressLines.push(`LGA: ${address.lga}`);
      }
      if (address.state) {
        addressLines.push(address.state);
      }
      if (address.postal_code || address.postalCode) {
        addressLines.push(
          `Postal Code: ${address.postal_code || address.postalCode}`
        );
      }
      if (address.country) {
        addressLines.push(address.country);
      }

      // ✅ Render address lines with proper wrapping
      addressLines.forEach((line) => {
        const splitLines = doc.splitTextToSize(line, pageWidth - 2 * margin);
        splitLines.forEach((splitLine) => {
          checkPageBreak(5);
          doc.text(splitLine, margin, yPos);
          yPos += 4.5;
        });
      });
    } else {
      // ✅ Show "No address provided" if missing
      yPos += 2;
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Address:", margin, yPos);
      yPos += 5;
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128, 128, 128);
      doc.text("No delivery address provided", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 4.5;
    }

    yPos += 8;

    // ===== ORDER ITEMS TABLE =====
    checkPageBreak(60);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER ITEMS", margin, yPos);
    yPos += 6;

    // Prepare table data
    const tableData = orderGroup.allOrders.map((order) => {
      const product = order.productId;
      return [
        product?.name || "Product",
        order.product_details?.priceOption || "Regular",
        order.quantity.toString(),
        formatCurrencyCompact(order.unitPrice),
        formatCurrencyCompact(order.quantity * order.unitPrice),
      ];
    });

    // Add items table using autoTable
    autoTable(doc, {
      startY: yPos,
      head: [["Product", "Option", "Qty", "Unit Price", "Total"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        fontSize: 9,
      },
      bodyStyles: {
        textColor: 50,
        fontSize: 8,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 65, halign: "left" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
      margin: { left: margin, right: margin },
      didDrawPage: function (data) {
        yPos = data.cursor.y;
      },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ===== TOTALS SECTION =====
    checkPageBreak(50);

    const totals = summary.totals;
    const totalsSectionX = pageWidth - 75;

    doc.setFontSize(9);

    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", totalsSectionX, yPos);
    doc.text(formatCurrencyCompact(totals.subTotal), pageWidth - margin, yPos, {
      align: "right",
    });
    yPos += 5.5;

    // Shipping
    if (totals.totalShipping > 0) {
      doc.text("Shipping:", totalsSectionX, yPos);
      doc.text(
        formatCurrencyCompact(totals.totalShipping),
        pageWidth - margin,
        yPos,
        {
          align: "right",
        }
      );
      yPos += 5.5;
    }

    // Discount
    if (totals.totalDiscount > 0) {
      doc.text("Discount:", totalsSectionX, yPos);
      doc.setTextColor(220, 53, 69);
      doc.text(
        `-${formatCurrencyCompact(totals.totalDiscount)}`,
        pageWidth - margin,
        yPos,
        { align: "right" }
      );
      doc.setTextColor(0, 0, 0);
      yPos += 5.5;
    }

    // Tax
    if (totals.totalTax > 0) {
      doc.text("Tax:", totalsSectionX, yPos);
      doc.text(
        formatCurrencyCompact(totals.totalTax),
        pageWidth - margin,
        yPos,
        {
          align: "right",
        }
      );
      yPos += 5.5;
    }

    // Grand Total (bold and larger)
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.line(totalsSectionX, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", totalsSectionX, yPos);
    doc.setTextColor(40, 167, 69);
    doc.text(
      formatCurrencyCompact(totals.grandTotal),
      pageWidth - margin,
      yPos,
      {
        align: "right",
      }
    );
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // ===== NOTES SECTION =====
    if (mainOrder.notes || mainOrder.customer_notes) {
      checkPageBreak(30);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("NOTES:", margin, yPos);
      yPos += 5;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");

      if (mainOrder.notes) {
        const notesLines = doc.splitTextToSize(
          `Admin Notes: ${mainOrder.notes}`,
          pageWidth - 2 * margin
        );
        notesLines.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, margin, yPos);
          yPos += 4.5;
        });
        yPos += 2;
      }

      if (mainOrder.customer_notes) {
        const customerNotesLines = doc.splitTextToSize(
          `Customer Notes: ${mainOrder.customer_notes}`,
          pageWidth - 2 * margin
        );
        customerNotesLines.forEach((line) => {
          checkPageBreak(5);
          doc.text(line, margin, yPos);
          yPos += 4.5;
        });
      }
      yPos += 5;
    }

    // ===== FOOTER =====
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128, 128, 128);

      doc.text("Thank you for your business!", pageWidth / 2, footerY, {
        align: "center",
      });
      doc.text(
        `Generated on ${new Date().toLocaleString("en-GB")}`,
        pageWidth / 2,
        footerY + 4,
        { align: "center" }
      );

      // Page number
      doc.setFontSize(7.5);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY + 4, {
        align: "right",
      });
    }

    // Save PDF
    const filename = `Order_${orderGroup.orderGroupId}_${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF invoice: " + error.message);
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Load image and return as data URL
 * @param {string} src - Image source
 * @returns {Promise<string>}
 */
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = src;
  });
};

/**
 * Format currency with Naira symbol (compact version for PDF)
 * Uses NGN prefix instead of symbol to avoid encoding issues
 */
const formatCurrencyCompact = (amount) => {
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  // Use "NGN" prefix or you can use the actual symbol
  return `NGN ${formatted}`;
};

/**
 * Format currency with Naira symbol for display
 * This version uses the actual Naira symbol
 */
const formatCurrency = (amount) => {
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  // Using the actual Naira symbol
  return `\u20A6 ${formatted}`;
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default generateOrderPDF;
