import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp, Users, Calendar, DollarSign, Activity, ArrowUpRight, ArrowDownRight,
  Stethoscope, Building2, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Download, FileText, Printer, Filter
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ComposedChart, BarChart, LineChart,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopService {
  service_id: number;
  service_name: string;
  usage_count: number;
  revenue: number;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string | null;
  id: number;
  amount?: number;
}

interface DashboardStats {
  today_appointments: number;
  today_revenue: number;
  pending_payments: number;
  active_patients: number;
  recently_active_patients: number;
  total_doctors: number;
  new_leads_today: number;
  appointments_this_week: number;
  revenue_this_month: number;
  top_services: TopService[];
  recent_activity: RecentActivity[];
}

interface RevenueTrendItem { year: number; month: number; revenue: number; }
interface AppointmentTrendItem { year: number; month: number; total_appointments: number; completed_appointments: number; }
interface PatientTrendItem { year: number; month: number; new_patients: number; }

interface MonthlyTrends {
  revenue_trend: RevenueTrendItem[];
  appointment_trend: AppointmentTrendItem[];
  patient_trend: PatientTrendItem[];
  period_months: number;
  start_date: string;
  end_date: string;
}

interface TopRevenueService {
  service_id: number;
  service_name: string;
  usage_count: number;
  total_revenue: number;
}

interface RevenueReport {
  period_start: string;
  period_end: string;
  total_invoiced: number;
  total_collected: number;
  total_pending: number;
  total_discounts: number;
  payment_methods: Record<string, number>;
  daily_breakdown: { date: string; revenue: number }[];
  top_revenue_services: TopRevenueService[];
}

interface AppointmentByDoctor {
  doctor_id: number;
  doctor_name: string;
  total_appointments: number;
  completed: number;
}

interface PeakHour { hour: number; appointment_count: number; }

interface AppointmentReport {
  period_start: string;
  period_end: string;
  total_scheduled: number;
  completed: number;
  cancelled: number;
  no_shows: number;
  rescheduled: number;
  by_doctor: AppointmentByDoctor[];
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  peak_hours: PeakHour[];
}

interface PatientReport {
  period_start: string;
  period_end: string;
  new_registrations: number;
  total_active: number;
  total_visits: number;
  average_visits_per_patient: number;
  by_age_group: Record<string, number>;
  by_gender: Record<string, number>;
  top_conditions: unknown[];
}

interface DailyMetrics {
  metric_date: string;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  new_patients: number;
  returning_patients: number;
  total_revenue: number;
  paid_revenue: number;
  pending_revenue: number;
  ai_leads_captured: number;
  ai_leads_converted: number;
  ai_bookings: number;
  average_wait_time_minutes: number | null;
  average_consultation_time_minutes: number | null;
}

interface DoctorPerformance {
  doctor_id: number;
  doctor_name: string;
  specialization: string | null;
  total_appointments: number;
  completed_appointments: number;
  completion_rate: number;
  revenue_generated: number;
  average_consultation_time_minutes: number | null;
  patient_satisfaction: null;
}

interface TodayAppointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  status: string;
  appointment_type?: string;
  patient?: { id: number; full_name?: string; first_name?: string; last_name?: string };
  doctor?: {
    id: number;
    user?: { first_name: string; last_name: string; full_name?: string };
    first_name?: string;
    last_name?: string;
  };
}

// ─── Report Template Types ────────────────────────────────────────────────────

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'financial' | 'clinical' | 'operational';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC', '#4ECDC4'];

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const reportTemplates: ReportTemplate[] = [
  { id: 'revenue', title: 'Revenue Report', description: 'Comprehensive revenue analysis by clinic, service, and period', icon: DollarSign, category: 'financial' },
  { id: 'expenses', title: 'Expense Report', description: 'Detailed breakdown of operational expenses across clinics', icon: TrendingUp, category: 'financial' },
  { id: 'collection', title: 'Collection Report', description: 'Payment collection rates, outstanding amounts, and aging', icon: BarChart3, category: 'financial' },
  { id: 'patient', title: 'Patient Report', description: 'Patient demographics, growth trends, and retention rates', icon: Users, category: 'clinical' },
  { id: 'appointment', title: 'Appointment Report', description: 'Appointment volumes, completion rates, and scheduling', icon: Calendar, category: 'clinical' },
  { id: 'doctor', title: 'Doctor Performance', description: 'Doctor productivity, patient ratings, and revenue generated', icon: Stethoscope, category: 'operational' },
  { id: 'clinic', title: 'Clinic Comparison', description: 'Side-by-side clinic performance with key metrics', icon: Building2, category: 'operational' },
];

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  return headers;
};

const apiFetch = async (path: string) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateStr = (d: Date) => d.toISOString().split('T')[0];

