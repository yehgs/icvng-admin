// components/PurchaseOrder/ItemsSection.jsx
import React, { useState } from 'react';
import { Plus, Trash2, Package, Search } from 'lucide-react';
import ProductSearchModal from './ProductSearchModal';

const ItemsSection = ({ items, updateItems, currency }) => {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchingForIndex, setSearchingForIndex] = useState(null);

  console.log('=== ITEMS SECTION RENDER DEBUG ===');
  console.log('ItemsSection rendered with items:', items);
  console.log('Items details:');
  items.forEach((item, index) => {
    console.log(`Item ${index}:`, {
      product: item.product,
      productDetails: item.productDetails ? 'EXISTS' : 'NULL',
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
    });
  });
  console.log('=== END RENDER DEBUG ===');

  const addItem = () => {
    const newItem = {
      product: '',
      productDetails: null,
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
    };
    const newItems = [...items, newItem];
    console.log('Adding new item, new items array:', newItems); // Debug log
    updateItems(newItems);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      console.log('Removing item at index', index, 'new items:', newItems); // Debug log
      updateItems(newItems);
    }
  };

  const updateItem = (index, field, value) => {
    console.log(`=== UPDATE ITEM DEBUG ===`);
    console.log(`Updating item ${index}, field ${field}, value:`, value);
    console.log('Current items before update:', items);
    console.log('Items length:', items.length);
    console.log('Index valid?', index >= 0 && index < items.length);

    if (index < 0 || index >= items.length) {
      console.error('Invalid index:', index, 'Items length:', items.length);
      return;
    }

    const newItems = [...items];
    const oldItem = { ...newItems[index] };
    newItems[index] = { ...newItems[index], [field]: value };

    console.log('Old item:', oldItem);
    console.log('New item:', newItems[index]);

    // Recalculate total cost when quantity or unit cost changes
    if (field === 'quantity' || field === 'unitCost') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitCost = parseFloat(newItems[index].unitCost) || 0;
      newItems[index].totalCost = quantity * unitCost;
      console.log('Recalculated total cost:', newItems[index].totalCost);
    }

    console.log('Final items array to pass to updateItems:', newItems);
    console.log('=== END UPDATE DEBUG ===');

    updateItems(newItems);
  };

  const handleProductSelect = (product) => {
    console.log('=== PRODUCT SELECTION DEBUG ===');
    console.log('Product selected:', product);
    console.log('For item index:', searchingForIndex);
    console.log('Current items:', items);

    if (
      searchingForIndex !== null &&
      searchingForIndex >= 0 &&
      searchingForIndex < items.length
    ) {
      // Update all fields in a single operation to avoid state batching issues
      const newItems = [...items];
      const currentItem = { ...newItems[searchingForIndex] };

      // Update the item with all new values at once
      newItems[searchingForIndex] = {
        ...currentItem,
        product: product._id,
        productDetails: product,
        unitCost: product.price || currentItem.unitCost,
        totalCost:
          (product.price || currentItem.unitCost) * currentItem.quantity,
      };

      console.log('Updated item:', newItems[searchingForIndex]);
      console.log('Full updated items array:', newItems);

      updateItems(newItems);
      setSearchingForIndex(null);
      setShowProductSearch(false);
    } else {
      console.error(
        'Invalid searchingForIndex:',
        searchingForIndex,
        'Items length:',
        items.length
      );
    }
    console.log('=== END PRODUCT SELECTION DEBUG ===');
  };

  const openProductSearch = (index) => {
    console.log('Opening product search for item index:', index); // Debug log
    setSearchingForIndex(index);
    setShowProductSearch(true);
  };

  const getCurrencySymbol = () => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      CNY: '¥',
    };
    return symbols[currency?.code] || '';
  };

  return (
    <>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Order Items
          </h4>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                {/* Product Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product *
                  </label>
                  <div className="space-y-2">
                    {item.productDetails ? (
                      <div className="p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="w-full flex flex-col">
                            <div className="flex items-center gap-3">
                              {item.productDetails.image &&
                                Array.isArray(item.productDetails.image) &&
                                item.productDetails.image.length > 0 && (
                                  <img
                                    src={item.productDetails.image[0]}
                                    alt={item.productDetails.name}
                                    className="w-16 h-16 object-cover mb-2 rounded-md"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.productDetails.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  SKU: {item.productDetails.sku || 'N/A'}
                                </div>
                                {item.productDetails.brand && (
                                  <div className="text-xs text-gray-400">
                                    Brand:{' '}
                                    {typeof item.productDetails.brand ===
                                    'object'
                                      ? item.productDetails.brand.name
                                      : item.productDetails.brand}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openProductSearch(index)}
                              className="mt-2 text-blue-600 hover:text-blue-700 text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1 justify-center"
                            >
                              Change Product
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProductSearch(index)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-500 hover:text-blue-600"
                      >
                        <Search className="w-4 h-4" />
                        Search & Select Product
                      </button>
                    )}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        'quantity',
                        parseInt(e.target.value) || 1
                      )
                    }
                    required
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit Cost ({currency?.code || 'USD'}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      {getCurrencySymbol()}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      value={item.unitCost}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'unitCost',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      required
                    />
                  </div>
                </div>

                {/* Total Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      {getCurrencySymbol()}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md"
                      value={(item.totalCost || 0).toFixed(2)}
                      readOnly
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Additional Item Info */}
              {item.productDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                    {item.productDetails.category && (
                      <div>
                        <span className="font-medium">Category:</span>{' '}
                        {typeof item.productDetails.category === 'object'
                          ? item.productDetails.category.name
                          : item.productDetails.category}
                      </div>
                    )}
                    {item.productDetails.productType && (
                      <div>
                        <span className="font-medium">Type:</span>{' '}
                        {item.productDetails.productType}
                      </div>
                    )}
                    {item.productDetails.stock !== undefined && (
                      <div>
                        <span className="font-medium">Stock:</span>{' '}
                        {item.productDetails.stock}
                      </div>
                    )}
                    {item.productDetails.price && (
                      <div>
                        <span className="font-medium">List Price:</span>{' '}
                        {getCurrencySymbol()}
                        {item.productDetails.price}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Items Summary */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Items: {items.length}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Valid Items:{' '}
              {
                items.filter(
                  (item) =>
                    item.product &&
                    item.product !== '' &&
                    item.quantity > 0 &&
                    item.unitCost > 0
                ).length
              }
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Quantity:{' '}
              {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </span>
            <span className="text-lg font-bold text-blue-600">
              Subtotal: {getCurrencySymbol()}
              {items
                .reduce((sum, item) => sum + (item.totalCost || 0), 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Product Search Modal */}
      <ProductSearchModal
        isOpen={showProductSearch}
        onClose={() => {
          console.log('Product modal closing');
          setShowProductSearch(false);
          setSearchingForIndex(null);
        }}
        onProductSelect={(product) => {
          console.log(
            'ProductSearchModal called onProductSelect with:',
            product
          );
          handleProductSelect(product);
        }}
      />
    </>
  );
};

export default ItemsSection;
