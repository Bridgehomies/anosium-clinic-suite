/**
 * Protected Route Component
 * Handles authentication, role-based access control (RBAC), and tenant validation
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireActiveTenant?: boolean;
  requireFeature?: string;
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

const LoadingScreen: React.FC = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireActiveTenant = false,
  requireFeature,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTenant, isLoading: tenantLoading, hasFeature } = useTenant();

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (authLoading || tenantLoading) {
    return <LoadingScreen />;
  }

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  if (!isAuthenticated || !user) {
    // Save attempted location for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================================

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user.role as UserRole);

    if (!hasRequiredRole) {
      // User doesn't have required role
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            requiredRole: allowedRoles.join(' or '),
            currentRole: user.role 
          }} 
          replace 
        />
      );
    }
  }

  // ============================================================================
  // TENANT VALIDATION
  // ============================================================================

  if (requireActiveTenant) {
    // Super admins can access without tenant
    if (user.role !== 'SUPER_ADMIN') {
      if (!currentTenant) {
        return (
          <Navigate 
            to="/no-tenant" 
            state={{ message: 'No clinic assigned' }}
            replace 
          />
        );
      }

      if (!currentTenant.is_active) {
        return (
          <Navigate 
            to="/tenant-inactive" 
            state={{ message: 'Your clinic account is inactive' }}
            replace 
          />
        );
      }

      // Check subscription status
      const isSubscriptionActive = 
        currentTenant.subscription_status === 'ACTIVE' || 
        currentTenant.subscription_status === 'TRIAL';

      if (!isSubscriptionActive) {
        return (
          <Navigate 
            to="/subscription-expired" 
            state={{ 
              message: 'Your subscription has expired',
              status: currentTenant.subscription_status 
            }}
            replace 
          />
        );
      }
    }
  }

  // ============================================================================
  // FEATURE ACCESS CHECK
  // ============================================================================

  if (requireFeature) {
    // Super admins have access to all features
    if (user.role !== 'SUPER_ADMIN') {
      if (!hasFeature(requireFeature)) {
        return (
          <Navigate 
            to="/feature-unavailable" 
            state={{ 
              feature: requireFeature,
              tier: currentTenant?.subscription_tier || 'FREE'
            }}
            replace 
          />
        );
      }
    }
  }

  // ============================================================================
  // RENDER PROTECTED CONTENT
  // ============================================================================

  return <>{children}</>;
};

export default ProtectedRoute;