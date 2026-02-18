import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp, Users, Calendar, DollarSign, Activity, ArrowUpRight, ArrowDownRight,
  Stethoscope, Building2, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ComposedChart, BarChart,
} from 'recharts';

// ─── Types exactly matching backend response shapes ───────────────────────────

interface TopService {
  service_id: number;
  service_name: string;
  usage_count: number;
  revenue: number; // from dashboard top_services
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
  today_revenue: number;           // cents
  pending_payments: number;        // cents
  active_patients: number;
  recently_active_patients: number;
  total_doctors: number;
  new_leads_today: number;
  appointments_this_week: number;
  revenue_this_month: number;      // cents
  top_services: TopService[];
  recent_activity: RecentActivity[];
}

// revenue_trend item: { year, month, revenue }
interface RevenueTrendItem {
  year: number;
  month: number;
  revenue: number; // cents
}

// appointment_trend item: { year, month, total_appointments, completed_appointments }
interface AppointmentTrendItem {
  year: number;
  month: number;
  total_appointments: number;
  completed_appointments: number;
}

// patient_trend item: { year, month, new_patients }
interface PatientTrendItem {
  year: number;
  month: number;
  new_patients: number;
}

interface MonthlyTrends {
  revenue_trend: RevenueTrendItem[];
  appointment_trend: AppointmentTrendItem[];
  patient_trend: PatientTrendItem[];   // ← key is patient_trend, NOT patient_growth
  period_months: number;
  start_date: string;
  end_date: string;
}

interface TopRevenueService {
  service_id: number;
  service_name: string;
  usage_count: number;
  total_revenue: number; // cents — key is total_revenue, NOT revenue
}

interface RevenueReport {
  period_start: string;
  period_end: string;
  total_invoiced: number;   // cents
  total_collected: number;  // cents
  total_pending: number;    // cents
  total_discounts: number;  // cents
  payment_methods: Record<string, number>; // { method_string: amount_cents }
  daily_breakdown: { date: string; revenue: number }[];
  top_revenue_services: TopRevenueService[];
}

interface AppointmentByDoctor {
  doctor_id: number;
  doctor_name: string;
  total_appointments: number;
  completed: number;
}

interface PeakHour {
  hour: number;             // integer 0–23
  appointment_count: number;
}

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
  peak_hours: PeakHour[];   // top 5 peak hours, ordered by count desc
}

interface PatientReport {
  period_start: string;
  period_end: string;
  new_registrations: number;
  total_active: number;
  total_visits: number;
  average_visits_per_patient: number;
  by_age_group: Record<string, number>; // keys: '0-17','18-30','31-45','46-60','61+'
  by_gender: Record<string, number>;    // keys: gender strings e.g. 'male','female','Unknown'
  top_conditions: unknown[];            // always [] — placeholder in BE
}

interface DailyMetrics {
  metric_date: string;
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  new_patients: number;
  returning_patients: number;
  total_revenue: number;   // cents
  paid_revenue: number;    // cents
  pending_revenue: number; // cents
  ai_leads_captured: number;
  ai_leads_converted: number;
  ai_bookings: number;
  average_wait_time_minutes: number | null;
  average_consultation_time_minutes: number | null;
}

// doctor performance list item
interface DoctorPerformance {
  doctor_id: number;
  doctor_name: string;        // "First Last"
  specialization: string | null;
  total_appointments: number;
  completed_appointments: number;
  completion_rate: number;    // 0–100
  revenue_generated: number;  // cents — NOT total_revenue, NOT total_patients
  average_consultation_time_minutes: number | null;
  patient_satisfaction: null; // always null — placeholder in BE
}

// Appointment from /appointments/today → List[Appointment]
interface TodayAppointment {
  id: number;
  appointment_date: string;
  appointment_time: string;   // "HH:MM:SS"
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

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC', '#4ECDC4'];

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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

  const sub = (days: number) => {
    const d = new Date(now); d.setDate(d.getDate() - days); return toDateStr(d);
  };
  const subM = (m: number) => {
    const d = new Date(now); d.setMonth(d.getMonth() - m); return toDateStr(d);
  };
  const subY = (y: number) => {
    const d = new Date(now); d.setFullYear(d.getFullYear() - y); return toDateStr(d);
  };

