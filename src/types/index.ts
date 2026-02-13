// types/index.ts (or a dedicated file)
export type UserRole = 'SUPER_ADMIN' | 'clinic_admin' | 'doctor' | 'receptionist' | 'staff';
export type InviteMethod = 'email' | 'code' | 'direct';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  clinic?: string;
  clinicId?: number;
  status: 'active' | 'pending' | 'inactive';
  lastActive?: string;
  createdAt: string;
}

export interface Clinic {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  adminId?: number;
  adminName?: string;
  status: 'active' | 'inactive';
  staffCount: number;
  patientsCount: number;
  monthlyRevenue: number;
  createdAt: string;
}

// You can also add other shared types here