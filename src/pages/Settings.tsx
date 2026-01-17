import { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, HelpCircle, ChevronRight, ArrowLeft, Camera, Mail, Phone, Building, Save, Eye, EyeOff, Smartphone, Monitor, Moon, Sun, Check } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type SettingsSection = 'main' | 'profile' | 'notifications' | 'security' | 'appearance' | 'language' | 'help';

const settingsSections = [
  {
    id: 'profile' as const,
    title: 'Profile Settings',
    description: 'Manage your account details and preferences',
    icon: User,
  },
  {
    id: 'notifications' as const,
    title: 'Notifications',
    description: 'Configure how you receive alerts and updates',
    icon: Bell,
  },
  {
    id: 'security' as const,
    title: 'Security',
    description: 'Password, two-factor authentication, and sessions',
    icon: Shield,
  },
  {
    id: 'appearance' as const,
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    icon: Palette,
  },
  {
    id: 'language' as const,
    title: 'Language & Region',
    description: 'Set your preferred language and timezone',
    icon: Globe,
  },
  {
    id: 'help' as const,
    title: 'Help & Support',
    description: 'Get help, report issues, and contact support',
    icon: HelpCircle,
  },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  
  // Profile state
  const [profile, setProfile] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@anosium.ai',
    phone: '+1 (555) 123-4567',
    department: 'Administration',
    role: 'System Administrator',
    bio: 'Healthcare system administrator with 5+ years of experience managing clinical operations.',
  });

  // Notification state
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    emailPayments: true,
    emailReports: false,
    pushAppointments: true,
    pushPayments: false,
    pushAlerts: true,
    smsReminders: true,
    smsUrgent: true,
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    showCurrentPassword: false,
    showNewPassword: false,
  });

  // Appearance state
  const [appearance, setAppearance] = useState({
    theme: 'light',
    accentColor: 'teal',
    compactMode: false,
    animationsEnabled: true,
  });

  // Language state
  const [language, setLanguage] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  // Help state
  const [helpForm, setHelpForm] = useState({
    subject: '',
    category: '',
    message: '',
  });

  const handleSave = (section: string) => {
    toast.success(`${section} saved successfully!`);
  };

  const renderMainView = () => (
    <>
      {/* Profile Card */}
      <div className="card-elevated p-6 mb-8 animate-fade-up">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-medium">
              <span className="text-white font-bold text-2xl">
                {profile.firstName[0]}{profile.lastName[0]}
              </span>
            </div>
            <button 
              onClick={() => setActiveSection('profile')}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-colors"
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-foreground">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-secondary mt-1">{profile.role}</p>
          </div>
          <button 
            onClick={() => setActiveSection('profile')}
            className="btn-outline"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {settingsSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className="card-elevated p-6 text-left group hover:border-secondary/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-brand-teal-light flex items-center justify-center transition-colors">
                <section.icon
                  size={22}
                  className="text-muted-foreground group-hover:text-secondary transition-colors"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground group-hover:text-secondary transition-colors" />
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
          <button 
            onClick={() => toast.error('Account deletion requires confirmation via email')}
            className="px-4 py-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all text-sm font-medium"
          >
            Delete Account
          </button>
          <button 
            onClick={() => toast.success('Data export initiated. You will receive an email shortly.')}
            className="px-4 py-2 rounded-lg border-2 border-destructive/50 text-destructive/70 hover:border-destructive hover:text-destructive transition-all text-sm font-medium"
          >
            Export Data
          </button>
        </div>
      </div>
    </>
  );

  const renderProfileSection = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-medium">
            <span className="text-white font-bold text-3xl">
              {profile.firstName[0]}{profile.lastName[0]}
            </span>
          </div>
          <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-colors">
            <Camera size={18} />
          </button>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">Profile Photo</h3>
          <p className="text-sm text-muted-foreground">Click to upload a new photo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={profile.firstName}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={profile.lastName}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <div className="relative">
            <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="department"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={profile.role} onValueChange={(value) => setProfile({ ...profile, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System Administrator">System Administrator</SelectItem>
              <SelectItem value="Clinic Manager">Clinic Manager</SelectItem>
              <SelectItem value="Receptionist">Receptionist</SelectItem>
              <SelectItem value="Doctor">Doctor</SelectItem>
              <SelectItem value="Nurse">Nurse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={4}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => handleSave('Profile')}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-8 animate-fade-up">
      {/* Email Notifications */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center">
            <Mail size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">Receive updates via email</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Appointment Reminders</p>
              <p className="text-sm text-muted-foreground">Get notified about upcoming appointments</p>
            </div>
            <Switch
              checked={notifications.emailAppointments}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailAppointments: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Payment Confirmations</p>
              <p className="text-sm text-muted-foreground">Receive receipts and payment updates</p>
            </div>
            <Switch
              checked={notifications.emailPayments}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailPayments: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Weekly Reports</p>
              <p className="text-sm text-muted-foreground">Summary of clinic performance</p>
            </div>
            <Switch
              checked={notifications.emailReports}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailReports: checked })}
            />
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center">
            <Bell size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">Real-time alerts in your browser</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">New Appointments</p>
              <p className="text-sm text-muted-foreground">When patients book appointments</p>
            </div>
            <Switch
              checked={notifications.pushAppointments}
              onCheckedChange={(checked) => setNotifications({ ...notifications, pushAppointments: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Payment Received</p>
              <p className="text-sm text-muted-foreground">When payments are processed</p>
            </div>
            <Switch
              checked={notifications.pushPayments}
              onCheckedChange={(checked) => setNotifications({ ...notifications, pushPayments: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">System Alerts</p>
              <p className="text-sm text-muted-foreground">Important system notifications</p>
            </div>
            <Switch
              checked={notifications.pushAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, pushAlerts: checked })}
            />
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center">
            <Smartphone size={20} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">SMS Notifications</h3>
            <p className="text-sm text-muted-foreground">Text message alerts</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Appointment Reminders</p>
              <p className="text-sm text-muted-foreground">SMS reminders before appointments</p>
            </div>
            <Switch
              checked={notifications.smsReminders}
              onCheckedChange={(checked) => setNotifications({ ...notifications, smsReminders: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Urgent Notifications</p>
              <p className="text-sm text-muted-foreground">Critical alerts via SMS</p>
            </div>
            <Switch
              checked={notifications.smsUrgent}
              onCheckedChange={(checked) => setNotifications({ ...notifications, smsUrgent: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => handleSave('Notification preferences')}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-8 animate-fade-up">
      {/* Change Password */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={security.showCurrentPassword ? 'text' : 'password'}
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setSecurity({ ...security, showCurrentPassword: !security.showCurrentPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {security.showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={security.showNewPassword ? 'text' : 'password'}
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setSecurity({ ...security, showNewPassword: !security.showNewPassword })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {security.showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={security.confirmPassword}
              onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>
          <button 
            onClick={() => {
              if (security.newPassword !== security.confirmPassword) {
                toast.error('Passwords do not match');
                return;
              }
              if (security.newPassword.length < 8) {
                toast.error('Password must be at least 8 characters');
                return;
              }
              toast.success('Password updated successfully');
              setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            className="btn-primary"
          >
            Update Password
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            checked={security.twoFactorEnabled}
            onCheckedChange={(checked) => {
              setSecurity({ ...security, twoFactorEnabled: checked });
              toast.success(checked ? '2FA enabled' : '2FA disabled');
            }}
          />
        </div>
        {security.twoFactorEnabled && (
          <div className="mt-4 p-4 bg-brand-teal-light/50 rounded-lg">
            <p className="text-sm text-secondary font-medium">
              ✓ Two-factor authentication is enabled
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You will be asked for a verification code when signing in.
            </p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Active Sessions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-teal-light flex items-center justify-center">
                <Monitor size={18} className="text-secondary" />
              </div>
              <div>
                <p className="font-medium">MacBook Pro - Chrome</p>
                <p className="text-sm text-muted-foreground">New York, USA • Current session</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Smartphone size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">iPhone 14 Pro - Safari</p>
                <p className="text-sm text-muted-foreground">New York, USA • 2 days ago</p>
              </div>
            </div>
            <button className="text-sm text-destructive hover:text-destructive/80 font-medium">
              Revoke
            </button>
          </div>
        </div>
        <button 
          onClick={() => toast.success('All other sessions have been logged out')}
          className="mt-4 text-sm text-destructive hover:text-destructive/80 font-medium"
        >
          Log out of all other sessions
        </button>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-8 animate-fade-up">
      {/* Theme */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setAppearance({ ...appearance, theme: theme.id })}
              className={`p-4 rounded-xl border-2 transition-all ${
                appearance.theme === theme.id
                  ? 'border-secondary bg-brand-teal-light'
                  : 'border-border hover:border-secondary/50'
              }`}
            >
              <theme.icon size={24} className={appearance.theme === theme.id ? 'text-secondary' : 'text-muted-foreground'} />
              <p className={`mt-2 font-medium ${appearance.theme === theme.id ? 'text-secondary' : 'text-foreground'}`}>
                {theme.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Accent Color</h3>
        <div className="flex gap-4">
          {[
            { id: 'teal', color: 'bg-brand-teal' },
            { id: 'blue', color: 'bg-blue-500' },
            { id: 'purple', color: 'bg-purple-500' },
            { id: 'green', color: 'bg-green-500' },
            { id: 'orange', color: 'bg-orange-500' },
          ].map((color) => (
            <button
              key={color.id}
              onClick={() => setAppearance({ ...appearance, accentColor: color.id })}
              className={`w-12 h-12 rounded-xl ${color.color} flex items-center justify-center transition-transform hover:scale-110 ${
                appearance.accentColor === color.id ? 'ring-2 ring-offset-2 ring-secondary' : ''
              }`}
            >
              {appearance.accentColor === color.id && (
                <Check size={20} className="text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
            </div>
            <Switch
              checked={appearance.compactMode}
              onCheckedChange={(checked) => setAppearance({ ...appearance, compactMode: checked })}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Animations</p>
              <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
            </div>
            <Switch
              checked={appearance.animationsEnabled}
              onCheckedChange={(checked) => setAppearance({ ...appearance, animationsEnabled: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => handleSave('Appearance')}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderLanguageSection = () => (
    <div className="space-y-8 animate-fade-up">
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Language & Region Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language.language} onValueChange={(value) => setLanguage({ ...language, language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (US)</SelectItem>
                <SelectItem value="en-gb">English (UK)</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={language.timezone} onValueChange={(value) => setLanguage({ ...language, timezone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select value={language.dateFormat} onValueChange={(value) => setLanguage({ ...language, dateFormat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Time Format</Label>
            <Select value={language.timeFormat} onValueChange={(value) => setLanguage({ ...language, timeFormat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => handleSave('Language settings')}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </div>
  );

  const renderHelpSection = () => (
    <div className="space-y-8 animate-fade-up">
      {/* FAQ */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            { q: 'How do I reset my password?', a: 'Go to Security settings and click "Update Password".' },
            { q: 'How do I add a new doctor?', a: 'Navigate to Doctors page and click "Add Doctor" button.' },
            { q: 'How do I export patient data?', a: 'Go to Patients page and use the export feature in the table.' },
            { q: 'How do I configure appointment slots?', a: 'Visit Appointments settings to manage available time slots.' },
          ].map((faq, index) => (
            <div key={index} className="py-3 border-b border-border last:border-0">
              <p className="font-medium text-foreground">{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Contact Support</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={helpForm.subject}
              onChange={(e) => setHelpForm({ ...helpForm, subject: e.target.value })}
              placeholder="Brief description of your issue"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={helpForm.category} onValueChange={(value) => setHelpForm({ ...helpForm, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="billing">Billing Question</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={helpForm.message}
              onChange={(e) => setHelpForm({ ...helpForm, message: e.target.value })}
              rows={5}
              placeholder="Describe your issue in detail..."
            />
          </div>
          <button 
            onClick={() => {
              if (!helpForm.subject || !helpForm.category || !helpForm.message) {
                toast.error('Please fill in all fields');
                return;
              }
              toast.success('Support ticket submitted! We will respond within 24 hours.');
              setHelpForm({ subject: '', category: '', message: '' });
            }}
            className="btn-primary"
          >
            Submit Ticket
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Documentation', href: '#' },
            { label: 'Video Tutorials', href: '#' },
            { label: 'Community Forum', href: '#' },
            { label: 'API Reference', href: '#' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-brand-teal-light transition-colors group"
            >
              <HelpCircle size={18} className="text-muted-foreground group-hover:text-secondary" />
              <span className="font-medium group-hover:text-secondary">{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'appearance':
        return renderAppearanceSection();
      case 'language':
        return renderLanguageSection();
      case 'help':
        return renderHelpSection();
      default:
        return renderMainView();
    }
  };

  const getSectionTitle = () => {
    const section = settingsSections.find(s => s.id === activeSection);
    return section?.title || 'Settings';
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-4xl">
        {activeSection !== 'main' && (
          <button
            onClick={() => setActiveSection('main')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Settings</span>
          </button>
        )}
        
        {activeSection !== 'main' && (
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            {getSectionTitle()}
          </h2>
        )}

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
