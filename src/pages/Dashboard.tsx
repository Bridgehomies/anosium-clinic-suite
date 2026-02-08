import { useState, useMemo } from 'react';
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

// Data structures
const clinicPerformance = [
  { clinic: 'Downtown Clinic', revenue: 198420, patients: 1240, appointments: 3200, satisfaction: 4.8, doctors: 15 },
  { clinic: 'Westside Medical', revenue: 145300, patients: 890, appointments: 2100, satisfaction: 4.6, doctors: 12 },
  { clinic: 'Northpark Health', revenue: 112800, patients: 650, appointments: 1800, satisfaction: 4.7, doctors: 10 },
  { clinic: 'Eastview Center', revenue: 89500, patients: 520, appointments: 1400, satisfaction: 4.5, doctors: 11 },
];

const monthlyTrend = [
  { month: 'Jul', downtown: 152000, westside: 118000, northpark: 92000, eastview: 71000, appointments: 280, patients: 820 },
  { month: 'Aug', downtown: 161000, westside: 125000, northpark: 98000, eastview: 75000, appointments: 295, patients: 865 },
  { month: 'Sep', downtown: 158000, westside: 122000, northpark: 95000, eastview: 78000, appointments: 288, patients: 842 },
  { month: 'Oct', downtown: 175000, westside: 132000, northpark: 101000, eastview: 82000, appointments: 312, patients: 920 },
  { month: 'Nov', downtown: 182000, westside: 138000, northpark: 108000, eastview: 85000, appointments: 328, patients: 975 },
  { month: 'Dec', downtown: 198000, westside: 145000, northpark: 113000, eastview: 90000, appointments: 342, patients: 1015 },
];

const serviceDistribution = [
  { name: 'Consultations', value: 35, count: 2240 },
  { name: 'Surgeries', value: 22, count: 1408 },
  { name: 'Lab Tests', value: 20, count: 1280 },
  { name: 'Imaging', value: 13, count: 832 },
  { name: 'Therapy', value: 10, count: 640 },
];

const patientDemographics = [
  { age: '0-18', male: 120, female: 135, total: 255 },
  { age: '19-35', male: 340, female: 380, total: 720 },
  { age: '36-50', male: 280, female: 310, total: 590 },
  { age: '51-65', male: 210, female: 245, total: 455 },
  { age: '65+', male: 150, female: 180, total: 330 },
];

const appointmentsByDay = [
  { day: 'Mon', completed: 42, cancelled: 5, noShow: 3, pending: 8 },
  { day: 'Tue', completed: 48, cancelled: 4, noShow: 2, pending: 6 },
  { day: 'Wed', completed: 38, cancelled: 6, noShow: 4, pending: 7 },
  { day: 'Thu', completed: 52, cancelled: 3, noShow: 2, pending: 5 },
  { day: 'Fri', completed: 56, cancelled: 4, noShow: 3, pending: 9 },
  { day: 'Sat', completed: 28, cancelled: 2, noShow: 1, pending: 4 },
  { day: 'Sun', completed: 18, cancelled: 1, noShow: 1, pending: 2 },
];

const radarData = [
  { metric: 'Revenue', downtown: 95, westside: 78, northpark: 62, eastview: 48 },
  { metric: 'Patients', downtown: 90, westside: 72, northpark: 55, eastview: 42 },
  { metric: 'Satisfaction', downtown: 96, westside: 92, northpark: 94, eastview: 90 },
  { metric: 'Efficiency', downtown: 88, westside: 82, northpark: 78, eastview: 75 },
  { metric: 'Growth', downtown: 85, westside: 88, northpark: 72, eastview: 68 },
  { metric: 'Retention', downtown: 92, westside: 85, northpark: 80, eastview: 76 },
];

const recentAppointments = [
  { id: 1, patient: 'Sarah Johnson', doctor: 'Dr. Smith', time: '09:00 AM', status: 'completed', clinic: 'Downtown Clinic' },
  { id: 2, patient: 'Michael Chen', doctor: 'Dr. Williams', time: '10:30 AM', status: 'in-progress', clinic: 'Westside Medical' },
  { id: 3, patient: 'Emily Davis', doctor: 'Dr. Brown', time: '11:00 AM', status: 'pending', clinic: 'Downtown Clinic' },
  { id: 4, patient: 'James Wilson', doctor: 'Dr. Garcia', time: '02:00 PM', status: 'pending', clinic: 'Northpark Health' },
  { id: 5, patient: 'Lisa Anderson', doctor: 'Dr. Martinez', time: '03:30 PM', status: 'cancelled', clinic: 'Eastview Center' },
];

const hourlyAppointments = [
  { hour: '8 AM', count: 12 }, { hour: '9 AM', count: 18 }, { hour: '10 AM', count: 24 },
  { hour: '11 AM', count: 22 }, { hour: '12 PM', count: 15 }, { hour: '1 PM', count: 14 },
  { hour: '2 PM', count: 26 }, { hour: '3 PM', count: 28 }, { hour: '4 PM', count: 20 },
  { hour: '5 PM', count: 16 }, { hour: '6 PM', count: 10 },
];

