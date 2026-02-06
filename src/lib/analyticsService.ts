/**
 * Analytics Service
 * Handles all analytics and dashboard-related API calls
 */

import apiClient from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DashboardStats {
  overview: {
    total_patients: number;
    total_appointments_today: number;
    total_revenue_today: number;
    pending_invoices_count: number;
  };
  appointments: {
    scheduled: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
  recent_activities: Activity[];
}

export interface Activity {
  id: number;
  type: 'appointment' | 'patient' | 'payment' | 'visit';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}

export interface AppointmentStats {
  period: string;
  total_appointments: number;
  by_status: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  by_doctor: Array<{
    doctor_id: number;
    doctor_name: string;
    appointment_count: number;
    completion_rate: number;
  }>;
  by_date: Array<{
    date: string;
    count: number;
  }>;
  average_duration: number;
  peak_hours: Array<{
    hour: number;
    count: number;
  }>;
}

export interface RevenueStats {
  period: string;
  total_revenue: number;
  total_invoices: number;
  average_invoice_value: number;
  by_service: Array<{
    service_name: string;
    revenue: number;
    count: number;
  }>;
  by_payment_method: Array<{
    payment_method: string;
    amount: number;
    count: number;
  }>;
  by_date: Array<{
    date: string;
    amount: number;
  }>;
  outstanding_amount: number;
  collection_rate: number;
}

export interface PatientStats {
  period: string;
  total_patients: number;
  new_patients: number;
  active_patients: number;
  by_gender: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  by_age_group: Array<{
    age_group: string;
    count: number;
  }>;
  by_visit_frequency: Array<{
    frequency: string;
    count: number;
  }>;
  retention_rate: number;
}

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  doctor_id?: number;
  department_id?: number;
}

// ============================================================================
// ANALYTICS SERVICE CLASS
// ============================================================================

class AnalyticsService {
  /**
   * Get dashboard statistics
   * Backend: GET /analytics/dashboard
   */
  async getDashboardStats(params?: AnalyticsParams): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/analytics/dashboard', {
      params: {
        start_date: params?.start_date,
        end_date: params?.end_date,
      },
    });
    return response.data;
  }

  /**
   * Get appointment statistics
   * Backend: GET /analytics/appointments
   */
  async getAppointmentStats(params?: AnalyticsParams): Promise<AppointmentStats> {
    const response = await apiClient.get<AppointmentStats>('/analytics/appointments', {
      params,
    });
    return response.data;
  }

  /**
   * Get revenue statistics
   * Backend: GET /analytics/revenue
   */
  async getRevenueStats(params?: AnalyticsParams): Promise<RevenueStats> {
    const response = await apiClient.get<RevenueStats>('/analytics/revenue', {
      params,
    });
    return response.data;
  }

  /**
   * Get patient statistics
   * Backend: GET /analytics/patients
   */
  async getPatientStats(params?: AnalyticsParams): Promise<PatientStats> {
    const response = await apiClient.get<PatientStats>('/analytics/patients', {
      params,
    });
    return response.data;
  }

  /**
   * Get today's dashboard stats
   */
  async getTodayDashboard(): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDashboardStats({
      start_date: today,
      end_date: today,
    });
  }

  /**
   * Get this week's stats
   */
  async getWeeklyStats(): Promise<{
    appointments: AppointmentStats;
    revenue: RevenueStats;
    patients: PatientStats;
  }> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const params = {
      start_date: weekAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };

    const [appointments, revenue, patients] = await Promise.all([
      this.getAppointmentStats(params),
      this.getRevenueStats(params),
      this.getPatientStats(params),
    ]);

    return { appointments, revenue, patients };
  }

  /**
   * Get this month's stats
   */
  async getMonthlyStats(): Promise<{
    appointments: AppointmentStats;
    revenue: RevenueStats;
    patients: PatientStats;
  }> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const params = {
      start_date: firstDayOfMonth.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };

    const [appointments, revenue, patients] = await Promise.all([
      this.getAppointmentStats(params),
      this.getRevenueStats(params),
      this.getPatientStats(params),
    ]);

    return { appointments, revenue, patients };
  }

  /**
   * Get custom date range stats
   */
  async getCustomRangeStats(
    startDate: string,
    endDate: string
  ): Promise<{
    appointments: AppointmentStats;
    revenue: RevenueStats;
    patients: PatientStats;
  }> {
    const params = {
      start_date: startDate,
      end_date: endDate,
    };

    const [appointments, revenue, patients] = await Promise.all([
      this.getAppointmentStats(params),
      this.getRevenueStats(params),
      this.getPatientStats(params),
    ]);

    return { appointments, revenue, patients };
  }

  /**
   * Get doctor-specific stats
   */
  async getDoctorStats(doctorId: number, startDate?: string, endDate?: string): Promise<{
    appointments: AppointmentStats;
    revenue: RevenueStats;
  }> {
    const params = {
      doctor_id: doctorId,
      start_date: startDate,
      end_date: endDate,
    };

    const [appointments, revenue] = await Promise.all([
      this.getAppointmentStats(params),
      this.getRevenueStats(params),
    ]);

    return { appointments, revenue };
  }

  /**
   * Calculate growth rate
   */
  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
  }
}

export default new AnalyticsService();