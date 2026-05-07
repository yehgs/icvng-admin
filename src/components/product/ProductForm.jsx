import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Star,
  Package,
  Plus,
} from 'lucide-react';
import ImageUploader from '../common/ImageUploader';
import {
  productAPI,
  brandAPI,
  colorAPI,
} from '../../utils/manageApi';
import { supplierAPI } from '../../utils/api';
import { getCategories, getSubCategories } from '../../utils/categoryService';
import toast from 'react-hot-toast';

const ProductForm = ({ isOpen, onClose, product = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [colors, setColors] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});

  // Quick-create supplier inline
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    image: [],
    weight: '',
    brand: [],
    compatibleSystem: '',
    producer: '',
    productType: 'COFFEE',
    roastLevel: '',
    roastOrigin: '',
    blend: '',
    featured: false,
    aromaticProfile: '',
    alcoholLevel: '',
    coffeeOrigin: '',
    intensity: '',
    category: '',
    subCategory: '',
    tags: [],
    colors: [],
    unit: '',
    packaging: '',
    productAvailability: true,
    description: '',
    shortDescription: '',
    additionalInfo: '',
    seoTitle: '',
    seoDescription: '',
    publish: 'PENDING',
    // Prices
    btbPrice: '',
    btcPrice: '',
    price3weeksDelivery: '',
    price5weeksDelivery: '',
    discount: '',
    // Partner/online stock
    partnerStock: {
      enabled: false,
      quantity: 0,
      supplier: '',
      notes: '',
    },
  });

  const productTypes = [
    'COFFEE',
    'MACHINE',
    'ACCESSORIES',
    'COFFEE_BEANS',
    'TEA',
    'DRINKS',
  ];

  const roastLevels = ['LIGHT', 'MEDIUM', 'DARK'];

  const intensityLevels = [
    '1/10',
    '2/10',
    '3/10',
    '4/10',
    '5/10',
    '6/10',
    '7/10',
    '8/10',
    '9/10',
    '10/10',
  ];

  const publishStates = ['PUBLISHED', 'PENDING', 'DRAFT'];

  const blendOptions = [
    '100% Arabica',
    '100% Robusta',
    'Arabica/Robusta Blend (70/30)',
    'Arabica/Robusta Blend (30/70)',
    'Arabica/Robusta Blend (80/20)',
    'Arabica/Robusta Blend (40/60)',
    'Arabica/Robusta Blend (60/40)',
    'Single Origin Arabica',
    'Estate Blend',
    'House Blend',
    'Breakfast Blend',
    'Espresso Blend',
    'Mocha-Java Blend',
    'Mocha Italia',
    'Cappuccino Blend',
    'African Blend',
    'Latin American Blend',
    'Indonesian Blend',
    'Italian Roast Blend',
    'French Roast Blend',
    'Varius Blend',
  ];

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (product) {
        populateForm(product);
      } else {
        resetForm();
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (formData.category) {
      fetchSubCategories(formData.category);
    } else {
      setSubCategories([]);
    }
  }, [formData.category]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, brandsRes, colorsRes, suppliersRes] = await Promise.all([
        getCategories(),
        brandAPI.getBrands(),
        colorAPI.getColors(),
        supplierAPI.getSuppliers({ status: 'ACTIVE', limit: 200 }),
      ]);
      setCategories(cats);
      if (brandsRes.success) setBrands(brandsRes.data);
      if (colorsRes.success) setColors(colorsRes.data);
      if (suppliersRes.success) setSuppliers(suppliersRes.data || []);

      if (!cats || cats.length === 0) {
        toast.error('Categories not loaded. Check server connection.');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      try { const cats = await getCategories(); setCategories(cats); } catch (_) { /* ignore */ }
      try { const r = await brandAPI.getBrands(); if (r.success) setBrands(r.data); } catch (_) { /* ignore */ }
      try { const r = await colorAPI.getColors(); if (r.success) setColors(r.data); } catch (_) { /* ignore */ }
      try { const r = await supplierAPI.getSuppliers({ status: 'ACTIVE' }); if (r.success) setSuppliers(r.data || []); } catch (_) { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) { toast.error('Supplier name is required'); return; }
    setCreatingSupplier(true);
    try {
      const slug = newSupplierName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const res = await supplierAPI.createSupplier({
        name: newSupplierName.trim(),
        slug: `${slug}-${Date.now()}`,
        phone: newSupplierPhone.trim(),
        status: 'ACTIVE',
      });
      if (res.success) {
        const newSupplier = res.data;
        setSuppliers((prev) => [...prev, newSupplier]);
        // Auto-select the newly created supplier
        handleInputChange('partnerStock', {
          ...(formData.partnerStock || {}),
          supplier: newSupplier._id,
        });
        setNewSupplierName('');
        setNewSupplierPhone('');
        setShowNewSupplier(false);
        toast.success(`Supplier "${newSupplier.name}" created and selected`);
      } else {
        toast.error(res.message || 'Failed to create supplier');
      }
    } catch (_) {
      toast.error('Failed to create supplier');
    } finally {
      setCreatingSupplier(false);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const subs = await getSubCategories(categoryId);
      setSubCategories(subs);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const populateForm = (productData) => {
    setFormData({
      name: productData.name || '',
      image: productData.image || [],
      weight: productData.weight || '',
      brand: productData.brand?.map((b) => b._id) || [],
      compatibleSystem: productData.compatibleSystem || '',
      producer: productData.producer || '',
      productType: productData.productType || 'COFFEE',
      roastLevel: productData.roastLevel || '',
      roastOrigin: productData.roastOrigin || '',
      blend: productData.blend || '',
      featured: productData.featured || false,
      aromaticProfile: productData.aromaticProfile || '',
      alcoholLevel: productData.alcoholLevel || '',
      coffeeOrigin: productData.coffeeOrigin || '',
      intensity: productData.intensity || '',
      category: productData.category?._id || '',
      subCategory: productData.subCategory?._id || '',
      tags: productData.tags?.map((t) => t._id) || [],
      colors: productData.colors?.map((c) => c._id) || [],
      unit: productData.unit || '',
      packaging: productData.packaging || '',
      productAvailability:
        productData.productAvailability !== undefined
          ? productData.productAvailability
          : true,
      description: productData.description || '',
      shortDescription: productData.shortDescription || '',
      additionalInfo: productData.additionalInfo || '',
      seoTitle: productData.seoTitle || '',
      seoDescription: productData.seoDescription || '',
      publish: productData.publish || 'PENDING',
      // Prices
      btbPrice: productData.btbPrice || '',
      btcPrice: productData.btcPrice || '',
      price3weeksDelivery: productData.price3weeksDelivery || '',
      price5weeksDelivery: productData.price5weeksDelivery || '',
      discount: productData.discount || '',
      // Partner/online stock — supplier may be a populated object or just an ID
      partnerStock: productData.partnerStock ? {
        enabled: productData.partnerStock.enabled || false,
        quantity: productData.partnerStock.quantity || 0,
        supplier: productData.partnerStock.supplier?._id || productData.partnerStock.supplier || '',
        notes: productData.partnerStock.notes || '',
      } : {
        enabled: false,
        quantity: 0,
        supplier: '',
        notes: '',
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: [],
      weight: '',
      brand: [],
      compatibleSystem: '',
      producer: '',
      productType: 'COFFEE',
      roastLevel: '',
      roastOrigin: '',
      blend: '',
      featured: false,
      aromaticProfile: '',
      alcoholLevel: '',
      coffeeOrigin: '',
      intensity: '',
      category: '',
      subCategory: '',
      tags: [],
      colors: [],
      unit: '',
      packaging: '',
      productAvailability: true,
      description: '',
      shortDescription: '',
      additionalInfo: '',
      seoTitle: '',
      seoDescription: '',
      publish: 'PENDING',
      btbPrice: '',
      btcPrice: '',
      price3weeksDelivery: '',
      price5weeksDelivery: '',
      discount: '',
      partnerStock: {
        enabled: false,
        quantity: 0,
        supplier: '',
        notes: '',
      },
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.image || formData.image.length === 0) {
      newErrors.image = 'At least one product image is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    }

    // At least one of BTC, 3-week, or 5-week price must be set
    const btc = parseFloat(formData.btcPrice) || 0;
    const w3 = parseFloat(formData.price3weeksDelivery) || 0;
    const w5 = parseFloat(formData.price5weeksDelivery) || 0;
    if (btc === 0 && w3 === 0 && w5 === 0) {
      newErrors.prices = 'At least one of BTC Price, 3-Week Price, or 5-Week Price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      let response;
      if (product) {
        response = await productAPI.updateProduct({
          _id: product._id,
          ...formData,
        });
      } else {
        response = await productAPI.createProduct(formData);
      }

      if (response.success) {
        toast.success(
          product
            ? 'Product updated successfully!'
            : 'Product created successfully!'
        );
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset subcategory when category changes
      ...(field === 'category' ? { subCategory: '' } : {}),
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleMultiSelectChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {product ? 'Edit Product' : 'Create New Product'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product
                  ? 'Update product information'
                  : 'Add a new product to your catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading form data...
            </span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.name
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Type *
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) =>
                      handleInputChange('productType', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {productTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) =>
                      handleInputChange('weight', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Product weight"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., kg, g, ml, pieces"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Packaging
                  </label>
                  <input
                    type="text"
                    value={formData.packaging}
                    onChange={(e) =>
                      handleInputChange('packaging', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Bag, Box, Bottle"
                  />
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Product Images *
              </h4>
              <ImageUploader
                images={formData.image}
                onImagesChange={(images) => handleInputChange('image', images)}
                multiple={true}
                maxImages={5}
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.image}
                </p>
              )}
            </div>

            {/* Category & Classification */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Category & Classification
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange('category', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                      errors.category
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SubCategory
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) =>
                      handleInputChange('subCategory', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={!formData.category}
                  >
                    <option value="">Select SubCategory</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory._id} value={subCategory._id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Brands
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                    {brands.map((brand) => (
                      <label
                        key={brand._id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.brand.includes(brand._id)}
                          onChange={(e) =>
                            handleMultiSelectChange(
                              'brand',
                              brand._id,
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {brand.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Colors
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                    {colors.map((color) => (
                      <label
                        key={color._id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.colors.includes(color._id)}
                          onChange={(e) =>
                            handleMultiSelectChange(
                              'colors',
                              color._id,
                              e.target.checked
                            )
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color.hexCode }}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {color.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Coffee Specific Fields */}
            {formData.productType === 'COFFEE' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Coffee Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Roast Level
                    </label>
                    <select
                      value={formData.roastLevel}
                      onChange={(e) =>
                        handleInputChange('roastLevel', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Roast Level</option>
                      {roastLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Intensity
                    </label>
                    <select
                      value={formData.intensity}
                      onChange={(e) =>
                        handleInputChange('intensity', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Intensity</option>
                      {intensityLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Blend
                    </label>
                    <select
                      value={formData.blend}
                      onChange={(e) =>
                        handleInputChange('blend', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Blend</option>
                      {blendOptions.map((blend) => (
                        <option key={blend} value={blend}>
                          {blend}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Coffee Origin
                    </label>
                    <input
                      type="text"
                      value={formData.coffeeOrigin}
                      onChange={(e) =>
                        handleInputChange('coffeeOrigin', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Colombia, Ethiopia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Aromatic Profile
                    </label>
                    <input
                      type="text"
                      value={formData.aromaticProfile}
                      onChange={(e) =>
                        handleInputChange('aromaticProfile', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Fruity, Nutty, Chocolate"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Roast Origin
                    </label>
                    <input
                      type="text"
                      value={formData.roastOrigin}
                      onChange={(e) =>
                        handleInputChange('roastOrigin', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Where the coffee was roasted"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Descriptions */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Product Descriptions
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Short Description *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.shortDescription}
                    onChange={(e) =>
                      handleInputChange('shortDescription', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none ${
                      errors.shortDescription
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Brief product description for listings"
                  />
                  {errors.shortDescription && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.shortDescription}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Description
                  </label>
                  <textarea
                    rows={5}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Detailed product description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Information
                  </label>
                  <textarea
                    rows={3}
                    value={formData.additionalInfo}
                    onChange={(e) =>
                      handleInputChange('additionalInfo', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Additional product information, care instructions, etc."
                  />
                </div>
              </div>
            </div>

            {/* ── Pricing ── */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Pricing
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                At least one of BTC, 3-Week, or 5-Week price is required.
              </p>

              {/* Price required warning */}
              {errors.prices && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.prices}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BTB Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    BTB Price (Business-to-Business) <span className="text-gray-400 font-normal">— optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                    <input type="number" min="0" step="0.01"
                      value={formData.btbPrice || ''}
                      onChange={(e) => handleInputChange('btbPrice', e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* BTC Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    BTC Price <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">— shown as regular price on website</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                    <input type="number" min="0" step="0.01"
                      value={formData.btcPrice || ''}
                      onChange={(e) => handleInputChange('btcPrice', e.target.value)}
                      className={`w-full pl-7 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${errors.btcPrice ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.btcPrice && <p className="mt-1 text-xs text-red-600">{errors.btcPrice}</p>}
                </div>

                {/* 3-Week Delivery Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    3-Week Delivery Price <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">— most categories</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                    <input type="number" min="0" step="0.01"
                      value={formData.price3weeksDelivery || ''}
                      onChange={(e) => handleInputChange('price3weeksDelivery', e.target.value)}
                      className={`w-full pl-7 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${errors.price3weeksDelivery ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price3weeksDelivery && <p className="mt-1 text-xs text-red-600">{errors.price3weeksDelivery}</p>}
                </div>

                {/* 5-Week Delivery Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    5-Week Delivery Price <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">— Capsule Machines & Coffee Makers</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                    <input type="number" min="0" step="0.01"
                      value={formData.price5weeksDelivery || ''}
                      onChange={(e) => handleInputChange('price5weeksDelivery', e.target.value)}
                      className={`w-full pl-7 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${errors.price5weeksDelivery ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price5weeksDelivery && <p className="mt-1 text-xs text-red-600">{errors.price5weeksDelivery}</p>}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount (%) <span className="text-gray-400 font-normal">— applied to all prices</span>
                  </label>
                  <input type="number" min="0" max="100" step="1"
                    value={formData.discount || ''}
                    onChange={(e) => handleInputChange('discount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* ── Partner Stock (Editor-managed online stock) ── */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Partner / Online Stock
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    For products held by partners or sourced externally. This sets the online stock visible to customers.
                    Warehouse staff can <strong>view</strong> this but cannot manage it — only editors can.
                    No offline stock applies to these products.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
                  <input type="checkbox"
                    checked={formData.partnerStock?.enabled || false}
                    onChange={(e) => handleInputChange('partnerStock', {
                      ...(formData.partnerStock || {}),
                      enabled: e.target.checked,
                    })}
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>

              {formData.partnerStock?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Online Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input type="number" min="0"
                      value={formData.partnerStock?.quantity ?? ''}
                      onChange={(e) => handleInputChange('partnerStock', {
                        ...(formData.partnerStock || {}),
                        quantity: parseInt(e.target.value) || 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewSupplier((p) => !p)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {showNewSupplier ? 'Cancel' : 'Create New'}
                      </button>
                    </div>

                    {/* Supplier dropdown */}
                    {!showNewSupplier && (
                      <select
                        value={formData.partnerStock?.supplier || ''}
                        onChange={(e) => handleInputChange('partnerStock', {
                          ...(formData.partnerStock || {}),
                          supplier: e.target.value,
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}{s.contactPerson?.phone ? ` — ${s.contactPerson.phone}` : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Quick-create supplier inline */}
                    {showNewSupplier && (
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-blue-700">New Supplier</p>
                        <input type="text"
                          value={newSupplierName}
                          onChange={(e) => setNewSupplierName(e.target.value)}
                          placeholder="Supplier name *"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <input type="text"
                          value={newSupplierPhone}
                          onChange={(e) => setNewSupplierPhone(e.target.value)}
                          placeholder="Phone (optional)"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleCreateSupplier}
                          disabled={creatingSupplier || !newSupplierName.trim()}
                          className="w-full py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {creatingSupplier
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Creating...</>
                            : <><Plus className="w-3 h-3" /> Create & Select</>}
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <input type="text"
                      value={formData.partnerStock?.notes || ''}
                      onChange={(e) => handleInputChange('partnerStock', {
                        ...(formData.partnerStock || {}),
                        notes: e.target.value,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g. Restocked monthly"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SEO & Publishing */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                SEO & Publishing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) =>
                      handleInputChange('seoTitle', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="SEO optimized title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.publish}
                    onChange={(e) =>
                      handleInputChange('publish', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {publishStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SEO Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.seoDescription}
                    onChange={(e) =>
                      handleInputChange('seoDescription', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="SEO meta description"
                  />
                </div>
              </div>
            </div>

            {/* Product Settings */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Product Settings
              </h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      handleInputChange('featured', e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Star className="ml-2 mr-1 h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Featured Product
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.productAvailability}
                    onChange={(e) =>
                      handleInputChange('productAvailability', e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Product Available for Sale
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {product ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {product ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductForm;
