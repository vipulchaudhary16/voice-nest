import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        if (parsedUser?.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      }
    } catch {
      // Ignore localStorage parse issues.
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const shouldShowToast = !error?.config?.suppressErrorToast;
    if (shouldShowToast) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    }
    return Promise.reject(error);
  },
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
