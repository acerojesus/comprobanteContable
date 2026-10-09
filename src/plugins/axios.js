import axios from 'axios';
import { useAuthStore } from '../stores/Auth.js';

// Configuración de URLs base según el entorno:
// Local: 'http://localhost:49256/api'
// Producción: 'https://api.contar.co/api'
const LOCAL_URL = 'http://localhost:49256/api';
const PROD_URL = 'https://api.contar.co/api';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_URL : LOCAL_URL),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el header x-token en cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (token) {
      // Header personalizado para autorización y compatibilidad con Bearer token
      config.headers['x-token'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;