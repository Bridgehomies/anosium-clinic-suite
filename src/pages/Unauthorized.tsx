/**
 * Unauthorized Page
 * Shown when user tries to access a route they don't have permissions for
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { requiredRole?: string; currentRole?: string } | null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            <CardTitle>Access Denied</CardTitle>
          </div>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state && (
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="mb-2">
                <strong>Required Role:</strong> {state.requiredRole || 'Unknown'}
              </p>
              <p>
                <strong>Your Role:</strong> {state.currentRole || 'Unknown'}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact your clinic administrator.
          </p>

          <Button onClick={() => navigate('/dashboard')} className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;