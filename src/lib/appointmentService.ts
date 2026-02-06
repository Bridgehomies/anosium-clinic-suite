/**
 * Appointment Service
 * Handles all appointment-related API calls
 */

import apiClient from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Appointment {
  id: number;
  tenant_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_datetime: string;
  duration_minutes: number;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  
  // Populated fields (if backend includes them)
  patient?: any;
  doctor?: any;
}

export interface AppointmentCreate {
  patient_id: number;
  doctor_id: number;
  appointment_datetime: string;
  duration_minutes?: number;
  reason?: string;
  notes?: string;
}

export interface AppointmentUpdate {
  appointment_datetime?: string;
  duration_minutes?: number;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface AppointmentListParams {
  skip?: number;
  limit?: number;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  doctor_id?: number;
  patient_id?: number;
  date?: string; // Format: YYYY-MM-DD
  start_date?: string;
  end_date?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// ============================================================================
// APPOINTMENT SERVICE CLASS
// ============================================================================

class AppointmentService {
  /**
   * Get paginated list of appointments
   * Backend: GET /appointments
   */
  async getAppointments(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    const response = await apiClient.get<PaginatedResponse<Appointment>>('/appointments', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        status: params?.status,
        doctor_id: params?.doctor_id,
        patient_id: params?.patient_id,
        date: params?.date,
      },
    });
    return response.data;
  }

  /**
   * Get single appointment by ID
   * Backend: GET /appointments/{id}
   */
  async getAppointment(id: number): Promise<Appointment> {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  }

  /**
   * Create new appointment
   * Backend: POST /appointments
   */
  async createAppointment(data: AppointmentCreate): Promise<Appointment> {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  }

  /**
   * Update existing appointment
   * Backend: PUT /appointments/{id}
   */
  async updateAppointment(id: number, data: AppointmentUpdate): Promise<Appointment> {
    const response = await apiClient.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  }

  /**
   * Delete appointment
   * Backend: DELETE /appointments/{id}
   */
  async deleteAppointment(id: number): Promise<void> {
    await apiClient.delete(`/appointments/${id}`);
  }

  /**
   * Update appointment status
   * Backend: POST /appointments/{id}/status
   */
  async updateAppointmentStatus(
    id: number,
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  ): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/status`, { status });
    return response.data;
  }

  /**
   * Reschedule appointment
   * Backend: POST /appointments/{id}/reschedule
   */
  async rescheduleAppointment(id: number, newDatetime: string): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/reschedule`, {
      new_datetime: newDatetime,
    });
    return response.data;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: number): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'CANCELLED');
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(id: number): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'CONFIRMED');
  }

  /**
   * Mark appointment as completed
   */
  async completeAppointment(id: number): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'COMPLETED');
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(id: number): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'NO_SHOW');
  }

  /**
   * Get appointments for today
   */
  async getTodayAppointments(doctorId?: number): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const response = await this.getAppointments({
      date: today,
      doctor_id: doctorId,
      limit: 100,
    });
    return response.items;
  }

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(limit: number = 10, doctorId?: number): Promise<Appointment[]> {
    const response = await this.getAppointments({
      status: 'SCHEDULED',
      doctor_id: doctorId,
      limit,
    });
    return response.items;
  }

  /**
   * Get appointments by date range
   */
  async getAppointmentsByDateRange(
    startDate: string,
    endDate: string,
    doctorId?: number
  ): Promise<Appointment[]> {
    const response = await this.getAppointments({
      start_date: startDate,
      end_date: endDate,
      doctor_id: doctorId,
      limit: 1000,
    });
    return response.items;
  }
}

export default new AppointmentService();