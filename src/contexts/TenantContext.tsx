/**
 * TenantContext - Multi-Tenant State Management
 * Manages clinic/tenant switching and tenant-specific data
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'TRIAL';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
  enabled_features: Record<string, any>;
  logo_url?: string;
  primary_color: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TenantWithStats extends Tenant {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  monthly_revenue: number;
  active_users: number;
}

export interface TenantContextType {
  // State
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  
  // Actions
  fetchCurrentTenant: () => Promise<void>;
  fetchTenantStats: () => Promise<TenantWithStats | null>;
  switchTenant: (tenantId: number) => void;
  updateTenant: (data: Partial<Tenant>) => Promise<void>;
  
  // Feature checks
  hasFeature: (feature: string) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
  
  // Subscription helpers
  isSubscriptionActive: boolean;
  subscriptionTier: SubscriptionTier;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // FETCH CURRENT TENANT
  // ============================================================================

  const fetchCurrentTenant = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCurrentTenant(null);
      return;
    }

    // Super admin without tenant_id
    if (isSuperAdmin && !user.tenant_id) {
      setCurrentTenant(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get<Tenant>('/tenants/me');
      setCurrentTenant(response.data);
      
      // Store tenant ID in localStorage for API client
      localStorage.setItem('tenant_id', response.data.id.toString());
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load clinic information',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isSuperAdmin]);

  // ============================================================================
  // FETCH TENANT WITH STATS
  // ============================================================================

  const fetchTenantStats = useCallback(async (): Promise<TenantWithStats | null> => {
    if (!isAuthenticated || !user?.tenant_id) {
      return null;
    }

    try {
      const response = await apiClient.get<TenantWithStats>('/tenants/me/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tenant stats:', error);
      return null;
    }
  }, [isAuthenticated, user]);

  // ============================================================================
  // SWITCH TENANT (Super Admin Only)
  // ============================================================================

  const switchTenant = useCallback((tenantId: number) => {
    if (!isSuperAdmin) {
      console.warn('Only super admins can switch tenants');
      return;
    }

    // Store tenant ID for X-Tenant-ID header
    localStorage.setItem('tenant_id', tenantId.toString());
    
    // Refresh tenant data
    fetchCurrentTenant();
    
    toast({
      title: 'Tenant switched',
      description: 'Viewing data for selected clinic',
    });
  }, [isSuperAdmin, fetchCurrentTenant]);

  // ============================================================================
  // UPDATE TENANT
  // ============================================================================

  const updateTenant = useCallback(async (data: Partial<Tenant>) => {
    if (!currentTenant) {
      throw new Error('No tenant loaded');
    }

    try {
      const response = await apiClient.put<Tenant>('/tenants/me', data);
      setCurrentTenant(response.data);
      
      toast({
        title: 'Success',
        description: 'Clinic information updated',
      });
    } catch (error) {
      console.error('Failed to update tenant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update clinic information',
      });
      throw error;
    }
  }, [currentTenant]);

  // ============================================================================
  // FEATURE CHECKS
  // ============================================================================

  const hasFeature = useCallback((feature: string): boolean => {
    if (!currentTenant) return false;
    return currentTenant.enabled_features?.[feature] === true;
  }, [currentTenant]);

  const isFeatureEnabled = useCallback((feature: string): boolean => {
    return hasFeature(feature);
  }, [hasFeature]);

  // ============================================================================
  // SUBSCRIPTION HELPERS
  // ============================================================================

  const isSubscriptionActive = currentTenant?.subscription_status === 'ACTIVE' || 
                                currentTenant?.subscription_status === 'TRIAL';
  
  const subscriptionTier = currentTenant?.subscription_tier || 'FREE';

  // ============================================================================
  // LOAD TENANT ON AUTH CHANGE
  // ============================================================================

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCurrentTenant();
    } else {
      setCurrentTenant(null);
      localStorage.removeItem('tenant_id');
    }
  }, [isAuthenticated, user, fetchCurrentTenant]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: TenantContextType = {
    // State
    currentTenant,
    tenants,
    isLoading,
    
    // Actions
    fetchCurrentTenant,
    fetchTenantStats,
    switchTenant,
    updateTenant,
    
    // Feature checks
    hasFeature,
    isFeatureEnabled,
    
    // Subscription helpers
    isSubscriptionActive,
    subscriptionTier,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

export default TenantContext;