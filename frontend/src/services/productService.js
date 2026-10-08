import apiClient from './api';

export const productService = {
  /**
   * Browse product catalog
   * @param {Object} params - { category, budget_band, skip, limit }
   */
  list: (params = {}) => apiClient.get('/products', { params }),

  /**
   * Get product detail by ID
   */
  getById: (id) => apiClient.get(`/products/${id}`),

  /**
   * Get personalized recommendations for current user
   * @param {Object} params - { budget_band, category }
   */
  getRecommendations: (params = {}) => apiClient.get('/products/recommendations', { params }),

  /**
   * Compare up to 3 products
   * @param {string[]} productIds - Array of product UUIDs
   * @param {string|null} budgetBand - Optional budget preference
   */
  compare: (productIds, budgetBand = null) =>
    apiClient.post('/products/compare', {
      product_ids: productIds,
      ...(budgetBand && { budget_band: budgetBand }),
    }),

  /**
   * Get alternative products for a given product
   */
  getAlternatives: (productId) => apiClient.get(`/products/${productId}/alternatives`),
};
