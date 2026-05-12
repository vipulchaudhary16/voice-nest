import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  if (!config.headers?.Authorization) {
    try {
      const rawUser = localStorage.getItem('user');
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

  console.log('[API][WEB][REQ]', {
    method: (config.method || 'get').toUpperCase(),
    url: `${config.baseURL || ''}${config.url || ''}`,
    params: config.params,
    data: config.data,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    const startedAt = response.config?.metadata?.startTime || Date.now();
    const durationMs = Date.now() - startedAt;
    console.log('[API][WEB][RES]', {
      method: (response.config?.method || 'get').toUpperCase(),
      url: `${response.config?.baseURL || ''}${response.config?.url || ''}`,
      status: response.status,
      durationMs,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const startedAt = error?.config?.metadata?.startTime || Date.now();
    const durationMs = Date.now() - startedAt;
    console.error('[API][WEB][ERR]', {
      method: (error?.config?.method || 'get').toUpperCase(),
      url: `${error?.config?.baseURL || ''}${error?.config?.url || ''}`,
      status: error?.response?.status,
      durationMs,
      message: error?.response?.data?.message || error?.message,
      data: error?.response?.data,
    });
    const shouldShowToast = !error?.config?.suppressErrorToast;
    if (shouldShowToast) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
