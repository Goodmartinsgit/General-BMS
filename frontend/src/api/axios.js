import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let getAccessToken = () => null;

export const setAccessTokenGetter = (getter) => {
    getAccessToken = getter;
};

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

// Request interceptor: attach access token from memory
api.interceptors.request.use(
    config => {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // Don't retry refresh or login requests
        if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await api.post('/auth/refresh', {}, { withCredentials: true });
                const { accessToken } = response.data;
                setAccessTokenGetter(() => accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                processQueue(null, accessToken);
                return api(originalRequest);
            } catch (refreshError) {
                setAccessTokenGetter(() => null);
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
