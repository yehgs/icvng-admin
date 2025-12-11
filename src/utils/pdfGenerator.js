// icvng-admin/src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import companyLogo from '../assets/web-logo.svg';

/**
 * Generate PDF invoice for website orders
 * @param {Object} orderGroup - Order group object with all orders
 * @returns {Promise<void>}
 */
export const generateOrderPDF = async (orderGroup) => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
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
      // Convert SVG to base64 or use as is
      const img = new Image();
      img.src = companyLogo;

      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Add logo (adjust dimensions as needed)
          doc.addImage(img, 'SVG', margin, yPos, 40, 15);
          resolve();
        };
        img.onerror = () => {
          console.warn('Logo failed to load, continuing without it');
          resolve(); // Continue even if logo fails
        };
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
    }

    // Company info (right side)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const companyInfo = [
      'I-COFFEE NIGERIA',
      'www.i-coffee.ng',
      'support@i-coffee.ng',
      '+234 XXX XXX XXXX',
    ];

    let companyYPos = yPos;
    companyInfo.forEach((line) => {
      doc.text(line, pageWidth - margin, companyYPos, { align: 'right' });
      companyYPos += 5;
    });

    yPos += 25;

    // ===== INVOICE TITLE =====
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // ===== ORDER INFO =====
    const mainOrder = orderGroup.parentOrder || orderGroup.allOrders[0];
    const summary = orderGroup.summary;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Invoice details box
    const invoiceDetails = [
      ['Order Group ID:', orderGroup.orderGroupId],
      ['Order Date:', formatDate(summary.createdAt)],
      ['Order Status:', summary.order_status],
      ['Payment Status:', summary.payment_status],
      ['Payment Method:', mainOrder.payment_method],
      ['Total Items:', summary.totalItems.toString()],
    ];

    if (mainOrder.invoiceNumber) {
      invoiceDetails.unshift(['Invoice Number:', mainOrder.invoiceNumber]);
    }

    let leftCol = margin;
    let rightCol = pageWidth / 2 + 5;

    invoiceDetails.forEach((detail, index) => {
      const x = index % 2 === 0 ? leftCol : rightCol;
      doc.setFont('helvetica', 'bold');
      doc.text(detail[0], x, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(detail[1], x + 35, yPos);

      if (index % 2 === 1) yPos += 6;
    });

    if (invoiceDetails.length % 2 === 1) yPos += 6;
    yPos += 10;

    // ===== CUSTOMER INFORMATION =====
    checkPageBreak(40);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const customer = mainOrder.userId;
    const customerInfo = [
      `Name: ${customer?.name || 'N/A'}`,
      `Email: ${customer?.email || 'N/A'}`,
      `Phone: ${customer?.mobile || 'N/A'}`,
    ];

    customerInfo.forEach((info) => {
      doc.text(info, margin, yPos);
      yPos += 6;
    });

    // Delivery Address
    if (mainOrder.deliveryAddress || mainOrder.delivery_address) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Delivery Address:', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');

      const address = mainOrder.deliveryAddress || mainOrder.delivery_address;
      const addressLines = [];

      if (address.street) addressLines.push(address.street);
      if (address.city) addressLines.push(address.city);
      if (address.state) addressLines.push(address.state);
      if (address.lga) addressLines.push(`LGA: ${address.lga}`);
      if (address.postalCode)
        addressLines.push(`Postal Code: ${address.postalCode}`);

      addressLines.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 5;
      });
    }

    yPos += 10;

    // ===== ORDER ITEMS TABLE =====
    checkPageBreak(60);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER ITEMS', margin, yPos);
    yPos += 7;

    // Prepare table data
    const tableData = orderGroup.allOrders.map((order) => {
      const product = order.productId;
      return [
        product?.name || 'Product',
        order.product_details?.priceOption || 'Regular',
        order.quantity.toString(),
        formatCurrency(order.unitPrice),
        formatCurrency(order.quantity * order.unitPrice),
      ];
    });

    // Add items table
    doc.autoTable({
      startY: yPos,
      head: [['Product', 'Option', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        textColor: 50,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ===== TOTALS SECTION =====
    checkPageBreak(50);

    const totals = summary.totals;
    const totalsSectionX = pageWidth - 70;

    doc.setFontSize(10);

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsSectionX, yPos);
    doc.text(formatCurrency(totals.subTotal), pageWidth - margin, yPos, {
      align: 'right',
    });
    yPos += 6;

    // Shipping
    if (totals.totalShipping > 0) {
      doc.text('Shipping:', totalsSectionX, yPos);
      doc.text(formatCurrency(totals.totalShipping), pageWidth - margin, yPos, {
        align: 'right',
      });
      yPos += 6;
    }

    // Discount
    if (totals.totalDiscount > 0) {
      doc.text('Discount:', totalsSectionX, yPos);
      doc.setTextColor(220, 53, 69); // Red for discount
      doc.text(
        `-${formatCurrency(totals.totalDiscount)}`,
        pageWidth - margin,
        yPos,
        { align: 'right' }
      );
      doc.setTextColor(0, 0, 0); // Reset to black
      yPos += 6;
    }

    // Tax
    if (totals.totalTax > 0) {
      doc.text('Tax:', totalsSectionX, yPos);
      doc.text(formatCurrency(totals.totalTax), pageWidth - margin, yPos, {
        align: 'right',
      });
      yPos += 6;
    }

    // Grand Total (bold and larger)
    yPos += 3;
    doc.setLineWidth(0.5);
    doc.line(totalsSectionX, yPos, pageWidth - margin, yPos);
    yPos += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL:', totalsSectionX, yPos);
    doc.setTextColor(40, 167, 69); // Green for total
    doc.text(formatCurrency(totals.grandTotal), pageWidth - margin, yPos, {
      align: 'right',
    });
    doc.setTextColor(0, 0, 0); // Reset to black
    yPos += 10;

    // ===== NOTES SECTION =====
    if (mainOrder.notes || mainOrder.customer_notes) {
      checkPageBreak(30);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES:', margin, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      if (mainOrder.notes) {
        const notesLines = doc.splitTextToSize(
          `Admin Notes: ${mainOrder.notes}`,
          pageWidth - 2 * margin
        );
        doc.text(notesLines, margin, yPos);
        yPos += notesLines.length * 5 + 3;
      }

      if (mainOrder.customer_notes) {
        const customerNotesLines = doc.splitTextToSize(
          `Customer Notes: ${mainOrder.customer_notes}`,
          pageWidth - 2 * margin
        );
        doc.text(customerNotesLines, margin, yPos);
        yPos += customerNotesLines.length * 5;
      }
      yPos += 5;
    }

    // ===== FOOTER =====
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);

    doc.text('Thank you for your business!', pageWidth / 2, footerY, {
      align: 'center',
    });
    doc.text(
      `Generated on ${new Date().toLocaleString('en-GB')}`,
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    );

    // Save PDF
    const filename = `Order_${orderGroup.orderGroupId}_${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF invoice');
  }
};

// ===== HELPER FUNCTIONS =====

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount || 0);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default generateOrderPDF;
