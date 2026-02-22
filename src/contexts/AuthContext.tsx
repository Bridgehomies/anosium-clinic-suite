/**
 * AuthContext - Authentication State Management
 * Manages user authentication, JWT tokens, and session state
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { UserResponse, LoginCredentials, SignUpData } from '@/lib/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

// Matches UserResponse.role from authService exactly
export type UserRole = 'SUPER_ADMIN' | 'clinic_admin' | 'DOCTOR' | 'RECEPTIONIST' | 'STAFF';

export interface AuthContextType {
  // State
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;        // ← exposed so components don't touch localStorage directly
  tenantId: number | null;
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Permission helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isSuperAdmin: boolean;
  isClinicAdmin: boolean;
  isDoctor: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalise any role string to lowercase so comparisons are always safe,
 * even if old stored data or a future API change returns uppercase values.
 */
function normaliseRole(role: string | undefined | null): string {
  return (role ?? '').toLowerCase();
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    // Initialise from whatever authService already persisted
    () => authService.getAccessToken()
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ============================================================================
  // INITIALIZATION - Load user from storage
  // ============================================================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setIsLoading(false);
          return;
        }

        // Try localStorage first (fast path)
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Sync token state
        const token = authService.getAccessToken();
        setAccessToken(token);

        // Then confirm from API (ensures data is current)
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authService.clearStorage();
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ============================================================================
  // LOGIN
  // ============================================================================

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      await authService.signIn(credentials);

      // Sync token into state so consumers get the updated value
      const token = authService.getAccessToken();
      setAccessToken(token);

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      toast({
        title: 'Login successful',
        description: `Welcome back, ${currentUser.first_name}!`,
      });

      if (normaliseRole(currentUser.role) === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.response?.data?.detail || 'Invalid email or password',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // ============================================================================
  // SIGNUP
  // ============================================================================

  const signup = useCallback(async (data: SignUpData) => {
    setIsLoading(true);
    try {
      await authService.signUp(data);

      const token = authService.getAccessToken();
      setAccessToken(token);

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      toast({
        title: 'Registration successful',
        description: 'Your clinic has been created!',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'Failed to create account';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map((err: any) => err.msg).join(', ');
      }

      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: errorMessage,
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // ============================================================================
  // LOGOUT
  // ============================================================================

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      authService.clearStorage();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
      navigate('/');
    }
  }, [navigate]);

  // ============================================================================
  // REFRESH USER DATA
  // ============================================================================

  const refreshUser = useCallback(async () => {
    try {
      const token = authService.getAccessToken();
      setAccessToken(token);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setAccessToken(null);
      authService.clearStorage();
      navigate('/');
    }
  }, [navigate]);

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  const hasRole = useCallback((role: UserRole): boolean => {
    return normaliseRole(user?.role) === normaliseRole(role);
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    const userNorm = normaliseRole(user?.role);
    return roles.some(r => normaliseRole(r) === userNorm);
  }, [user]);

  // ============================================================================
  // COMPUTED PROPERTIES — all use normalised comparison
  // ============================================================================

  const isAuthenticated = !!user;
  const isSuperAdmin = normaliseRole(user?.role) === 'super_admin';
  const isClinicAdmin = normaliseRole(user?.role) === 'clinic_admin' || isSuperAdmin;
  const isDoctor = normaliseRole(user?.role) === 'doctor';
  const tenantId = user?.tenant_id ?? null;

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    accessToken,
    tenantId,   
    login,
    signup,
    logout,
    refreshUser,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isClinicAdmin,
    isDoctor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe defaults during initialization instead of throwing
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
      accessToken: null,
      tenantId: null,
      login: async () => {},
      signup: async () => {},
      logout: async () => {},
      refreshUser: async () => {},
      hasRole: () => false,
      hasAnyRole: () => false,
      isSuperAdmin: false,
      isClinicAdmin: false,
      isDoctor: false,
    };
  }
  return context;
};

export default AuthContext;