import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api-service';
import { getDateRange, MONTH_NAMES, centsToDisplay } from '../utils/superAdmin.utils';
import {
  LoadingState, ClinicStats, User, NewClinicForm, NewUserForm,
  InviteMethod, ConsolidatedSummary, ReportTemplate,
} from '../types/superAdmin.types';
import { formatPhoneNumber, validatePhoneNumber, validatePassword } from '../utils/superAdmin.utils';

const EMPTY_CLINIC: NewClinicForm = {
  name: '', slug: '', email: '', phone: '', address: '', city: '', state: '',
  admin_first_name: '', admin_last_name: '', password: '',
};

const EMPTY_USER: NewUserForm = {
  email: '', first_name: '', last_name: '', phone: '', role: 'staff', tenant_id: 0, password: '',
};

export const useSuperAdminDashboard = () => {
  const { toast } = useToast();

  // ── Auth / access ──────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser]   = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // ── Loading ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState<LoadingState>({
    page: false, clinicAction: null, userAction: null, modalSubmit: false,
  });

  // ── Core data ──────────────────────────────────────────────────────────────
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [clinics, setClinics]               = useState<ClinicStats[]>([]);
  const [users, setUsers]                   = useState<User[]>([]);
  const [revenueData, setRevenueData]       = useState<any[]>([]);

  // ── Financial data ─────────────────────────────────────────────────────────
  const [revenueReport,     setRevenueReport]     = useState<any>(null);
  const [appointmentReport, setAppointmentReport] = useState<any>(null);
  const [patientReport,     setPatientReport]     = useState<any>(null);
  const [monthlyTrends,     setMonthlyTrends]     = useState<any>(null);
  const [financialLoading,  setFinancialLoading]  = useState(false);

  useEffect(() => { loadDashboardData(); }, []);

  // ── Data loaders ───────────────────────────────────────────────────────────

  const loadFinancialData = async (dateRange: string) => {
    setFinancialLoading(true);
    try {
      const { from, to } = getDateRange(dateRange);
      const [revReport, apptReport, patReport, trends] = await Promise.allSettled([
        apiService.getRevenueReport(from, to).catch(() => null),
        apiService.getAppointmentReport(from, to).catch(() => null),
        apiService.getPatientReport(from, to).catch(() => null),
        apiService.getMonthlyTrends(6).catch(() => null),
      ]);
      if (revReport.status     === 'fulfilled') setRevenueReport(revReport.value);
      if (apptReport.status    === 'fulfilled') setAppointmentReport(apptReport.value);
      if (patReport.status     === 'fulfilled') setPatientReport(patReport.value);
      if (trends.status        === 'fulfilled') setMonthlyTrends(trends.value);
    } catch {}
    finally { setFinancialLoading(false); }
  };

  const loadDashboardData = async () => {
    setLoading(prev => ({ ...prev, page: true }));
    try {
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);
      if (user.role?.toLowerCase() !== 'super_admin') {
        setAccessDenied(true);
        toast({ title: 'Access Denied', description: 'You need super admin privileges to access this dashboard.', variant: 'destructive' });
        return;
      }

      const [statsResult, clinicsResult, usersResult, revenueResult] = await Promise.allSettled([
        apiService.getDashboardStats().catch(() => ({ this_month_revenue: 0, today_revenue: 0, pending_payments: 0 })),
        apiService.getTenants({ page_size: 100 }).catch(() => ({ items: [] })),
        apiService.getUsers({ page_size: 100 }).catch(() => ({ items: [] })),
        (async () => {
          try {
            const today = new Date();
            const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
            return await apiService.getRevenueReport(sixMonthsAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
          } catch { return { daily_breakdown: [], top_revenue_services: [] }; }
        })(),
      ]);

      const stats      = statsResult.status   === 'fulfilled' ? statsResult.value              : { this_month_revenue: 0, today_revenue: 0, pending_payments: 0 };
      const clinicsData= clinicsResult.status === 'fulfilled' ? clinicsResult.value.items || [] : [];
      const usersData  = usersResult.status   === 'fulfilled' ? usersResult.value.items || []   : [];
      const revenue    = revenueResult.status === 'fulfilled' ? revenueResult.value             : { daily_breakdown: [], top_revenue_services: [] };

      setDashboardStats(stats);
      setUsers(usersData);
      setRevenueData(revenue.daily_breakdown?.slice(-30) || []);

      if (Array.isArray(clinicsData) && clinicsData.length > 0) {
        const clinicIds = clinicsData.filter((c: any) => c && typeof c.id === 'number').map((c: any) => c.id);
        if (clinicIds.length > 0) {
          const clinicsWithStats = await apiService.batchGetTenantStats(clinicIds);
          setClinics(clinicsWithStats);
        } else setClinics([]);
      } else setClinics([]);

      loadFinancialData('6months');
    } catch (error: any) {
      if (error.response?.status === 401) { window.location.href = '/login'; return; }
      toast({ title: 'Error', description: 'Failed to load dashboard data. Some features may not be available.', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  };

  // ── Clinic actions ─────────────────────────────────────────────────────────

  const handleAddClinic = async (newClinic: NewClinicForm, onSuccess: () => void) => {
    setLoading(prev => ({ ...prev, modalSubmit: true }));
    try {
      await apiService.createTenant(newClinic);
      toast({ title: 'Clinic created!', description: `${newClinic.name} is now live.` });
      onSuccess();
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create clinic', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, modalSubmit: false }));
    }
  };

  const handleDeleteClinic = async (clinic: ClinicStats) => {
    setLoading(prev => ({ ...prev, clinicAction: clinic.id }));
    try {
      await apiService.deleteTenant(clinic.id);
      toast({ title: 'Clinic deleted', description: `${clinic.name} has been removed.` });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to delete', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, clinicAction: null }));
    }
  };

  const handleToggleClinicStatus = async (clinic: ClinicStats) => {
    setLoading(prev => ({ ...prev, clinicAction: clinic.id }));
    try {
      clinic.is_active
        ? await apiService.deactivateTenant(clinic.id)
        : await apiService.activateTenant(clinic.id);
      toast({ title: 'Status updated', description: `${clinic.name} has been ${clinic.is_active ? 'deactivated' : 'activated'}.` });
      loadDashboardData();
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, clinicAction: null }));
    }
  };

  // ── User actions ───────────────────────────────────────────────────────────

  const handleAddUser = async (
    newUser: NewUserForm,
    inviteMethod: InviteMethod,
    generatedCode: string,
    onSuccess: () => void,
  ) => {
    if (newUser.phone && !validatePhoneNumber(newUser.phone)) {
      toast({ title: 'Validation Error', description: 'Invalid phone number format. Use +923001234567 or 923001234567', variant: 'destructive' });
      return;
    }
    const passwordToUse = inviteMethod === 'code' ? generatedCode : newUser.password;
    if (inviteMethod !== 'email') {
      const check = validatePassword(passwordToUse);
      if (!check.valid) { toast({ title: 'Validation Error', description: check.error, variant: 'destructive' }); return; }
    }

    setLoading(prev => ({ ...prev, modalSubmit: true }));
    try {
      const userData = { ...newUser, phone: newUser.phone ? formatPhoneNumber(newUser.phone) : undefined };

      if (inviteMethod === 'email') {
        const tempPassword = `Temp${Math.random().toString(36).substring(2, 10)}!`;
        const user = await apiService.createUser({ ...userData, password: tempPassword });
        await apiService.sendWelcomeEmail(user.id);
        toast({ title: 'Invitation sent!', description: `${newUser.first_name} will receive an email shortly.` });
      } else if (inviteMethod === 'code') {
        await apiService.createUser({ ...userData, password: generatedCode });
        toast({ title: 'User created!', description: `Share the code ${generatedCode} with the user.` });
      } else {
        await apiService.createUser(userData);
        toast({ title: 'User created!', description: `${newUser.first_name} ${newUser.last_name} has been added.` });
      }

      onSuccess();
      loadDashboardData();
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.details?.map((d: any) => d.message).join(', ') ||
        error.response?.data?.error?.message ||
        error.response?.data?.detail ||
        'Failed to create user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, modalSubmit: false }));
    }
  };

  const handleDeleteUser = async (user: User) => {
    setLoading(prev => ({ ...prev, userAction: user.id }));
    try {
      await apiService.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast({ title: 'User deleted', description: `${user.full_name} has been removed.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to delete user', variant: 'destructive' });
      loadDashboardData();
    } finally {
      setLoading(prev => ({ ...prev, userAction: null }));
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    setLoading(prev => ({ ...prev, userAction: user.id }));
    try {
      user.is_active
        ? await apiService.deactivateUser(user.id)
        : await apiService.activateUser(user.id);
      toast({ title: 'Status updated', description: `${user.full_name} has been ${user.is_active ? 'deactivated' : 'activated'}.` });
      loadDashboardData();
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, userAction: null }));
    }
  };

  const handleResendInvite = async (userId: number) => {
    setLoading(prev => ({ ...prev, userAction: userId }));
    try {
      await apiService.sendWelcomeEmail(userId);
      toast({ title: 'Invitation resent!', description: 'The user will receive a new email shortly.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to send', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, userAction: null }));
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const consolidatedSummary: ConsolidatedSummary = (() => {
    const totalRevenue      = revenueReport?.total_invoiced ?? 0;
    const totalCollected    = revenueReport?.total_collected ?? 0;
    const totalPending      = revenueReport?.total_pending ?? 0;
    const totalPatients     = clinics.reduce((sum, c) => sum + (c.total_patients ?? 0), 0);
    const totalAppointments = appointmentReport?.total_scheduled ?? 0;
    const completionRate    = totalAppointments > 0 ? ((appointmentReport?.completed ?? 0) / totalAppointments) * 100 : 0;
    const collectionRate    = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
    const newPatients       = patientReport?.new_registrations ?? 0;
    return {
      totalRevenue, totalCollected,
      netProfit: totalCollected - totalPending,
      profitMargin: totalCollected > 0 && totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
      totalPatients, newPatients, totalAppointments, completionRate, collectionRate,
      outstandingAmount: totalPending,
    };
  })();

  const monthlyConsolidated = (() => {
    if (!monthlyTrends?.revenue_trend?.length) return [];
    return monthlyTrends.revenue_trend.map((r: any) => ({
      month:    MONTH_NAMES[r.month] ?? `M${r.month}`,
      revenue:  Math.round(r.revenue ?? 0),
      expenses: Math.round((r.revenue ?? 0) * 0.6),
      profit:   Math.round((r.revenue ?? 0) * 0.4),
    }));
  })();

  const revenueByClinic = clinics
    .filter(c => c.is_active)
    .slice(0, 8)
    .map(c => ({ clinic: c.name, revenue: Math.round(c.monthly_revenue ?? 0) }));

  const serviceDistributionData = (revenueReport?.top_revenue_services ?? []).map((s: any) => ({
    name:  s.service_name,
    value: Math.round(s.total_revenue ?? s.revenue ?? 0),
  }));

  return {
    // state
    currentUser, accessDenied, loading, financialLoading,
    dashboardStats, clinics, users, revenueData,
    revenueReport, appointmentReport, patientReport,
    // derived
    consolidatedSummary, monthlyConsolidated, revenueByClinic, serviceDistributionData,
    // actions
    loadDashboardData, loadFinancialData,
    handleAddClinic, handleDeleteClinic, handleToggleClinicStatus,
    handleAddUser, handleDeleteUser, handleToggleUserStatus, handleResendInvite,
  };
};