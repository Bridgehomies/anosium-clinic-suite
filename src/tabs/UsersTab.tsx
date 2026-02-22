import { Users, UserPlus, Search, Filter, Mail, RefreshCw, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { EmptyState } from '../components/SharedUI';
import { getRoleBadgeColor, getRoleIcon } from '../utils/superAdmin.utils';
import { User, UserRole, LoadingState, ClinicStats } from '../types/superAdmin.types';

interface UsersTabProps {
  users: User[];
  clinics: ClinicStats[];
  loading: LoadingState;
  searchQuery: string;
  roleFilter: UserRole | 'all';
  onSearchChange: (q: string) => void;
  onRoleFilterChange: (role: UserRole | 'all') => void;
  onAddUser: () => void;
  onToggleStatus: (user: User) => void;
  onDeleteClick: (user: User) => void;
  onResendInvite: (userId: number) => void;
}

export const UsersTab = ({
  users,
  clinics,
  loading,
  searchQuery,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
  onAddUser,
  onToggleStatus,
  onDeleteClick,
  onResendInvite,
}: UsersTabProps) => {
  const filtered = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUserClick = () => {
    onAddUser();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and their access levels</p>
        </div>
        <Button className="bg-brand-teal hover:bg-brand-teal/90 shadow-md" onClick={handleAddUserClick}>
          <UserPlus className="w-4 h-4 mr-2" />Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={v => onRoleFilterChange(v as any)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="receptionist">Receptionist</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="accountant">Accountant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {['User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th
                      key={h}
                      className={cn(
                        'text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide',
                        h === 'Actions' && 'text-right'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isLoading={loading.userAction === user.id}
                    onToggleStatus={onToggleStatus}
                    onDeleteClick={onDeleteClick}
                    onResendInvite={onResendInvite}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="No Users Found" description="No users match your search criteria." />
      )}
    </div>
  );
};

// ─── User Row (sub-component) ─────────────────────────────────────────────────

interface UserRowProps {
  user: User;
  isLoading: boolean;
  onToggleStatus: (user: User) => void;
  onDeleteClick: (user: User) => void;
  onResendInvite: (userId: number) => void;
}

const UserRow = ({ user, isLoading, onToggleStatus, onDeleteClick, onResendInvite }: UserRowProps) => {
  const RoleIcon = getRoleIcon(user.role);
  return (
    <tr className="hover:bg-muted/20 transition-colors">
      {/* Name / email */}
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-teal/20 flex items-center justify-center text-xs font-bold text-brand-navy flex-shrink-0">
            {user.full_name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-medium text-sm leading-tight">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role badge */}
      <td className="py-3.5 px-4">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', getRoleBadgeColor(user.role))}>
          <RoleIcon className="w-3 h-3" />
          {user.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
        </span>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600')}>
          {user.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
        {!user.is_verified && (
          <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="w-3 h-3" />Pending
          </span>
        )}
      </td>

      {/* Last login */}
      <td className="py-3.5 px-4">
        <span className="text-xs text-muted-foreground">
          {user.last_login
            ? new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Never'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-4">
        <div className="flex items-center justify-end gap-1">
          {!user.is_verified && (
            <Button variant="ghost" size="sm" onClick={() => onResendInvite(user.id)} disabled={isLoading}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" title="Resend invite">
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onToggleStatus(user)} disabled={isLoading}
            className={cn('h-8 w-8 p-0', user.is_active ? 'hover:bg-amber-50 hover:text-amber-600' : 'hover:bg-emerald-50 hover:text-emerald-600')}
            title={user.is_active ? 'Deactivate' : 'Activate'}>
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : user.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteClick(user)}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" disabled={isLoading} title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
};