import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, Calendar, ClipboardList,
  Receipt, Building2, Settings, LogOut, ChevronLeft, Menu,
  Shield, FileText, CreditCard, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarContext } from '@/contexts/SidebarContext';
import ClinicSwitcher, { type Clinic } from '@/components/clinic/ClinicSwitcher';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api-service';

const navigation = [
  { name: 'Super Admin', href: '/super-admin', icon: Shield, superAdminOnly: true },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Visits', href: '/visits', icon: ClipboardList },
  { name: 'Services', href: '/services', icon: Receipt },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Invoices', href: '/billing/invoices', icon: FileText },
  { name: 'Payments', href: '/billing/payments', icon: CreditCard },
];

const Sidebar = () => {
  const location = useLocation();
  const { collapsed, toggle } = useSidebarContext();
  const { user, isSuperAdmin, logout } = useAuth();

  const [userClinics, setUserClinics] = useState<Clinic[]>([]);
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
  const [clinicsLoading, setClinicsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadClinics = async () => {
      setClinicsLoading(true);
      try {
        if (isSuperAdmin) {
          // Super admin sees all clinics and can switch between them
          const { items } = await apiService.getTenants({ page_size: 100 });
          const mapped: Clinic[] = (items ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            role: 'Admin',
            patientCount: 0,
            isActive: c.is_active,
          }));
          setUserClinics(mapped);
          // Restore last-selected clinic for super admin, or default to first
          const storedId = localStorage.getItem('tenant_id');
          const restored = storedId ? mapped.find(c => c.id === Number(storedId)) : null;
          setCurrentClinic(restored ?? mapped[0] ?? null);
        } else if (user.tenant_id) {
          // Regular user — only their assigned clinic, no switching
          const clinic = await apiService.getTenant(user.tenant_id);
          const mapped: Clinic = {
            id: clinic.id,
            name: clinic.name,
            slug: clinic.slug,
            role: user.role?.replace(/_/g, ' ').toLowerCase() ?? 'staff',
            patientCount: 0,
            isActive: clinic.is_active,
          };
          setUserClinics([mapped]);
          setCurrentClinic(mapped);
          // Ensure apiClient always sends the right X-Tenant-ID
          localStorage.setItem('tenant_id', String(clinic.id));
        }
      } catch (err) {
        console.error('Failed to load clinics for sidebar', err);
      } finally {
        setClinicsLoading(false);
      }
    };

    loadClinics();
  }, [user, isSuperAdmin]);

  const handleSwitchClinic = (clinicId: number) => {
    const clinic = userClinics.find(c => c.id === clinicId);
    if (!clinic) return;
    setCurrentClinic(clinic);
    localStorage.setItem('tenant_id', String(clinicId));
    toast.success(`Switched to ${clinic.name}`);
    // Reload so all data re-fetches under the new tenant context
    window.location.reload();
  };

  // Filter nav: non-super-admins never see the Super Admin link
  const visibleNav = navigation.filter(item =>
    !item.superAdminOnly || isSuperAdmin
  );

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out',
      collapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="AnosiumAI" className="w-16 h-16 object-contain" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg text-sidebar-foreground">AnosiumAI</h1>
                <p className="text-xs text-sidebar-foreground/60">Clinic Management</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center mx-auto overflow-hidden">
              <img src="/logo.png" alt="AnosiumAI" className="w-8 h-8 object-contain" />
            </div>
          )}
        </div>

        {/* Clinic Switcher — only render when data is ready */}
        <div className={cn('border-b border-sidebar-border', collapsed ? 'px-2 py-3' : 'px-3 py-3')}>
          {clinicsLoading ? (
            <div className="flex items-center justify-center py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sidebar-foreground/40" />
            </div>
          ) : currentClinic ? (
            <ClinicSwitcher
              clinics={userClinics}
              currentClinic={currentClinic}
              onSwitch={isSuperAdmin ? handleSwitchClinic : () => {}}
              collapsed={collapsed}
            />
          ) : null}
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
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn('nav-link group', isActive && 'active', collapsed && 'justify-center px-3')}
                title={collapsed ? item.name : undefined}
              >
                <item.icon size={20} className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                )} />
                {!collapsed && <span className="truncate">{item.name}</span>}
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
          <button
            onClick={logout}
            className={cn('nav-link group w-full', collapsed && 'justify-center px-3')}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={20} className="text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;