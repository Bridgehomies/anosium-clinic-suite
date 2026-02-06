import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Visits = lazy(() => import("./pages/Visits"));
const Services = lazy(() => import("./pages/Services"));
const Departments = lazy(() => import("./pages/Departments"));
const Invoices = lazy(() => import("./pages/Invoices"));
const Payments = lazy(() => import("./pages/Payments"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <TooltipProvider>
                <SidebarProvider>
                  <Toaster />
                  <Sonner />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/unauthorized" element={<Unauthorized />} />

                      {/* Protected Routes - Dashboard */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Patients */}
                      <Route
                        path="/patients"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                            <Patients />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Doctors */}
                      <Route
                        path="/doctors"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN']}>
                            <Doctors />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Appointments */}
                      <Route
                        path="/appointments"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST']}>
                            <Appointments />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Visits */}
                      <Route
                        path="/visits"
                        element={
                          <ProtectedRoute allowedRoles={['DOCTOR', 'CLINIC_ADMIN']}>
                            <Visits />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Services */}
                      <Route
                        path="/services"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN']}>
                            <Services />
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Routes - Departments */}
                      <Route
                        path="/departments"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN']}>
                            <Departments />
                          </ProtectedRoute>
                        }
                      />

                      {/* Billing Routes */}
                      <Route
                        path="/billing/invoices"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'RECEPTIONIST']}>
                            <Invoices />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/billing/payments"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'RECEPTIONIST']}>
                            <Payments />
                          </ProtectedRoute>
                        }
                      />

                      {/* Analytics & Reports */}
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'SUPER_ADMIN']}>
                            <Analytics />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reports"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'SUPER_ADMIN']}>
                            <Reports />
                          </ProtectedRoute>
                        }
                      />

                      {/* NOTE: AI routes - Create these pages when ready */}
                      {/*
                      <Route
                        path="/ai/leads"
                        element={
                          <ProtectedRoute allowedRoles={['CLINIC_ADMIN', 'RECEPTIONIST']}>
                            <LeadManagement />
                          </ProtectedRoute>
                        }
                      />
                      */}

                      {/* Super Admin Only */}
                      <Route
                        path="/super-admin"
                        element={
                          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                            <SuperAdminDashboard />
                          </ProtectedRoute>
                        }
                      />

                      {/* Settings */}
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </SidebarProvider>
              </TooltipProvider>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;