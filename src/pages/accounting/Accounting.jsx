import React from 'react';
import { Calculator, DollarSign, CreditCard, Receipt } from 'lucide-react';

const Accounting = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-600 to-teal-600 rounded-full mb-6 shadow-lg">
          <Calculator className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Accounting & Finance
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Manage financial records, invoices, expenses, and generate financial
          reports. Coming soon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <DollarSign className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Revenue Tracking
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor income streams and financial performance
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <Receipt className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Expense Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track and categorize business expenses
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <CreditCard className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Invoicing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate and manage customer invoices
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
            Coming Soon
          </h4>
          <p className="text-green-800 dark:text-green-300 text-sm">
            Comprehensive accounting features are in development. Expected
            release: Q1 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
