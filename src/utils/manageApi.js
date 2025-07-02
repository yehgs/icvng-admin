import { apiCall } from './api';

// Brand Management API
export const brandAPI = {
  getBrands: async () => {
    return apiCall('/brand/get');
  },

  createBrand: async (brandData) => {
    return apiCall('/brand/add-brand', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  },

  updateBrand: async (brandData) => {
    return apiCall('/brand/update', {
      method: 'PUT',
      body: JSON.stringify(brandData),
    });
  },

  deleteBrand: async (brandId) => {
    return apiCall('/brand/delete', {
      method: 'DELETE',
      body: JSON.stringify({ _id: brandId }),
    });
  },
};

// Category Management API
export const categoryAPI = {
  getCategories: async () => {
    return apiCall('/category/get');
  },

  createCategory: async (categoryData) => {
    return apiCall('/category/add-category', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  updateCategory: async (categoryData) => {
    return apiCall('/category/update', {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  deleteCategory: async (categoryId) => {
    return apiCall('/category/delete', {
      method: 'DELETE',
      body: JSON.stringify({ _id: categoryId }),
    });
  },
};

// SubCategory Management API
export const subCategoryAPI = {
  getSubCategories: async () => {
    return apiCall('/subCategory/get', {
      method: 'POST',
    });
  },

  createSubCategory: async (subCategoryData) => {
    return apiCall('/subCategory/create', {
      method: 'POST',
      body: JSON.stringify(subCategoryData),
    });
  },

  updateSubCategory: async (subCategoryData) => {
    return apiCall('/subCategory/update', {
      method: 'PUT',
      body: JSON.stringify(subCategoryData),
    });
  },

  deleteSubCategory: async (subCategoryId) => {
    return apiCall('/subCategory/delete', {
      method: 'DELETE',
      body: JSON.stringify({ _id: subCategoryId }),
    });
  },
};

// Color Management API
export const colorAPI = {
  getColors: async () => {
    return apiCall('/colors/get');
  },

  createColor: async (colorData) => {
    return apiCall('/colors/create', {
      method: 'POST',
      body: JSON.stringify(colorData),
    });
  },

  updateColor: async (colorData) => {
    return apiCall('/colors/update', {
      method: 'PUT',
      body: JSON.stringify(colorData),
    });
  },

  deleteColor: async (colorId) => {
    return apiCall('/colors/delete', {
      method: 'DELETE',
      body: JSON.stringify({ colorId }),
    });
  },
};

// Product Management API
export const productAPI = {
  getProducts: async (params = {}) => {
    return apiCall('/product/get', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  createProduct: async (productData) => {
    return apiCall('/product/create', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (productData) => {
    return apiCall('/product/update-product-details', {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (productId) => {
    return apiCall('/product/delete-product', {
      method: 'DELETE',
      body: JSON.stringify({ _id: productId }),
    });
  },

  searchProducts: async (searchParams) => {
    return apiCall('/product/search-product', {
      method: 'POST',
      body: JSON.stringify(searchParams),
    });
  },
};

export default {
  brandAPI,
  categoryAPI,
  subCategoryAPI,
  colorAPI,
  productAPI,
};
