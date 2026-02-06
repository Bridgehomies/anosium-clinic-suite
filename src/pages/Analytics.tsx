import { useState } from 'react';
import { TrendingUp, Users, Calendar, DollarSign, Activity, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';

const COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC', '#4ECDC4'];

// Cross-clinic comparison data
const clinicPerformance = [
  { clinic: 'Downtown Clinic', revenue: 198420, patients: 1240, appointments: 3200, satisfaction: 4.8 },
  { clinic: 'Westside Medical', revenue: 145300, patients: 890, appointments: 2100, satisfaction: 4.6 },
  { clinic: 'Northpark Health', revenue: 112800, patients: 650, appointments: 1800, satisfaction: 4.7 },
  { clinic: 'Eastview Center', revenue: 89500, patients: 520, appointments: 1400, satisfaction: 4.5 },
];

const monthlyTrend = [
  { month: 'Jul', downtown: 152000, westside: 118000, northpark: 92000, eastview: 71000 },
  { month: 'Aug', downtown: 161000, westside: 125000, northpark: 98000, eastview: 75000 },
  { month: 'Sep', downtown: 158000, westside: 122000, northpark: 95000, eastview: 78000 },
  { month: 'Oct', downtown: 175000, westside: 132000, northpark: 101000, eastview: 82000 },
  { month: 'Nov', downtown: 182000, westside: 138000, northpark: 108000, eastview: 85000 },
  { month: 'Dec', downtown: 198000, westside: 145000, northpark: 113000, eastview: 90000 },
];

const serviceDistribution = [
  { name: 'Consultations', value: 35 },
  { name: 'Surgeries', value: 22 },
  { name: 'Lab Tests', value: 20 },
  { name: 'Imaging', value: 13 },
  { name: 'Therapy', value: 10 },
];

const patientDemographics = [
  { age: '0-18', male: 120, female: 135 },
  { age: '19-35', male: 340, female: 380 },
  { age: '36-50', male: 280, female: 310 },
  { age: '51-65', male: 210, female: 245 },
  { age: '65+', male: 150, female: 180 },
];

const appointmentsByDay = [
  { day: 'Mon', completed: 42, cancelled: 5, noShow: 3 },
  { day: 'Tue', completed: 48, cancelled: 4, noShow: 2 },
  { day: 'Wed', completed: 38, cancelled: 6, noShow: 4 },
  { day: 'Thu', completed: 52, cancelled: 3, noShow: 2 },
  { day: 'Fri', completed: 56, cancelled: 4, noShow: 3 },
  { day: 'Sat', completed: 28, cancelled: 2, noShow: 1 },
];

const radarData = [
  { metric: 'Revenue', downtown: 95, westside: 78, northpark: 62, eastview: 48 },
  { metric: 'Patients', downtown: 90, westside: 72, northpark: 55, eastview: 42 },
  { metric: 'Satisfaction', downtown: 96, westside: 92, northpark: 94, eastview: 90 },
  { metric: 'Efficiency', downtown: 88, westside: 82, northpark: 78, eastview: 75 },
  { metric: 'Growth', downtown: 85, westside: 88, northpark: 72, eastview: 68 },
  { metric: 'Retention', downtown: 92, westside: 85, northpark: 80, eastview: 76 },
];

const Analytics = () => {
  const [dateRange, setDateRange] = useState('6months');
  const [selectedClinic, setSelectedClinic] = useState('all');

  const totalRevenue = clinicPerformance.reduce((s, c) => s + c.revenue, 0);
  const totalPatients = clinicPerformance.reduce((s, c) => s + c.patients, 0);
  const totalAppointments = clinicPerformance.reduce((s, c) => s + c.appointments, 0);
  const avgSatisfaction = (clinicPerformance.reduce((s, c) => s + c.satisfaction, 0) / clinicPerformance.length).toFixed(1);

  return (
    <DashboardLayout title="Cross-Clinic Analytics" subtitle="Performance insights across all your clinics">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedClinic} onValueChange={setSelectedClinic}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="all">All Clinics</SelectItem>
            {clinicPerformance.map(c => <SelectItem key={c.clinic} value={c.clinic}>{c.clinic}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          { title: 'Total Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}K`, change: '+15.2%', positive: true, icon: DollarSign },
          { title: 'Total Patients', value: totalPatients.toLocaleString(), change: '+8.4%', positive: true, icon: Users },
          { title: 'Appointments', value: totalAppointments.toLocaleString(), change: '+12.1%', positive: true, icon: Calendar },
          { title: 'Avg. Satisfaction', value: `${avgSatisfaction}/5`, change: '+0.3', positive: true, icon: Activity },
        ].map((kpi) => (
          <div key={kpi.title} className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold font-display mt-1">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.positive ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                  <span className={cn('text-sm font-medium', kpi.positive ? 'text-emerald-600' : 'text-red-600')}>{kpi.change}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><kpi.icon size={20} className="text-primary" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend + Service Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg">Revenue by Clinic</h3>
              <p className="text-sm text-muted-foreground">Monthly revenue comparison</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="downtown" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.1} strokeWidth={2} name="Downtown" />
                <Area type="monotone" dataKey="westside" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.1} strokeWidth={2} name="Westside" />
                <Area type="monotone" dataKey="northpark" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.1} strokeWidth={2} name="Northpark" />
                <Area type="monotone" dataKey="eastview" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.1} strokeWidth={2} name="Eastview" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Service Distribution</h3>
          <p className="text-sm text-muted-foreground mb-4">Across all clinics</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {serviceDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {serviceDistribution.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} /><span className="text-muted-foreground">{s.name}</span></div>
                <span className="font-medium">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinic Comparison Table + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Clinic Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-xs font-semibold text-muted-foreground uppercase">Clinic</th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Revenue</th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Patients</th>
                  <th className="text-right py-3 text-xs font-semibold text-muted-foreground uppercase">Rating</th>
                </tr>
              </thead>
              <tbody>
                {clinicPerformance.map((clinic, i) => (
                  <tr key={clinic.clinic} className="border-b border-border/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="font-medium">{clinic.clinic}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 font-semibold">${(clinic.revenue / 1000).toFixed(0)}K</td>
                    <td className="text-right py-3">{clinic.patients.toLocaleString()}</td>
                    <td className="text-right py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{clinic.satisfaction}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Performance Radar</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name="Downtown" dataKey="downtown" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Westside" dataKey="westside" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.1} strokeWidth={2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: Appointments by Day + Patient Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Appointments by Day</h3>
          <p className="text-sm text-muted-foreground mb-4">Completion rates across weekdays</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                <Bar dataKey="completed" fill={COLORS[1]} radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} name="Cancelled" />
                <Bar dataKey="noShow" fill="#F59E0B" radius={[4, 4, 0, 0]} name="No Show" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Patient Demographics</h3>
          <p className="text-sm text-muted-foreground mb-4">Age & gender distribution</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientDemographics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis dataKey="age" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={50} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
                <Bar dataKey="male" fill={COLORS[0]} radius={[0, 4, 4, 0]} name="Male" />
                <Bar dataKey="female" fill={COLORS[1]} radius={[0, 4, 4, 0]} name="Female" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
