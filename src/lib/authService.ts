/**
 * Authentication Service
 * Handles all authentication-related API calls
 * FIXED: Properly aligned with FastAPI backend OpenAPI specification
 */

import apiClient, { getErrorMessage } from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  clinicName?: string; // Optional clinic name
}

export interface TenantCreateRequest {
  name: string;
  email: string;
  slug: string;
  password: string;
  admin_first_name: string;
  admin_last_name: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'STAFF';
  tenant_id: number | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface TenantResponse {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  subscription_plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  subscription_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED';
  subscription_start_date: string;
  subscription_end_date?: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface SessionInfo {
  device_name: string;
  ip_address: string;
  last_used: string;
  created_at: string;
  token: string;
}

// ============================================================================
// AUTH SERVICE CLASS
// ============================================================================

class AuthService {
  /**
   * Sign in user
   * Backend: POST /auth/login
   * Body: {email, password}
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Store tokens
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        // Fetch and store user data
        await this.fetchAndStoreUserData();
      }

      return response.data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up new user (creates tenant + admin user)
   * Backend: POST /tenants
   * Body: {name, email, slug, password, admin_first_name, admin_last_name}
   */
  async signUp(data: SignUpData): Promise<TenantResponse> {
    try {
      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Generate slug from email
      const slug = data.email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      // Create tenant (which also creates the admin user)
      const payload: TenantCreateRequest = {
        name: data.clinicName || `${data.fullName}'s Clinic`,
        email: data.email,
        slug: slug,
        password: data.password,
        admin_first_name: firstName,
        admin_last_name: lastName,
      };

      const response = await apiClient.post<TenantResponse>('/tenants', payload);

      // After registration, automatically log in
      await this.signIn({
        email: data.email,
        password: data.password,
      });

      return response.data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out user
   * Backend: POST /auth/logout
   */
  async signOut(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      this.clearStorage();
    }
  }

  /**
   * Sign out from specific device
   * Backend: POST /auth/logout-device
   * Query params: ?refresh_token={token}
   */
  async signOutDevice(refreshToken: string): Promise<void> {
    try {
      await apiClient.post(`/auth/logout-device?refresh_token=${encodeURIComponent(refreshToken)}`);
    } catch (error) {
      console.error('Logout device error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * Backend: POST /auth/refresh
   * Query params: ?refresh_token={token}
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<AuthResponse>(
        `/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`
      );

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear tokens and redirect to login
      this.clearStorage();
      throw error;
    }
  }

  /**
   * Get current user
   * Backend: GET /auth/me
   */
  async getCurrentUser(): Promise<UserResponse> {
    try {
      const response = await apiClient.get<UserResponse>('/auth/me');
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Get active sessions
   * Backend: GET /auth/sessions
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: SessionInfo[] }>(
        '/auth/sessions'
      );
      return response.data.data;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  }

  /**
   * Fetch and store user data (internal helper)
   */
  private async fetchAndStoreUserData(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  /**
   * Request password reset
   * Backend: POST /auth/password/reset-request
   * Body: {email}
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/password/reset-request', { email });
    } catch (error) {
      console.error('Request password reset error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * Backend: POST /auth/password/reset
   * Query params: ?token={token}&new_password={password}
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post(
        `/auth/password/reset?token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(
          newPassword
        )}`
      );
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change password (requires authentication)
   * Backend: POST /auth/password/change
   * Body: {old_password, new_password}
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/password/change', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   * Backend: POST /auth/verify-email
   * Query params: ?token={token}
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  }

  // ============================================================================
  // LOCAL STORAGE HELPERS
  // ============================================================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  /**
   * Get stored user
   */
  getUser(): UserResponse | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Clear all stored authentication data
   */
  clearStorage(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    const user = this.getUser();
    return user?.role || null;
  }

  /**
   * Get tenant ID
   */
  getTenantId(): number | null {
    const user = this.getUser();
    return user?.tenant_id || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  /**
   * Check if user is clinic admin
   */
  isClinicAdmin(): boolean {
    return this.hasRole('CLINIC_ADMIN');
  }

  /**
   * Check if user is doctor
   */
  isDoctor(): boolean {
    return this.hasRole('DOCTOR');
  }
}

// Export singleton instance
export default new AuthService();