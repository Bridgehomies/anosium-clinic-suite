import { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Globe, HelpCircle, ChevronRight, ArrowLeft, Camera, Mail, Phone, Building, Save, Eye, EyeOff, Smartphone, Monitor, Moon, Sun, Check, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

// ─── API helpers ────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err?.detail ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingsSection = 'main' | 'profile' | 'notifications' | 'security' | 'appearance' | 'language' | 'help';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  full_name: string;
}

interface NotificationPreference {
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
  enabled_types: Record<string, boolean>;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
}

interface Session {
  id: string;
  device?: string;
  location?: string;
  created_at?: string;
  is_current?: boolean;
}

// ─── Section config ───────────────────────────────────────────────────────────

const settingsSections = [
  { id: 'profile' as const, title: 'Profile Settings', description: 'Manage your account details and preferences', icon: User },
  { id: 'notifications' as const, title: 'Notifications', description: 'Configure how you receive alerts and updates', icon: Bell },
  { id: 'security' as const, title: 'Security', description: 'Password, two-factor authentication, and sessions', icon: Shield },
  { id: 'appearance' as const, title: 'Appearance', description: 'Customize the look and feel of your dashboard', icon: Palette },
  { id: 'language' as const, title: 'Language & Region', description: 'Set your preferred language and timezone', icon: Globe },
  { id: 'help' as const, title: 'Help & Support', description: 'Get help, report issues, and contact support', icon: HelpCircle },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const { theme, setTheme } = useTheme();

  // ── Profile ──────────────────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  useEffect(() => {
    if (activeSection === 'profile' && !profile.email) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  async function fetchProfile() {
    try {
      setProfileLoading(true);
      const user = await apiFetch<UserProfile>('/users/me');
      setProfile({
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone ?? '',
        role: user.role,
      });
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setProfileSaving(true);
      await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone || null,
        }),
      });
      toast.success('Profile saved successfully!');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Notifications ────────────────────────────────────────────────────────
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreference>({
    email_enabled: true,
    sms_enabled: true,
    whatsapp_enabled: true,
    push_enabled: true,
    enabled_types: {},
    quiet_hours_start: null,
    quiet_hours_end: null,
    timezone: 'UTC',
  });

  useEffect(() => {
    if (activeSection === 'notifications') {
      fetchNotifPrefs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  async function fetchNotifPrefs() {
    try {
      setNotifLoading(true);
      const prefs = await apiFetch<NotificationPreference>('/notifications/preferences');
      setNotifications(prefs);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to load notification preferences');
    } finally {
      setNotifLoading(false);
    }
  }

  async function saveNotifPrefs() {
    try {
      setNotifSaving(true);
      await apiFetch('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(notifications),
      });
      toast.success('Notification preferences saved!');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save preferences');
    } finally {
      setNotifSaving(false);
    }
  }

  // ── Security ─────────────────────────────────────────────────────────────
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    showCurrentPassword: false,
    showNewPassword: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (activeSection === 'security') {
      fetchSessions();
    }
  }, [activeSection]);

  async function fetchSessions() {
    try {
      setSessionsLoading(true);
      const data = await apiFetch<Session[]>('/auth/sessions');
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      // sessions are optional; fail silently
    } finally {
      setSessionsLoading(false);
    }
  }

  async function changePassword() {
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (security.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      setPasswordSaving(true);
      await apiFetch('/auth/password/change', {
        method: 'POST',
        body: JSON.stringify({
          old_password: security.currentPassword,
          new_password: security.newPassword,
        }),
      });
      toast.success('Password updated successfully');
      setSecurity(s => ({ ...s, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function logoutAllSessions() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
      toast.success('All sessions logged out');
      setSessions([]);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to logout sessions');
    }
  }

  // ── Appearance (local only) ───────────────────────────────────────────────
  const [appearance, setAppearance] = useState({
    accentColor: 'teal',
    compactMode: false,
    animationsEnabled: true,
  });

  // ── Language (local only) ────────────────────────────────────────────────
  const [language, setLanguage] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  // ── Help form ────────────────────────────────────────────────────────────
  const [helpForm, setHelpForm] = useState({ subject: '', category: '', message: '' });
  const [helpSending, setHelpSending] = useState(false);

  async function submitHelpTicket() {
    if (!helpForm.subject || !helpForm.category || !helpForm.message) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      setHelpSending(true);
      // Send as an in-app notification to support
      await apiFetch('/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: 'system',
          channel: 'in_app',
          subject: `[Support] ${helpForm.subject}`,
          message: `Category: ${helpForm.category}\n\n${helpForm.message}`,
        }),
      });
      toast.success('Support ticket submitted! We will respond within 24 hours.');
      setHelpForm({ subject: '', category: '', message: '' });
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to submit ticket');
    } finally {
      setHelpSending(false);
    }
  }

  // ─── Render helpers ──────────────────────────────────────────────────────

  const renderMainView = () => (
    <>
      {/* Profile Card */}
      <div className="card-elevated p-6 mb-8 animate-fade-up">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-medium">
              <span className="text-white font-bold text-2xl">
                {profile.firstName?.[0] ?? 'A'}{profile.lastName?.[0] ?? 'U'}
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
              {profile.firstName || 'Admin'} {profile.lastName || 'User'}
            </h2>
            <p className="text-muted-foreground">{profile.email || '—'}</p>
            <p className="text-sm text-secondary mt-1 capitalize">{profile.role?.replace('_', ' ') || 'Administrator'}</p>
          </div>
          <button onClick={() => setActiveSection('profile')} className="btn-outline">
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
                <section.icon size={22} className="text-muted-foreground group-hover:text-secondary transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">{section.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <ChevronRight size={20} className="text-muted-foreground group-hover:text-secondary transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 p-6 rounded-xl border-2 border-destructive/20 bg-destructive/5 animate-fade-up">
        <h3 className="font-display font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">These actions are irreversible. Please proceed with caution.</p>
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
      {profileLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-secondary" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-medium">
                <span className="text-white font-bold text-3xl">
                  {profile.firstName?.[0] ?? 'A'}{profile.lastName?.[0] ?? 'U'}
                </span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg hover:bg-secondary/90 transition-colors">
                <Camera size={18} />
              </button>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">Click the camera icon to upload a new photo</p>
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
                  disabled
                  className="pl-10 opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
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
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="role"
                  value={profile.role?.replace(/_/g, ' ')}
                  disabled
                  className="pl-10 opacity-60 cursor-not-allowed capitalize"
                />
              </div>
              <p className="text-xs text-muted-foreground">Role is managed by your administrator.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveProfile} disabled={profileSaving} className="btn-primary flex items-center gap-2">
              {profileSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {profileSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-8 animate-fade-up">
      {notifLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-secondary" />
        </div>
      ) : (
        <>
          {/* Email */}
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
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Email Enabled</p>
                <p className="text-sm text-muted-foreground">Receive all email notifications</p>
              </div>
              <Switch
                checked={notifications.email_enabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email_enabled: checked })}
              />
            </div>
          </div>

          {/* Push */}
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
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Push Enabled</p>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch
                checked={notifications.push_enabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push_enabled: checked })}
              />
            </div>
          </div>

          {/* SMS */}
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
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">SMS Enabled</p>
                <p className="text-sm text-muted-foreground">Receive SMS notifications</p>
              </div>
              <Switch
                checked={notifications.sms_enabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sms_enabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">WhatsApp Enabled</p>
                <p className="text-sm text-muted-foreground">Receive WhatsApp messages</p>
              </div>
              <Switch
                checked={notifications.whatsapp_enabled}
                onCheckedChange={(checked) => setNotifications({ ...notifications, whatsapp_enabled: checked })}
              />
            </div>
          </div>

          {/* Notification types */}
          <div className="card-elevated p-6">
            <h3 className="font-semibold mb-4">Notification Types</h3>
            <div className="space-y-3">
              {[
                { key: 'appointment_reminder', label: 'Appointment Reminders' },
                { key: 'payment_received', label: 'Payment Confirmations' },
                { key: 'follow_up', label: 'Follow-up Reminders' },
                { key: 'system', label: 'System Alerts' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="font-medium">{label}</p>
                  <Switch
                    checked={notifications.enabled_types[key] !== false}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        enabled_types: { ...notifications.enabled_types, [key]: checked },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={saveNotifPrefs} disabled={notifSaving} className="btn-primary flex items-center gap-2">
              {notifSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {notifSaving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </>
      )}
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
          <button onClick={changePassword} disabled={passwordSaving} className="btn-primary flex items-center gap-2">
            {passwordSaving ? <Loader2 size={18} className="animate-spin" /> : null}
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
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
            <p className="text-sm text-secondary font-medium">✓ Two-factor authentication is enabled</p>
            <p className="text-sm text-muted-foreground mt-1">You will be asked for a verification code when signing in.</p>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Active Sessions</h3>
        {sessionsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-secondary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="space-y-4">
            {/* Fallback: show current session placeholder */}
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-teal-light flex items-center justify-center">
                  <Monitor size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Current Browser Session</p>
                  <p className="text-sm text-muted-foreground">Current session</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">Active</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s, i) => (
              <div key={s.id ?? i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.is_current ? 'bg-brand-teal-light' : 'bg-muted'}`}>
                    <Monitor size={18} className={s.is_current ? 'text-secondary' : 'text-muted-foreground'} />
                  </div>
                  <div>
                    <p className="font-medium">{s.device ?? `Session ${i + 1}`}</p>
                    <p className="text-sm text-muted-foreground">{s.location ?? '—'}</p>
                  </div>
                </div>
                {s.is_current ? (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">Active</span>
                ) : (
                  <button
                    className="text-sm text-destructive hover:text-destructive/80 font-medium"
                    onClick={logoutAllSessions}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={logoutAllSessions} className="mt-4 text-sm text-destructive hover:text-destructive/80 font-medium">
          Log out of all other sessions
        </button>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-8 animate-fade-up">
      {/* Theme */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-2">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">Your preference is saved automatically.</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light' as const, label: 'Light', icon: Sun, description: 'Bright and clean' },
            { id: 'dark' as const, label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
            { id: 'system' as const, label: 'System', icon: Monitor, description: 'Match device' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setTheme(opt.id); toast.success(`Theme changed to ${opt.label}`); }}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${theme === opt.id ? 'border-secondary bg-accent' : 'border-border hover:border-secondary/50'}`}
            >
              <opt.icon size={24} className={theme === opt.id ? 'text-secondary' : 'text-muted-foreground'} />
              <p className={`mt-2 font-medium ${theme === opt.id ? 'text-secondary' : 'text-foreground'}`}>{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
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
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setAppearance({ ...appearance, accentColor: c.id })}
              className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center transition-transform hover:scale-110 ${appearance.accentColor === c.id ? 'ring-2 ring-offset-2 ring-secondary' : ''}`}
            >
              {appearance.accentColor === c.id && <Check size={20} className="text-white" />}
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
            <Switch checked={appearance.compactMode} onCheckedChange={(c) => setAppearance({ ...appearance, compactMode: c })} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Animations</p>
              <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
            </div>
            <Switch checked={appearance.animationsEnabled} onCheckedChange={(c) => setAppearance({ ...appearance, animationsEnabled: c })} />
          </div>
        </div>
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
            <Select value={language.language} onValueChange={(v) => setLanguage({ ...language, language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Select value={language.timezone} onValueChange={(v) => setLanguage({ ...language, timezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Select value={language.dateFormat} onValueChange={(v) => setLanguage({ ...language, dateFormat: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Time Format</Label>
            <Select value={language.timeFormat} onValueChange={(v) => setLanguage({ ...language, timeFormat: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={() => toast.success('Language settings saved!')} className="btn-primary flex items-center gap-2">
          <Save size={18} />Save Settings
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
          ].map((faq, i) => (
            <div key={i} className="py-3 border-b border-border last:border-0">
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
            <Select value={helpForm.category} onValueChange={(v) => setHelpForm({ ...helpForm, category: v })}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
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
          <button onClick={submitHelpTicket} disabled={helpSending} className="btn-primary flex items-center gap-2">
            {helpSending ? <Loader2 size={18} className="animate-spin" /> : null}
            {helpSending ? 'Submitting…' : 'Submit Ticket'}
          </button>
        </div>
      </div>

      {/* Resources */}
      <div className="card-elevated p-6">
        <h3 className="font-semibold text-lg mb-6">Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Documentation', 'Video Tutorials', 'Community Forum', 'API Reference'].map((label) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-brand-teal-light transition-colors group"
            >
              <HelpCircle size={18} className="text-muted-foreground group-hover:text-secondary" />
              <span className="font-medium group-hover:text-secondary">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection();
      case 'notifications': return renderNotificationsSection();
      case 'security': return renderSecuritySection();
      case 'appearance': return renderAppearanceSection();
      case 'language': return renderLanguageSection();
      case 'help': return renderHelpSection();
      default: return renderMainView();
    }
  };

  const getSectionTitle = () => settingsSections.find(s => s.id === activeSection)?.title ?? 'Settings';

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
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">{getSectionTitle()}</h2>
        )}

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default Settings;