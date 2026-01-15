import { User, Bell, Shield, Palette, Globe, HelpCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile Settings',
    description: 'Manage your account details and preferences',
    icon: User,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure how you receive alerts and updates',
    icon: Bell,
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Password, two-factor authentication, and sessions',
    icon: Shield,
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    icon: Palette,
  },
  {
    id: 'language',
    title: 'Language & Region',
    description: 'Set your preferred language and timezone',
    icon: Globe,
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'Get help, report issues, and contact support',
    icon: HelpCircle,
  },
];

const Settings = () => {
  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-4xl">
        {/* Profile Card */}
        <div className="card-elevated p-6 mb-8 animate-fade-up">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-medium">
              <span className="text-white font-bold text-2xl">AU</span>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-foreground">
                Admin User
              </h2>
              <p className="text-muted-foreground">admin@anosium.ai</p>
              <p className="text-sm text-secondary mt-1">System Administrator</p>
            </div>
            <button className="btn-outline">Edit Profile</button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              className="card-elevated p-6 text-left group hover:border-secondary/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-brand-teal-light flex items-center justify-center transition-colors">
                  <section.icon
                    size={22}
                    className="text-muted-foreground group-hover:text-secondary transition-colors"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 p-6 rounded-xl border-2 border-destructive/20 bg-destructive/5 animate-fade-up">
          <h3 className="font-display font-semibold text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all text-sm font-medium">
              Delete Account
            </button>
            <button className="px-4 py-2 rounded-lg border-2 border-destructive/50 text-destructive/70 hover:border-destructive hover:text-destructive transition-all text-sm font-medium">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
