import apiClient from './api';

export const ingredientService = {
  /**
   * List / search ingredients
   * @param {Object} params - { search, category, skip, limit }
   */
  list: (params = {}) => apiClient.get('/ingredients', { params }),

  /**
   * Get ingredient detail by UUID
   */
  getById: (id) => apiClient.get(`/ingredients/${id}`),

  /**
   * Evaluate ingredient suitability for the current user
   */
  evaluateSuitability: (ingredientId) =>
    apiClient.post('/ingredients/suitability', { ingredient_id: ingredientId }),

  /**
   * Check interactions between a list of ingredient names
   */
  checkInteractions: (ingredientNames) =>
    apiClient.post('/ingredients/interactions', { ingredient_names: ingredientNames }),
};
