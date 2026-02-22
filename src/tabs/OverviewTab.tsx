import { DollarSign, TrendingUp, CreditCard, Building2, Users, Stethoscope, Clock } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MetricCard, EmptyState } from '../components/SharedUI';
import { centsToK, CHART_COLORS } from '../utils/superAdmin.utils';
import { ClinicStats, ConsolidatedSummary, User } from '../types/superAdmin.types';

interface OverviewTabProps {
  dashboardStats: any;
  consolidatedSummary: ConsolidatedSummary;
  clinics: ClinicStats[];
  users: User[];
  revenueData: any[];
  serviceDistributionData: { name: string; value: number }[];
}

export const OverviewTab = ({
  dashboardStats,
  consolidatedSummary,
  clinics,
  users,
  revenueData,
  serviceDistributionData,
}: OverviewTabProps) => {
  const quickStats = [
    { icon: Building2, value: clinics.filter(c => c.is_active).length, label: 'Active Clinics',  bg: 'bg-purple-100', text: 'text-purple-600' },
    { icon: Users,     value: users.length,                             label: 'Total Users',     bg: 'bg-blue-100',   text: 'text-blue-600' },
    { icon: Stethoscope, value: users.filter(u => u.role?.toLowerCase() === 'doctor').length, label: 'Doctors', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { icon: Clock,     value: users.filter(u => !u.is_verified).length, label: 'Pending Invites', bg: 'bg-amber-100',  text: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue (MTD)"
          value={centsToK(consolidatedSummary.totalRevenue)}
          change={consolidatedSummary.totalRevenue > 0 ? `${centsToK(consolidatedSummary.totalRevenue)} collected` : 'No data yet'}
          changeType="positive"
          icon={DollarSign}
          large
        />
        <MetricCard
          title="Today's Revenue"
          value={centsToK(dashboardStats?.today_revenue ?? 0)}
          change={dashboardStats?.today_revenue > 0 ? 'Revenue collected today' : 'No revenue today'}
          changeType="positive"
          icon={TrendingUp}
          large
        />
        <MetricCard
          title="Pending Payments"
          value={centsToK(dashboardStats?.pending_payments ?? 0)}
          change={dashboardStats?.pending_payments > 0 ? 'Awaiting collection' : 'All clear'}
          changeType={dashboardStats?.pending_payments > 0 ? 'negative' : 'positive'}
          icon={CreditCard}
        />
        <MetricCard
          title="Total Clinics"
          value={clinics.length.toString()}
          change={`${clinics.filter(c => c.is_active).length} active`}
          changeType="positive"
          icon={Building2}
        />
      </div>

      {/* Quick stat pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, i) => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend area chart */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Revenue Trend (Last 30 Days)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#36406D" stopOpacity={0.3} />
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

        {/* Revenue by service pie chart */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Revenue by Service</h3>
          {serviceDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistributionData}
                  cx="50%" cy="50%"
                  labelLine={false}
                  label={entry => entry.name}
                  outerRadius={100}
                  dataKey="value"
                >
                  {serviceDistributionData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={DollarSign} title="No Service Data" description="Service revenue breakdown will appear here once data is available." />
          )}
        </div>
      </div>
    </div>
  );
};