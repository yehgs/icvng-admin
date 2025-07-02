// components/PurchaseOrder/OrderSummary.jsx
import React from 'react';
import { Calculator, DollarSign } from 'lucide-react';

const OrderSummary = ({ totals, currency, supportedCurrencies }) => {
  const getCurrencySymbol = () => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      CNY: '¥',
    };
    return symbols[currency?.code] || '$';
  };

  const getCurrencyName = () => {
    if (supportedCurrencies && supportedCurrencies.length > 0) {
      const curr = supportedCurrencies.find((c) => c.code === currency?.code);
      return curr ? curr.name : currency?.code || 'USD';
    }

    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      NGN: 'Nigerian Naira',
      CNY: 'Chinese Yuan',
    };
    return names[currency?.code] || currency?.code || 'USD';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-green-600" />
        Order Summary
      </h4>

      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
        {/* Currency Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>
              Currency: {getCurrencyName()} ({currency?.code || 'USD'})
            </span>
          </div>
          {currency?.code !== 'NGN' && (
            <div>
              Exchange Rate: 1 {currency?.code || 'USD'} = ₦
              {currency?.exchangeRate || 1}
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">
              Items Subtotal:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {getCurrencySymbol()}
              {totals.subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">
              Total Logistics:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {getCurrencySymbol()}
              {totals.totalLogistics.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Grand Total:
              </span>
              <span className="text-xl font-bold text-green-600">
                {getCurrencySymbol()}
                {totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* NGN Conversion */}
          {currency?.code !== 'NGN' && (
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span>In Nigerian Naira:</span>
              <span className="font-medium">
                ₦
                {totals.grandTotalInNaira.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Logistics %:</span>{' '}
              {totals.subtotal > 0
                ? ((totals.totalLogistics / totals.subtotal) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div>
              <span className="font-medium">Total Items:</span>{' '}
              {totals.totalItems || 0}
            </div>
          </div>
        </div>

        {/* Warning for high logistics costs */}
        {totals.subtotal > 0 &&
          totals.totalLogistics / totals.subtotal > 0.3 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>High Logistics Cost:</strong> Logistics costs represent{' '}
                {((totals.totalLogistics / totals.subtotal) * 100).toFixed(1)}%
                of item costs. Consider reviewing transport mode or
                consolidating orders.
              </p>
            </div>
          )}

        {/* Cost savings info */}
        {totals.totalLogistics === 0 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>No Logistics Costs:</strong> This order has no additional
              shipping or logistics fees.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
