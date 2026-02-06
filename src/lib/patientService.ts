/**
 * Patient Service
 * Handles all patient-related API calls
 */

import apiClient from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Patient {
  id: number;
  tenant_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  email?: string;
  phone: string;
  address?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  email?: string;
  address?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  is_active?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface PatientListParams {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
}

// ============================================================================
// PATIENT SERVICE CLASS
// ============================================================================

class PatientService {
  /**
   * Get paginated list of patients
   * Backend: GET /patients
   */
  async getPatients(params?: PatientListParams): Promise<PaginatedResponse<Patient>> {
    const response = await apiClient.get<PaginatedResponse<Patient>>('/patients', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        search: params?.search,
        is_active: params?.is_active,
      },
    });
    return response.data;
  }

  /**
   * Get single patient by ID
   * Backend: GET /patients/{id}
   */
  async getPatient(id: number): Promise<Patient> {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  }

  /**
   * Create new patient
   * Backend: POST /patients
   */
  async createPatient(data: PatientCreate): Promise<Patient> {
    const response = await apiClient.post<Patient>('/patients', data);
    return response.data;
  }

  /**
   * Update existing patient
   * Backend: PUT /patients/{id}
   */
  async updatePatient(id: number, data: PatientUpdate): Promise<Patient> {
    const response = await apiClient.put<Patient>(`/patients/${id}`, data);
    return response.data;
  }

  /**
   * Delete patient
   * Backend: DELETE /patients/{id}
   */
  async deletePatient(id: number): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  }

  /**
   * Get patient's visit history
   * Backend: GET /patients/{id}/visits
   */
  async getPatientVisits(id: number): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/patients/${id}/visits`);
    return response.data;
  }

  /**
   * Get patient's appointments
   * Backend: GET /patients/{id}/appointments
   */
  async getPatientAppointments(id: number): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/patients/${id}/appointments`);
    return response.data;
  }

  /**
   * Search patients by query
   */
  async searchPatients(query: string, limit: number = 10): Promise<Patient[]> {
    const response = await this.getPatients({
      search: query,
      limit,
    });
    return response.items;
  }
}

export default new PatientService();