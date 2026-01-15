import { Users, Stethoscope, Calendar, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import QuickActions from '@/components/dashboard/QuickActions';
import AppointmentChart from '@/components/dashboard/AppointmentChart';
import RevenueChart from '@/components/dashboard/RevenueChart';
import RecentAppointments from '@/components/dashboard/RecentAppointments';

const Dashboard = () => {
  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back, Admin. Here's what's happening today."
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
        <MetricCard
          title="Total Patients"
          value="2,847"
          change="+12.5%"
          changeType="positive"
          icon={Users}
          iconColor="bg-brand-navy"
        />
        <MetricCard
          title="Active Doctors"
          value="48"
          change="+3"
          changeType="positive"
          icon={Stethoscope}
          iconColor="bg-brand-teal"
        />
        <MetricCard
          title="Today's Appointments"
          value="156"
          change="-5%"
          changeType="negative"
          icon={Calendar}
          iconColor="bg-gradient-to-br from-brand-navy to-brand-teal"
        />
        <MetricCard
          title="Monthly Revenue"
          value="$67,420"
          change="+18.2%"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-emerald-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AppointmentChart />
        <RevenueChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentAppointments />
        </div>
        <QuickActions />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
