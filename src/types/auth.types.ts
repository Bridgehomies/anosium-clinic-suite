/**
 * Authentication Type Definitions
 * Matches backend auth schemas
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'CLINIC_ADMIN' 
  | 'DOCTOR' 
  | 'RECEPTIONIST' 
  | 'STAFF' 
  | 'ACCOUNTANT';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  tenant_id: number | null;
  phone?: string;
  avatar_url?: string;
  permissions: Record<string, any>;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  clinicName?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface TokenPayload {
  user_id: number;
  tenant_id?: number;
  role: UserRole;
  email: string;
  exp: number;
  iat: number;
  type: 'access' | 'refresh';
}

export interface PasswordReset {
  email: string;
}

export interface PasswordChange {
  old_password: string;
  new_password: string;
}

export interface SessionInfo {
  device_name: string;
  ip_address: string;
  last_used: string;
  created_at: string;
  token: string;
}

// Permission helpers
export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export const RoleHierarchy: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  CLINIC_ADMIN: 4,
  DOCTOR: 3,
  ACCOUNTANT: 2,
  RECEPTIONIST: 2,
  STAFF: 1,
};

export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
};