  const map: Record<string, { from: string; to: string }> = {
    today:    { from: today,    to: today },
    '7days':  { from: sub(7),   to: today },
    '30days': { from: sub(30),  to: today },
    '3months':{ from: subM(3),  to: today },
    '6months':{ from: subM(6),  to: today },
    '1year':  { from: subY(1),  to: today },
  };
  return map[range] ?? map['6months'];
};

/** Percent change from first to last, formatted as "+12.3%" or "-4.1%" */
const calcPctChange = (arr: number[]): string | null => {
  if (arr.length < 2 || arr[0] === 0) return null;
  const pct = ((arr[arr.length - 1] - arr[0]) / arr[0]) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

const centsToK = (cents: number) =>
  `$${((cents / 100) / 1000).toFixed(1)}K`;

const centsToDisplay = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
};

const formatTime = (timeStr: string) => {
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return timeStr; }
};

const getPatientName = (apt: TodayAppointment) => {
  const p = apt.patient;
  if (!p) return 'N/A';
  return (p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) || 'N/A';
};

const getDoctorName = (apt: TodayAppointment) => {
  const d = apt.doctor;
  if (!d) return 'N/A';
  if (d.user) {
    return (d.user.full_name ?? `${d.user.first_name} ${d.user.last_name}`.trim()) || 'N/A';
  }
  return `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || 'N/A';
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':             return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'in_progress':
    case 'checked_in':            return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'scheduled':
    case 'confirmed':
    case 'pending':               return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cancelled':             return 'bg-red-50 text-red-700 border-red-200';
    case 'no_show':               return 'bg-gray-50 text-gray-700 border-gray-200';
    case 'rescheduled':           return 'bg-purple-50 text-purple-700 border-purple-200';
    default:                      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':                        return <CheckCircle2 size={14} />;
    case 'in_progress': case 'checked_in':  return <Clock size={14} />;
    case 'scheduled': case 'confirmed':
    case 'pending':                          return <AlertCircle size={14} />;
    case 'cancelled': case 'no_show':        return <XCircle size={14} />;
    default:                                 return null;
  }
};

// ─── Empty state component ────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-full min-h-[120px] text-sm text-muted-foreground">
    {message}
  </div>
);

// ─── Main Dashboard Component ─────────────────────────────────────────────────

const Dashboard = () => {
  const [dateRange, setDateRange]       = useState('6months');
  const [activeTab, setActiveTab]       = useState('overview');

  // Raw API state — typed exactly to backend shapes
  const [dashboardStats, setDashboardStats]         = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments]   = useState<TodayAppointment[]>([]);
  const [monthlyTrends, setMonthlyTrends]           = useState<MonthlyTrends | null>(null);
  const [revenueReport, setRevenueReport]           = useState<RevenueReport | null>(null);
  const [appointmentReport, setAppointmentReport]   = useState<AppointmentReport | null>(null);
  const [patientReport, setPatientReport]           = useState<PatientReport | null>(null);
  const [doctorPerformance, setDoctorPerformance]   = useState<DoctorPerformance[]>([]);
  const [dailyMetrics, setDailyMetrics]             = useState<DailyMetrics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getDateRange(dateRange);
      const today = toDateStr(new Date());

      const [
        stats,
        appointments,
        trends,
        revenue,
        apptReport,
        patReport,
        docPerf,
        daily,
      ] = await Promise.all([
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
      // Doctor performance returns a plain list
      setDoctorPerformance(Array.isArray(docPerf) ? docPerf : []);
      setDailyMetrics(daily as DailyMetrics | null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ── Derived data — mapped exactly to real field names ─────────────────────

  /**
   * Monthly trend chart data.
   * revenue_trend: { year, month, revenue }
   * appointment_trend: { year, month, total_appointments, completed_appointments }
   * patient_trend: { year, month, new_patients }   ← patient_trend, NOT patient_growth
   */
  const trendChartData = useMemo(() => {
    if (!monthlyTrends?.revenue_trend?.length) return [];

    return monthlyTrends.revenue_trend.map((r, idx) => ({
      label:        `${MONTH_NAMES[r.month]} '${String(r.year).slice(2)}`,
      revenue:      (r.revenue ?? 0) / 100,                                         // dollars
      appointments: monthlyTrends.appointment_trend?.[idx]?.total_appointments ?? 0, // total_appointments
      newPatients:  monthlyTrends.patient_trend?.[idx]?.new_patients ?? 0,           // patient_trend / new_patients
    }));
  }, [monthlyTrends]);

  /** Period-over-period changes computed from trend arrays */
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

  /**
   * Service pie + bar data.
   * top_revenue_services: { service_id, service_name, usage_count, total_revenue }
   * Key is total_revenue (cents), NOT revenue.
   */
  const serviceDistribution = useMemo(() => {
    if (!revenueReport?.top_revenue_services?.length) return [];
    const total = revenueReport.total_invoiced || 1;
    return revenueReport.top_revenue_services.map(s => ({
      name:         s.service_name,
      count:        s.usage_count,
      totalRevenue: (s.total_revenue ?? 0) / 100,   // dollars
      pct:          Number(((s.total_revenue / total) * 100).toFixed(1)),
    }));
  }, [revenueReport]);

  /**
   * Patient demographics.
   * by_age_group keys: '0-17','18-30','31-45','46-60','61+'
   * by_gender keys: gender strings (e.g. 'male','female','Unknown','other')
   */
  const patientDemographics = useMemo(() => {
    if (!patientReport?.by_age_group) return [];

    const byGender = patientReport.by_gender ?? {};
    // Sum all gender values to compute ratio
    const totalGender = Object.values(byGender).reduce((a, b) => a + b, 0) || 1;
    // Find male-like keys (case-insensitive)
    const maleTotal = Object.entries(byGender)
      .filter(([k]) => k.toLowerCase().includes('male') && !k.toLowerCase().includes('female'))
      .reduce((a, [, v]) => a + v, 0);
    const maleRatio = maleTotal / totalGender;

    return Object.entries(patientReport.by_age_group).map(([age, total]) => ({
      age,
      male:   Math.round((total as number) * maleRatio),
      female: Math.round((total as number) * (1 - maleRatio)),
      total:  total as number,
    }));
  }, [patientReport]);

  /**
   * Gender breakdown for its own chart.
   */
  const genderData = useMemo(() => {
    if (!patientReport?.by_gender) return [];
    return Object.entries(patientReport.by_gender)
      .filter(([, count]) => count > 0)
      .map(([gender, count]) => ({
        name:  gender.charAt(0).toUpperCase() + gender.slice(1),
        value: count as number,
      }));
  }, [patientReport]);

  /**
   * Peak hours chart.
   * AppointmentReport.peak_hours: [{ hour: int, appointment_count: int }]
   * Only top 5 returned (ordered by count desc). Sorted by hour for display.
   */
  const peakHoursData = useMemo(() => {
    if (!appointmentReport?.peak_hours?.length) return [];
    return [...appointmentReport.peak_hours]
      .sort((a, b) => a.hour - b.hour)
      .map(h => ({
        hour:  formatHour(h.hour),
        count: h.appointment_count,
      }));
  }, [appointmentReport]);

  /**
   * Daily metrics summary card values.
   * Uses DailyMetrics if available, falls back to dashboard stats for today's numbers.
   */
  const todayMetrics = useMemo(() => {
    if (dailyMetrics) {
      return {
        totalAppointments:     dailyMetrics.total_appointments,
        completedAppointments: dailyMetrics.completed_appointments,
        cancelledAppointments: dailyMetrics.cancelled_appointments,
        noShowAppointments:    dailyMetrics.no_show_appointments,
        newPatients:           dailyMetrics.new_patients,
        returningPatients:     dailyMetrics.returning_patients,
        paidRevenue:           dailyMetrics.paid_revenue,        // cents
        pendingRevenue:        dailyMetrics.pending_revenue,     // cents
      };
    }
    // Fallback to dashboard stats
    return {
      totalAppointments:     dashboardStats?.today_appointments ?? 0,
      completedAppointments: null,
      cancelledAppointments: null,
      noShowAppointments:    null,
      newPatients:           null,
      returningPatients:     null,
      paidRevenue:           dashboardStats?.today_revenue ?? 0,
      pendingRevenue:        null,
    };
  }, [dailyMetrics, dashboardStats]);

  /**
   * Radar chart: doctor comparison.
   * Uses: revenue_generated (not total_revenue), total_appointments, completed_appointments, completion_rate
   * No total_patients or average_rating fields exist.
   */
  const radarData = useMemo(() => {
    if (!doctorPerformance.length) return [];
    const top3 = doctorPerformance.slice(0, 3);

    const maxRevenue     = Math.max(...doctorPerformance.map(d => d.revenue_generated), 1);
    const maxAppointments= Math.max(...doctorPerformance.map(d => d.total_appointments), 1);

    return ['Revenue', 'Appointments', 'Completion Rate'].map(metric => {
      const row: Record<string, string | number> = { metric };
      top3.forEach(doc => {
        // Use last name as radar key, handle identical last names
        const key = doc.doctor_name.split(' ').pop() ?? `Dr${doc.doctor_id}`;
        switch (metric) {
          case 'Revenue':
            row[key] = Math.round((doc.revenue_generated / maxRevenue) * 100);
            break;
          case 'Appointments':
            row[key] = Math.round((doc.total_appointments / maxAppointments) * 100);
            break;
          case 'Completion Rate':
            row[key] = Math.round(doc.completion_rate); // already 0–100
            break;
        }
      });
      return row;
    });
  }, [doctorPerformance]);

  /**
   * Operational efficiency KPIs — all from real API fields.
   */
  const efficiencyKpis = useMemo(() => {
    const totalScheduled = appointmentReport?.total_scheduled ?? 0;
    const completed      = appointmentReport?.completed       ?? 0;
    const cancelled      = appointmentReport?.cancelled       ?? 0;
    const noShows        = appointmentReport?.no_shows        ?? 0;
    const totalInvoiced  = revenueReport?.total_invoiced      ?? 0;
    const totalCollected = revenueReport?.total_collected     ?? 0;

    return [
      {
        label:  'Completion Rate',
        metric: totalScheduled ? `${((completed / totalScheduled) * 100).toFixed(0)}%` : 'N/A',
        pct:    totalScheduled ? (completed / totalScheduled) * 100 : 0,
        color:  COLORS[1],
      },
      {
        label:  'Revenue Collection Rate',
        metric: totalInvoiced  ? `${((totalCollected / totalInvoiced) * 100).toFixed(0)}%` : 'N/A',
        pct:    totalInvoiced  ? (totalCollected / totalInvoiced) * 100 : 0,
        color:  COLORS[2],
      },
      {
        label:  'Cancellation Rate',
        metric: totalScheduled ? `${((cancelled / totalScheduled) * 100).toFixed(0)}%` : 'N/A',
        pct:    totalScheduled ? (cancelled / totalScheduled) * 100 : 0,
        color:  '#EF4444',
      },
      {
        label:  'No-Show Rate',
        metric: totalScheduled ? `${((noShows / totalScheduled) * 100).toFixed(0)}%` : 'N/A',
        pct:    totalScheduled ? (noShows / totalScheduled) * 100 : 0,
        color:  '#F59E0B',
      },
    ];
  }, [appointmentReport, revenueReport]);

  /**
   * System alerts — derived entirely from real API data, no fake text.
   */
  const systemAlerts = useMemo(() => {
    const alerts: { type: 'warning' | 'info' | 'success' | 'alert'; message: string }[] = [];

    const cancelled = appointmentReport?.cancelled ?? 0;
    if (cancelled > 0)
      alerts.push({ type: 'warning', message: `${cancelled} cancelled appointment${cancelled !== 1 ? 's' : ''} in the selected period` });

    const noShows = appointmentReport?.no_shows ?? 0;
    if (noShows > 0)
      alerts.push({ type: 'warning', message: `${noShows} no-show appointment${noShows !== 1 ? 's' : ''} in the selected period` });

    const newReg = patientReport?.new_registrations ?? 0;
    if (newReg > 0)
      alerts.push({ type: 'info', message: `${newReg} new patient${newReg !== 1 ? 's' : ''} registered in the selected period` });

    const pending = revenueReport?.total_pending ?? 0;
    if (pending > 0)
      alerts.push({ type: 'alert', message: `${centsToDisplay(pending)} in outstanding pending payments` });

    const invoiced  = revenueReport?.total_invoiced  ?? 0;
    const collected = revenueReport?.total_collected ?? 0;
    if (invoiced > 0 && collected > 0 && collected >= invoiced)
      alerts.push({ type: 'success', message: 'All invoiced revenue has been collected this period' });

    const leads = dashboardStats?.new_leads_today ?? 0;
    if (leads > 0)
      alerts.push({ type: 'info', message: `${leads} new AI lead${leads !== 1 ? 's' : ''} captured today` });

    return alerts;
  }, [appointmentReport, patientReport, revenueReport, dashboardStats]);

  /**
   * KPI cards — every value from a real API field.
   * revenue_this_month (cents) / active_patients / recently_active_patients /
   * appointments_this_week / total_doctors
   * No avg satisfaction — doctor.patient_satisfaction is always null in BE.
   */
  const kpiCards = useMemo(() => [
    {
      title:    'Monthly Revenue',
      value:    centsToK(dashboardStats?.revenue_this_month ?? 0),
      change:   revenuePctChange,
      icon:     DollarSign,
      subtitle: 'this calendar month',
    },
    {
      title:    'Active Patients',
      value:    (dashboardStats?.active_patients ?? 0).toLocaleString(),
      change:   null as string | null,
      icon:     Users,
      subtitle: 'total registered & active',
    },
    {
      title:    'Active (90d)',
      value:    (dashboardStats?.recently_active_patients ?? 0).toLocaleString(),
      change:   patientPctChange,
      icon:     Activity,
      subtitle: 'visited in last 90 days',
    },
    {
      title:    "This Week's Appts",
      value:    (dashboardStats?.appointments_this_week ?? 0).toLocaleString(),
      change:   apptPctChange,
      icon:     Calendar,
      subtitle: 'scheduled this week',
    },
    {
      title:    'Active Doctors',
      value:    (dashboardStats?.total_doctors ?? 0).toString(),
      change:   null as string | null,
      icon:     Stethoscope,
      subtitle: 'across all clinics',
    },
    {
      title:    "Today's Revenue",
      value:    centsToK(dashboardStats?.today_revenue ?? 0),
      change:   null as string | null,
      icon:     TrendingUp,
      subtitle: 'collected today',
    },
  ], [dashboardStats, revenuePctChange, apptPctChange, patientPctChange]);

  // ── Today appointments rows ────────────────────────────────────────────────

  const appointmentRows = useMemo(() =>
    todayAppointments.slice(0, 6).map(apt => ({
      id:      apt.id,
      patient: getPatientName(apt),
      doctor:  getDoctorName(apt),
      time:    formatTime(apt.appointment_time),
      status:  apt.status,
      type:    apt.appointment_type ?? '—',
    })),
  [todayAppointments]);

  // ── Payment methods chart data ────────────────────────────────────────────

  const paymentMethodsData = useMemo(() => {
    if (!revenueReport?.payment_methods) return [];
    return Object.entries(revenueReport.payment_methods)
      .filter(([, v]) => v > 0)
      .map(([method, amount]) => ({
        name:  method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: (amount as number) / 100,
      }));
  }, [revenueReport]);

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout title="Healthcare Analytics Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data…</p>
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
            <p className="text-muted-foreground mb-4 text-sm max-w-md">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Subcomponents ─────────────────────────────────────────────────────────

  const KpiChange = ({ value }: { value: string | null }) => {
    if (!value) return null;
    const isPos = !value.startsWith('-');
    return (
      <div className="flex items-center gap-1">
        {isPos
          ? <ArrowUpRight size={14} className="text-emerald-500" />
          : <ArrowDownRight size={14} className="text-red-500" />}
        <span className={cn('text-xs font-semibold', isPos ? 'text-emerald-600' : 'text-red-600')}>
          {value}
        </span>
      </div>
    );
  };

  const chartStyle = {
    contentStyle: {
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  };

  const axisProps = {
    axisLine: false as const,
    tickLine: false as const,
    tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout
      title="Healthcare Analytics Dashboard"
      subtitle="Comprehensive insights across all your clinics and operations"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
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

        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* ────────────────── OVERVIEW ────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-0">

          {/* Revenue trend + service distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 card-elevated p-6">
              <h3 className="font-display font-semibold text-lg">Revenue &amp; Appointment Trend</h3>
              <p className="text-sm text-muted-foreground mb-6">Monthly data — last 6 months</p>
              {trendChartData.length === 0
                ? <EmptyState message="No trend data for the selected period." />
                : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" {...axisProps} />
                        <YAxis
                          yAxisId="left" {...axisProps}
                          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <YAxis yAxisId="right" orientation="right" {...axisProps} />
                        <Tooltip
                          {...chartStyle}
                          formatter={(v: number, name: string) =>
                            name === 'Revenue' ? [`$${v.toLocaleString()}`, name] : [v, name]
                          }
                        />
                        <Area
                          yAxisId="left" type="monotone" dataKey="revenue"
                          stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.12}
                          strokeWidth={2} name="Revenue"
                        />
                        <Line
                          yAxisId="right" type="monotone" dataKey="appointments"
                          stroke="#EF4444" strokeWidth={2}
                          dot={{ fill: '#EF4444', r: 4 }} name="Appointments"
                        />
                        <Line
                          yAxisId="right" type="monotone" dataKey="newPatients"
                          stroke={COLORS[1]} strokeWidth={2}
                          dot={{ fill: COLORS[1], r: 4 }} name="New Patients"
                          strokeDasharray="4 4"
                        />
                        <Legend />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )
              }
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Service Revenue Split</h3>
              <p className="text-sm text-muted-foreground mb-4">By total_revenue (top services)</p>
              {serviceDistribution.length === 0
                ? <EmptyState message="No service data." />
                : (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceDistribution} cx="50%" cy="50%"
                            innerRadius={38} outerRadius={66}
                            paddingAngle={4} dataKey="pct"
                          >
                            {serviceDistribution.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            {...chartStyle}
                            formatter={(v: number) => [`${v}%`, 'Share']}
                          />
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
                )
              }
            </div>
          </div>

          {/* Today's appointments + peak hours */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-lg">Today's Appointments</h3>
                  <p className="text-sm text-muted-foreground">
                    {todayAppointments.length > 0
                      ? `${todayAppointments.length} total — showing first ${appointmentRows.length}`
                      : 'No appointments today'}
                  </p>
                </div>
                {/* Summary chips from DailyMetrics if available */}
                {dailyMetrics && (
                  <div className="flex gap-2 flex-wrap justify-end">
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      ✓ {dailyMetrics.completed_appointments} done
                    </span>
                    <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                      {dailyMetrics.cancelled_appointments} cancelled
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200">
                      {dailyMetrics.no_show_appointments} no-show
                    </span>
                  </div>
                )}
              </div>
              {appointmentRows.length === 0
                ? <EmptyState message="No appointments found for today." />
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {['Patient', 'Doctor', 'Time', 'Type', 'Status'].map(h => (
                            <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">
                              {h}
                            </th>
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
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                                getStatusColor(apt.status)
                              )}>
                                {getStatusIcon(apt.status)}
                                {apt.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>

            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Peak Hours</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Top 5 busiest hours (period)
              </p>
              {peakHoursData.length === 0
                ? <EmptyState message="No peak hour data." />
                : (
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
                )
              }

              {/* Today's patient split from DailyMetrics */}
              {dailyMetrics && (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{dailyMetrics.new_patients}</p>
                    <p className="text-xs text-muted-foreground">New patients today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{dailyMetrics.returning_patients}</p>
                    <p className="text-xs text-muted-foreground">Returning today</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top services from dashboard stats */}
          {(dashboardStats?.top_services?.length ?? 0) > 0 && (
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">
                Top Services (Last 30 Days)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {dashboardStats!.top_services.map((s, i) => (
                  <div key={s.service_id} className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                      {i + 1}
                    </div>
                    <p className="text-sm font-semibold truncate">{s.service_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.usage_count} uses</p>
                    <p className="text-xs font-semibold text-primary mt-0.5">{centsToDisplay(s.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ────────────────── ANALYTICS ────────────────── */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Doctor performance table */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Doctor Performance</h3>
              <p className="text-sm text-muted-foreground mb-4">Revenue &amp; completion (period)</p>
              {doctorPerformance.length === 0
                ? <EmptyState message="No doctor performance data." />
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {['Doctor', 'Specialty', 'Appts', 'Completed', 'Rate', 'Revenue'].map(h => (
                            <th key={h} className={cn(
                              'py-3 text-xs font-semibold text-muted-foreground uppercase',
                              h === 'Doctor' || h === 'Specialty' ? 'text-left' : 'text-right'
                            )}>{h}</th>
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
                            <td className="py-3 text-muted-foreground text-xs">
                              {doc.specialization ?? '—'}
                            </td>
                            <td className="py-3 text-right">{doc.total_appointments}</td>
                            <td className="py-3 text-right">{doc.completed_appointments}</td>
                            <td className="py-3 text-right">
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-semibold',
                                doc.completion_rate >= 80
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : doc.completion_rate >= 60
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                              )}>
                                {doc.completion_rate.toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-3 text-right font-semibold">
                              {centsToK(doc.revenue_generated)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>

            {/* Radar — revenue, appointments, completion_rate */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Doctor Comparison</h3>
              <p className="text-sm text-muted-foreground mb-4">Top 3 doctors — normalised 0–100</p>
              {radarData.length === 0
                ? <EmptyState message="No data for radar chart." />
                : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                        {doctorPerformance.slice(0, 3).map((doc, i) => {
                          const key = doc.doctor_name.split(' ').pop() ?? `Dr${doc.doctor_id}`;
                          return (
                            <Radar key={doc.doctor_id} name={doc.doctor_name}
                              dataKey={key} stroke={COLORS[i]} fill={COLORS[i]}
                              fillOpacity={0.18 - i * 0.04} strokeWidth={2}
                            />
                          );
                        })}
                        <Legend />
                        <Tooltip {...chartStyle} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Patient demographics */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Patient Demographics</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Age groups: 0-17 / 18-30 / 31-45 / 46-60 / 61+
              </p>
              {patientDemographics.length === 0
                ? <EmptyState message="No demographic data." />
                : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={patientDemographics} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" {...axisProps} />
                        <YAxis dataKey="age" type="category" {...axisProps} width={55} />
                        <Tooltip {...chartStyle} />
                        <Bar dataKey="male"   fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Male"   stackId="a" />
                        <Bar dataKey="female" fill={COLORS[1]} radius={[0, 4, 4, 0]} name="Female" stackId="a" />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              }

              {/* Gender summary from by_gender */}
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
                    <span className="text-sm text-muted-foreground">Total visits:</span>
                    <span className="text-sm font-semibold">{(patientReport?.total_visits ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Avg visits/patient:</span>
                    <span className="text-sm font-semibold">{patientReport?.average_visits_per_patient?.toFixed(1) ?? '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Revenue by service — bar chart with real total_revenue values */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Revenue by Service</h3>
              <p className="text-sm text-muted-foreground mb-4">
                From top_revenue_services — total_revenue field
              </p>
              {serviceDistribution.length === 0
                ? <EmptyState message="No service revenue data." />
                : (
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
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${s.pct}%`, backgroundColor: COLORS[i] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }

              {/* Payment methods breakdown */}
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

          {/* Appointment status totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Scheduled', value: appointmentReport?.total_scheduled ?? 0, color: 'bg-primary/10 text-primary' },
              { label: 'Completed',       value: appointmentReport?.completed        ?? 0, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Cancelled',       value: appointmentReport?.cancelled        ?? 0, color: 'bg-red-50 text-red-700' },
              { label: 'No-Shows',        value: appointmentReport?.no_shows         ?? 0, color: 'bg-gray-50 text-gray-700' },
            ].map(item => (
              <div key={item.label} className={cn('card-elevated p-5 text-center rounded-xl border', item.color.replace('text-', 'border-').split(' ')[0])}>
                <p className={cn('text-3xl font-bold font-display', item.color.split(' ')[1])}>{item.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Efficiency KPIs */}
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
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(Math.max(item.pct, 0), 100)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue summary */}
              {revenueReport && (
                <div className="mt-6 pt-5 border-t border-border grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{centsToK(revenueReport.total_invoiced)}</p>
                    <p className="text-xs text-muted-foreground">Invoiced</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">{centsToK(revenueReport.total_collected)}</p>
                    <p className="text-xs text-muted-foreground">Collected</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">{centsToK(revenueReport.total_pending)}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              )}
            </div>

            {/* Appointment type breakdown from by_type */}
            <div className="card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-1">Appointments by Type &amp; Status</h3>
              <p className="text-sm text-muted-foreground mb-4">From by_type and by_status fields</p>

              {Object.keys(appointmentReport?.by_type ?? {}).length === 0 &&
               Object.keys(appointmentReport?.by_status ?? {}).length === 0
                ? <EmptyState message="No breakdown data available." />
                : (
                  <div className="space-y-4">
                    {/* By type */}
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

                    {/* By status */}
                    {Object.entries(appointmentReport?.by_status ?? {}).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 mt-4">By Status</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(appointmentReport!.by_status).map(([s, count]) => (
                            <div key={s} className={cn(
                              'flex items-center justify-between p-3 rounded-lg border',
                              getStatusColor(s.toLowerCase())
                            )}>
                              <span className="text-xs capitalize">{s.replace(/_/g, ' ')}</span>
                              <span className="text-sm font-bold">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rescheduled from AppointmentReport */}
                    {(appointmentReport?.rescheduled ?? 0) > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <span className="text-xs text-purple-700">Rescheduled</span>
                        <span className="text-sm font-bold text-purple-700">{appointmentReport!.rescheduled}</span>
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          </div>

          {/* Alerts + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-elevated p-6">
              <h3 className="font-display font-semibold text-lg mb-4">System Alerts</h3>
              {systemAlerts.length === 0
                ? <EmptyState message="No alerts for the selected period." />
                : (
                  <div className="space-y-3">
                    {systemAlerts.map((alert, i) => (
                      <div key={i} className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border',
                        alert.type === 'warning' && 'bg-amber-50/50 border-amber-200',
                        alert.type === 'info'    && 'bg-blue-50/50 border-blue-200',
                        alert.type === 'success' && 'bg-emerald-50/50 border-emerald-200',
                        alert.type === 'alert'   && 'bg-red-50/50 border-red-200'
                      )}>
                        <AlertCircle size={18} className={cn(
                          alert.type === 'warning' && 'text-amber-600',
                          alert.type === 'info'    && 'text-blue-600',
                          alert.type === 'success' && 'text-emerald-600',
                          alert.type === 'alert'   && 'text-red-600'
                        )} />
                        <p className="text-sm font-medium">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )
              }

              {/* Recent activity from dashboard stats */}
              {(dashboardStats?.recent_activity?.length ?? 0) > 0 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-semibold mb-3">Recent Activity</p>
                  <div className="space-y-2">
                    {dashboardStats!.recent_activity.slice(0, 5).map(act => (
                      <div key={`${act.type}-${act.id}`} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            act.type === 'payment' ? 'bg-emerald-500' : 'bg-primary'
                          )} />
                          <span className="text-muted-foreground">{act.description}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {act.amount !== undefined && (
                            <span className="font-semibold text-emerald-600">{centsToDisplay(act.amount)}</span>
                          )}
                          {act.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(act.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
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
                  { label: 'Schedule Appointment', icon: Calendar,  color: 'bg-primary' },
                  { label: 'Add New Patient',       icon: Users,     color: 'bg-brand-teal' },
                  { label: 'Generate Report',       icon: BarChart3, color: 'bg-brand-navy' },
                  { label: 'View All Clinics',      icon: Building2, color: 'bg-purple-500' },
                ].map(action => (
                  <button
                    key={action.label}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-lg text-white font-medium text-sm',
                      'hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 transform',
                      action.color
                    )}
                  >
                    <action.icon size={18} />
                    {action.label}
                  </button>
                ))}
              </div>

              {/* Discount summary */}
              {revenueReport && revenueReport.total_discounts > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Discounts Given</span>
                    <span className="font-semibold text-amber-600">{centsToK(revenueReport.total_discounts)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Dashboard;