const Dashboard = () => {
  const [dateRange, setDateRange] = useState('6months');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Memoized calculations for performance
  const metrics = useMemo(() => {
    const totalRevenue = clinicPerformance.reduce((s, c) => s + c.revenue, 0);
    const totalPatients = clinicPerformance.reduce((s, c) => s + c.patients, 0);
    const totalAppointments = clinicPerformance.reduce((s, c) => s + c.appointments, 0);
    const totalDoctors = clinicPerformance.reduce((s, c) => s + c.doctors, 0);
    const avgSatisfaction = (clinicPerformance.reduce((s, c) => s + c.satisfaction, 0) / clinicPerformance.length).toFixed(1);
    
    return { totalRevenue, totalPatients, totalAppointments, totalDoctors, avgSatisfaction };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} />;
      case 'in-progress': return <Clock size={14} />;
      case 'pending': return <AlertCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return null;
    }
  };

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
            {clinicPerformance.map(c => (
              <SelectItem key={c.clinic} value={c.clinic}>{c.clinic}</SelectItem>
            ))}
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
            subtitle: 'total bookings'
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
                  <p className="text-sm text-muted-foreground">Multi-clinic revenue comparison over time</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyTrend}>
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
                      tickFormatter={(v) => `$${v / 1000}k`} 
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
                      formatter={(v: number) => [`$${v.toLocaleString()}`, '']} 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="downtown" 
                      stroke={COLORS[0]} 
                      fill={COLORS[0]} 
                      fillOpacity={0.1} 
                      strokeWidth={2} 
                      name="Downtown" 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="westside" 
                      stroke={COLORS[1]} 
                      fill={COLORS[1]} 
                      fillOpacity={0.1} 
                      strokeWidth={2} 
                      name="Westside" 
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
              <p className="text-sm text-muted-foreground mb-4">Across all clinics</p>
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
                {serviceDistribution.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[i] }} 
                      />
                      <span className="text-muted-foreground">{s.name}</span>
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
                  <h3 className="font-display font-semibold text-lg">Recent Appointments</h3>
                  <p className="text-sm text-muted-foreground">Latest patient visits across clinics</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Patient</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Doctor</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Clinic</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Time</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 font-medium">{apt.patient}</td>
                        <td className="py-3 px-2 text-muted-foreground">{apt.doctor}</td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">{apt.clinic}</td>
                        <td className="py-3 px-2 text-muted-foreground">{apt.time}</td>
                        <td className="py-3 px-2">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                            getStatusColor(apt.status)
                          )}>
                            {getStatusIcon(apt.status)}
                            {apt.status}
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
                  <h3 className="font-display font-semibold text-lg">Clinic Performance Comparison</h3>
                  <p className="text-sm text-muted-foreground">Key metrics across all locations</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase">Clinic</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Revenue</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Patients</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Doctors</th>
                      <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clinicPerformance.map((clinic, i) => (
                      <tr key={clinic.clinic} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[i] }} 
                            />
                            <span className="font-medium">{clinic.clinic}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 font-semibold">
                          ${(clinic.revenue / 1000).toFixed(0)}K
                        </td>
                        <td className="text-right py-3">{clinic.patients.toLocaleString()}</td>
                        <td className="text-right py-3">{clinic.doctors}</td>
                        <td className="text-right py-3">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            {clinic.satisfaction}
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
              <p className="text-sm text-muted-foreground mb-4">Comparative analysis radar</p>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar 
                      name="Downtown" 
                      dataKey="downtown" 
                      stroke={COLORS[0]} 
                      fill={COLORS[0]} 
                      fillOpacity={0.2} 
                      strokeWidth={2} 
                    />
                    <Radar 
                      name="Westside" 
                      dataKey="westside" 
                      stroke={COLORS[1]} 
                      fill={COLORS[1]} 
                      fillOpacity={0.15} 
                      strokeWidth={2} 
                    />
                    <Radar 
                      name="Northpark" 
                      dataKey="northpark" 
                      stroke={COLORS[2]} 
                      fill={COLORS[2]} 
                      fillOpacity={0.1} 
                      strokeWidth={2} 
                    />
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
              <p className="text-sm text-muted-foreground mb-4">Age & gender distribution analysis</p>
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
              <p className="text-sm text-muted-foreground mb-4">Breakdown of income sources</p>
              <div className="space-y-4 mt-6">
                {serviceDistribution.map((service, i) => {
                  const revenueEstimate = (service.value * metrics.totalRevenue) / 100;
                  return (
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
                            ${(revenueEstimate / 1000).toFixed(0)}K
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
                  );
                })}
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
              <p className="text-sm text-muted-foreground mb-4">Completion rates & cancellations by day</p>
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
                    value: 84, 
                    total: 100, 
                    color: COLORS[1],
                    metric: '84%'
                  },
                  { 
                    label: 'Doctor Utilization', 
                    value: 78, 
                    total: 100, 
                    color: COLORS[2],
                    metric: '78%'
                  },
                  { 
                    label: 'Patient Retention', 
                    value: 92, 
                    total: 100, 
                    color: COLORS[0],
                    metric: '92%'
                  },
                  { 
                    label: 'Revenue per Patient', 
                    value: 175, 
                    total: 200, 
                    color: COLORS[3],
                    metric: '$175'
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
                  { type: 'warning', message: 'High cancellation rate at Westside Medical (12%)', time: '10 mins ago' },
                  { type: 'info', message: 'New doctor onboarding at Downtown Clinic', time: '1 hour ago' },
                  { type: 'success', message: 'Revenue target achieved for December', time: '2 hours ago' },
                  { type: 'alert', message: 'Low inventory alert for Lab Tests supplies', time: '3 hours ago' },
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