import apiClient from './api';

export const routineService = {
  getCurrentRoutinePlan: async () => {
    const response = await apiClient.get('/routines/current');
    return response.data;
  },

  generateNewRoutineVersion: async () => {
    const response = await apiClient.post('/routines/generate');
    return response.data;
  },

  getRoutineHistory: async () => {
    const response = await apiClient.get('/routines/history');
    return response.data;
  },

  toggleStepAdherence: async ({ routineStepId, recordDate, completed }) => {
    const response = await apiClient.post('/routines/adherence/toggle', {
      routine_step_id: routineStepId,
      record_date: recordDate,
      completed,
    });
    return response.data;
  },

  getAdherenceSummary: async () => {
    const response = await apiClient.get('/routines/adherence/summary');
    return response.data;
  },
};

export default routineService;
