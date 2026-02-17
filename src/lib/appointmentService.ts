/**
 * Appointment Service — aligned with backend OpenAPI spec
 */
import apiClient from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress'
  | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';

export type AppointmentType =
  | 'new_consultation' | 'follow_up' | 'emergency' | 'routine_checkup';

export interface Appointment {
  id: number;
  tenant_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_code: string;
  appointment_date: string;   // YYYY-MM-DD
  appointment_time: string;   // HH:MM:SS
  duration_minutes: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  booked_via_ai: boolean;
  ai_lead_id?: number | null;
  reminder_sent: boolean;
  reminder_sent_at?: string | null;
  checked_in_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at?: string | null;
  created_by?: number | null;
  patient: any;
  doctor: any;
}

export interface AppointmentCreate {
  appointment_date: string;   // YYYY-MM-DD
  appointment_time: string;   // HH:MM
  patient_id: number;
  doctor_id: number;
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  reason?: string | null;
  notes?: string | null;
  booked_via_ai?: boolean;
}

export interface AppointmentUpdate {
  appointment_date?: string | null;
  appointment_time?: string | null;
  duration_minutes?: number | null;
  reason?: string | null;
  notes?: string | null;
  status?: AppointmentStatus | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AppointmentListParams {
  page?: number;
  page_size?: number;
  status?: AppointmentStatus;
  doctor_id?: number;
  patient_id?: number;
  from_date?: string;
  to_date?: string;
}

export interface DoctorAvailabilitySlot {
  date: string;
  time: string;
  duration_minutes: number;
  is_available: boolean;
  doctor_id: number;
  doctor_name: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** "09:00 AM" → "09:00" */
export function to24Hour(time12: string): string {
  const [timePart, modifier] = time12.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`; // ← add :00
}

/** "09:00" → "09:00 AM" */
export function to12Hour(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const modifier = h >= 12 ? 'PM' : 'AM';
  const hours = h % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')} ${modifier}`;
}

export const STATUS_DISPLAY: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled', confirmed: 'Confirmed', checked_in: 'Checked In',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  no_show: 'No Show', rescheduled: 'Rescheduled',
};

// ── Service ───────────────────────────────────────────────────────────────────

class AppointmentService {
  async getAppointments(params?: AppointmentListParams): Promise<PaginatedResponse<Appointment>> {
    const response = await apiClient.get<PaginatedResponse<Appointment>>('/appointments', {
      params: {
        page: params?.page ?? 1,
        page_size: params?.page_size ?? 20,
        status: params?.status,
        doctor_id: params?.doctor_id,
        patient_id: params?.patient_id,
        from_date: params?.from_date,
        to_date: params?.to_date,
      },
    });
    return response.data;
  }

  async getAppointment(id: number): Promise<Appointment> {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  }

  async createAppointment(data: AppointmentCreate): Promise<Appointment> {
    const response = await apiClient.post<Appointment>('/appointments', data);
    return response.data;
  }

  async updateAppointment(id: number, data: AppointmentUpdate): Promise<Appointment> {
    const response = await apiClient.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  }

  async rescheduleAppointment(id: number, newDate: string, newTime: string, reason: string): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/reschedule`, {
      new_date: newDate, new_time: newTime, reason,
    });
    return response.data;
  }

  async cancelAppointment(id: number, cancellationReason: string): Promise<void> {
    await apiClient.post(`/appointments/${id}/cancel`, { cancellation_reason: cancellationReason });
  }

  async checkInAppointment(id: number): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/check-in`);
    return response.data;
  }

  async completeAppointment(id: number): Promise<Appointment> {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/complete`);
    return response.data;
  }

  async getTodayAppointments(doctorId?: number): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/appointments/today', {
      params: doctorId ? { doctor_id: doctorId } : undefined,
    });
    return response.data;
  }

  async getUpcomingAppointments(options?: { days?: number; patientId?: number; doctorId?: number }): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/appointments/upcoming', {
      params: { days: options?.days ?? 7, patient_id: options?.patientId, doctor_id: options?.doctorId },
    });
    return response.data;
  }

  async getDoctorAvailability(doctorId: number, fromDate: string, toDate: string): Promise<DoctorAvailabilitySlot[]> {
    const response = await apiClient.get<DoctorAvailabilitySlot[]>(
      `/appointments/doctor/${doctorId}/availability`,
      { params: { from_date: fromDate, to_date: toDate } }
    );
    return response.data;
  }
}

export default new AppointmentService();