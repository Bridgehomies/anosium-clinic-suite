import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  Users, 
  Stethoscope, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PiggyBank,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
} from 'recharts';

// Financial data
const revenueData = [
  { month: 'Jan', revenue: 145000, expenses: 82000, profit: 63000 },
  { month: 'Feb', revenue: 162000, expenses: 88000, profit: 74000 },
  { month: 'Mar', revenue: 158000, expenses: 85000, profit: 73000 },
  { month: 'Apr', revenue: 181000, expenses: 92000, profit: 89000 },
  { month: 'May', revenue: 175000, expenses: 89000, profit: 86000 },
  { month: 'Jun', revenue: 198000, expenses: 95000, profit: 103000 },
];

const revenueByService = [
  { name: 'Consultations', value: 35, amount: 69300 },
  { name: 'Surgeries', value: 28, amount: 55440 },
  { name: 'Lab Tests', value: 18, amount: 35640 },
  { name: 'Imaging', value: 12, amount: 23760 },
  { name: 'Pharmacy', value: 7, amount: 13860 },
];

const COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC'];

const dailyRevenue = [
  { day: 'Mon', amount: 8420 },
  { day: 'Tue', amount: 9150 },
  { day: 'Wed', amount: 7890 },
  { day: 'Thu', amount: 10200 },
  { day: 'Fri', amount: 11450 },
  { day: 'Sat', amount: 6320 },
  { day: 'Sun', amount: 4100 },
];

const outstandingPayments = [
  { id: 1, patient: 'John Anderson', amount: 2450, dueDate: '2024-01-20', status: 'overdue' },
  { id: 2, patient: 'Sarah Mitchell', amount: 890, dueDate: '2024-01-25', status: 'pending' },
  { id: 3, patient: 'Robert Chen', amount: 3200, dueDate: '2024-01-28', status: 'pending' },
  { id: 4, patient: 'Emily Davis', amount: 1560, dueDate: '2024-01-18', status: 'overdue' },
];

interface FinancialMetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
  subtitle?: string;
  large?: boolean;
}

const FinancialMetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  subtitle,
  large = false 
}: FinancialMetricCardProps) => (
  <div className={cn(
    "card-elevated p-6 group hover:shadow-xl transition-all duration-300",
    large && "lg:col-span-2"
  )}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn(
          "font-bold font-display text-foreground",
          large ? "text-4xl" : "text-3xl"
        )}>{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        <div className="flex items-center gap-2">
          {changeType === 'positive' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            changeType === 'positive' ? "text-emerald-600" : "text-red-600"
          )}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </div>
      <div className={cn(
        "rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
        large ? "w-16 h-16 bg-gradient-to-br from-brand-navy to-brand-teal" : "w-12 h-12 bg-brand-navy"
      )}>
        <Icon className={cn("text-white", large ? "w-8 h-8" : "w-5 h-5")} />
      </div>
    </div>
  </div>
);

interface ClinicalMetricProps {
  title: string;
  value: string;
  icon: React.ElementType;
}

const ClinicalMetric = ({ title, value, icon: Icon }: ClinicalMetricProps) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
    <div className="w-10 h-10 rounded-lg bg-brand-teal/10 flex items-center justify-center">
      <Icon className="w-5 h-5 text-brand-teal" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-lg font-bold font-display">{value}</p>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      subtitle="Financial overview and business intelligence for AnosiumAI Clinic"
    >
      {/* Primary Financial Metrics - Large & Prominent */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FinancialMetricCard
          title="Total Revenue (MTD)"
          value="$198,420"
          change="+18.5%"
          changeType="positive"
          icon={DollarSign}
          subtitle="June 2024"
          large
        />
        <FinancialMetricCard
          title="Net Profit"
          value="$103,200"
          change="+22.3%"
          changeType="positive"
          icon={TrendingUp}
          subtitle="52% margin"
          large
        />
        <FinancialMetricCard
          title="Outstanding"
          value="$8,100"
          change="-12%"
          changeType="positive"
          icon={CreditCard}
        />
        <FinancialMetricCard
          title="Avg. Transaction"
          value="$425"
          change="+8.2%"
          changeType="positive"
          icon={Wallet}
        />
      </div>

      {/* Main Financial Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue vs Expenses Chart - Takes 2 columns */}
        <div className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                Revenue vs Expenses
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                6-month financial trend analysis
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-navy" />
                <span className="text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-teal" />
                <span className="text-muted-foreground">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#36406D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#36406D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#59C4C1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#59C4C1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -10px rgba(54, 64, 109, 0.15)',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#36406D" strokeWidth={2} fill="url(#revenueGradient)" />
                <Area type="monotone" dataKey="expenses" stroke="#59C4C1" strokeWidth={2} fill="url(#expenseGradient)" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service Pie Chart */}
        <div className="card-elevated p-6">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-lg text-foreground">
              Revenue by Service
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Distribution breakdown
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByService}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {revenueByService.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -10px rgba(54, 64, 109, 0.15)',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `$${props.payload.amount.toLocaleString()} (${value}%)`,
                    props.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {revenueByService.map((service, index) => (
              <div key={service.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-muted-foreground">{service.name}</span>
                </div>
                <span className="font-medium">${service.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row - Daily Revenue & Outstanding Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Revenue */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                Daily Revenue
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This week's performance
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-display text-foreground">$57,530</p>
              <p className="text-xs text-emerald-600 font-medium">+9.2% vs last week</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -10px rgba(54, 64, 109, 0.15)',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="#36406D" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                Outstanding Payments
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pending collections
              </p>
            </div>
            <button className="btn-secondary text-sm">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {outstandingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    payment.status === 'overdue' ? "bg-red-500" : "bg-amber-500"
                  )} />
                  <div>
                    <p className="font-medium text-sm">{payment.patient}</p>
                    <p className="text-xs text-muted-foreground">Due: {payment.dueDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-navy">${payment.amount.toLocaleString()}</p>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    payment.status === 'overdue' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row - Clinical Overview (Secondary) */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground">
                Clinical Overview
              </h3>
              <p className="text-sm text-muted-foreground">
                Operational metrics summary
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <ClinicalMetric title="Total Patients" value="2,847" icon={Users} />
          <ClinicalMetric title="Active Doctors" value="48" icon={Stethoscope} />
          <ClinicalMetric title="Today's Appointments" value="156" icon={Calendar} />
          <ClinicalMetric title="Completed Visits" value="142" icon={Receipt} />
          <ClinicalMetric title="Pending Follow-ups" value="38" icon={Calendar} />
          <ClinicalMetric title="New Patients (MTD)" value="124" icon={Users} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
