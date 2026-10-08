import apiClient from './api';

export const progressService = {
  /** Overall progress summary: current vs previous assessment */
  getSummary: () => apiClient.get('/progress/summary'),

  /** Time-series trend data for all score pillars */
  getTrends: (period = '30d') => apiClient.get('/progress/trends', { params: { period } }),

  /** Per-concern severity trends */
  getConcernTrends: (period = '30d') => apiClient.get('/progress/concerns', { params: { period } }),

  /** Routine adherence stats and streak */
  getAdherence: () => apiClient.get('/progress/adherence'),

  /** Assessment history list */
  getHistory: (limit = 20) => apiClient.get('/progress/history', { params: { limit } }),

  /** Compare two assessments side-by-side */
  compare: (baselineId, targetId) =>
    apiClient.get('/progress/compare', {
      params: {
        ...(baselineId ? { baseline_id: baselineId } : {}),
        ...(targetId ? { target_id: targetId } : {}),
      },
    }),
};
