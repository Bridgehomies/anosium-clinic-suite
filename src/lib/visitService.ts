import apiClient, { getErrorMessage } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisitStatus = 'in_progress' | 'completed' | 'pending_payment';

export interface Vitals {
  blood_pressure?: string | null;
  temperature?: number | null;
  pulse?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  weight?: number | null;
  height?: number | null;
  bmi?: number | null;
}

export interface Prescription {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string | null;
}

export interface LabTest {
  test_name: string;
  test_code?: string | null;
  instructions?: string | null;
  urgent?: boolean;
}

export interface PatientSummary {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  patient_code: string;
  phone: string;
  email?: string | null;
  date_of_birth: string;
  gender: string;
  age: number;
}

export interface DoctorSummary {
  id: number;
  specialization: string;
  doctor_code: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  } | null;
}

export interface Visit {
  id: number;
  tenant_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number | null;
  visit_code: string;
  visit_date: string;
  status: VisitStatus;
  chief_complaint: string;
  symptoms: string[];
  vitals?: Vitals | null;
  diagnosis?: string | null;
  diagnosis_codes: string[];
  treatment_plan?: string | null;
  prescriptions: Prescription[];
  lab_tests_ordered: LabTest[];
  procedures_performed: string[];
  follow_up_required: boolean;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  attachments: string[];
  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
  patient: PatientSummary;
  doctor: DoctorSummary;
}

export interface PaginatedVisits {
  items: Visit[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface VisitCreatePayload {
  patient_id: number;
  doctor_id: number;
  appointment_id?: number | null;
  chief_complaint: string;
  symptoms?: string[];
  vitals?: Vitals | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  prescriptions?: Prescription[];
  lab_tests_ordered?: LabTest[];
  procedures_performed?: string[];
  follow_up_required?: boolean;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
}

export interface VisitUpdatePayload {
  chief_complaint?: string | null;
  symptoms?: string[] | null;
  vitals?: Vitals | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  prescriptions?: Prescription[] | null;
  lab_tests_ordered?: LabTest[] | null;
  procedures_performed?: string[] | null;
  follow_up_required?: boolean | null;
  follow_up_date?: string | null;
  follow_up_notes?: string | null;
  status?: VisitStatus | null;
}

export interface ListVisitsParams {
  page?: number;
  page_size?: number;
  patient_id?: number;
  doctor_id?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class VisitService {
  private readonly base = '/visits';

  /** List visits with optional pagination + filtering */
  async listVisits(params: ListVisitsParams = {}): Promise<PaginatedVisits> {
    try {
      const { data } = await apiClient.get<PaginatedVisits>(this.base, { params });
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  /** Get a single visit with full details */
  async getVisit(visitId: number): Promise<Visit> {
    try {
      const { data } = await apiClient.get<Visit>(`${this.base}/${visitId}`);
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  /** Create a new visit */
  async createVisit(payload: VisitCreatePayload): Promise<Visit> {
    try {
      const { data } = await apiClient.post<Visit>(this.base, payload);
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  /** Update an existing visit */
  async updateVisit(visitId: number, payload: VisitUpdatePayload): Promise<Visit> {
    try {
      const { data } = await apiClient.put<Visit>(`${this.base}/${visitId}`, payload);
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  /** Mark a visit as completed */
  async completeVisit(visitId: number): Promise<Visit> {
    try {
      const { data } = await apiClient.post<Visit>(`${this.base}/${visitId}/complete`);
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  /** Get visit history for a patient */
  async getPatientHistory(patientId: number, limit = 10): Promise<Visit[]> {
    try {
      const { data } = await apiClient.get<Visit[]>(`${this.base}/patient/${patientId}/history`, {
        params: { limit },
      });
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
}

export const visitService = new VisitService();