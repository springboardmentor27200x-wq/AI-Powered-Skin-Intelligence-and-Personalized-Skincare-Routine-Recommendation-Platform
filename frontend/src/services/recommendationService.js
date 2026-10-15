import api from './api';

export const recommendationService = {
  analyzeIngredients(payload) {
    return api.post('/recommendations/ingredient-analysis', payload).then((res) => res.data);
  },
  getProductRecommendations(payload) {
    return api.post('/recommendations/products', payload).then((res) => res.data);
  },
};
