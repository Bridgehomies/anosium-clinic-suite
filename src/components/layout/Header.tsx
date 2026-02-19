import { Bell, Search, User, X, CheckCheck, LogOut, Settings, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── API helpers ─────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Notification {
  id: number;
  type: string;
  channel: string;
  subject: string | null;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const notifTypeColor: Record<string, string> = {
  appointment_reminder: 'bg-blue-100 text-blue-600',
  appointment_confirmation: 'bg-green-100 text-green-600',
  payment_due: 'bg-orange-100 text-orange-600',
  payment_received: 'bg-emerald-100 text-emerald-600',
  follow_up: 'bg-purple-100 text-purple-600',
  missed_appointment: 'bg-red-100 text-red-600',
  system: 'bg-gray-100 text-gray-600',
};

function notifDot(type: string) {
  return notifTypeColor[type] ?? 'bg-gray-100 text-gray-600';
}

// ─── Component ────────────────────────────────────────────────────────────────

const Header = ({ title, subtitle }: HeaderProps) => {
  const navigate = useNavigate();

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // ── User profile ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<UserProfile>('/auth/me')
      .then(setUser)
      .catch(() => {/* graceful: show fallback */})
      .finally(() => setUserLoading(false));
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => n.status !== 'read').length;

  const fetchNotifications = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const data = await apiFetch<Notification[]>('/notifications/me?limit=10');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {/* silently fail */}
    finally { setNotifsLoading(false); }
  }, []);

  // Load on mount, then poll every 60s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Open notif panel → refresh
  useEffect(() => {
    if (notifOpen) fetchNotifications();
  }, [notifOpen, fetchNotifications]);

  async function markOneRead(id: number) {
    try {
      await apiFetch(`/notifications/${id}/mark-read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n))
      );
    } catch {/* ignore */}
  }

  async function markAllRead() {
    try {
      setMarkingAll(true);
      await apiFetch('/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
      );
    } catch {/* ignore */}
    finally { setMarkingAll(false); }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {/* best-effort */}
    finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    }
  }

  // ── Click-outside to close dropdowns ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Avatar initials ───────────────────────────────────────────────────────
  const initials = user
    ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
    : 'AU';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex h-20 items-center justify-between px-8">

        {/* Title */}
        <div className="animate-slide-in-left">
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="relative flex items-center">
            <div
              className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
                searchOpen ? 'w-64' : 'w-10'
              }`}
            >
              {searchOpen && (
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients, appointments…"
                  className="input-modern pr-10 text-sm animate-fade-in w-full"
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
                  }}
                />
              )}
              <button
                onClick={() => {
                  if (searchOpen && searchQuery) setSearchQuery('');
                  setSearchOpen(!searchOpen);
                }}
                className={`${
                  searchOpen
                    ? 'absolute right-3 top-1/2 -translate-y-1/2'
                    : 'w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center'
                } transition-all hover:scale-105`}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
              >
                {searchOpen && searchQuery
                  ? <X size={16} className="text-muted-foreground" />
                  : <Search size={18} className="text-muted-foreground" />
                }
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-all hover:scale-105"
              aria-label="Notifications"
            >
              <Bell size={18} className="text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-96 max-h-[520px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      disabled={markingAll}
                      className="flex items-center gap-1.5 text-xs text-secondary hover:text-secondary/80 font-medium transition-colors"
                    >
                      {markingAll
                        ? <Loader2 size={12} className="animate-spin" />
                        : <CheckCheck size={14} />
                      }
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                  {notifsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-secondary" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                        <Bell size={24} className="text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">All caught up!</p>
                      <p className="text-sm text-muted-foreground mt-1">No notifications to display.</p>
                    </div>
                  ) : (
                    <ul>
                      {notifications.map((n) => {
                        const isUnread = n.status !== 'read';
                        return (
                          <li
                            key={n.id}
                            className={`flex gap-3 px-5 py-3.5 border-b border-border/60 last:border-0 cursor-pointer transition-colors ${
                              isUnread ? 'bg-brand-teal-light/30 hover:bg-brand-teal-light/50' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => isUnread && markOneRead(n.id)}
                          >
                            {/* Color dot */}
                            <div className="mt-0.5 flex-shrink-0">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold ${notifDot(n.type)}`}
                              >
                                {n.type.charAt(0).toUpperCase()}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              {n.subject && (
                                <p className={`text-sm font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {n.subject}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {timeAgo(n.sent_at ?? n.created_at)}
                              </p>
                            </div>

                            {isUnread && (
                              <div className="mt-1.5 flex-shrink-0">
                                <span className="w-2 h-2 rounded-full bg-secondary block" />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border px-5 py-3">
                  <button
                    onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                    className="w-full text-sm text-center text-secondary hover:text-secondary/80 font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    View all notifications <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-3 p-2 pr-4 rounded-xl hover:bg-muted transition-all group"
              aria-label="Profile menu"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-soft group-hover:shadow-medium transition-shadow flex-shrink-0 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : userLoading ? (
                  <Loader2 size={16} className="text-white animate-spin" />
                ) : (
                  <span className="text-white font-bold text-sm">{initials}</span>
                )}
              </div>

              {/* Name + role */}
              <div className="text-left hidden sm:block">
                {userLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-muted-foreground/20 rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-muted-foreground/10 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {user ? `${user.first_name} ${user.last_name}` : 'Admin User'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {user ? roleLabel(user.role) : 'Administrator'}
                    </p>
                  </>
                )}
              </div>
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-14 w-72 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up z-50">
                {/* User info header */}
                <div className="px-5 py-4 bg-gradient-to-br from-brand-navy/5 to-brand-teal/5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center shadow-soft flex-shrink-0 overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {user?.full_name ?? 'Admin User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email ?? '—'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-brand-teal-light text-secondary text-[10px] font-semibold capitalize">
                        {user ? roleLabel(user.role) : 'Administrator'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button
                    onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-brand-teal-light flex items-center justify-center transition-colors">
                      <Settings size={15} className="text-muted-foreground group-hover:text-secondary transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Settings</p>
                      <p className="text-xs text-muted-foreground">Profile, security & preferences</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </button>

                  <div className="my-1.5 h-px bg-border mx-2" />

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-destructive/15 flex items-center justify-center transition-colors">
                      {loggingOut
                        ? <Loader2 size={15} className="text-destructive animate-spin" />
                        : <LogOut size={15} className="text-muted-foreground group-hover:text-destructive transition-colors" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${loggingOut ? 'text-muted-foreground' : 'text-foreground group-hover:text-destructive transition-colors'}`}>
                        {loggingOut ? 'Signing out…' : 'Sign Out'}
                      </p>
                      <p className="text-xs text-muted-foreground">Log out of all sessions</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;