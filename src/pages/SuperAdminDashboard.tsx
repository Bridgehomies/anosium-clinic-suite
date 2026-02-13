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
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  RefreshCw,
  AlertCircle,
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
} from 'recharts';
import apiService from '@/services/api-service';

// Types - Match database enum format (UPPERCASE)
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
  clinicAction: number | null; // Track which clinic is being acted upon
  userAction: number | null; // Track which user is being acted upon
  modalSubmit: boolean;
}

const CHART_COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC'];

const getRoleBadgeColor = (role: UserRole) => {
  const roleNormalized = role?.toLowerCase().replace(/_/g, '_'); // Normalize to snake_case
  switch (roleNormalized) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'clinic_admin':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'doctor':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'receptionist':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'staff':
    case 'accountant':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getRoleIcon = (role: UserRole) => {
  const roleNormalized = role?.toLowerCase().replace(/_/g, '_');
  switch (roleNormalized) {
    case 'super_admin':
      return Shield;
    case 'clinic_admin':
      return Building2;
    case 'doctor':
      return Stethoscope;
    case 'receptionist':
    case 'staff':
    case 'accountant':
      return Users;
    default:
      return Users;
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

// Add these helper functions after imports
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // If it doesn't start with +, ensure it starts with a digit 1-9
  if (!cleaned.startsWith('+') && cleaned.length > 0) {
    // Remove any leading zeros
    cleaned = cleaned.replace(/^0+/, '');
  }
  return cleaned;
};

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (password.length > 72) {
    return { valid: false, error: 'Password must be 72 characters or less' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  return { valid: true };
};

const MetricCard = ({ title, value, change, changeType, icon: Icon, subtitle, large = false }: MetricCardProps) => (
  <div className={cn('card-elevated p-6 hover:shadow-xl transition-all', large && 'lg:col-span-2')}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn('font-bold font-display', large ? 'text-4xl' : 'text-3xl')}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        <div className="flex items-center gap-2">
          {changeType === 'positive' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span className={cn('text-sm font-medium', changeType === 'positive' ? 'text-emerald-600' : 'text-red-600')}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </div>
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center',
          large ? 'w-16 h-16 bg-gradient-to-br from-brand-navy to-brand-teal' : 'w-12 h-12 bg-brand-navy'
        )}
      >
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

const SuperAdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState<LoadingState>({
    page: false,
    clinicAction: null,
    userAction: null,
    modalSubmit: false,
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Data state
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [clinics, setClinics] = useState<ClinicStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);

  // Clinic state
  const [addClinicModalOpen, setAddClinicModalOpen] = useState(false);
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [newClinic, setNewClinic] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    admin_first_name: '',
    admin_last_name: '',
    password: '',
  });

  // User state
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('email');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [newUser, setNewUser] = useState<{
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: CreateUserRole;
    tenant_id: number;
    password: string;
  }>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff', // Changed from 'STAFF' to 'staff'
    tenant_id: 0,
    password: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading((prev) => ({ ...prev, page: true }));
    try {
      // First, verify super admin access
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);

      const userRole = user.role?.toLowerCase();
      if (userRole !== 'super_admin') {
        setAccessDenied(true);
        toast({
          title: 'Access Denied',
          description: 'You need super admin privileges to access this dashboard.',
          variant: 'destructive',
        });
        return;
      }

      // Load all data in parallel for better performance
      const [statsResult, clinicsResult, usersResult, revenueResult] = await Promise.allSettled([
        // Dashboard stats
        apiService.getDashboardStats().catch(() => ({
          this_month_revenue: 0,
          today_revenue: 0,
          pending_payments: 0,
        })),

        // Clinics
        apiService.getTenants({ page_size: 100 }).catch(() => ({ items: [] })),

        // Users
        apiService.getUsers({ page_size: 100 }).catch(() => ({ items: [] })),

        // Revenue data
        (async () => {
          try {
            const today = new Date();
            const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
            const revenue = await apiService.getRevenueReport(
              sixMonthsAgo.toISOString().split('T')[0],
              today.toISOString().split('T')[0]
            );
            return revenue;
          } catch {
            return { daily_breakdown: [], top_revenue_services: [] };
          }
        })(),
      ]);

      // Extract results
      const stats = statsResult.status === 'fulfilled' ? statsResult.value : { this_month_revenue: 0, today_revenue: 0, pending_payments: 0 };
      const clinicsData = clinicsResult.status === 'fulfilled' ? clinicsResult.value.items || [] : [];
      const usersData = usersResult.status === 'fulfilled' ? usersResult.value.items || [] : [];
      const revenue = revenueResult.status === 'fulfilled' ? revenueResult.value : { daily_breakdown: [], top_revenue_services: [] };

      setDashboardStats(stats);
      setUsers(usersData);
      setRevenueData(revenue.daily_breakdown?.slice(-30) || []);
      setServiceDistribution(
        revenue.top_revenue_services?.map((s: any) => ({
          name: s.service_name,
          value: s.revenue,
        })) || []
      );

      // Load clinic stats in parallel with error handling
      // In loadDashboardData()
      if (clinicsData && Array.isArray(clinicsData) && clinicsData.length > 0) {
        const clinicIds = clinicsData
          .filter(c => c && typeof c.id === 'number')
          .map(c => c.id);
        
        if (clinicIds.length > 0) {
          const clinicsWithStats = await apiService.batchGetTenantStats(clinicIds);
          setClinics(clinicsWithStats);
        } else {
          setClinics([]);
        }
      } else {
        setClinics([]);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      
      if (error.response?.status === 401) {
        window.location.href = '/login';
        return;
      }

      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Some features may not be available.',
        variant: 'destructive',
      });
    } finally {
      setLoading((prev) => ({ ...prev, page: false }));
    }
  };

  const handleAddClinic = async () => {
    setLoading((prev) => ({ ...prev, modalSubmit: true }));
    try {
      await apiService.createTenant(newClinic);
      toast({ title: 'Success', description: 'Clinic created successfully!' });
      setAddClinicModalOpen(false);
      setNewClinic({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        admin_first_name: '',
        admin_last_name: '',
        password: '',
      });
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create clinic',
        variant: 'destructive',
      });
    } finally {
      setLoading((prev) => ({ ...prev, modalSubmit: false }));
    }
  };

  const handleDeleteClinic = async (clinicId: number) => {
    if (!confirm('Delete this clinic? This cannot be undone!')) return;
    setLoading((prev) => ({ ...prev, clinicAction: clinicId }));
    try {
      await apiService.deleteTenant(clinicId);
      toast({ title: 'Success', description: 'Clinic deleted' });
      loadDashboardData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete',
        variant: 'destructive',
      });
    } finally {
      setLoading((prev) => ({ ...prev, clinicAction: null }));
    }
  };

  const handleToggleClinicStatus = async (clinic: ClinicStats) => {
    setLoading((prev) => ({ ...prev, clinicAction: clinic.id }));
    try {
      clinic.is_active ? await apiService.deactivateTenant(clinic.id) : await apiService.activateTenant(clinic.id);
      toast({ title: 'Success', description: `Clinic ${clinic.is_active ? 'deactivated' : 'activated'}` });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setLoading((prev) => ({ ...prev, clinicAction: null }));
    }
  };

  const generateInviteCode = () => {
    // Generate SHORT code with guaranteed uppercase letter (max 12 chars)
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 chars
    const code = `CODE${randomPart}`; // Total: 4 + 8 = 12 chars
    setGeneratedCode(code);
    return code;
  };

  const handleAddUser = async () => {
    // Validate before submitting
    if (newUser.phone && !validatePhoneNumber(newUser.phone)) {
      toast({
        title: 'Validation Error',
        description: 'Invalid phone number format. Use +923001234567 or 923001234567',
        variant: 'destructive',
      });
      return;
    }

    const passwordToUse = inviteMethod === 'code' ? generatedCode : newUser.password;
    
    if (inviteMethod !== 'email') {
      const passwordCheck = validatePassword(passwordToUse);
      if (!passwordCheck.valid) {
        toast({
          title: 'Validation Error',
          description: passwordCheck.error,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading((prev) => ({ ...prev, modalSubmit: true }));
    try {
      // Prepare user data with cleaned phone
      const userData = {
        ...newUser,
        phone: newUser.phone ? formatPhoneNumber(newUser.phone) : undefined,
      };

      if (inviteMethod === 'email') {
        // For email invites, generate a SHORT secure temporary password (max 20 chars to stay well under 72 byte limit)
        const randomPart = Math.random().toString(36).substring(2, 10); // 8 chars
        const tempPassword = `Temp${randomPart}!`; // Total: 4 + 8 + 1 = 13 chars
        
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
      setNewUser({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff',
        tenant_id: 0,
        password: '',
      });
      setGeneratedCode('');
      loadDashboardData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.details 
        ? error.response.data.error.details.map((d: any) => d.message).join(', ')
        : error.response?.data?.error?.message || error.response?.data?.detail || 'Failed to create user';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading((prev) => ({ ...prev, modalSubmit: false }));
    }
  };
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user?')) return;
    setLoading((prev) => ({ ...prev, userAction: userId }));
    try {
      await apiService.deleteUser(userId);
      toast({ title: 'Success', description: 'User deleted' });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setLoading((prev) => ({ ...prev, userAction: null }));
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    setLoading((prev) => ({ ...prev, userAction: user.id }));
    try {
      user.is_active ? await apiService.deactivateUser(user.id) : await apiService.activateUser(user.id);
      toast({ title: 'Success', description: `User ${user.is_active ? 'deactivated' : 'activated'}` });
      loadDashboardData();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setLoading((prev) => ({ ...prev, userAction: null }));
    }
  };

  const handleResendInvite = async (userId: number) => {
    setLoading((prev) => ({ ...prev, userAction: userId }));
    try {
      await apiService.sendWelcomeEmail(userId);
      toast({ title: 'Success', description: 'Invitation resent!' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to send', variant: 'destructive' });
    } finally {
      setLoading((prev) => ({ ...prev, userAction: null }));
    }
  };

  const filteredClinics = clinics.filter(
    (c) =>
      c.name.toLowerCase().includes(clinicSearchQuery.toLowerCase()) || c.email.toLowerCase().includes(clinicSearchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (accessDenied) {
    return (
      <DashboardLayout title="Access Denied" subtitle="Insufficient permissions">
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground max-w-md">
              You need Super Admin privileges to access this dashboard.
              {currentUser && (
                <span className="block mt-2 text-sm">
                  Current role: <span className="font-semibold">{currentUser.role}</span>
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => (window.location.href = '/')} className="mt-4">
            Go to Home
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading.page && !dashboardStats) {
    return (
      <DashboardLayout title="Super Admin Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-navy" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Healthcare network oversight and management">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinics">Clinics ({clinics.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue (MTD)"
              value={`$${dashboardStats?.this_month_revenue?.toLocaleString() || '0'}`}
              change="+18.5%"
              changeType="positive"
              icon={DollarSign}
              large
            />
            <MetricCard
              title="Today's Revenue"
              value={`$${dashboardStats?.today_revenue?.toLocaleString() || '0'}`}
              change="+22.3%"
              changeType="positive"
              icon={TrendingUp}
              large
            />
            <MetricCard
              title="Pending Payments"
              value={`$${dashboardStats?.pending_payments?.toLocaleString() || '0'}`}
              change="-12%"
              changeType="positive"
              icon={CreditCard}
            />
            <MetricCard title="Total Clinics" value={clinics.length.toString()} change="+2" changeType="positive" icon={Building2} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Building2,
                value: clinics.filter((c) => c.is_active).length,
                label: 'Active Clinics',
                bg: 'bg-purple-100',
                text: 'text-purple-600',
              },
              { icon: Users, value: users.length, label: 'Total Users', bg: 'bg-blue-100', text: 'text-blue-600' },
              {
                icon: Stethoscope,
                value: users.filter((u) => u.role?.toUpperCase() === 'DOCTOR').length,
                label: 'Doctors',
                bg: 'bg-emerald-100',
                text: 'text-emerald-600',
              },
              {
                icon: Clock,
                value: users.filter((u) => !u.is_verified).length,
                label: 'Pending Invites',
                bg: 'bg-amber-100',
                text: 'text-amber-600',
              },
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
              {serviceDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
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

        {/* Clinics Tab */}
        <TabsContent value="clinics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display">Clinic Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage all clinic locations</p>
            </div>
            <Button onClick={() => setAddClinicModalOpen(true)} className="bg-brand-navy hover:bg-brand-navy/90" disabled={loading.page}>
              <Plus className="w-4 h-4 mr-2" />
              Add Clinic
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search clinics..." value={clinicSearchQuery} onChange={(e) => setClinicSearchQuery(e.target.value)} className="pl-10" />
          </div>

          {filteredClinics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredClinics.map((clinic) => (
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
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border',
                        clinic.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                      )}
                    >
                      {clinic.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xl font-bold text-brand-navy">{clinic.active_users}</p>
                      <p className="text-xs text-muted-foreground">Staff</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-brand-teal">{clinic.total_patients}</p>
                      <p className="text-xs text-muted-foreground">Patients</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-brand-navy">{users.filter((u) => u.role === 'doctor').length}</p>
                      <p className="text-xs text-muted-foreground">Doctors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-600">${(clinic.monthly_revenue / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleClinicStatus(clinic)}
                      disabled={loading.clinicAction === clinic.id}
                    >
                      {loading.clinicAction === clinic.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>{clinic.is_active ? 'Deactivate' : 'Activate'}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClinic(clinic.id)}
                      className="text-red-600 hover:bg-red-50"
                      disabled={loading.clinicAction === clinic.id}
                    >
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display">User Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage users and roles</p>
            </div>
            <Button onClick={() => setAddUserModalOpen(true)} className="bg-brand-teal hover:bg-brand-teal/90" disabled={loading.page}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
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
                      {['User', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className={cn('text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase', h === 'Actions' && 'text-right')}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => {
                      const RoleIcon = getRoleIcon(user.role);
                      const isUserLoading = loading.userAction === user.id;
                      return (
                        <tr key={user.id} className="hover:bg-muted/30">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', getRoleBadgeColor(user.role))}>
                              <RoleIcon className="w-3 h-3" />
                              {user.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700'
                              )}
                            >
                              {user.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {!user.is_verified && (
                                <Button variant="ghost" size="sm" onClick={() => handleResendInvite(user.id)} disabled={isUserLoading}>
                                  {isUserLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleToggleUserStatus(user)} disabled={isUserLoading}>
                                {isUserLoading ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : user.is_active ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
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

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="card-elevated p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Financial Analytics</h3>
            <p className="text-muted-foreground">Comprehensive financial reports and insights</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Clinic Modal */}
      <Dialog open={addClinicModalOpen} onOpenChange={setAddClinicModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-navy" />
              Add New Clinic
            </DialogTitle>
            <DialogDescription>Create a new clinic location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Clinic Name *</Label>
                <Input
                  id="clinic-name"
                  placeholder="Downtown Medical"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({ ...newClinic, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-slug">Slug *</Label>
                <Input
                  id="clinic-slug"
                  placeholder="downtown-medical"
                  value={newClinic.slug}
                  onChange={(e) =>
                    setNewClinic({
                      ...newClinic,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-email">Email *</Label>
              <Input
                id="clinic-email"
                type="email"
                placeholder="clinic@example.com"
                value={newClinic.email}
                onChange={(e) => setNewClinic({ ...newClinic, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-phone">Phone</Label>
              <Input
                id="clinic-phone"
                placeholder="+1 234-567-8900"
                value={newClinic.phone}
                onChange={(e) => setNewClinic({ ...newClinic, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic-address">Address</Label>
              <Input
                id="clinic-address"
                placeholder="123 Main St"
                value={newClinic.address}
                onChange={(e) => setNewClinic({ ...newClinic, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-city">City</Label>
                <Input id="clinic-city" value={newClinic.city} onChange={(e) => setNewClinic({ ...newClinic, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-state">State</Label>
                <Input id="clinic-state" value={newClinic.state} onChange={(e) => setNewClinic({ ...newClinic, state: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Admin User</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-first">First Name *</Label>
                  <Input id="admin-first" value={newClinic.admin_first_name} onChange={(e) => setNewClinic({ ...newClinic, admin_first_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-last">Last Name *</Label>
                  <Input id="admin-last" value={newClinic.admin_last_name} onChange={(e) => setNewClinic({ ...newClinic, admin_last_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="admin-pass">Password *</Label>
                <Input
                  id="admin-pass"
                  type="password"
                  placeholder="Min 8 chars"
                  value={newClinic.password}
                  onChange={(e) => setNewClinic({ ...newClinic, password: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClinicModalOpen(false)} disabled={loading.modalSubmit}>
              Cancel
            </Button>
            <Button
              onClick={handleAddClinic}
              className="bg-brand-navy"
              disabled={
                loading.modalSubmit ||
                !newClinic.name ||
                !newClinic.email ||
                !newClinic.slug ||
                !newClinic.admin_first_name ||
                !newClinic.admin_last_name ||
                !newClinic.password
              }
            >
              {loading.modalSubmit && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              Create Clinic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-teal" />
              Add New User
            </DialogTitle>
            <DialogDescription>Invite a team member or create account</DialogDescription>
          </DialogHeader>
          <Tabs value={inviteMethod} onValueChange={(v) => setInviteMethod(v as InviteMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email" className="text-xs">
                <Mail className="w-3 h-3 mr-1.5" />
                Email
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                <Key className="w-3 h-3 mr-1.5" />
                Code
              </TabsTrigger>
              <TabsTrigger value="direct" className="text-xs">
                <UserPlus className="w-3 h-3 mr-1.5" />
                Direct
              </TabsTrigger>
            </TabsList>
            <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as CreateUserRole })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select value={newUser.tenant_id.toString()} onValueChange={(v) => setNewUser({ ...newUser, tenant_id: parseInt(v) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {inviteMethod === 'email' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Email Invitation</p>
                      <p className="text-blue-700 text-xs mt-1">User will receive a secure link to set up their account</p>
                    </div>
                  </div>
                </div>
              )}
              {inviteMethod === 'code' && (
                <div className="mt-4 space-y-3">
                  {!generatedCode ? (
                    <Button onClick={generateInviteCode} variant="outline" className="w-full" type="button">
                      <Key className="w-4 h-4 mr-2" />
                      Generate Code
                    </Button>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-emerald-900">Invite Code</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCode);
                            toast({ title: 'Copied!' });
                          }}
                          type="button"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-white rounded-lg p-3 font-mono text-2xl text-center tracking-wider border-2 border-emerald-300">{generatedCode}</div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+923001234567"
                  value={newUser.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewUser({ ...newUser, phone: formatted });
                  }}
                />
                {newUser.phone && !validatePhoneNumber(newUser.phone) && (
                  <p className="text-xs text-red-600">
                    Phone must start with + or digit 1-9, followed by 1-14 digits (e.g., +923001234567)
                  </p>
                )}
              </div>

              {inviteMethod === 'direct' && (
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                  {newUser.password && !validatePassword(newUser.password).valid && (
                    <p className="text-xs text-red-600">{validatePassword(newUser.password).error}</p>
                  )}
                </div>
              )}
            </div>
          </Tabs>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddUserModalOpen(false);
                setGeneratedCode('');
              }}
              disabled={loading.modalSubmit}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              className="bg-brand-teal"
              disabled={
                loading.modalSubmit ||
                !newUser.first_name ||
                !newUser.last_name ||
                !newUser.email ||
                !newUser.tenant_id ||
                (newUser.phone && !validatePhoneNumber(newUser.phone)) ||
                (inviteMethod === 'direct' && (!newUser.password || !validatePassword(newUser.password).valid)) ||
                (inviteMethod === 'code' && !generatedCode)
              }
            >
              {loading.modalSubmit && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
              {inviteMethod === 'email' && 'Send Invite'}
              {inviteMethod === 'code' && 'Create User'}
              {inviteMethod === 'direct' && 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;