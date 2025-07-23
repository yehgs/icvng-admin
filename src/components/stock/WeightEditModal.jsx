import React, { useState, useEffect } from 'react';
import { X, Save, Scale, Package } from 'lucide-react';

const WeightEditModal = ({ isOpen, onClose, product, onSave }) => {
  const [weight, setWeight] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product && isOpen) {
      setWeight(product.weight || 0);
      setError('');
    }
  }, [product, isOpen]);

  const handleWeightChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setWeight(numValue);
    if (error) setError('');
  };

  const validateWeight = () => {
    if (weight < 0) {
      setError('Weight cannot be negative');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateWeight()) return;

    setSaving(true);
    try {
      await onSave(product._id, weight);
    } catch (error) {
      console.error('Error saving weight:', error);
      setError('Failed to save weight');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Scale className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Edit Product Weight
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {product?.name} • {product?.sku}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-12 w-12">
                {product?.image && product.image[0] ? (
                  <img
                    className="h-12 w-12 rounded-lg object-cover"
                    src={product.image[0]}
                    alt={product.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {product?.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SKU: {product?.sku}
                </p>
                <p className="text-xs text-gray-400">
                  {product?.brand?.map((b) => b.name).join(', ')} •{' '}
                  {product?.productType}
                </p>
              </div>
            </div>
          </div>

          {/* Weight Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Weight (kg)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  error
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-medium`}
                placeholder="Enter weight in kg"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                kg
              </div>
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Current Weight Info */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                Current Weight:
              </span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {product?.weight ? `${product.weight} kg` : 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-blue-700 dark:text-blue-300">
                New Weight:
              </span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {weight} kg
              </span>
            </div>
          </div>

          {/* Notice */}
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Weight Update Permission
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Warehouse staff can update product weights without additional
              approval.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !!error}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Weight'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightEditModal;
