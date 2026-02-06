/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Updated to match FastAPI backend OpenAPI specification
 */

import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
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
  role: string;
  tenant_id: number | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

class AuthService {
  /**
   * Sign in user
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
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
  }

  /**
   * Sign up new user (creates tenant)
   */
  async signUp(data: SignUpData): Promise<UserResponse> {
    // Split full name into first and last name
    const nameParts = data.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last if only one name provided
    
    // Generate slug from email (you might want to make this user-customizable)
    const slug = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Create tenant (which also creates the admin user)
    const payload = {
      name: data.fullName + "'s Clinic", // You might want to ask for clinic name separately
      email: data.email,
      slug: slug,
      password: data.password,
      admin_first_name: firstName,
      admin_last_name: lastName,
    };

    const response = await apiClient.post<any>('/tenants', payload);
    
    // After registration, automatically log in
    await this.signIn({
      email: data.email,
      password: data.password,
    });
    
    // Return user data (you'll get it from the login flow)
    const user = this.getUser();
    return user as UserResponse;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      this.clearStorage();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // According to the API spec, refresh_token is a query parameter
    const response = await apiClient.post<TokenResponse>(
      `/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`
    );
    
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }
    
    return response.data;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  }

  /**
   * Fetch and store user data
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
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password/reset-request', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // According to API spec, these are query parameters
    await apiClient.post(
      `/auth/password/reset?token=${encodeURIComponent(token)}&new_password=${encodeURIComponent(newPassword)}`
    );
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/password/change', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    // According to API spec, token is a query parameter
    await apiClient.post(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

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
}

export default new AuthService();