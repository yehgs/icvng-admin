import React, { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  Package,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import RoleBasedAccess from '../../components/layout/RoleBaseAccess';
import { pricingAPI, pricingUtils } from '../../utils/api';
import RoleBasedButton from '../../components/layout/RoleBasedButton';

const PriceCalculation = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [calculatedPrices, setCalculatedPrices] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      // Use the pricing API utility to fetch delivered purchase orders
      const data = await pricingAPI.getDeliveredPurchaseOrders();

      if (data.success) {
        setPurchaseOrders(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch purchase orders');
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error(error.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePrices = async (poId) => {
    setCalculating(true);
    try {
      const data = await pricingAPI.calculatePricesFromPurchaseOrder(poId);

      if (data.success) {
        setCalculatedPrices(data.data);
        setSelectedPO(poId);
        setShowPreview(true);
        toast.success('Prices calculated successfully!');
      } else {
        toast.error(data.message || 'Failed to calculate prices');
      }
    } catch (error) {
      console.error('Error calculating prices:', error);
      toast.error(error.message || 'Failed to calculate prices');
    } finally {
      setCalculating(false);
    }
  };

  const handleApprovePrices = async () => {
    if (!calculatedPrices || !selectedPO) return;

    setApproving(true);
    try {
      const calculatedItems = calculatedPrices.calculatedItems.map((item) => ({
        productId: item.product._id,
        calculations: item.calculations,
      }));

      // Validate the data before sending
      pricingUtils.validatePricingData(calculatedItems);

      const approvalData = {
        purchaseOrderId: selectedPO,
        calculatedItems,
      };

      const data = await pricingAPI.approvePriceCalculations(approvalData);

      if (data.success) {
        toast.success('Prices approved and products updated successfully!');
        setShowPreview(false);
        setCalculatedPrices(null);
        setSelectedPO(null);
        fetchPurchaseOrders();
      } else {
        toast.error(data.message || 'Failed to approve prices');
      }
    } catch (error) {
      console.error('Error approving prices:', error);
      toast.error(error.message || 'Failed to approve prices');
    } finally {
      setApproving(false);
    }
  };

  const formatCurrency = (amount) => {
    return pricingUtils.formatCurrency(amount);
  };

  const formatNumber = (number) => {
    return pricingUtils.formatNumber(number);
  };

  const PricePreviewModal = () => {
    if (!calculatedPrices || !showPreview) return null;

    const { purchaseOrder, calculatedItems, pricingConfig } = calculatedPrices;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Price Calculation Preview
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Purchase Order: {purchaseOrder.orderNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RoleBasedAccess allowedRoles={['Director']}>
                  <button
                    onClick={handleApprovePrices}
                    disabled={approving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {approving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {approving ? 'Approving...' : 'Approve Prices'}
                  </button>
                </RoleBasedAccess>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Purchase Order Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Exchange Rate
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  1 {purchaseOrder.currency} ={' '}
                  {formatCurrency(purchaseOrder.exchangeRate)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                  Total Logistics Cost
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(purchaseOrder.totalLogisticsCost)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Logistics Cost Per Unit
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(purchaseOrder.logisticsCostPerUnit)}
                </p>
              </div>
            </div>

            {/* Pricing Configuration Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Applied Pricing Configuration
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Sale Price:
                  </span>
                  <span className="ml-2 font-medium">
                    {pricingConfig.margins.salePrice}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    BTB Price:
                  </span>
                  <span className="ml-2 font-medium">
                    {pricingConfig.margins.btbPrice}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    BTC Price:
                  </span>
                  <span className="ml-2 font-medium">
                    {pricingConfig.margins.btcPrice}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    3 Weeks:
                  </span>
                  <span className="ml-2 font-medium">
                    {pricingConfig.margins.price3weeksDelivery}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    5 Weeks:
                  </span>
                  <span className="ml-2 font-medium">
                    {pricingConfig.margins.price5weeksDelivery}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Overhead:
                  </span>
                  <span className="ml-2 font-medium">
                    {pricingConfig.overheadPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Calculated Items */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Calculated Prices ({calculatedItems.length} items)
              </h4>

              {calculatedItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-6"
                >
                  {/* Product Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {item.product.sku} | Quantity:{' '}
                        {formatNumber(item.quantity)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Product Type
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.product.productType}
                      </p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Analysis */}
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-3">
                        Cost Breakdown
                      </h6>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Unit Cost (
                            {item.calculations.costBreakdown.originalCurrency}):
                          </span>
                          <span className="font-medium">
                            {formatNumber(
                              item.calculations.costBreakdown
                                .unitCostInOriginalCurrency
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Exchange Rate:
                          </span>
                          <span className="font-medium">
                            {formatNumber(
                              item.calculations.costBreakdown.exchangeRate
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Unit Cost (NGN):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              item.calculations.costBreakdown.unitCostInNaira
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Logistics Cost:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              item.calculations.costBreakdown
                                .freightAndClearingCostPerUnit
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total Cost:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              item.calculations.costBreakdown.totalCostPerUnit
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Overhead (
                            {item.calculations.costBreakdown.overheadPercentage}
                            %):
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              item.calculations.costBreakdown.overheadAmount
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                          <span className="text-gray-900 dark:text-white">
                            Sub Price:
                          </span>
                          <span className="text-blue-600">
                            {formatCurrency(
                              item.calculations.costBreakdown.subPrice
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Calculated Prices */}
                    <div>
                      <h6 className="font-medium text-gray-900 dark:text-white mb-3">
                        Final Prices
                      </h6>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Sale Price:
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(
                              item.calculations.calculatedPrices.salePrice
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            BTB Price:
                          </span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(
                              item.calculations.calculatedPrices.btbPrice
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            BTC Price:
                          </span>
                          <span className="font-semibold text-purple-600">
                            {formatCurrency(
                              item.calculations.calculatedPrices.btcPrice
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            3 Weeks Delivery:
                          </span>
                          <span className="font-semibold text-orange-600">
                            {formatCurrency(
                              item.calculations.calculatedPrices
                                .price3weeksDelivery
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            5 Weeks Delivery:
                          </span>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(
                              item.calculations.calculatedPrices
                                .price5weeksDelivery
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading purchase orders...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Calculator className="h-6 w-6 mr-2" />
            Price Calculation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Calculate product prices from delivered purchase orders
          </p>
        </div>

        <button
          onClick={fetchPurchaseOrders}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Purchase Orders List */}
      {purchaseOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Purchase Orders Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No delivered purchase orders available for price calculation
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              Purchase orders must have "DELIVERED" status to be available for
              pricing.
            </p>
            <p>Check the Purchase Orders section to update order statuses.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Available Purchase Orders ({purchaseOrders.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Order Number
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Supplier
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Currency
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Items
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Total Cost
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Delivered Date
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr
                      key={po._id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {po.orderNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600 dark:text-gray-400">
                          {po.supplier?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {po.currency}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600 dark:text-gray-400">
                          {po.items?.length || 0} items
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {po.currency}{' '}
                          {formatNumber(po.grandTotal || po.totalAmount || 0)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(
                            po.receivedDate || po.updatedAt
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RoleBasedButton disabledRoles={['MANAGER']}>
                          <button
                            onClick={() => handleCalculatePrices(po._id)}
                            disabled={calculating}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {calculating && selectedPO === po._id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calculating...
                              </>
                            ) : (
                              <>
                                <Calculator className="h-4 w-4" />
                                Calculate
                              </>
                            )}
                          </button>
                        </RoleBasedButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Price Preview Modal */}
      <PricePreviewModal />
    </div>
  );
};

export default PriceCalculation;
