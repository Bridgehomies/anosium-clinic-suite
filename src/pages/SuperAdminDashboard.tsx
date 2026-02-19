import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  UserPlus,
  Mail,
  Key,
  Shield,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  RefreshCw,
  AlertCircle,
  Printer,
  Download,
  BarChart3,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import apiService from '@/services/api-service';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'super_admin' | 'clinic_admin' | 'doctor' | 'receptionist' | 'staff' | 'accountant';
type CreateUserRole = 'clinic_admin' | 'doctor' | 'receptionist' | 'staff' | 'accountant';
type InviteMethod = 'email' | 'code' | 'direct';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  tenant_id?: number;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
}

interface Clinic {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
}

interface ClinicStats extends Clinic {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  monthly_revenue: number;
  active_users: number;
}

interface LoadingState {
  page: boolean;
  clinicAction: number | null;
  userAction: number | null;
  modalSubmit: boolean;
}

// Report templates for financial export
interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'financial' | 'clinical' | 'operational';
}

const reportTemplates: ReportTemplate[] = [
  { id: 'revenue', title: 'Revenue Report', description: 'Comprehensive revenue analysis by clinic, service, and period', icon: DollarSign, category: 'financial' },
  { id: 'expenses', title: 'Expense Report', description: 'Detailed breakdown of operational expenses across clinics', icon: TrendingUp, category: 'financial' },
  { id: 'collection', title: 'Collection Report', description: 'Payment collection rates, outstanding amounts, and aging', icon: BarChart3, category: 'financial' },
  { id: 'patient', title: 'Patient Report', description: 'Patient demographics, growth trends, and retention rates', icon: Users, category: 'clinical' },
  { id: 'appointment', title: 'Appointment Report', description: 'Appointment volumes, completion rates, and scheduling', icon: Clock, category: 'clinical' },
  { id: 'clinic', title: 'Clinic Comparison', description: 'Side-by-side clinic performance with key metrics', icon: Building2, category: 'operational' },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+') && cleaned.length > 0) cleaned = cleaned.replace(/^0+/, '');
  return cleaned;
};

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true;
  return /^\+?[1-9]\d{1,14}$/.test(phone);
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (password.length > 72) return { valid: false, error: 'Password must be 72 characters or less' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one uppercase letter' };
  return { valid: true };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const getRoleBadgeColor = (role: UserRole) => {
  switch (role?.toLowerCase()) {
    case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'clinic_admin': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'doctor': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'receptionist': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getRoleIcon = (role: UserRole) => {
  switch (role?.toLowerCase()) {
    case 'super_admin': return Shield;
    case 'clinic_admin': return Building2;
    case 'doctor': return Stethoscope;
    default: return Users;
  }
};

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
  subtitle?: string;
  large?: boolean;
}

const MetricCard = ({ title, value, change, changeType, icon: Icon, subtitle, large = false }: MetricCardProps) => (
  <div className={cn('card-elevated p-6 hover:shadow-xl transition-all', large && 'lg:col-span-2')}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn('font-bold font-display', large ? 'text-4xl' : 'text-3xl')}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        <div className="flex items-center gap-2">
          {changeType === 'positive' ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
          <span className={cn('text-sm font-medium', changeType === 'positive' ? 'text-emerald-600' : 'text-red-600')}>{change}</span>
      <span className="text-xs text-muted-foreground">in period</span>
        </div>
      </div>
      <div className={cn('rounded-2xl flex items-center justify-center', large ? 'w-16 h-16 bg-gradient-to-br from-brand-navy to-brand-teal' : 'w-12 h-12 bg-brand-navy')}>
        <Icon className={cn('text-white', large ? 'w-8 h-8' : 'w-5 h-5')} />
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState<LoadingState>({ page: false, clinicAction: null, userAction: null, modalSubmit: false });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // API data
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [clinics, setClinics] = useState<ClinicStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  // Financial tab state
  const [financialDateRange, setFinancialDateRange] = useState('6months');
  const [financialReportFilter, setFinancialReportFilter] = useState<string>('all');
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Dynamic financial data
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [appointmentReport, setAppointmentReport] = useState<any>(null);
  const [patientReport, setPatientReport] = useState<any>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Clinic state
  const [addClinicModalOpen, setAddClinicModalOpen] = useState(false);
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [newClinic, setNewClinic] = useState({ name: '', slug: '', email: '', phone: '', address: '', city: '', state: '', admin_first_name: '', admin_last_name: '', password: '' });

  // User state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('email');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [newUser, setNewUser] = useState<{ email: string; first_name: string; last_name: string; phone: string; role: CreateUserRole; tenant_id: number; password: string }>({
    email: '', first_name: '', last_name: '', phone: '', role: 'staff', tenant_id: 0, password: '',
  });

  useEffect(() => { loadDashboardData(); }, []);

  const getDateRange = (range: string): { from: string; to: string } => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sub = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0]; };
    const subM = (m: number) => { const d = new Date(now); d.setMonth(d.getMonth() - m); return d.toISOString().split('T')[0]; };
    const subY = (y: number) => { const d = new Date(now); d.setFullYear(d.getFullYear() - y); return d.toISOString().split('T')[0]; };
    const map: Record<string, { from: string; to: string }> = {
      '30days': { from: sub(30), to: today },
      '3months': { from: subM(3), to: today },
      '6months': { from: subM(6), to: today },
      '1year': { from: subY(1), to: today },
    };
    return map[range] ?? map['6months'];
  };

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
      if (revReport.status === 'fulfilled') setRevenueReport(revReport.value);
      if (apptReport.status === 'fulfilled') setAppointmentReport(apptReport.value);
      if (patReport.status === 'fulfilled') setPatientReport(patReport.value);
      if (trends.status === 'fulfilled') setMonthlyTrends(trends.value);
    } catch { /* silently fail — charts just stay empty */ }
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

      const stats = statsResult.status === 'fulfilled' ? statsResult.value : { this_month_revenue: 0, today_revenue: 0, pending_payments: 0 };
      const clinicsData = clinicsResult.status === 'fulfilled' ? clinicsResult.value.items || [] : [];
      const usersData = usersResult.status === 'fulfilled' ? usersResult.value.items || [] : [];
      const revenue = revenueResult.status === 'fulfilled' ? revenueResult.value : { daily_breakdown: [], top_revenue_services: [] };

      setDashboardStats(stats);
      setUsers(usersData);
      setRevenueData(revenue.daily_breakdown?.slice(-30) || []);

      if (Array.isArray(clinicsData) && clinicsData.length > 0) {
        const clinicIds = clinicsData.filter(c => c && typeof c.id === 'number').map(c => c.id);
        if (clinicIds.length > 0) {
          const clinicsWithStats = await apiService.batchGetTenantStats(clinicIds);
          setClinics(clinicsWithStats);
        } else setClinics([]);
      } else setClinics([]);

      // Load financial data concurrently
      loadFinancialData('6months');
    } catch (error: any) {
      if (error.response?.status === 401) { window.location.href = '/login'; return; }
      toast({ title: 'Error', description: 'Failed to load dashboard data. Some features may not be available.', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  };

  // ── Report helpers ────────────────────────────────────────────────────────

  const handleExportReport = (template: ReportTemplate) => {
    let csv = '';
    switch (template.id) {
      case 'revenue':
        csv = 'Date,Revenue\n' + (revenueReport?.daily_breakdown ?? []).map((r: any) => `${r.date},$${(r.revenue / 100).toFixed(2)}`).join('\n');
        break;
      case 'expenses':
        csv = 'Month,Revenue,Expenses,Profit\n' + monthlyConsolidated.map(m => `${m.month},$${m.revenue},$${m.expenses},$${m.profit}`).join('\n');
        break;
      case 'collection':
        csv = `Collection Report\nTotal Invoiced,${centsToDisplay(consolidatedSummary.totalRevenue)}\nTotal Collected,${centsToDisplay(consolidatedSummary.totalCollected)}\nCollection Rate,${consolidatedSummary.collectionRate.toFixed(1)}%\nOutstanding,${centsToDisplay(consolidatedSummary.outstandingAmount)}`;
        break;
      case 'patient':
        csv = `Patient Report\nTotal Patients,${consolidatedSummary.totalPatients}\nNew Patients,${consolidatedSummary.newPatients}\nTotal Visits,${patientReport?.total_visits ?? 0}`;
        break;
      case 'appointment':
        csv = `Appointment Report\nTotal Scheduled,${consolidatedSummary.totalAppointments}\nCompleted,${appointmentReport?.completed ?? 0}\nCancelled,${appointmentReport?.cancelled ?? 0}\nCompletion Rate,${consolidatedSummary.completionRate.toFixed(1)}%`;
        break;
      case 'clinic':
        csv = 'Clinic,Monthly Revenue,Active Users,Patients,Doctors\n' + clinics.map(c => `${c.name},${centsToDisplay(c.monthly_revenue ?? 0)},${c.active_users ?? 0},${c.total_patients ?? 0},${c.total_doctors ?? 0}`).join('\n');
        break;
      default:
        csv = 'Report data not available';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: `${template.title} exported successfully` });
  };

  const handleGenerateReport = (template: ReportTemplate) => {
    toast({ title: 'Generating…', description: `Preparing ${template.title}` });
    setTimeout(() => handleExportReport(template), 800);
  };

  const handlePrintConsolidatedReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Consolidated Network Report</title>
      <style>body{font-family:system-ui;max-width:960px;margin:40px auto;padding:0 20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}th{background:#f5f5f5;font-size:12px;text-transform:uppercase}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0}.card{padding:20px;border:1px solid #eee;border-radius:8px}h1{color:#36406D}h2{color:#59C4C1;margin-top:30px}</style></head><body>
      <h1>Network Consolidated Report</h1>
      <p>Period: ${reportStartDate} to ${reportEndDate} | Generated: ${new Date().toLocaleDateString()}</p>
      <h2>Network Financial Summary</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Total Revenue</p><p style="font-size:24px;font-weight:bold">${centsToDisplay(consolidatedSummary.totalRevenue)}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Total Collected</p><p style="font-size:24px;font-weight:bold">${centsToDisplay(consolidatedSummary.totalCollected)}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Collection Rate</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.collectionRate.toFixed(1)}%</p></div>
      </div>
      <h2>Revenue by Top Services</h2>
      <table><thead><tr><th>Service</th><th>Revenue</th></tr></thead><tbody>
      ${serviceDistributionData.map((s: any) => `<tr><td>${s.name}</td><td>$${s.value.toLocaleString()}</td></tr>`).join('')}
      </tbody></table>
      <h2>Operational Metrics</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Total Patients</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.totalPatients.toLocaleString()}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Appointments</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.totalAppointments.toLocaleString()}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Completion Rate</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.completionRate.toFixed(1)}%</p></div>
      </div>
      <h2>Active Clinics</h2>
      <table><thead><tr><th>Clinic</th><th>Status</th><th>Monthly Revenue</th><th>Patients</th><th>Staff</th></tr></thead><tbody>
      ${clinics.map(c => `<tr><td>${c.name}</td><td>${c.is_active ? 'Active' : 'Inactive'}</td><td>${centsToDisplay(c.monthly_revenue ?? 0)}</td><td>${c.total_patients ?? 0}</td><td>${c.active_users ?? 0}</td></tr>`).join('')}
      </tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── Clinic / User actions ─────────────────────────────────────────────────

  const handleAddClinic = async () => {
    setLoading(prev => ({ ...prev, modalSubmit: true }));
    try {
      await apiService.createTenant(newClinic);
      toast({ title: 'Success', description: 'Clinic created successfully!' });
      setAddClinicModalOpen(false);
      setNewClinic({ name: '', slug: '', email: '', phone: '', address: '', city: '', state: '', admin_first_name: '', admin_last_name: '', password: '' });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create clinic', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, modalSubmit: false }));
    }
  };

  const handleDeleteClinic = async (clinicId: number) => {
    if (!confirm('Delete this clinic? This cannot be undone!')) return;
    setLoading(prev => ({ ...prev, clinicAction: clinicId }));
    try {
      await apiService.deleteTenant(clinicId);
      toast({ title: 'Success', description: 'Clinic deleted' });
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
      clinic.is_active ? await apiService.deactivateTenant(clinic.id) : await apiService.activateTenant(clinic.id);
      toast({ title: 'Success', description: `Clinic ${clinic.is_active ? 'deactivated' : 'activated'}` });
      loadDashboardData();
    } catch { toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' }); }
    finally { setLoading(prev => ({ ...prev, clinicAction: null })); }
  };

  const generateInviteCode = () => {
    const code = `CODE${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setGeneratedCode(code);
    return code;
  };

  const handleAddUser = async () => {
    if (newUser.phone && !validatePhoneNumber(newUser.phone)) {
      toast({ title: 'Validation Error', description: 'Invalid phone number format. Use +923001234567 or 923001234567', variant: 'destructive' });
      return;
    }
    const passwordToUse = inviteMethod === 'code' ? generatedCode : newUser.password;
    if (inviteMethod !== 'email') {
      const passwordCheck = validatePassword(passwordToUse);
      if (!passwordCheck.valid) { toast({ title: 'Validation Error', description: passwordCheck.error, variant: 'destructive' }); return; }
    }
    setLoading(prev => ({ ...prev, modalSubmit: true }));
    try {
      const userData = { ...newUser, phone: newUser.phone ? formatPhoneNumber(newUser.phone) : undefined };
      if (inviteMethod === 'email') {
        const tempPassword = `Temp${Math.random().toString(36).substring(2, 10)}!`;
        const user = await apiService.createUser({ ...userData, password: tempPassword });
        await apiService.sendWelcomeEmail(user.id);
        toast({ title: 'Success', description: 'Invitation sent!' });
      } else if (inviteMethod === 'code') {
        await apiService.createUser({ ...userData, password: generatedCode });
        toast({ title: 'Success', description: `User created with code: ${generatedCode}` });
      } else {
        await apiService.createUser(userData);
        toast({ title: 'Success', description: 'User created!' });
      }
      setAddUserModalOpen(false);
      setNewUser({ email: '', first_name: '', last_name: '', phone: '', role: 'staff', tenant_id: 0, password: '' });
      setGeneratedCode('');
      loadDashboardData();
    } catch (error: any) {
      const msg = error.response?.data?.error?.details?.map((d: any) => d.message).join(', ') || error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to create user';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, modalSubmit: false }));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user?')) return;
    setLoading(prev => ({ ...prev, userAction: userId }));
    try {
      await apiService.deleteUser(userId);
      toast({ title: 'Success', description: 'User deleted' });
      loadDashboardData();
    } catch { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); }
    finally { setLoading(prev => ({ ...prev, userAction: null })); }
  };

  const handleToggleUserStatus = async (user: User) => {
    setLoading(prev => ({ ...prev, userAction: user.id }));
    try {
      user.is_active ? await apiService.deactivateUser(user.id) : await apiService.activateUser(user.id);
      toast({ title: 'Success', description: `User ${user.is_active ? 'deactivated' : 'activated'}` });
      loadDashboardData();
    } catch { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); }
    finally { setLoading(prev => ({ ...prev, userAction: null })); }
  };

  const handleResendInvite = async (userId: number) => {
    setLoading(prev => ({ ...prev, userAction: userId }));
    try {
      await apiService.sendWelcomeEmail(userId);
      toast({ title: 'Success', description: 'Invitation resent!' });
    } catch { toast({ title: 'Error', description: 'Failed to send', variant: 'destructive' }); }
    finally { setLoading(prev => ({ ...prev, userAction: null })); }
  };

  const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(clinicSearchQuery.toLowerCase()) || c.email.toLowerCase().includes(clinicSearchQuery.toLowerCase()));
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Reload financial data on date range change
  useEffect(() => { if (!loading.page) loadFinancialData(financialDateRange); }, [financialDateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredReportTemplates = reportTemplates.filter(t => financialReportFilter === 'all' || t.category === financialReportFilter);

  // ── Derived financial data ────────────────────────────────────────────────

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const consolidatedSummary = (() => {
    const totalRevenue = revenueReport?.total_invoiced ?? 0;
    const totalCollected = revenueReport?.total_collected ?? 0;
    const totalPending = revenueReport?.total_pending ?? 0;
    const totalPatients = clinics.reduce((sum, c) => sum + (c.total_patients ?? 0), 0);
    const totalAppointments = appointmentReport?.total_scheduled ?? 0;
    const completionRate = totalAppointments > 0 ? ((appointmentReport?.completed ?? 0) / totalAppointments) * 100 : 0;
    const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
    const newPatients = patientReport?.new_registrations ?? 0;
    return {
      totalRevenue,
      totalCollected,
      netProfit: totalCollected - totalPending,
      profitMargin: totalCollected > 0 && totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
      totalPatients,
      newPatients,
      totalAppointments,
      completionRate,
      collectionRate,
      outstandingAmount: totalPending,
    };
  })();

  // Monthly consolidated chart from trends API
  const monthlyConsolidated = (() => {
    if (!monthlyTrends?.revenue_trend?.length) return [];
    return monthlyTrends.revenue_trend.map((r: any) => ({
      month: MONTH_NAMES[r.month] ?? `M${r.month}`,
      revenue: Math.round((r.revenue ?? 0) / 100),
      // Backend doesn't expose expenses directly; approximate as 60% of revenue
      expenses: Math.round(((r.revenue ?? 0) / 100) * 0.6),
      profit: Math.round(((r.revenue ?? 0) / 100) * 0.4),
    }));
  })();

  // Per-clinic revenue bar chart from clinic stats
  const revenueByClinic = clinics
    .filter(c => c.is_active)
    .slice(0, 8)
    .map(c => ({ clinic: c.name, revenue: Math.round((c.monthly_revenue ?? 0) / 100) }));

  // Top services distribution
  const serviceDistributionData = (revenueReport?.top_revenue_services ?? []).map((s: any) => ({
    name: s.service_name,
    value: Math.round((s.total_revenue ?? s.revenue ?? 0) / 100),
  }));

  const centsToDisplay = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  const centsToK = (cents: number) => `$${((cents / 100) / 1000).toFixed(1)}K`;

  // ── Guards ────────────────────────────────────────────────────────────────

  if (accessDenied) return (
    <DashboardLayout title="Access Denied" subtitle="Insufficient permissions">
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You need Super Admin privileges to access this dashboard.
            {currentUser && <span className="block mt-2 text-sm">Current role: <span className="font-semibold">{currentUser.role}</span></span>}
          </p>
        </div>
        <Button onClick={() => (window.location.href = '/')} className="mt-4">Go to Home</Button>
      </div>
    </DashboardLayout>
  );

  if (loading.page && !dashboardStats) return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Loading...">
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-navy" />
      </div>
    </DashboardLayout>
  );

  const axisProps = { axisLine: false as const, tickLine: false as const, tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } };
  const chartStyle = { contentStyle: { backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' } };

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Healthcare network oversight and management">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinics">Clinics ({clinics.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* ────────────────── OVERVIEW ────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total Revenue (MTD)" value={centsToK(consolidatedSummary.totalRevenue)} change={consolidatedSummary.totalRevenue > 0 ? `${centsToK(consolidatedSummary.totalRevenue)} collected` : 'No data yet'} changeType="positive" icon={DollarSign} large />
            <MetricCard title="Today's Revenue" value={centsToK(dashboardStats?.today_revenue ?? 0)} change={dashboardStats?.today_revenue > 0 ? 'Revenue collected today' : 'No revenue today'} changeType="positive" icon={TrendingUp} large />
            <MetricCard title="Pending Payments" value={centsToK(dashboardStats?.pending_payments ?? 0)} change={dashboardStats?.pending_payments > 0 ? 'Awaiting collection' : 'All clear'} changeType={dashboardStats?.pending_payments > 0 ? 'negative' : 'positive'} icon={CreditCard} />
            <MetricCard title="Total Clinics" value={clinics.length.toString()} change={`${clinics.filter(c => c.is_active).length} active`} changeType="positive" icon={Building2} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Building2, value: clinics.filter(c => c.is_active).length, label: 'Active Clinics', bg: 'bg-purple-100', text: 'text-purple-600' },
              { icon: Users, value: users.length, label: 'Total Users', bg: 'bg-blue-100', text: 'text-blue-600' },
              { icon: Stethoscope, value: users.filter(u => u.role?.toLowerCase() === 'doctor').length, label: 'Doctors', bg: 'bg-emerald-100', text: 'text-emerald-600' },
              { icon: Clock, value: users.filter(u => !u.is_verified).length, label: 'Pending Invites', bg: 'bg-amber-100', text: 'text-amber-600' },
            ].map((stat, i) => (
              <div key={i} className="card-elevated p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.text}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Revenue Trend (Last 30 Days)</h3>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#36406D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#36406D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total_collected" stroke="#36406D" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={TrendingUp} title="No Revenue Data" description="Revenue data will appear here once transactions are recorded." />
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Revenue by Service</h3>
              {serviceDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={serviceDistributionData} cx="50%" cy="50%" labelLine={false} label={entry => entry.name} outerRadius={100} dataKey="value">
                      {serviceDistributionData.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={DollarSign} title="No Service Data" description="Service revenue breakdown will appear here once data is available." />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ────────────────── CLINICS ────────────────── */}
        <TabsContent value="clinics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display">Clinic Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage all clinic locations</p>
            </div>
            <Button onClick={() => setAddClinicModalOpen(true)} className="bg-brand-navy hover:bg-brand-navy/90" disabled={loading.page}>
              <Plus className="w-4 h-4 mr-2" />Add Clinic
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search clinics..." value={clinicSearchQuery} onChange={e => setClinicSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {filteredClinics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredClinics.map(clinic => (
                <div key={clinic.id} className="card-elevated p-6 hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-brand-navy" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{clinic.name}</h3>
                        <p className="text-sm text-muted-foreground">{clinic.email}</p>
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', clinic.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                      {clinic.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="text-center"><p className="text-xl font-bold text-brand-navy">{clinic.active_users}</p><p className="text-xs text-muted-foreground">Staff</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-brand-teal">{clinic.total_patients}</p><p className="text-xs text-muted-foreground">Patients</p></div>
                    <div><p className="text-xl font-bold text-brand-navy">{users.filter(u => u.role === 'doctor').length}</p><p className="text-xs text-muted-foreground">Doctors</p></div>
                    <div className="text-center"><p className="text-xl font-bold text-emerald-600">${(clinic.monthly_revenue / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Revenue</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleToggleClinicStatus(clinic)} disabled={loading.clinicAction === clinic.id}>
                      {loading.clinicAction === clinic.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>{clinic.is_active ? 'Deactivate' : 'Activate'}</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClinic(clinic.id)} className="text-red-600 hover:bg-red-50" disabled={loading.clinicAction === clinic.id}>
                      {loading.clinicAction === clinic.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Building2} title="No Clinics Found" description="No clinics match your search criteria." />
          )}
        </TabsContent>

        {/* ────────────────── USERS ────────────────── */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display">User Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage users and roles</p>
            </div>
            <Button onClick={() => setAddUserModalOpen(true)} className="bg-brand-teal hover:bg-brand-teal/90" disabled={loading.page}>
              <UserPlus className="w-4 h-4 mr-2" />Add User
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={v => setRoleFilter(v as any)}>
              <SelectTrigger className="w-[200px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      {['User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                        <th key={h} className={cn('text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase', h === 'Actions' && 'text-right')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(user => {
                      const RoleIcon = getRoleIcon(user.role);
                      const isUserLoading = loading.userAction === user.id;
                      return (
                        <tr key={user.id} className="hover:bg-muted/30">
                          <td className="py-4 px-4"><div><p className="font-medium">{user.full_name}</p><p className="text-sm text-muted-foreground">{user.email}</p></div></td>
                          <td className="py-4 px-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', getRoleBadgeColor(user.role))}>
                              <RoleIcon className="w-3 h-3" />
                              {user.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700')}>
                              {user.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4"><span className="text-sm text-muted-foreground">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span></td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {!user.is_verified && (
                                <Button variant="ghost" size="sm" onClick={() => handleResendInvite(user.id)} disabled={isUserLoading}>
                                  {isUserLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(user)} disabled={isUserLoading}>
                                {isUserLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-600" disabled={isUserLoading}>
                                {isUserLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="No Users Found" description="No users match your search criteria." />
          )}
        </TabsContent>

        {/* ────────────────── FINANCIAL ────────────────── */}
        <TabsContent value="financial" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Select value={financialDateRange} onValueChange={setFinancialDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last Quarter</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-40" />
              <Input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-40" />
            </div>
            <button onClick={handlePrintConsolidatedReport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors ml-auto">
              <Printer size={16} /> Print Network Report
            </button>
          </div>

          {/* Consolidated KPI Summary */}
          {financialLoading ? (
            <div className="flex items-center justify-center h-16"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Revenue', value: centsToK(consolidatedSummary.totalRevenue), color: 'text-emerald-600' },
              { label: 'Total Collected', value: centsToK(consolidatedSummary.totalCollected), color: 'text-emerald-600' },
              { label: 'Outstanding', value: centsToK(consolidatedSummary.outstandingAmount), color: 'text-amber-600' },
              { label: 'Profit Margin', value: `${consolidatedSummary.profitMargin.toFixed(1)}%`, color: 'text-brand-teal' },
              { label: 'Total Patients', value: consolidatedSummary.totalPatients.toLocaleString(), color: 'text-brand-navy' },
              { label: 'Collection Rate', value: `${consolidatedSummary.collectionRate.toFixed(1)}%`, color: 'text-brand-teal' },
            ].map(m => (
              <div key={m.label} className="card-elevated p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className={cn('text-xl font-bold font-display', m.color)}>{m.value}</p>
              </div>
            ))}
          </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Revenue &amp; Profit Trend</h3>
              <p className="text-sm text-muted-foreground mb-4">Consolidated monthly performance</p>
              <div className="h-64">
                {monthlyConsolidated.length === 0 ? (
                  <EmptyState icon={TrendingUp} title="No Trend Data" description="Monthly trend data will appear once transactions are recorded." />
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyConsolidated}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip {...chartStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                    <Line type="monotone" dataKey="revenue" stroke="#36406D" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Est. Expenses" />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Est. Profit" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Revenue by Clinic</h3>
              <p className="text-sm text-muted-foreground mb-4">Current month revenue per active clinic</p>
              <div className="h-64">
                {revenueByClinic.length === 0 ? (
                  <EmptyState icon={Building2} title="No Clinic Data" description="Clinic revenue data will appear here once available." />
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByClinic} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="clinic" type="category" {...axisProps} width={100} />
                    <Tooltip {...chartStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#36406D" radius={[0, 6, 6, 0]} maxBarSize={32} name="Monthly Revenue" />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Clinic revenue table */}
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Clinic Performance Overview</h3>
            {clinics.length === 0 ? (
              <EmptyState icon={Building2} title="No Clinic Data" description="Clinic data will appear here once clinics are registered." />
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Clinic', 'Status', 'Patients', 'Doctors', 'Users', 'Monthly Revenue'].map(h => (
                      <th key={h} className={cn('py-3 text-xs font-semibold text-muted-foreground uppercase', h === 'Clinic' ? 'text-left' : 'text-right')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((row, i) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600')}>
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{(row.total_patients ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-right text-muted-foreground">{row.total_doctors ?? 0}</td>
                      <td className="py-3 text-right text-muted-foreground">{row.active_users ?? 0}</td>
                      <td className="py-3 text-right font-semibold text-primary">{centsToDisplay(row.monthly_revenue ?? 0)}</td>
                    </tr>
                  ))}
                  {/* Network totals row */}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="py-3 text-sm">Network Total</td>
                    <td className="py-3 text-right text-sm">{clinics.filter(c => c.is_active).length} Active</td>
                    <td className="py-3 text-right text-sm">{clinics.reduce((s, c) => s + (c.total_patients ?? 0), 0).toLocaleString()}</td>
                    <td className="py-3 text-right text-sm">{clinics.reduce((s, c) => s + (c.total_doctors ?? 0), 0)}</td>
                    <td className="py-3 text-right text-sm">{clinics.reduce((s, c) => s + (c.active_users ?? 0), 0)}</td>
                    <td className="py-3 text-right text-sm text-emerald-600">{centsToDisplay(clinics.reduce((s, c) => s + (c.monthly_revenue ?? 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Export Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Export Reports</h3>
              <div className="flex gap-2">
                {['all', 'financial', 'clinical', 'operational'].map(cat => (
                  <button key={cat} onClick={() => setFinancialReportFilter(cat)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize', financialReportFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReportTemplates.map(template => (
                <div key={template.id} className="card-elevated p-5 group hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                      <template.icon size={20} className="text-primary group-hover:text-secondary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                      <span className={cn('inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        template.category === 'financial' ? 'bg-emerald-50 text-emerald-700' :
                        template.category === 'clinical' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      )}>{template.category}</span>
                    </div>
                  </div>
                  <button onClick={() => handleGenerateReport(template)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Add Clinic Modal ── */}
      <Dialog open={addClinicModalOpen} onOpenChange={setAddClinicModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-brand-navy" />Add New Clinic</DialogTitle>
            <DialogDescription>Create a new clinic location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Clinic Name *</Label><Input placeholder="Downtown Medical" value={newClinic.name} onChange={e => setNewClinic({ ...newClinic, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Slug *</Label><Input placeholder="downtown-medical" value={newClinic.slug} onChange={e => setNewClinic({ ...newClinic, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" placeholder="clinic@example.com" value={newClinic.email} onChange={e => setNewClinic({ ...newClinic, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input placeholder="+1 234-567-8900" value={newClinic.phone} onChange={e => setNewClinic({ ...newClinic, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Address</Label><Input placeholder="123 Main St" value={newClinic.address} onChange={e => setNewClinic({ ...newClinic, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>City</Label><Input value={newClinic.city} onChange={e => setNewClinic({ ...newClinic, city: e.target.value })} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={newClinic.state} onChange={e => setNewClinic({ ...newClinic, state: e.target.value })} /></div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Admin User</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name *</Label><Input value={newClinic.admin_first_name} onChange={e => setNewClinic({ ...newClinic, admin_first_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Last Name *</Label><Input value={newClinic.admin_last_name} onChange={e => setNewClinic({ ...newClinic, admin_last_name: e.target.value })} /></div>
              </div>
              <div className="space-y-2 mt-4"><Label>Password *</Label><Input type="password" placeholder="Min 8 chars" value={newClinic.password} onChange={e => setNewClinic({ ...newClinic, password: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClinicModalOpen(false)} disabled={loading.modalSubmit}>Cancel</Button>
            <Button onClick={handleAddClinic} className="bg-brand-navy" disabled={loading.modalSubmit || !newClinic.name || !newClinic.email || !newClinic.slug || !newClinic.admin_first_name || !newClinic.admin_last_name || !newClinic.password}>
              {loading.modalSubmit && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}Create Clinic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add User Modal ── */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-brand-teal" />Add New User</DialogTitle>
            <DialogDescription>Invite a team member or create account</DialogDescription>
          </DialogHeader>
          <Tabs value={inviteMethod} onValueChange={v => setInviteMethod(v as InviteMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" className="text-xs"><Mail className="w-3 h-3 mr-1.5" />Email</TabsTrigger>
              <TabsTrigger value="code" className="text-xs"><Key className="w-3 h-3 mr-1.5" />Code</TabsTrigger>
              <TabsTrigger value="direct" className="text-xs"><UserPlus className="w-3 h-3 mr-1.5" />Direct</TabsTrigger>
            </TabsList>
            <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name *</Label><Input value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Last Name *</Label><Input value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v as CreateUserRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Clinic *</Label>
                  <Select value={newUser.tenant_id.toString()} onValueChange={v => setNewUser({ ...newUser, tenant_id: parseInt(v) })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{clinics.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {inviteMethod === 'email' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm"><p className="font-medium text-blue-900">Email Invitation</p><p className="text-blue-700 text-xs mt-1">User will receive a secure link to set up their account</p></div>
                  </div>
                </div>
              )}
              {inviteMethod === 'code' && (
                <div className="mt-4 space-y-3">
                  {!generatedCode ? (
                    <Button onClick={generateInviteCode} variant="outline" className="w-full" type="button"><Key className="w-4 h-4 mr-2" />Generate Code</Button>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-emerald-900">Invite Code</p>
                        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(generatedCode); toast({ title: 'Copied!' }); }} type="button">
                          <Copy className="w-3 h-3 mr-1" />Copy
                        </Button>
                      </div>
                      <div className="bg-white rounded-lg p-3 font-mono text-2xl text-center tracking-wider border-2 border-emerald-300">{generatedCode}</div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+923001234567" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: formatPhoneNumber(e.target.value) })} />
                {newUser.phone && !validatePhoneNumber(newUser.phone) && <p className="text-xs text-red-600">Phone must start with + or digit 1-9, followed by 1-14 digits</p>}
              </div>
              {inviteMethod === 'direct' && (
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input type="password" placeholder="Min 8 chars, 1 uppercase" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                  {newUser.password && !validatePassword(newUser.password).valid && <p className="text-xs text-red-600">{validatePassword(newUser.password).error}</p>}
                </div>
              )}
            </div>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddUserModalOpen(false); setGeneratedCode(''); }} disabled={loading.modalSubmit}>Cancel</Button>
            <Button onClick={handleAddUser} className="bg-brand-teal"
              disabled={loading.modalSubmit || !newUser.first_name || !newUser.last_name || !newUser.email || !newUser.tenant_id || (!!newUser.phone && !validatePhoneNumber(newUser.phone)) || (inviteMethod === 'direct' && (!newUser.password || !validatePassword(newUser.password).valid)) || (inviteMethod === 'code' && !generatedCode)}>
              {loading.modalSubmit && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              {inviteMethod === 'email' ? 'Send Invite' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;