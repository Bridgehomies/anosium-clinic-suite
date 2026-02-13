// API Service Layer for Super Admin Dashboard
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base URL should include /api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Extend AxiosRequestConfig to include our custom _retry property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Track ongoing refresh request to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add auth token to requests
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle token refresh on 401 with race condition protection
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (isRefreshing) {
            // If already refreshing, wait for the new token
            return new Promise((resolve) => {
              subscribeTokenRefresh((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.api.request(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              // Backend expects: POST /auth/refresh?refresh_token=XXX
              const response = await axios.post(
                `${API_BASE_URL}/auth/refresh`,
                null,
                {
                  params: { refresh_token: refreshToken },
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );

              // Backend returns: { access_token, refresh_token, token_type, expires_in }
              const newAccessToken = response.data.access_token;
              
              localStorage.setItem('access_token', newAccessToken);
              
              // Notify all waiting requests
              onTokenRefreshed(newAccessToken);
              isRefreshing = false;

              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              }
              return this.api.request(originalRequest);
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              console.error('Token refresh failed:', refreshError);
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              isRefreshing = false;
              refreshSubscribers = [];
              
              // Only redirect if we're not already on the login page
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
              }
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token available
            isRefreshing = false;
            localStorage.removeItem('access_token');
            
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async refreshToken(refreshToken: string) {
    const response = await this.api.post('/auth/refresh', null, {
      params: { refresh_token: refreshToken },
    });
    return response.data;
  }

  async getCurrentUser() {
    // Backend endpoint: GET /auth/me
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async getActiveSessions() {
    // Backend endpoint: GET /auth/sessions
    const response = await this.api.get('/auth/sessions');
    return response.data;
  }

  async logoutDevice(refreshToken: string) {
    const response = await this.api.post('/auth/logout-device', null, {
      params: { refresh_token: refreshToken },
    });
    return response.data;
  }

  // ============================================
  // TENANT/CLINIC MANAGEMENT
  // ============================================

  async getTenants(params?: {
    subscription_tier?: string;
    subscription_status?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/tenants', { params });
    return response.data;
  }

  async getTenant(tenantId: number) {
    const response = await this.api.get(`/tenants/${tenantId}`);
    return response.data;
  }

  async getTenantStats(tenantId: number) {
    const response = await this.api.get(`/tenants/${tenantId}/stats`);
    return response.data;
  }

  async createTenant(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    slug: string;
    password: string;
    admin_first_name: string;
    admin_last_name: string;
  }) {
    const response = await this.api.post('/tenants', data);
    return response.data;
  }

  async updateTenant(
    tenantId: number,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postal_code?: string;
      logo_url?: string;
      primary_color?: string;
      settings?: Record<string, any>;
    }
  ) {
    const response = await this.api.put(`/tenants/${tenantId}`, data);
    return response.data;
  }

  async deleteTenant(tenantId: number) {
    const response = await this.api.delete(`/tenants/${tenantId}?confirm=true`);
    return response.data;
  }

  async activateTenant(tenantId: number) {
    const response = await this.api.post(`/tenants/${tenantId}/activate`);
    return response.data;
  }

  async deactivateTenant(tenantId: number, reason?: string) {
    const response = await this.api.post(`/tenants/${tenantId}/deactivate`, null, {
      params: { reason },
    });
    return response.data;
  }

  async updateTenantSubscription(
    tenantId: number,
    data: {
      subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
      subscription_status?: 'active' | 'suspended' | 'cancelled' | 'trial';
      enabled_features?: Record<string, any>;
    }
  ) {
    const response = await this.api.put(`/tenants/${tenantId}/subscription`, data);
    return response.data;
  }

  async getTenantUsage(tenantId: number) {
    const response = await this.api.get(`/tenants/${tenantId}/usage`);
    return response.data;
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUsers(params?: {
    role?: 'super_admin' | 'clinic_admin' | 'doctor' | 'receptionist' | 'staff' | 'accountant';
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUser(userId: number) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async createUser(data: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string; // Must match pattern: ^\+?[1-9]\d{1,14}$ (e.g., "+923001234567" or "923001234567")
    role: 'clinic_admin' | 'doctor' | 'receptionist' | 'staff' | 'accountant'; // Changed to snake_case
    password: string; // Must contain at least one uppercase letter
    tenant_id: number; // Made required (remove ? if backend requires it)
  }) {
    const response = await this.api.post('/users', data);
    return response.data;
  }
  async updateUser(
    userId: number,
    data: {
      first_name?: string;
      last_name?: string;
      phone?: string; // Must match pattern: ^\+?[1-9]\d{1,14}$
      avatar_url?: string;
      permissions?: Record<string, any>;
      is_active?: boolean;
    }
  ) {
    const response = await this.api.put(`/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: number) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async activateUser(userId: number) {
    const response = await this.api.post(`/users/${userId}/activate`);
    return response.data;
  }

  async deactivateUser(userId: number) {
    const response = await this.api.post(`/users/${userId}/deactivate`);
    return response.data;
  }

  async changeUserRole(userId: number, newRole: string) {
    const response = await this.api.put(`/users/${userId}/role?new_role=${newRole}`);
    return response.data;
  }

  async updateUserPermissions(userId: number, permissions: Record<string, any>) {
    const response = await this.api.put(`/users/${userId}/permissions`, permissions);
    return response.data;
  }

  async resetUserPassword(userId: number, newPassword: string) {
    // Ensure password has uppercase letter
    const response = await this.api.post(`/users/${userId}/reset-password?new_password=${newPassword}`);
    return response.data;
  }

  async sendWelcomeEmail(userId: number) {
    const response = await this.api.post(`/users/${userId}/send-welcome-email`);
    return response.data;
  }

  async getUserActivity(userId: number, days: number = 30) {
    const response = await this.api.get(`/users/${userId}/activity?days=${days}`);
    return response.data;
  }

  async getUsersSummary() {
    const response = await this.api.get('/users/stats/summary');
    return response.data;
  }

  // ============================================
  // ANALYTICS & DASHBOARD
  // ============================================

  async getDashboardStats() {
    const response = await this.api.get('/analytics/dashboard');
    return response.data;
  }

  async getDailyMetrics(date?: string) {
    const params = date ? { metric_date: date } : {};
    const response = await this.api.get('/analytics/metrics/daily', { params });
    return response.data;
  }

  async getRevenueReport(fromDate: string, toDate: string) {
    const response = await this.api.get('/analytics/reports/revenue', {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  }

  async getAppointmentReport(fromDate: string, toDate: string) {
    const response = await this.api.get('/analytics/reports/appointments', {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  }

  async getPatientReport(fromDate: string, toDate: string) {
    const response = await this.api.get('/analytics/reports/patients', {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  }

  async getMonthlyTrends(months: number = 6) {
    const response = await this.api.get('/analytics/trends/monthly', {
      params: { months },
    });
    return response.data;
  }

  async getDoctorPerformance(fromDate?: string, toDate?: string) {
    const response = await this.api.get('/analytics/performance/doctors', {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  }

  // ============================================
  // BILLING & PAYMENTS
  // ============================================

  async getInvoices(params?: {
    patient_id?: number;
    payment_status?: 'pending' | 'partial' | 'paid' | 'cancelled' | 'refunded';
    from_date?: string;
    to_date?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/billing/invoices', { params });
    return response.data;
  }

  async getPaymentSummary(fromDate?: string, toDate?: string) {
    const response = await this.api.get('/billing/summary', {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  }

  async createPayment(data: {
    invoice_id: number;
    amount: number;
    payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance' | 'wallet';
    transaction_id?: string;
    reference_number?: string;
    notes?: string;
  }) {
    const response = await this.api.post('/billing/payments', data);
    return response.data;
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async sendNotification(data: {
    type: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'in_app' | 'push';
    subject?: string;
    message: string;
    user_id?: number;
    patient_id?: number;
    recipient_email?: string;
    recipient_phone?: string;
    scheduled_for?: string;
  }) {
    const response = await this.api.post('/notifications', data);
    return response.data;
  }

  async sendBulkNotification(data: {
    type: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'in_app' | 'push';
    template_id: string;
    recipient_filters: Record<string, any>;
    scheduled_for?: string;
  }) {
    const response = await this.api.post('/notifications/bulk', data);
    return response.data;
  }

  // ============================================
  // AI LEADS
  // ============================================

  async getLeads(params?: {
    status?: 'new' | 'contacted' | 'qualified' | 'appointment_scheduled' | 'converted' | 'lost';
    source?: string;
    assigned_to?: number;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/ai-leads', { params });
    return response.data;
  }

  async convertLead(
    leadId: number,
    data: {
      create_patient?: boolean;
      patient_data?: Record<string, any>;
      conversion_notes?: string;
    }
  ) {
    const response = await this.api.post(`/ai-leads/${leadId}/convert`, data);
    return response.data;
  }

  async assignLead(leadId: number, userId: number) {
    const response = await this.api.post(`/ai-leads/${leadId}/assign?user_id=${userId}`);
    return response.data;
  }

  // ============================================
  // APPOINTMENTS
  // ============================================

  async getAppointments(params?: {
    patient_id?: number;
    doctor_id?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/appointments', { params });
    return response.data;
  }

  async getTodayAppointments(doctorId?: number) {
    const params = doctorId ? { doctor_id: doctorId } : {};
    const response = await this.api.get('/appointments/today', { params });
    return response.data;
  }

  // ============================================
  // PATIENTS
  // ============================================

  async getPatients(params?: {
    search?: string;
    gender?: 'male' | 'female' | 'other';
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/patients', { params });
    return response.data;
  }

  // ============================================
  // DOCTORS
  // ============================================

  async getDoctors(params?: {
    department_id?: number;
    specialization?: string;
    is_available?: boolean;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }) {
    const response = await this.api.get('/doctors', { params });
    return response.data;
  }

  async getDoctorStats(doctorId: number, fromDate?: string, toDate?: string) {
    const response = await this.api.get(`/doctors/${doctorId}/stats`, {
      params: { from_date: fromDate, to_date: toDate },
    });
    return response.data;
  }

  // ============================================
  // BATCH OPERATIONS (Optimized for dashboard)
  // ============================================

  /**
   * Load all clinic stats in parallel with error handling
   * Returns partial results even if some requests fail
   */
  async batchGetTenantStats(tenantIds: number[]) {
    const results = await Promise.allSettled(
      tenantIds.map((id) => this.getTenantStats(id))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to load stats for tenant ${tenantIds[index]}:`, result.reason);
        // Return fallback data structure
        return {
          id: tenantIds[index],
          total_patients: 0,
          total_doctors: 0,
          total_appointments: 0,
          monthly_revenue: 0,
          active_users: 0,
        };
      }
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;