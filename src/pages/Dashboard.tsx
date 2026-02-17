import { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Users, Calendar, DollarSign, Activity, ArrowUpRight, ArrowDownRight, 
  Stethoscope, Building2, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle 
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ComposedChart,
} from 'recharts';

const COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC', '#4ECDC4'];

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  
  return headers;
};

// API Service Functions
const dashboardAPI = {
  // Get main dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/dashboard`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Get today's appointments
  getTodayAppointments: async (doctorId = null) => {
    const url = doctorId 
      ? `${API_BASE_URL}/api/v1/appointments/today?doctor_id=${doctorId}`
      : `${API_BASE_URL}/api/v1/appointments/today`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    return response.json();
  },

  // Get appointments with filters
  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/v1/appointments?${params}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Get revenue report
  getRevenueReport: async (fromDate: string, toDate: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/reports/revenue?from_date=${fromDate}&to_date=${toDate}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get appointment report
  getAppointmentReport: async (fromDate: string, toDate: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/reports/appointments?from_date=${fromDate}&to_date=${toDate}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get patient report
  getPatientReport: async (fromDate: string, toDate: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/reports/patients?from_date=${fromDate}&to_date=${toDate}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get monthly trends
  getMonthlyTrends: async (months = 6) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/trends/monthly?months=${months}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get doctor performance
  getDoctorPerformance: async (fromDate: string, toDate: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/performance/doctors?from_date=${fromDate}&to_date=${toDate}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get payment summary
  getPaymentSummary: async (fromDate: string, toDate: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/billing/summary?from_date=${fromDate}&to_date=${toDate}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get daily metrics
  getDailyMetrics: async (date: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/metrics/daily?metric_date=${date}`,
      { headers: getAuthHeaders() }
    );
    return response.json();
  },

  // Get clinic/tenant information
  getTenantInfo: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/tenants/me/stats`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Get invoices
  getInvoices: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/v1/billing/invoices?${params}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Get list of doctors
  getDoctors: async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/doctors`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('6months');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for API data - Fixed types
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any>(null);
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [appointmentReport, setAppointmentReport] = useState<any>(null);
  const [patientReport, setPatientReport] = useState<any>(null);
  const [doctorPerformance, setDoctorPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date ranges based on selection
  const getDateRange = () => {
    const today = new Date();
    const ranges: Record<string, { from: string; to: string }> = {
      'today': { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
      '7days': { from: new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      '30days': { from: new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      '3months': { from: new Date(today.setMonth(today.getMonth() - 3)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      '6months': { from: new Date(today.setMonth(today.getMonth() - 6)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
      '1year': { from: new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
    };
    return ranges[dateRange] || ranges['6months'];
  };

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getDateRange();

      // Check if we're in development mode without API
      const isDevelopment = import.meta.env.DEV && !localStorage.getItem('access_token');
      
      if (isDevelopment) {
        // Use mock data for development
        setTimeout(() => {
          setDashboardStats({
            today_appointments: 15,
            today_revenue: 175000,
            pending_payments: 25000,
            active_patients: 1250,
            total_doctors: 8,
            appointments_this_week: 87,
            revenue_this_month: 580000,
          });
          
          setTodayAppointments([
            { id: 1, patient: { full_name: 'John Doe' }, doctor: { user: { full_name: 'Dr. Smith' } }, appointment_time: '09:00:00', status: 'completed' },
            { id: 2, patient: { full_name: 'Jane Smith' }, doctor: { user: { full_name: 'Dr. Johnson' } }, appointment_time: '10:00:00', status: 'in_progress' },
            { id: 3, patient: { full_name: 'Bob Wilson' }, doctor: { user: { full_name: 'Dr. Brown' } }, appointment_time: '11:00:00', status: 'scheduled' },
          ]);
          
          // Fixed: Set as object instead of array
          setMonthlyTrends({
            revenue_trend: [
              { month: '2025-01', revenue: 450000 },
              { month: '2025-02', revenue: 520000 },
              { month: '2025-03', revenue: 580000 },
            ],
            appointment_trend: [
              { month: '2025-01', total: 320 },
              { month: '2025-02', total: 365 },
              { month: '2025-03', total: 410 },
            ],
            patient_growth: [
              { month: '2025-01', new: 45 },
              { month: '2025-02', new: 52 },
              { month: '2025-03', new: 68 },
            ],
          });
          
          setRevenueReport({
            total_invoiced: 580000,
            total_collected: 520000,
            total_pending: 60000,
            top_revenue_services: [
              { service_name: 'General Consultation', count: 145, revenue: 145000 },
              { service_name: 'Cardiology', count: 65, revenue: 195000 },
              { service_name: 'Pediatrics', count: 89, revenue: 98000 },
              { service_name: 'Orthopedics', count: 42, revenue: 84000 },
              { service_name: 'Dermatology', count: 38, revenue: 58000 },
            ],
          });
          
          setAppointmentReport({
            total_scheduled: 410,
            completed: 368,
            cancelled: 28,
            no_shows: 14,
            by_status: {
              scheduled: 410,
              completed: 368,
              cancelled: 28,
            },
          });
          
          setPatientReport({
            new_registrations: 68,
            total_active: 1250,
            by_age_group: {
              '0-18': 180,
              '19-35': 420,
              '36-50': 310,
              '51-65': 240,
              '65+': 100,
            },
            by_gender: {
              male: 650,
              female: 600,
            },
          });
          
          setDoctorPerformance([
            { doctor_id: 1, doctor_name: 'Dr. Smith', total_appointments: 120, total_patients: 95, total_revenue: 180000, average_rating: 4.8 },
            { doctor_id: 2, doctor_name: 'Dr. Johnson', total_appointments: 98, total_patients: 82, total_revenue: 156000, average_rating: 4.6 },
            { doctor_id: 3, doctor_name: 'Dr. Brown', total_appointments: 87, total_patients: 71, total_revenue: 139000, average_rating: 4.7 },
          ]);
          
          setLoading(false);
        }, 500);
        return;
      }

      // Fetch all data in parallel from API
      const [
        stats,
        appointments,
        trends,
        revenue,
        appointmentData,
        patientData,
        doctorData
      ] = await Promise.all([
        dashboardAPI.getDashboardStats(),
        dashboardAPI.getTodayAppointments(),
        dashboardAPI.getMonthlyTrends(6),
        dashboardAPI.getRevenueReport(from, to),
        dashboardAPI.getAppointmentReport(from, to),
        dashboardAPI.getPatientReport(from, to),
        dashboardAPI.getDoctorPerformance(from, to)
      ]);

      setDashboardStats(stats);
      setTodayAppointments(appointments);
      setMonthlyTrends(trends);
      setRevenueReport(revenue);
      setAppointmentReport(appointmentData);
      setPatientReport(patientData);
      setDoctorPerformance(doctorData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when date range changes
  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Transform monthly trends data for charts
  const transformedMonthlyTrend = useMemo(() => {
    if (!monthlyTrends?.revenue_trend) return [];
    
    return monthlyTrends.revenue_trend.map((item: any, index: number) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      revenue: item.revenue / 100, // Convert from cents
      appointments: monthlyTrends.appointment_trend?.[index]?.total || 0,
      patients: monthlyTrends.patient_growth?.[index]?.new || 0
    }));
  }, [monthlyTrends]);

  // Transform service distribution from revenue report
  const serviceDistribution = useMemo(() => {
    if (!revenueReport?.top_revenue_services) return [];
    
    return revenueReport.top_revenue_services.map((service: any) => ({
      name: service.service_name,
      value: ((service.revenue / revenueReport.total_invoiced) * 100).toFixed(1),
      count: service.count,
      revenue: service.revenue / 100
    }));
  }, [revenueReport]);

  // Transform patient demographics
  const patientDemographics = useMemo(() => {
    if (!patientReport?.by_age_group) return [];
    
    return Object.entries(patientReport.by_age_group).map(([age, total]) => {
      const maleRatio = 0.52; // Approximate from by_gender
      const totalNum = total as number;
      return {
        age,
        male: Math.round(totalNum * maleRatio),
        female: Math.round(totalNum * (1 - maleRatio)),
        total: totalNum
      };
    });
  }, [patientReport]);

  // Transform appointment status data
  const appointmentsByDay = useMemo(() => {
    if (!appointmentReport?.by_status) return [];
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // This is simplified - in real implementation, you'd get daily breakdown from API
    return days.map(day => ({
      day,
      completed: Math.floor(Math.random() * 50) + 30,
      cancelled: Math.floor(Math.random() * 5) + 2,
      noShow: Math.floor(Math.random() * 3) + 1,
      pending: Math.floor(Math.random() * 8) + 4
    }));
  }, [appointmentReport]);

  // Radar chart data from doctor performance
  const radarData = useMemo(() => {
    if (!doctorPerformance || doctorPerformance.length === 0) return [];
    
    const metrics = ['Revenue', 'Patients', 'Satisfaction', 'Efficiency', 'Growth', 'Retention'];
    return metrics.map(metric => {
      const data: any = { metric };
      doctorPerformance.slice(0, 3).forEach(doctor => {
        // Normalize values to 0-100 scale
        const normalizeValue = (value: number, max: number) => Math.round((value / max) * 100);
        
        switch(metric) {
          case 'Revenue':
            data[doctor.doctor_name.split(' ')[1]] = normalizeValue(doctor.total_revenue, Math.max(...doctorPerformance.map(d => d.total_revenue)));
            break;
          case 'Patients':
            data[doctor.doctor_name.split(' ')[1]] = normalizeValue(doctor.total_patients, Math.max(...doctorPerformance.map(d => d.total_patients)));
            break;
          case 'Satisfaction':
            data[doctor.doctor_name.split(' ')[1]] = doctor.average_rating ? (doctor.average_rating / 5) * 100 : 0;
            break;
          default:
            data[doctor.doctor_name.split(' ')[1]] = Math.floor(Math.random() * 30) + 70;
        }
      });
      return data;
    });
  }, [doctorPerformance]);

  // Hourly appointments distribution (mock data - would need separate API endpoint)
  const hourlyAppointments = [
    { hour: '8 AM', count: 12 }, { hour: '9 AM', count: 18 }, { hour: '10 AM', count: 24 },
    { hour: '11 AM', count: 22 }, { hour: '12 PM', count: 15 }, { hour: '1 PM', count: 14 },
    { hour: '2 PM', count: 26 }, { hour: '3 PM', count: 28 }, { hour: '4 PM', count: 20 },
    { hour: '5 PM', count: 16 }, { hour: '6 PM', count: 10 },
  ];

  // Memoized calculations for KPIs
  const metrics = useMemo(() => {
    if (!dashboardStats) {
      return {
        totalRevenue: 0,
        totalPatients: 0,
        totalAppointments: 0,
        totalDoctors: 0,
        avgSatisfaction: 0
      };
    }

    return {
      totalRevenue: (dashboardStats.revenue_this_month || 0) / 100,
      totalPatients: dashboardStats.active_patients || 0,
      totalAppointments: dashboardStats.appointments_this_week || 0,
      totalDoctors: dashboardStats.total_doctors || 0,
      avgSatisfaction: 4.7 // Would come from separate patient feedback endpoint
    };
  }, [dashboardStats]);

  // Format recent appointments for display
  const recentAppointments = useMemo(() => {
    return todayAppointments.slice(0, 5).map(apt => ({
      id: apt.id,
      patient: apt.patient?.full_name || 'N/A',
      doctor: apt.doctor?.user?.full_name || 'N/A',
      clinic: selectedClinic === 'all' ? 'Main Clinic' : selectedClinic,
      time: new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: apt.status
    }));
  }, [todayAppointments, selectedClinic]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'checked_in': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled':
      case 'confirmed':
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'no_show': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} />;
      case 'in_progress':
      case 'checked_in': return <Clock size={14} />;
      case 'scheduled':
      case 'confirmed':
      case 'pending': return <AlertCircle size={14} />;
      case 'cancelled':
      case 'no_show': return <XCircle size={14} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Healthcare Analytics Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Healthcare Analytics Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Healthcare Analytics Dashboard" 
      subtitle="Comprehensive insights across all your clinics and operations"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedClinic} onValueChange={setSelectedClinic}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="all">All Clinics</SelectItem>
            <SelectItem value="downtown">Downtown Clinic</SelectItem>
            <SelectItem value="westside">Westside Medical</SelectItem>
            <SelectItem value="northpark">Northpark Health</SelectItem>
            <SelectItem value="eastview">Eastview Center</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-children">
        {[
          { 
            title: 'Total Revenue', 
            value: `$${(metrics.totalRevenue / 1000).toFixed(0)}K`, 
            change: '+15.2%', 
            positive: true, 
            icon: DollarSign,
            subtitle: 'vs last period'
          },
          { 
            title: 'Total Patients', 
            value: metrics.totalPatients.toLocaleString(), 
            change: '+8.4%', 
            positive: true, 
            icon: Users,
            subtitle: 'active patients'
          },
          { 
            title: 'Appointments', 
            value: metrics.totalAppointments.toLocaleString(), 
            change: '+12.1%', 
            positive: true, 
            icon: Calendar,
            subtitle: 'this week'
          },
          { 
            title: 'Active Doctors', 
            value: metrics.totalDoctors.toString(), 
            change: '+3', 
            positive: true, 
            icon: Stethoscope,
            subtitle: 'across clinics'
          },
          { 
            title: 'Satisfaction', 
            value: `${metrics.avgSatisfaction}/5`, 
            change: '+0.3', 
            positive: true, 
            icon: Activity,
            subtitle: 'average rating'
          },
        ].map((kpi) => (
          <div key={kpi.title} className="card-elevated p-5 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <kpi.icon size={20} className="text-primary" />
              </div>
              <div className="flex items-center gap-1">
                {kpi.positive ? (
                  <ArrowUpRight size={14} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-500" />
                )}
                <span className={cn(
                  'text-xs font-semibold',
                  kpi.positive ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {kpi.change}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold font-display">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Revenue Trend + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-semibold text-lg">Revenue & Growth Trend</h3>
                  <p className="text-sm text-muted-foreground">Monthly revenue over time</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={transformedMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={COLORS[0]} 
                      fill={COLORS[0]} 
                      fillOpacity={0.1} 
                      strokeWidth={2} 
                      name="Revenue" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      dot={{ fill: '#EF4444', r: 4 }}
                      name="Appointments" 
                    />
                    <Legend />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Service Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">Top revenue services</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={serviceDistribution} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={40} 
                      outerRadius={70} 
                      paddingAngle={4} 
                      dataKey="value"
                    >
                      {serviceDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 mt-4">
                {serviceDistribution.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i] }} 
                      />
                      <span className="text-muted-foreground truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{s.count}</span>
                      <span className="font-semibold">{s.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Appointments + Hourly Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">Today's Appointments</h3>
                  <p className="text-sm text-muted-foreground">Recent patient visits</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Patient</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Doctor</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Time</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 font-medium">{apt.patient}</td>
                        <td className="py-3 px-2 text-muted-foreground">{apt.doctor}</td>
                        <td className="py-3 px-2 text-muted-foreground">{apt.time}</td>
                        <td className="py-3 px-2">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                            getStatusColor(apt.status)
                          )}>
                            {getStatusIcon(apt.status)}
                            {apt.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Hourly Traffic</h3>
              <p className="text-sm text-muted-foreground mb-4">Peak appointment times</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyAppointments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px' 
                      }} 
                    />
                    <Bar 
                      dataKey="count" 
                      fill={COLORS[1]} 
                      radius={[6, 6, 0, 0]} 
                      name="Appointments"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          {/* Clinic Comparison + Performance Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">Doctor Performance</h3>
                  <p className="text-sm text-muted-foreground">Key metrics by doctor</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase">Doctor</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Revenue</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Patients</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorPerformance.slice(0, 5).map((doctor, i) => (
                      <tr key={doctor.doctor_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[i] }} 
                            />
                            <span className="font-medium">{doctor.doctor_name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 font-semibold">
                          ${((doctor.total_revenue || 0) / 100 / 1000).toFixed(1)}K
                        </td>
                        <td className="text-right py-3">{doctor.total_patients}</td>
                        <td className="text-right py-3">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            {(doctor.average_rating || 0).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Multi-Dimensional Performance</h3>
              <p className="text-sm text-muted-foreground mb-4">Comparative analysis</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    {doctorPerformance.slice(0, 3).map((doctor, i) => (
                      <Radar 
                        key={doctor.doctor_id}
                        name={doctor.doctor_name.split(' ')[1]} 
                        dataKey={doctor.doctor_name.split(' ')[1]} 
                        stroke={COLORS[i]} 
                        fill={COLORS[i]} 
                        fillOpacity={0.2 - (i * 0.05)} 
                        strokeWidth={2} 
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Patient Demographics + Service Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Patient Demographics</h3>
              <p className="text-sm text-muted-foreground mb-4">Age & gender distribution</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientDemographics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis 
                      type="number" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <YAxis 
                      dataKey="age" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      width={60} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px' 
                      }} 
                    />
                    <Bar dataKey="male" fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Male" stackId="a" />
                    <Bar dataKey="female" fill={COLORS[1]} radius={[0, 4, 4, 0]} name="Female" stackId="a" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Revenue by Service Type</h3>
              <p className="text-sm text-muted-foreground mb-4">Income breakdown</p>
              <div className="space-y-4 mt-6">
                {serviceDistribution.slice(0, 5).map((service: any, i: number) => (
                  <div key={service.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[i] }} 
                        />
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{service.count} visits</span>
                        <span className="font-semibold">
                          ${(service.revenue / 1000).toFixed(1)}K
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${service.value}%`,
                          backgroundColor: COLORS[i]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6 mt-0">
          {/* Weekly Appointments + Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Weekly Appointment Status</h3>
              <p className="text-sm text-muted-foreground mb-4">Completion rates by day</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '12px' 
                      }} 
                    />
                    <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} name="Completed" />
                    <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Pending" />
                    <Bar dataKey="cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} name="Cancelled" />
                    <Bar dataKey="noShow" fill="#6B7280" radius={[4, 4, 0, 0]} name="No Show" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Operational Efficiency</h3>
              <p className="text-sm text-muted-foreground mb-4">Key performance indicators</p>
              <div className="space-y-6 mt-6">
                {[
                  { 
                    label: 'Completion Rate', 
                    value: appointmentReport?.completed || 0,
                    total: appointmentReport?.total_scheduled || 100, 
                    color: COLORS[1],
                    metric: `${((appointmentReport?.completed / appointmentReport?.total_scheduled) * 100).toFixed(0)}%`
                  },
                  { 
                    label: 'Revenue Collection', 
                    value: (revenueReport?.total_collected || 0) / (revenueReport?.total_invoiced || 1),
                    total: 1, 
                    color: COLORS[2],
                    metric: `${(((revenueReport?.total_collected || 0) / (revenueReport?.total_invoiced || 1)) * 100).toFixed(0)}%`
                  },
                  { 
                    label: 'Patient Retention', 
                    value: 92, 
                    total: 100, 
                    color: COLORS[0],
                    metric: '92%'
                  },
                  { 
                    label: 'Avg Revenue/Patient', 
                    value: (revenueReport?.total_collected || 0) / (patientReport?.total_active || 1),
                    total: 200, 
                    color: COLORS[3],
                    metric: `$${(((revenueReport?.total_collected || 0) / (patientReport?.total_active || 1)) / 100).toFixed(0)}`
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-bold">{item.metric}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${(item.value / item.total) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">System Alerts & Notifications</h3>
              <div className="space-y-3">
                {[
                  { type: 'warning', message: `${appointmentReport?.cancelled || 0} cancelled appointments today`, time: '10 mins ago' },
                  { type: 'info', message: `${patientReport?.new_registrations || 0} new patients registered this month`, time: '1 hour ago' },
                  { type: 'success', message: 'Revenue target achieved for this month', time: '2 hours ago' },
                  { type: 'alert', message: `${(revenueReport?.total_pending || 0) / 100} pending payments`, time: '3 hours ago' },
                ].map((alert, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border',
                      alert.type === 'warning' && 'bg-amber-50/50 border-amber-200',
                      alert.type === 'info' && 'bg-blue-50/50 border-blue-200',
                      alert.type === 'success' && 'bg-emerald-50/50 border-emerald-200',
                      alert.type === 'alert' && 'bg-red-50/50 border-red-200'
                    )}
                  >
                    <AlertCircle 
                      size={18} 
                      className={cn(
                        alert.type === 'warning' && 'text-amber-600',
                        alert.type === 'info' && 'text-blue-600',
                        alert.type === 'success' && 'text-emerald-600',
                        alert.type === 'alert' && 'text-red-600'
                      )} 
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { label: 'Schedule Appointment', icon: Calendar, color: 'bg-primary' },
                  { label: 'Add New Patient', icon: Users, color: 'bg-brand-teal' },
                  { label: 'Generate Report', icon: BarChart3, color: 'bg-brand-navy' },
                  { label: 'View All Clinics', icon: Building2, color: 'bg-purple-500' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {/* Navigate to respective page */}}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-lg text-white font-medium text-sm',
                      'hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5',
                      action.color
                    )}
                  >
                    <action.icon size={18} />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Dashboard;