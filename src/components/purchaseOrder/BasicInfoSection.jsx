// components/PurchaseOrder/BasicInfoSection.jsx
import React from 'react';
import { Building2, Calendar, Receipt } from 'lucide-react';
import ReceiptUploader from '../common/ReceiptUploader';

const BasicInfoSection = ({ formData, updateFormData, suppliers, minDate }) => {
  const handleSupplierChange = (e) => {
    updateFormData('supplier', e.target.value);
  };

  const handleDeliveryDateChange = (e) => {
    updateFormData('expectedDeliveryDate', e.target.value);
  };

  const handleReceiptsChange = (receipts) => {
    console.log(
      'BasicInfoSection - handleReceiptsChange called with:',
      receipts
    );
    updateFormData('receipts', receipts);
  };

  // Debug formData
  console.log('BasicInfoSection - formData:', formData);
  console.log('BasicInfoSection - formData.receipts:', formData.receipts);

  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        Basic Information
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Supplier *
          </label>
          <select
            required
            className="form-select w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={formData.supplier || ''}
            onChange={handleSupplierChange}
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.name} - {supplier.email}
              </option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              No suppliers available. Please add suppliers first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Expected Delivery Date *
          </label>
          <input
            type="date"
            required
            min={minDate}
            className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={formData.expectedDeliveryDate || ''}
            onChange={handleDeliveryDateChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            Delivery date must be today or later
          </p>
        </div>
      </div>

      {/* Receipt Uploader Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-green-600" />
          Purchase Receipts & Documents
        </h4>
        <ReceiptUploader
          receipts={formData.receipts || []}
          onReceiptsChange={handleReceiptsChange}
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;
