import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getCurrentUser = () => api.get("/users/me");
export const createProfile = (data) => api.post("/profile", data);
export const getProfile = () => api.get("/profile");
export const updateProfile = (data) => api.put("/profile", data);
export default api;
