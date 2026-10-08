import apiClient from './api';

export const reportService = {
  getAiStatus: () => apiClient.get('/reports/ai-status'),

  getPreview: (reportType, assessmentId = null, includeAiSummary = true, targetUserId = null) =>
    apiClient.get('/reports/preview', {
      params: {
        report_type: reportType,
        ...(assessmentId ? { assessment_id: assessmentId } : {}),
        include_ai_summary: includeAiSummary,
        ...(targetUserId ? { target_user_id: targetUserId } : {}),
      },
    }),

  getDirectDownloadUrl: (format, reportType, assessmentId = null, includeAiSummary = true, targetUserId = null) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const baseUrl = apiClient.defaults.baseURL || '/api/v1';
    const params = new URLSearchParams({
      report_type: reportType,
      include_ai_summary: String(includeAiSummary),
      ...(assessmentId ? { assessment_id: assessmentId } : {}),
      ...(targetUserId ? { target_user_id: targetUserId } : {}),
      ...(token ? { token } : {}),
    });
    return `${baseUrl}/reports/export/${format}?${params.toString()}`;
  },

  downloadPdf: async (reportType, assessmentId = null, includeAiSummary = true, targetUserId = null) => {
    try {
      const response = await apiClient.get('/reports/export/pdf', {
        params: {
          report_type: reportType,
          ...(assessmentId ? { assessment_id: assessmentId } : {}),
          include_ai_summary: includeAiSummary,
          ...(targetUserId ? { target_user_id: targetUserId } : {}),
        },
        responseType: 'blob',
      });

      if (response.status === 204 || !response.data || (response.data instanceof Blob && response.data.size === 0)) {
        return { success: true, intercepted: true };
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DermaIQ_${reportType}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, intercepted: false };
    } catch (err) {
      // Check if download was captured/aborted by an external download manager (e.g. IDM 204 / network error)
      const isIntercepted =
        err?.response?.status === 204 ||
        err?.code === 'ERR_NETWORK' ||
        err?.message?.includes('Network Error') ||
        err?.message?.includes('204') ||
        err?.message?.includes('IDM');

      if (isIntercepted) {
        console.info('PDF download captured by browser download manager (IDM).');
        return { success: true, intercepted: true };
      }
      throw err;
    }
  },

  downloadExcel: async (reportType, assessmentId = null, includeAiSummary = true, targetUserId = null) => {
    try {
      const response = await apiClient.get('/reports/export/excel', {
        params: {
          report_type: reportType,
          ...(assessmentId ? { assessment_id: assessmentId } : {}),
          include_ai_summary: includeAiSummary,
          ...(targetUserId ? { target_user_id: targetUserId } : {}),
        },
        responseType: 'blob',
      });

      if (response.status === 204 || !response.data || (response.data instanceof Blob && response.data.size === 0)) {
        return { success: true, intercepted: true };
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DermaIQ_${reportType}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, intercepted: false };
    } catch (err) {
      const isIntercepted =
        err?.response?.status === 204 ||
        err?.code === 'ERR_NETWORK' ||
        err?.message?.includes('Network Error') ||
        err?.message?.includes('204') ||
        err?.message?.includes('IDM');

      if (isIntercepted) {
        console.info('Excel download captured by browser download manager (IDM).');
        return { success: true, intercepted: true };
      }
      throw err;
    }
  },

  getHistory: (targetUserId = null, limit = 50) =>
    apiClient.get('/reports/history', {
      params: {
        ...(targetUserId ? { target_user_id: targetUserId } : {}),
        limit,
      },
    }),
};
