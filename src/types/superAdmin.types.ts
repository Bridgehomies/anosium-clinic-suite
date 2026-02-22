import { DollarSign } from 'lucide-react';

export type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'receptionist' | 'staff' | 'accountant';
export type CreateUserRole = 'clinic_admin' | 'doctor' | 'receptionist' | 'staff' | 'accountant';
export type InviteMethod = 'email' | 'code' | 'direct';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  tenant_id?: number;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
}

export interface Clinic {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
}

export interface ClinicStats extends Clinic {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  monthly_revenue: number;
  active_users: number;
}

export interface LoadingState {
  page: boolean;
  clinicAction: number | null;
  userAction: number | null;
  modalSubmit: boolean;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'financial' | 'clinical' | 'operational';
}

export interface NewClinicForm {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  admin_first_name: string;
  admin_last_name: string;
  password: string;
}

export interface NewUserForm {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: CreateUserRole;
  tenant_id: number;
  password: string;
}

export interface ConsolidatedSummary {
  totalRevenue: number;
  totalCollected: number;
  netProfit: number;
  profitMargin: number;
  totalPatients: number;
  newPatients: number;
  totalAppointments: number;
  completionRate: number;
  collectionRate: number;
  outstandingAmount: number;
}