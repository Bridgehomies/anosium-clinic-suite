/**
 * API Client Configuration
 * Axios instance with interceptors for authentication, tenant headers, and error handling
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Get base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Request Interceptor
 * Adds authorization header and tenant header to all requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID header for multi-tenancy
    // Super admins can override tenant via this header
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        tenantId: tenantId || 'none',
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh and error responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: originalRequest?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // FIX #2: Don't intercept auth errors on login/signup/tenant-creation
    // endpoints. A failed login (wrong password, 401) is not an expired-
    // session case — without this, it would incorrectly trigger the
    // refresh-and-retry flow below, and could force a redirect to '/' while
    // the user is still sitting on the sign-in page.
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/signup') ||
      originalRequest?.url?.includes('/tenants');

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token — only redirect if not already on an auth page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin') && !currentPath.includes('/signup') && currentPath !== '/') {
          localStorage.clear();
          window.location.href = '/';
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // FIX #1: refresh_token now sent in the JSON body, matching the
        // backend's Body(..., embed=True) contract — it no longer reads
        // this from the query string, so the old ?refresh_token=... call
        // would 422 on every refresh attempt.
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        // Process queued requests
        processQueue(null, access_token);

        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin') && !currentPath.includes('/signup') && currentPath !== '/') {
          localStorage.clear();
          window.location.href = '/';
        }

        return Promise.reject(refreshError);
      }
    }

    // For auth endpoints, just reject without redirecting — let the calling
    // component (e.g. the sign-in form) show its own error message instead
    // of this interceptor yanking the user away from the page they're on.
    if (isAuthEndpoint && error.response?.status === 401) {
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Account inactive or insufficient permissions
      console.error('Access forbidden:', error.response.data);
      
      // Check if it's a tenant-related issue
      const detail = (error.response.data as any)?.detail;
      if (typeof detail === 'string') {
        if (detail.includes('tenant') || detail.includes('inactive')) {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/signin') && !currentPath.includes('/signup')) {
            window.location.href = '/tenant-inactive';
          }
        }
      }
    }

    // Handle 429 Too Many Requests (Rate limiting)
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded:', error.response.data);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Helper function to extract error message from response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Check for detail in response
    if (error.response?.data?.detail) {
      // Handle string detail
      if (typeof error.response.data.detail === 'string') {
        return error.response.data.detail;
      }
      
      // Handle array of validation errors (FastAPI 422 responses)
      if (Array.isArray(error.response.data.detail)) {
        const messages = error.response.data.detail.map((err: any) => {
          const field = err.loc?.join('.') || 'field';
          return `${field}: ${err.msg}`;
        });
        return messages.join(', ');
      }
    }

    // Handle other error formats
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Default messages based on status code
    if (error.response?.status === 401) {
      return 'Invalid credentials or session expired';
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action';
    }

    if (error.response?.status === 404) {
      return 'Resource not found';
    }

    if (error.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }

    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }

    // Network error
    if (error.message === 'Network Error') {
      return 'Network error. Please check your internet connection.';
    }

    return error.message || 'An unexpected error occurred';
  }

  // Non-Axios error
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Helper to check if error is authentication related
 */
export const isAuthError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
};

/**
 * Helper to check if error is validation related
 */
export const isValidationError = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 422 || error.response?.status === 400;
  }
  return false;
};