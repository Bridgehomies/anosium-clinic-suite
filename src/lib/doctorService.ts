/**
 * Doctor Service
 * Handles all doctor-related API calls
 */

import apiClient from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Doctor {
  id: number;
  tenant_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  specialization: string;
  qualification: string;
  license_number?: string;
  department_id?: number;
  email: string;
  phone: string;
  consultation_fee?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  
  // Populated fields
  department?: any;
  user?: any;
}

export interface DoctorCreate {
  user_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  qualification: string;
  license_number?: string;
  department_id?: number;
  email: string;
  phone: string;
  consultation_fee?: number;
}

export interface DoctorUpdate {
  first_name?: string;
  last_name?: string;
  specialization?: string;
  qualification?: string;
  license_number?: string;
  department_id?: number;
  email?: string;
  phone?: string;
  consultation_fee?: number;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface DoctorListParams {
  skip?: number;
  limit?: number;
  department_id?: number;
  is_active?: boolean;
  search?: string;  // ✅ Added search parameter
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// ============================================================================
// DOCTOR SERVICE CLASS
// ============================================================================

class DoctorService {
  async getDoctors(params?: DoctorListParams): Promise<PaginatedResponse<Doctor>> {
    const response = await apiClient.get<PaginatedResponse<Doctor>>('/doctors', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        department_id: params?.department_id,
        is_active: params?.is_active,
        search: params?.search,  // ✅ Pass search to backend
      },
    });
    return response.data;
  }

  async getDoctor(id: number): Promise<Doctor> {
    const response = await apiClient.get<Doctor>(`/doctors/${id}`);
    return response.data;
  }

  async createDoctor(data: DoctorCreate): Promise<Doctor> {
    const response = await apiClient.post<Doctor>('/doctors', data);
    return response.data;
  }

  async updateDoctor(id: number, data: DoctorUpdate): Promise<Doctor> {
    const response = await apiClient.put<Doctor>(`/doctors/${id}`, data);
    return response.data;
  }

  async deleteDoctor(id: number): Promise<void> {
    await apiClient.delete(`/doctors/${id}`);
  }

  async getDoctorAppointments(
    id: number,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/doctors/${id}/appointments`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  async getDoctorAvailability(id: number, date: string): Promise<TimeSlot[]> {
    const response = await apiClient.get<{ available_slots: TimeSlot[] }>(
      `/doctors/${id}/availability`,
      { params: { date } }
    );
    return response.data.available_slots;
  }

  async getActiveDoctors(): Promise<Doctor[]> {
    const response = await this.getDoctors({ is_active: true, limit: 100 });
    return response.items ?? [];
  }

  async getDoctorsByDepartment(departmentId: number): Promise<Doctor[]> {
    const response = await this.getDoctors({ department_id: departmentId, limit: 100 });
    return response.items ?? [];
  }

  async getDoctorsBySpecialization(specialization: string): Promise<Doctor[]> {
    const response = await this.getDoctors({ limit: 100 });
    return (response.items ?? []).filter(
      (doctor) => doctor.specialization.toLowerCase() === specialization.toLowerCase()
    );
  }
}

export default new DoctorService();