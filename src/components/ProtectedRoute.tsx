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
  // isSuperAdmin is a pre-computed boolean from AuthContext — no string coercion needed
  const { user, isAuthenticated, isLoading: authLoading, isSuperAdmin } = useAuth();
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
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================================

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.includes(user.role as UserRole);
    if (!hasRequiredRole) {
      return (
        <Navigate
          to="/unauthorized"
          state={{
            requiredRole: allowedRoles.join(' or '),
            currentRole: user.role,
          }}
          replace
        />
      );
    }
  }

  // ============================================================================
  // TENANT VALIDATION
  // ============================================================================

  if (requireActiveTenant && !isSuperAdmin) {
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

    // Compare lowercase — API returns 'active' | 'trial' | 'suspended' | 'cancelled'
    const subStatus = (currentTenant.subscription_status ?? '').toLowerCase();
    const isSubscriptionActive = subStatus === 'active' || subStatus === 'trial';

    if (!isSubscriptionActive) {
      return (
        <Navigate
          to="/subscription-expired"
          state={{
            message: 'Your subscription has expired',
            status: currentTenant.subscription_status,
          }}
          replace
        />
      );
    }
  }

  // ============================================================================
  // FEATURE ACCESS CHECK
  // ============================================================================

  if (requireFeature && !isSuperAdmin) {
    if (!hasFeature(requireFeature)) {
      return (
        <Navigate
          to="/feature-unavailable"
          state={{
            feature: requireFeature,
            tier: currentTenant?.subscription_tier ?? 'free',
          }}
          replace
        />
      );
    }
  }

  // ============================================================================
  // RENDER PROTECTED CONTENT
  // ============================================================================

  return <>{children}</>;
};

export default ProtectedRoute;