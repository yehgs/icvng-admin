// admin/src/utils/categoryService.js
// Shared category loading with in-memory cache so every page
// that needs categories does NOT make a separate network call.

import { apiCall } from './api';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _flatCache = null;         // [{ _id, name, image, slug }]
let _flatCacheTs = 0;

let _structureCache = null;    // [{ _id, name, subcategories, brands }]
let _structureCacheTs = 0;

// ── Flat list (for dropdowns in ProductForm, ProductManagement, etc.) ────────
export const getCategories = async () => {
  if (_flatCache && Date.now() - _flatCacheTs < CACHE_TTL) return _flatCache;
  const res = await apiCall('/category/get');
  if (res.success && Array.isArray(res.data)) {
    _flatCache = res.data;
    _flatCacheTs = Date.now();
    return _flatCache;
  }
  return [];
};

// ── SubCategories flat list ──────────────────────────────────────────────────
let _subCache = null;
let _subCacheTs = 0;

export const getSubCategories = async (categoryId = null) => {
  if (!_subCache || Date.now() - _subCacheTs >= CACHE_TTL) {
    const res = await apiCall('/subCategory/get', { method: 'POST' });
    if (res.success && Array.isArray(res.data)) {
      _subCache = res.data;
      _subCacheTs = Date.now();
    } else {
      _subCache = [];
    }
  }
  if (!categoryId) return _subCache;
  return (_subCache || []).filter((s) => s.category?._id === categoryId || s.category === categoryId);
};

// ── Category structure (for nav, warehouse, pricing) ────────────────────────
export const getCategoryStructure = async () => {
  if (_structureCache && Date.now() - _structureCacheTs < CACHE_TTL) return _structureCache;
  const res = await apiCall('/product/category-structure');
  if (res.success && Array.isArray(res.data)) {
    _structureCache = res.data;
    _structureCacheTs = Date.now();
    return _structureCache;
  }
  return [];
};

// ── Force refresh all caches ─────────────────────────────────────────────────
export const clearCategoryCache = () => {
  _flatCache = null; _flatCacheTs = 0;
  _subCache = null;  _subCacheTs = 0;
  _structureCache = null; _structureCacheTs = 0;
};
