import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  ClipboardList,
  Receipt,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  FileText,
  CreditCard,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarContext } from '@/contexts/SidebarContext';
import ClinicSwitcher, { type Clinic } from '@/components/clinic/ClinicSwitcher';
import { useState } from 'react';
import { toast } from 'sonner';

const navigation = [
  { name: 'Super Admin', href: '/super-admin', icon: Shield },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Visits', href: '/visits', icon: ClipboardList },
  { name: 'Services', href: '/services', icon: Receipt },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Invoices', href: '/billing/invoices', icon: FileText },
  { name: 'Payments', href: '/billing/payments', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

// Mock clinics for the switcher
const mockClinics: Clinic[] = [
  { id: 1, name: 'Downtown Clinic', slug: 'downtown', role: 'Admin', patientCount: 1240, isActive: true },
  { id: 2, name: 'Westside Medical', slug: 'westside', role: 'Manager', patientCount: 890, isActive: true },
  { id: 3, name: 'Northpark Health', slug: 'northpark', role: 'Admin', patientCount: 650, isActive: true },
  { id: 4, name: 'Eastview Center', slug: 'eastview', role: 'Viewer', patientCount: 520, isActive: false },
];

const Sidebar = () => {
  const location = useLocation();
  const { collapsed, toggle } = useSidebarContext();
  const [currentClinic, setCurrentClinic] = useState<Clinic>(mockClinics[0]);

  const handleSwitchClinic = (clinicId: number) => {
    const clinic = mockClinics.find(c => c.id === clinicId);
    if (clinic) {
      setCurrentClinic(clinic);
      toast.success(`Switched to ${clinic.name}`);
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-sidebar-foreground">
                  AnosiumAI
                </h1>
                <p className="text-xs text-sidebar-foreground/60">Clinic Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center mx-auto">
              <span className="text-sidebar-primary-foreground font-bold text-lg">A</span>
            </div>
          )}
        </div>

        {/* Clinic Switcher */}
        <div className={cn('border-b border-sidebar-border', collapsed ? 'px-2 py-3' : 'px-3 py-3')}>
          <ClinicSwitcher
            clinics={mockClinics}
            currentClinic={currentClinic}
            onSwitch={handleSwitchClinic}
            collapsed={collapsed}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-24 w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground shadow-lg hover:scale-110 transition-transform"
        >
          {collapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'nav-link group',
                  isActive && 'active',
                  collapsed && 'justify-center px-3'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  size={20}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link
            to="/settings"
            className={cn('nav-link group', collapsed && 'justify-center px-3')}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={20} className="text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <Link
            to="/"
            className={cn('nav-link group', collapsed && 'justify-center px-3')}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={20} className="text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
