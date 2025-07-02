import React from 'react';
import { BarChart3, FileText } from 'lucide-react';

const PricingReports = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pricing Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze pricing performance and profit margins
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      <div className="card p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Pricing Reports
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Pricing reporting functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingReports;
