// components/order/InvoicePreviewModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, Download, Mail } from 'lucide-react';
import { adminOrderAPI, handleApiError } from '../../utils/api';
import toast from 'react-hot-toast';

const InvoicePreviewModal = ({
  isOpen,
  onClose,
  formData,
  selectedCustomer,
  totals,
}) => {
  const [loading, setLoading] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState('');

  useEffect(() => {
    if (isOpen && formData && selectedCustomer) {
      fetchInvoicePreview();
    }
  }, [isOpen]);

  const fetchInvoicePreview = async () => {
    try {
      setLoading(true);

      const previewData = {
        customerId: formData.customerId,
        items: formData.items
          .filter((item) => item.productId && item.quantity > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity) || 1,
            priceOption: item.priceOption,
          })),
        orderType: formData.orderType,
        orderMode: formData.orderMode,
        paymentMethod: formData.paymentMethod,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes,
        customerNotes: formData.customerNotes,
        discountAmount: parseFloat(formData.discountAmount) || 0,
        taxAmount: parseFloat(formData.taxAmount) || 0,
        shippingCost: parseFloat(formData.shippingCost) || 0,
      };

      const response = await adminOrderAPI.previewInvoice(previewData);

      if (response.success) {
        setInvoiceHTML(response.data.html);
      } else {
        toast.error(response.message || 'Failed to generate invoice preview');
      }
    } catch (error) {
      console.error('Error fetching invoice preview:', error);
      toast.error(handleApiError(error, 'Failed to load invoice preview'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invoice Preview
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Preview invoice before creating the order
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Generating invoice preview...
              </p>
            </div>
          ) : invoiceHTML ? (
            <div className="p-6">
              <div
                className="bg-white rounded-lg shadow-lg"
                dangerouslySetInnerHTML={{ __html: invoiceHTML }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                No invoice preview available
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formData.sendInvoiceEmail && selectedCustomer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>Invoice will be sent to: {selectedCustomer.email}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;
