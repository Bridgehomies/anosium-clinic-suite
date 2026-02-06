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

export type UserRole = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'STAFF';

export interface AuthContextType {
  // State
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
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
// PROVIDER COMPONENT
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ============================================================================
  // INITIALIZATION - Load user from storage
  // ============================================================================

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens
        if (!authService.isAuthenticated()) {
          setIsLoading(false);
          return;
        }

        // Try to get user from localStorage first (fast)
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Then refresh from API (ensures data is current)
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid tokens
        authService.clearStorage();
        setUser(null);
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
      const response = await authService.signIn(credentials);
      
      // Fetch user data
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      toast({
        title: 'Login successful',
        description: `Welcome back, ${currentUser.first_name}!`,
      });

      // Navigate based on role
      if (currentUser.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.detail || 'Invalid email or password';
      
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: errorMessage,
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
      // Create tenant and admin user
      await authService.signUp(data);
      
      // SignUp automatically logs in, so fetch user
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      toast({
        title: 'Registration successful',
        description: 'Your clinic has been created!',
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Failed to create account';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg).join(', ');
        }
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
      // Clear state regardless of API call result
      setUser(null);
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
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might need to re-login
      setUser(null);
      authService.clearStorage();
      navigate('/');
    }
  }, [navigate]);

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role as UserRole) : false;
  }, [user]);

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isClinicAdmin = user?.role === 'CLINIC_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDoctor = user?.role === 'DOCTOR';

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    
    // Actions
    login,
    signup,
    logout,
    refreshUser,
    
    // Permission helpers
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isClinicAdmin,
    isDoctor,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;