const getDateRange = (range: string): { from: string; to: string } => {
  const now = new Date();
  const today = toDateStr(now);
  const sub = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return toDateStr(d); };
  const subM = (m: number) => { const d = new Date(now); d.setMonth(d.getMonth() - m); return toDateStr(d); };
  const subY = (y: number) => { const d = new Date(now); d.setFullYear(d.getFullYear() - y); return toDateStr(d); };
  const map: Record<string, { from: string; to: string }> = {
    today: { from: today, to: today },
    '7days': { from: sub(7), to: today },
    '30days': { from: sub(30), to: today },
    '3months': { from: subM(3), to: today },
    '6months': { from: subM(6), to: today },
    '1year': { from: subY(1), to: today },
  };
  return map[range] ?? map['6months'];
};

const calcPctChange = (arr: number[]): string | null => {
  if (arr.length < 2 || arr[0] === 0) return null;
  const pct = ((arr[arr.length - 1] - arr[0]) / arr[0]) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

const amountToK = (amount: number) => `$${(amount / 1000).toFixed(1)}K`;
const amountToDisplay = (amount: number) => `$${(amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const formatTime = (timeStr: string) => {
  try { return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
  catch { return timeStr; }
};

const getPatientName = (apt: TodayAppointment) => {
  const p = apt.patient;
  if (!p) return 'N/A';
  return (p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) || 'N/A';
};

const getDoctorName = (apt: TodayAppointment) => {
  const d = apt.doctor;
  if (!d) return 'N/A';
  if (d.user) return (d.user.full_name ?? `${d.user.first_name} ${d.user.last_name}`.trim()) || 'N/A';
  return `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || 'N/A';
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_progress': case 'checked_in': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'scheduled': case 'confirmed': case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
    case 'no_show': return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'rescheduled': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 size={14} />;
    case 'in_progress': case 'checked_in': return <Clock size={14} />;
    case 'scheduled': case 'confirmed': case 'pending': return <AlertCircle size={14} />;
    case 'cancelled': case 'no_show': return <XCircle size={14} />;
    default: return null;
  }
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-full min-h-[120px] text-sm text-muted-foreground">
    {message}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');

  // Report tab state
  const [reportFilterCategory, setReportFilterCategory] = useState<string>('all');
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // API state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrends | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [appointmentReport, setAppointmentReport] = useState<AppointmentReport | null>(null);
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerformance[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getDateRange(dateRange);
      const today = toDateStr(new Date());

      const [stats, appointments, trends, revenue, apptReport, patReport, docPerf, daily] = await Promise.all([
        apiFetch('/api/v1/analytics/dashboard'),
        apiFetch('/api/v1/appointments/today'),
        apiFetch('/api/v1/analytics/trends/monthly?months=6'),
        apiFetch(`/api/v1/analytics/reports/revenue?from_date=${from}&to_date=${to}`),
        apiFetch(`/api/v1/analytics/reports/appointments?from_date=${from}&to_date=${to}`),
        apiFetch(`/api/v1/analytics/reports/patients?from_date=${from}&to_date=${to}`),
        apiFetch(`/api/v1/analytics/performance/doctors?from_date=${from}&to_date=${to}`),
        apiFetch(`/api/v1/analytics/metrics/daily?metric_date=${today}`).catch(() => null),
      ]);

      setDashboardStats(stats as DashboardStats);
      setTodayAppointments(Array.isArray(appointments) ? appointments : []);
      setMonthlyTrends(trends as MonthlyTrends);
      setRevenueReport(revenue as RevenueReport);
      setAppointmentReport(apptReport as AppointmentReport);
      setPatientReport(patReport as PatientReport);
      setDoctorPerformance(Array.isArray(docPerf) ? docPerf : []);
      setDailyMetrics(daily as DailyMetrics | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ── Report export helpers ─────────────────────────────────────────────────

  const handleExportReport = (template: ReportTemplate) => {
    let csv = '';
    switch (template.id) {
      case 'revenue':
        csv = 'Date,Revenue,Collected\n' + (revenueReport?.daily_breakdown ?? []).map(r => `${r.date},$${(r.revenue / 100).toFixed(2)}`).join('\n');
        break;
      case 'expenses':
        csv = 'Month,Revenue,Expenses\n' + (monthlyTrends?.revenue_trend ?? []).map(r => `${MONTH_NAMES[r.month]} ${r.year},$${(r.revenue / 100).toFixed(0)}`).join('\n');
        break;
      case 'collection':
        csv = `Collection Report\nTotal Invoiced,${amountToDisplay(revenueReport?.total_invoiced ?? 0)}\nTotal Collected,${amountToDisplay(revenueReport?.total_collected ?? 0)}\nPending,${amountToDisplay(revenueReport?.total_pending ?? 0)}`;
        break;
      case 'patient':
        csv = `Patient Report\nTotal Active,${patientReport?.total_active ?? 0}\nNew Registrations,${patientReport?.new_registrations ?? 0}\nTotal Visits,${patientReport?.total_visits ?? 0}`;
        break;
      case 'appointment':
        csv = `Appointment Report\nTotal Scheduled,${appointmentReport?.total_scheduled ?? 0}\nCompleted,${appointmentReport?.completed ?? 0}\nCancelled,${appointmentReport?.cancelled ?? 0}`;
        break;
      case 'doctor':
        csv = 'Doctor,Appointments,Completed,Rate,Revenue\n' + doctorPerformance.map(d => `${d.doctor_name},${d.total_appointments},${d.completed_appointments},${d.completion_rate.toFixed(0)}%,${amountToDisplay(d.revenue_generated)}`).join('\n');
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
    toast.success(`${template.title} exported successfully`);
  };

  const handleGenerateReport = (template: ReportTemplate) => {
    toast.success(`Generating ${template.title}...`);
    setTimeout(() => handleExportReport(template), 800);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Consolidated Report</title>
      <style>body{font-family:system-ui;max-width:900px;margin:40px auto;padding:0 20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}th{background:#f5f5f5;font-size:12px;text-transform:uppercase}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0}.card{padding:20px;border:1px solid #eee;border-radius:8px}h1{color:#36406D}h2{color:#59C4C1;margin-top:30px}</style></head><body>
      <h1>Consolidated Report</h1>
      <p>Period: ${reportStartDate} to ${reportEndDate} | Generated: ${new Date().toLocaleDateString()}</p>
      <h2>Financial Summary</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Total Invoiced</p><p style="font-size:24px;font-weight:bold">${amountToDisplay(revenueReport?.total_invoiced ?? 0)}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Collected</p><p style="font-size:24px;font-weight:bold">${amountToDisplay(revenueReport?.total_collected ?? 0)}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Pending</p><p style="font-size:24px;font-weight:bold">${amountToDisplay(revenueReport?.total_pending ?? 0)}</p></div>
      </div>
      <h2>Revenue by Top Services</h2>
      <table><thead><tr><th>Service</th><th>Usage Count</th><th>Revenue</th></tr></thead><tbody>
      ${(revenueReport?.top_revenue_services ?? []).map(s => `<tr><td>${s.service_name}</td><td>${s.usage_count}</td><td>${amountToDisplay(s.total_revenue ?? 0)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Patient Summary</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Active Patients</p><p style="font-size:24px;font-weight:bold">${patientReport?.total_active ?? 0}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Total Visits</p><p style="font-size:24px;font-weight:bold">${patientReport?.total_visits ?? 0}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Appointments</p><p style="font-size:24px;font-weight:bold">${appointmentReport?.total_scheduled ?? 0}</p></div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const trendChartData = useMemo(() => {
    if (!monthlyTrends?.revenue_trend?.length) return [];
    return monthlyTrends.revenue_trend.map((r, idx) => ({
      label: `${MONTH_NAMES[r.month]} '${String(r.year).slice(2)}`,
      revenue: (r.revenue ?? 0),
      appointments: monthlyTrends.appointment_trend?.[idx]?.total_appointments ?? 0,
      newPatients: monthlyTrends.patient_trend?.[idx]?.new_patients ?? 0,
    }));
  }, [monthlyTrends]);

  const revenuePctChange = useMemo(() => {
    if (!monthlyTrends?.revenue_trend?.length) return null;
    return calcPctChange(monthlyTrends.revenue_trend.map(r => r.revenue));
  }, [monthlyTrends]);

  const apptPctChange = useMemo(() => {
    if (!monthlyTrends?.appointment_trend?.length) return null;
    return calcPctChange(monthlyTrends.appointment_trend.map(r => r.total_appointments));
  }, [monthlyTrends]);

  const patientPctChange = useMemo(() => {
    if (!monthlyTrends?.patient_trend?.length) return null;
    return calcPctChange(monthlyTrends.patient_trend.map(r => r.new_patients));
  }, [monthlyTrends]);

  const serviceDistribution = useMemo(() => {
    if (!revenueReport?.top_revenue_services?.length) return [];
    const total = revenueReport.total_invoiced || 1;
    return revenueReport.top_revenue_services.map(s => ({
      name: s.service_name,
      count: s.usage_count,
      totalRevenue: s.total_revenue ?? 0,
      pct: Number(((s.total_revenue / total) * 100).toFixed(1)),
    }));
  }, [revenueReport]);

  const patientDemographics = useMemo(() => {
    if (!patientReport?.by_age_group) return [];
    const byGender = patientReport.by_gender ?? {};
    const totalGender = Object.values(byGender).reduce((a, b) => a + b, 0) || 1;
    const maleTotal = Object.entries(byGender).filter(([k]) => k.toLowerCase().includes('male') && !k.toLowerCase().includes('female')).reduce((a, [, v]) => a + v, 0);
    const maleRatio = maleTotal / totalGender;
    return Object.entries(patientReport.by_age_group).map(([age, total]) => ({
      age,
      male: Math.round((total as number) * maleRatio),
      female: Math.round((total as number) * (1 - maleRatio)),
      total: total as number,
    }));
  }, [patientReport]);

  const genderData = useMemo(() => {
    if (!patientReport?.by_gender) return [];
    return Object.entries(patientReport.by_gender).filter(([, count]) => count > 0).map(([gender, count]) => ({
      name: gender.charAt(0).toUpperCase() + gender.slice(1),
      value: count as number,
    }));
  }, [patientReport]);

  const peakHoursData = useMemo(() => {
    if (!appointmentReport?.peak_hours?.length) return [];
    return [...appointmentReport.peak_hours].sort((a, b) => a.hour - b.hour).map(h => ({ hour: formatHour(h.hour), count: h.appointment_count }));
  }, [appointmentReport]);

  const todayMetrics = useMemo(() => {
    if (dailyMetrics) return {
      totalAppointments: dailyMetrics.total_appointments,
      completedAppointments: dailyMetrics.completed_appointments,
      cancelledAppointments: dailyMetrics.cancelled_appointments,
      noShowAppointments: dailyMetrics.no_show_appointments,
      newPatients: dailyMetrics.new_patients,
      returningPatients: dailyMetrics.returning_patients,
      paidRevenue: dailyMetrics.paid_revenue,
      pendingRevenue: dailyMetrics.pending_revenue,
    };
    return {
      totalAppointments: dashboardStats?.today_appointments ?? 0,
      completedAppointments: null, cancelledAppointments: null,
      noShowAppointments: null, newPatients: null, returningPatients: null,
      paidRevenue: dashboardStats?.today_revenue ?? 0, pendingRevenue: null,
    };
  }, [dailyMetrics, dashboardStats]);

  const radarData = useMemo(() => {
    if (!doctorPerformance.length) return [];
    const top3 = doctorPerformance.slice(0, 3);
    const maxRevenue = Math.max(...doctorPerformance.map(d => d.revenue_generated), 1);
    const maxAppointments = Math.max(...doctorPerformance.map(d => d.total_appointments), 1);
    return ['Revenue', 'Appointments', 'Completion Rate'].map(metric => {
      const row: Record<string, string | number> = { metric };
      top3.forEach(doc => {
        const key = doc.doctor_name.split(' ').pop() ?? `Dr${doc.doctor_id}`;
        switch (metric) {
          case 'Revenue': row[key] = Math.round((doc.revenue_generated / maxRevenue) * 100); break;
          case 'Appointments': row[key] = Math.round((doc.total_appointments / maxAppointments) * 100); break;
          case 'Completion Rate': row[key] = Math.round(doc.completion_rate); break;
        }
      });
      return row;
    });
  }, [doctorPerformance]);

  const efficiencyKpis = useMemo(() => {
    const totalScheduled = appointmentReport?.total_scheduled ?? 0;
    const completed = appointmentReport?.completed ?? 0;
    const cancelled = appointmentReport?.cancelled ?? 0;
    const noShows = appointmentReport?.no_shows ?? 0;
    const totalInvoiced = revenueReport?.total_invoiced ?? 0;
    const totalCollected = revenueReport?.total_collected ?? 0;
    return [
      { label: 'Completion Rate', metric: totalScheduled ? `${((completed / totalScheduled) * 100).toFixed(0)}%` : 'N/A', pct: totalScheduled ? (completed / totalScheduled) * 100 : 0, color: COLORS[1] },
      { label: 'Revenue Collection Rate', metric: totalInvoiced ? `${((totalCollected / totalInvoiced) * 100).toFixed(0)}%` : 'N/A', pct: totalInvoiced ? (totalCollected / totalInvoiced) * 100 : 0, color: COLORS[2] },
      { label: 'Cancellation Rate', metric: totalScheduled ? `${((cancelled / totalScheduled) * 100).toFixed(0)}%` : 'N/A', pct: totalScheduled ? (cancelled / totalScheduled) * 100 : 0, color: '#EF4444' },
      { label: 'No-Show Rate', metric: totalScheduled ? `${((noShows / totalScheduled) * 100).toFixed(0)}%` : 'N/A', pct: totalScheduled ? (noShows / totalScheduled) * 100 : 0, color: '#F59E0B' },
    ];
  }, [appointmentReport, revenueReport]);

  const systemAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'info' | 'success' | 'alert'; message: string }[] = [];
    const cancelled = appointmentReport?.cancelled ?? 0;
    if (cancelled > 0) alerts.push({ type: 'warning', message: `${cancelled} cancelled appointment${cancelled !== 1 ? 's' : ''} in the selected period` });
    const noShows = appointmentReport?.no_shows ?? 0;
    if (noShows > 0) alerts.push({ type: 'warning', message: `${noShows} no-show appointment${noShows !== 1 ? 's' : ''} in the selected period` });
    const newReg = patientReport?.new_registrations ?? 0;
    if (newReg > 0) alerts.push({ type: 'info', message: `${newReg} new patient${newReg !== 1 ? 's' : ''} registered in the selected period` });
    const pending = revenueReport?.total_pending ?? 0;
    if (pending > 0) alerts.push({ type: 'alert', message: `${amountToDisplay(pending)} in outstanding pending payments` });
    const invoiced = revenueReport?.total_invoiced ?? 0;
    const collected = revenueReport?.total_collected ?? 0;
    if (invoiced > 0 && collected > 0 && collected >= invoiced) alerts.push({ type: 'success', message: 'All invoiced revenue has been collected this period' });
    const leads = dashboardStats?.new_leads_today ?? 0;
    if (leads > 0) alerts.push({ type: 'info', message: `${leads} new AI lead${leads !== 1 ? 's' : ''} captured today` });
    return alerts;
  }, [appointmentReport, patientReport, revenueReport, dashboardStats]);

  const kpiCards = useMemo(() => [
    { title: 'Monthly Revenue', value: amountToK(dashboardStats?.revenue_this_month ?? 0), change: revenuePctChange, icon: DollarSign, subtitle: 'this calendar month' },
    { title: 'Active Patients', value: (dashboardStats?.active_patients ?? 0).toLocaleString(), change: null as string | null, icon: Users, subtitle: 'total registered & active' },
    { title: 'Active (90d)', value: (dashboardStats?.recently_active_patients ?? 0).toLocaleString(), change: patientPctChange, icon: Activity, subtitle: 'visited in last 90 days' },
    { title: "This Week's Appts", value: (dashboardStats?.appointments_this_week ?? 0).toLocaleString(), change: apptPctChange, icon: Calendar, subtitle: 'scheduled this week' },
    { title: 'Active Doctors', value: (dashboardStats?.total_doctors ?? 0).toString(), change: null as string | null, icon: Stethoscope, subtitle: 'across all clinics' },
    { title: "Today's Revenue", value: amountToK(dashboardStats?.today_revenue ?? 0), change: null as string | null, icon: TrendingUp, subtitle: dashboardStats?.today_revenue === 0 ? 'no collections today' : 'collected today' },
  ], [dashboardStats, revenuePctChange, apptPctChange, patientPctChange]);

  const appointmentRows = useMemo(() =>
    todayAppointments.slice(0, 6).map(apt => ({
      id: apt.id,
      patient: getPatientName(apt),
      doctor: getDoctorName(apt),
      time: formatTime(apt.appointment_time),
      status: apt.status,
      type: apt.appointment_type ?? '—',
    })),
  [todayAppointments]);

  const paymentMethodsData = useMemo(() => {
    if (!revenueReport?.payment_methods) return [];
    return Object.entries(revenueReport.payment_methods).filter(([, v]) => v > 0).map(([method, amount]) => ({
      name: method.replace('PaymentMethod.', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: amount as number,
    }));
  }, [revenueReport]);

  const filteredReportTemplates = reportTemplates.filter(t => reportFilterCategory === 'all' || t.category === reportFilterCategory);

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) return (
    <DashboardLayout title="Healthcare Analytics Dashboard">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data…</p>
        </div>
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout title="Healthcare Analytics Dashboard">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-muted-foreground mb-4 text-sm max-w-md">{error}</p>
          <button onClick={fetchDashboardData} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    </DashboardLayout>
  );

  // ── Sub-components ────────────────────────────────────────────────────────

  const KpiChange = ({ value }: { value: string | null }) => {
    if (!value) return null;
    const isPos = !value.startsWith('-');
    return (
      <div className="flex items-center gap-1">
        {isPos ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
        <span className={cn('text-xs font-semibold', isPos ? 'text-emerald-600' : 'text-red-600')}>{value}</span>
      </div>
    );
  };

  const chartStyle = {
    contentStyle: { backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  };

  const axisProps = { axisLine: false as const, tickLine: false as const, tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } };

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Healthcare Analytics Dashboard" subtitle="Comprehensive insights across all your clinics and operations">
      {/* Global Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <button onClick={fetchDashboardData} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
        {revenueReport && (
          <p className="text-xs text-muted-foreground ml-auto">
            Period: {revenueReport.period_start} → {revenueReport.period_end}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {kpiCards.map(kpi => (
          <div key={kpi.title} className="card-elevated p-5 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <kpi.icon size={20} className="text-primary" />
              </div>
              <KpiChange value={kpi.change} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
            <p className="text-2xl font-bold font-display">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Tabs — now 4: Overview, Analytics, Operations, Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* ────────────────── OVERVIEW ────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <h3 className="font-display font-semibold text-lg">Revenue &amp; Appointment Trend</h3>
              <p className="text-sm text-muted-foreground mb-6">Monthly data — last 6 months</p>
              {trendChartData.length === 0 ? <EmptyState message="No trend data for the selected period." /> : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis yAxisId="left" {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" {...axisProps} />
                      <Tooltip {...chartStyle} formatter={(v: number, name: string) => name === 'Revenue' ? [`$${v.toLocaleString()}`, name] : [v, name]} />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.12} strokeWidth={2} name="Revenue" />
                      <Line yAxisId="right" type="monotone" dataKey="appointments" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} name="Appointments" />
                      <Line yAxisId="right" type="monotone" dataKey="newPatients" stroke={COLORS[1]} strokeWidth={2} dot={{ fill: COLORS[1], r: 4 }} name="New Patients" strokeDasharray="4 4" />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Service Revenue Split</h3>
              <p className="text-sm text-muted-foreground mb-4">By total revenue (top services)</p>
              {serviceDistribution.length === 0 ? <EmptyState message="No service data." /> : (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={38} outerRadius={66} paddingAngle={4} dataKey="pct">
                          {serviceDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip {...chartStyle} formatter={(v: number) => [`${v}%`, 'Share']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5 mt-3">
                    {serviceDistribution.slice(0, 5).map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-muted-foreground truncate max-w-[130px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{s.count}×</span>
                          <span className="font-semibold text-xs">{s.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">Today's Appointments</h3>
                  <p className="text-sm text-muted-foreground">{todayAppointments.length > 0 ? `${todayAppointments.length} total — showing first ${appointmentRows.length}` : 'No appointments today'}</p>
                </div>
                {dailyMetrics && (
                  <div className="flex gap-2 flex-wrap justify-end">
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">✓ {dailyMetrics.completed_appointments} done</span>
                    <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">{dailyMetrics.cancelled_appointments} cancelled</span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200">{dailyMetrics.no_show_appointments} no-show</span>
                  </div>
                )}
              </div>
              {appointmentRows.length === 0 ? <EmptyState message="No appointments found for today." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Patient', 'Doctor', 'Time', 'Type', 'Status'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {appointmentRows.map(apt => (
                        <tr key={apt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 font-medium">{apt.patient}</td>
                          <td className="py-3 px-2 text-muted-foreground">{apt.doctor}</td>
                          <td className="py-3 px-2 text-muted-foreground tabular-nums">{apt.time}</td>
                          <td className="py-3 px-2 text-muted-foreground text-xs">{apt.type}</td>
                          <td className="py-3 px-2">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', getStatusColor(apt.status))}>
                              {getStatusIcon(apt.status)}
                              {apt.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Peak Hours</h3>
              <p className="text-sm text-muted-foreground mb-4">Top 5 busiest hours (period)</p>
              {peakHoursData.length === 0 ? <EmptyState message="No peak hour data." /> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="hour" {...axisProps} tick={{ ...axisProps.tick, fontSize: 11 }} />
                      <YAxis {...axisProps} />
                      <Tooltip {...chartStyle} />
                      <Bar dataKey="count" fill={COLORS[1]} radius={[6, 6, 0, 0]} name="Appointments" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {dailyMetrics && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{dailyMetrics.new_patients}</p>
                    <p className="text-xs text-muted-foreground">New today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{dailyMetrics.returning_patients}</p>
                    <p className="text-xs text-muted-foreground">Returning</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(dashboardStats?.top_services?.length ?? 0) > 0 && (
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Top Services (Last 30 Days)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {dashboardStats!.top_services.map((s, i) => (
                  <div key={s.service_id} className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                    <p className="text-sm font-semibold truncate">{s.service_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.usage_count} uses</p>
                    <p className="text-xs font-semibold text-primary mt-0.5">{amountToDisplay(s.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ────────────────── ANALYTICS ────────────────── */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Doctor Performance</h3>
              <p className="text-sm text-muted-foreground mb-4">Revenue &amp; completion (period)</p>
              {doctorPerformance.length === 0 ? <EmptyState message="No doctor performance data." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Doctor', 'Specialty', 'Appts', 'Completed', 'Rate', 'Revenue'].map(h => (
                          <th key={h} className={cn('py-3 text-xs font-semibold text-muted-foreground uppercase', h === 'Doctor' || h === 'Specialty' ? 'text-left' : 'text-right')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {doctorPerformance.slice(0, 8).map((doc, i) => (
                        <tr key={doc.doctor_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="font-medium whitespace-nowrap">{doc.doctor_name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">{doc.specialization ?? '—'}</td>
                          <td className="py-3 text-right">{doc.total_appointments}</td>
                          <td className="py-3 text-right">{doc.completed_appointments}</td>
                          <td className="py-3 text-right">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', doc.completion_rate >= 80 ? 'bg-emerald-50 text-emerald-700' : doc.completion_rate >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                              {doc.completion_rate.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-3 text-right font-semibold">{amountToK(doc.revenue_generated)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Doctor Comparison</h3>
              <p className="text-sm text-muted-foreground mb-4">Top 3 doctors — normalised 0–100</p>
              {radarData.length === 0 ? <EmptyState message="No data for radar chart." /> : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      {doctorPerformance.slice(0, 3).map((doc, i) => {
                        const key = doc.doctor_name.split(' ').pop() ?? `Dr${doc.doctor_id}`;
                        return <Radar key={doc.doctor_id} name={doc.doctor_name} dataKey={key} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.18 - i * 0.04} strokeWidth={2} />;
                      })}
                      <Legend />
                      <Tooltip {...chartStyle} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Patient Demographics</h3>
              <p className="text-sm text-muted-foreground mb-4">Age groups by gender</p>
              {patientDemographics.length === 0 ? <EmptyState message="No demographic data." /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientDemographics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" {...axisProps} />
                      <YAxis dataKey="age" type="category" {...axisProps} width={55} />
                      <Tooltip {...chartStyle} />
                      <Bar dataKey="male" fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Male" stackId="a" />
                      <Bar dataKey="female" fill={COLORS[1]} radius={[0, 4, 4, 0]} name="Female" stackId="a" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {genderData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex gap-4 flex-wrap">
                  {genderData.map((g, i) => (
                    <div key={g.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-muted-foreground">{g.name}:</span>
                      <span className="text-sm font-semibold">{g.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Avg visits/patient:</span>
                    <span className="text-sm font-semibold">{patientReport?.average_visits_per_patient?.toFixed(1) ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Revenue by Service</h3>
              <p className="text-sm text-muted-foreground mb-4">From top revenue services</p>
              {serviceDistribution.length === 0 ? <EmptyState message="No service revenue data." /> : (
                <div className="space-y-4 mt-2">
                  {serviceDistribution.slice(0, 6).map((s, i) => (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                          <span className="font-medium truncate max-w-[160px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{s.count} visits</span>
                          <span className="font-semibold">${(s.totalRevenue / 1000).toFixed(1)}K</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, backgroundColor: COLORS[i] }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {paymentMethodsData.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-semibold mb-3">Payment Methods</p>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethodsData.map((m, i) => (
                      <div key={m.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs text-muted-foreground">{m.name}</span>
                        </div>
                        <span className="text-xs font-semibold">${(m.value / 1000).toFixed(1)}K</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ────────────────── OPERATIONS ────────────────── */}
        <TabsContent value="operations" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Scheduled', value: appointmentReport?.total_scheduled ?? 0, color: 'bg-primary/10 text-primary' },
              { label: 'Completed', value: appointmentReport?.completed ?? 0, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Cancelled', value: appointmentReport?.cancelled ?? 0, color: 'bg-red-50 text-red-700' },
              { label: 'No-Shows', value: appointmentReport?.no_shows ?? 0, color: 'bg-gray-50 text-gray-700' },
            ].map(item => (
              <div key={item.label} className="card-elevated p-5 text-center rounded-xl">
                <p className={cn('text-3xl font-bold font-display', item.color.split(' ')[1])}>{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Operational Efficiency</h3>
              <p className="text-sm text-muted-foreground mb-6">From appointment &amp; revenue reports</p>
              <div className="space-y-6">
                {efficiencyKpis.map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm font-bold">{item.metric}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(Math.max(item.pct, 0), 100)}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              {revenueReport && (
                <div className="mt-6 pt-5 border-t border-border grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-bold text-primary">{amountToK(revenueReport.total_invoiced)}</p><p className="text-xs text-muted-foreground">Invoiced</p></div>
                  <div><p className="text-lg font-bold text-emerald-600">{amountToK(revenueReport.total_collected)}</p><p className="text-xs text-muted-foreground">Collected</p></div>
                  <div><p className="text-lg font-bold text-amber-600">{amountToK(revenueReport.total_pending)}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Appointments by Type &amp; Status</h3>
              <p className="text-sm text-muted-foreground mb-4">From by_type and by_status fields</p>
              {Object.keys(appointmentReport?.by_type ?? {}).length === 0 && Object.keys(appointmentReport?.by_status ?? {}).length === 0 ? <EmptyState message="No breakdown data available." /> : (
                <div className="space-y-4">
                  {Object.entries(appointmentReport?.by_type ?? {}).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">By Type</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(appointmentReport!.by_type).map(([type, count], i) => (
                          <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-xs capitalize">{type.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="text-sm font-bold">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.entries(appointmentReport?.by_status ?? {}).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 mt-4">By Status</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(appointmentReport!.by_status).map(([s, count]) => (
                          <div key={s} className={cn('flex items-center justify-between p-3 rounded-lg border', getStatusColor(s.toLowerCase()))}>
                            <span className="text-xs capitalize">{s.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-bold">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(appointmentReport?.rescheduled ?? 0) > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <span className="text-xs text-purple-700">Rescheduled</span>
                      <span className="text-sm font-bold text-purple-700">{appointmentReport!.rescheduled}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">System Alerts</h3>
              {systemAlerts.length === 0 ? <EmptyState message="No alerts for the selected period." /> : (
                <div className="space-y-3">
                  {systemAlerts.map((alert, i) => (
                    <div key={i} className={cn('flex items-start gap-3 p-4 rounded-lg border',
                      alert.type === 'warning' && 'bg-amber-50/50 border-amber-200',
                      alert.type === 'info' && 'bg-blue-50/50 border-blue-200',
                      alert.type === 'success' && 'bg-emerald-50/50 border-emerald-200',
                      alert.type === 'alert' && 'bg-red-50/50 border-red-200'
                    )}>
                      <AlertCircle size={18} className={cn(
                        alert.type === 'warning' && 'text-amber-600',
                        alert.type === 'info' && 'text-blue-600',
                        alert.type === 'success' && 'text-emerald-600',
                        alert.type === 'alert' && 'text-red-600'
                      )} />
                      <p className="text-sm font-medium">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
              {(dashboardStats?.recent_activity?.length ?? 0) > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-semibold mb-3">Recent Activity</p>
                  <div className="space-y-2">
                    {dashboardStats!.recent_activity.slice(0, 5).map(act => (
                      <div key={`${act.type}-${act.id}`} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', act.type === 'payment' ? 'bg-emerald-500' : 'bg-primary')} />
                          <span className="text-muted-foreground">{act.description}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {act.amount !== undefined && <span className="font-semibold text-emerald-600">{amountToDisplay(act.amount)}</span>}
                          {act.timestamp && <span className="text-xs text-muted-foreground">{new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {[
                  { label: 'Schedule Appointment', icon: Calendar, color: 'bg-primary' },
                  { label: 'Add New Patient', icon: Users, color: 'bg-brand-teal' },
                  { label: 'Generate Report', icon: BarChart3, color: 'bg-brand-navy', action: () => setActiveTab('reports') },
                  { label: 'View All Clinics', icon: Building2, color: 'bg-purple-500' },
                ].map(action => (
                  <button key={action.label} onClick={action.action}
                    className={cn('w-full flex items-center gap-3 p-4 rounded-lg text-white font-medium text-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 transform', action.color)}>
                    <action.icon size={18} />
                    {action.label}
                  </button>
                ))}
              </div>
              {revenueReport && revenueReport.total_discounts > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Discounts Given</span>
                    <span className="font-semibold text-amber-600">{amountToDisplay(revenueReport.total_discounts)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ────────────────── REPORTS ────────────────── */}
        <TabsContent value="reports" className="space-y-6 mt-0">
          {/* Report Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex gap-2">
              <Input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-40" />
              <Input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-40" />
            </div>
            <button onClick={handlePrintReport} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors ml-auto">
              <Printer size={16} /> Print Report
            </button>
          </div>

          {/* Live Summary Metrics — pulled from live API data */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Revenue', value: amountToDisplay(revenueReport?.total_invoiced ?? 0), color: 'text-emerald-600' },
              { label: 'Collected', value: amountToDisplay(revenueReport?.total_collected ?? 0), color: 'text-emerald-600' },
              { label: 'Pending', value: amountToDisplay(revenueReport?.total_pending ?? 0), color: 'text-amber-600' },
              { label: 'Patients', value: (patientReport?.total_active ?? 0).toLocaleString(), color: 'text-primary' },
              { label: 'Appointments', value: (appointmentReport?.total_scheduled ?? 0).toLocaleString(), color: 'text-primary' },
              { label: 'Completion', value: appointmentReport?.total_scheduled ? `${((( appointmentReport.completed) / appointmentReport.total_scheduled) * 100).toFixed(0)}%` : 'N/A', color: 'text-secondary' },
            ].map(metric => (
              <div key={metric.label} className="card-elevated p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <p className={cn('text-xl font-bold font-display', metric.color)}>{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground mb-4">Monthly performance from live data</p>
              {trendChartData.length === 0 ? <EmptyState message="No trend data available." /> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" {...axisProps} />
                      <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...chartStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                      <Line type="monotone" dataKey="revenue" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Top Services by Revenue</h3>
              <p className="text-sm text-muted-foreground mb-4">Highest revenue-generating services in period</p>
              {serviceDistribution.length === 0 ? <EmptyState message="No service data available." /> : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceDistribution.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" {...axisProps} width={110} />
                      <Tooltip {...chartStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="totalRevenue" fill={COLORS[0]} radius={[0, 6, 6, 0]} maxBarSize={32} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Report Templates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Export Templates</h3>
              <div className="flex gap-2">
                {['all', 'financial', 'clinical', 'operational'].map(cat => (
                  <button key={cat} onClick={() => setReportFilterCategory(cat)}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize', reportFilterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredReportTemplates.map(template => (
                <div key={template.id} className="card-elevated p-5 group hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                      <template.icon size={20} className="text-primary group-hover:text-secondary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
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
    </DashboardLayout>
  );
};

export default Dashboard;