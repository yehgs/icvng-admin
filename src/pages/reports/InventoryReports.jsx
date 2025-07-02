import React from 'react';
import { FileText, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-6 shadow-lg">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Reports & Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Generate comprehensive reports and analyze business performance.
          Advanced analytics coming soon!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <BarChart3 className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Sales Reports
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track sales performance and revenue trends
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <PieChart className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              User Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyze user behavior and engagement metrics
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Business Intelligence
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced analytics and forecasting
            </p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
            Coming Soon
          </h4>
          <p className="text-purple-800 dark:text-purple-300 text-sm">
            Advanced reporting features are being developed. Expected release:
            Q4 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
