import axios from 'axios';
import { USER_API_END_POINT } from './constant';
import { csrfService } from './csrfService';

// Create axios instance
const axiosInstance = axios.create({
    withCredentials: true
});

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor to add CSRF token
axiosInstance.interceptors.request.use(
    async (config) => {
        console.log(`[CSRF Interceptor] ${config.method?.toUpperCase()} ${config.url}`);
        
        // Only add CSRF token for state-changing methods
        if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
            try {
                const token = await csrfService.getToken();
                if (token) {
                    config.headers['x-csrf-token'] = token;
                    console.log(`[CSRF Interceptor] Token attached:`, token.substring(0, 16) + '...');
                } else {
                    console.warn('[CSRF Interceptor] No token received from service');
                }
            } catch (error) {
                console.error('[CSRF Interceptor] Failed to get CSRF token:', error);
                // Continue with request even if CSRF token fetch fails
                // The server will reject it with 403 if CSRF protection is enabled
            }
        } else {
            console.log(`[CSRF Interceptor] Skipping CSRF for ${config.method} request`);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration and CSRF errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle CSRF token errors
        if (
            error.response?.status === 403 &&
            error.response?.data?.message?.includes('CSRF') &&
            !originalRequest._csrfRetry
        ) {
            originalRequest._csrfRetry = true;

            try {
                // Clear old token and fetch new one
                csrfService.clearToken();
                const newToken = await csrfService.getToken();
                
                if (newToken) {
                    // Retry the original request with new token
                    originalRequest.headers['x-csrf-token'] = newToken;
                    return axiosInstance(originalRequest);
                }
            } catch (retryError) {
                console.error('Failed to retry request with new CSRF token:', retryError);
                return Promise.reject(error);
            }
        }

        // Check if error is due to expired token
        if (error.response?.status === 401 && 
            error.response?.data?.code === 'TOKEN_EXPIRED' && 
            !originalRequest._retry) {
            
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => {
                    return axiosInstance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call refresh token endpoint
                await axios.post(
                    `${USER_API_END_POINT}/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                // Process queued requests
                processQueue(null);
                isRefreshing = false;

                // Retry original request
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                processQueue(refreshError, null);
                isRefreshing = false;
                
                // Clear user data and redirect to login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
