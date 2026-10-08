/**
 * Safely extracts a user-readable error message string from Axios/FastAPI error responses.
 * Handles strings, FastAPI validation lists ([{ loc, msg, type }]), error objects, and fallback.
 */
export const extractErrorMessage = (err, fallback = 'An unexpected error occurred. Please try again.') => {
  if (!err) return fallback;
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'string') return first;
    if (first?.msg) return first.msg;
    return fallback;
  }
  if (typeof detail === 'object' && detail !== null) {
    return detail.message || detail.msg || fallback;
  }
  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }
  if (err.message && typeof err.message === 'string' && !err.message.includes('Network Error') && !err.message.includes('Request failed')) {
    return err.message;
  }
  return fallback;
};
