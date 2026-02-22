import { Building2, Plus, Search, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EmptyState } from '../components/SharedUI';
import { ClinicStats, LoadingState } from '../types/superAdmin.types';

interface ClinicsTabProps {
  clinics: ClinicStats[];
  loading: LoadingState;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddClinic: () => void;
  onToggleStatus: (clinic: ClinicStats) => void;
  onDeleteClick: (clinic: ClinicStats) => void;
}

export const ClinicsTab = ({
  clinics,
  loading,
  searchQuery,
  onSearchChange,
  onAddClinic,
  onToggleStatus,
  onDeleteClick,
}: ClinicsTabProps) => {
  const filtered = clinics.filter(
    c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Clinic Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage all clinic locations and their settings</p>
        </div>
        <Button onClick={onAddClinic} className="bg-brand-navy hover:bg-brand-navy/90 shadow-md" disabled={loading.page}>
          <Plus className="w-4 h-4 mr-2" />Add Clinic
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map(clinic => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              isLoading={loading.clinicAction === clinic.id}
              onToggleStatus={onToggleStatus}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={Building2} title="No Clinics Found" description="No clinics match your search criteria." />
      )}
    </div>
  );
};

// ─── Clinic Card (sub-component) ──────────────────────────────────────────────

interface ClinicCardProps {
  clinic: ClinicStats;
  isLoading: boolean;
  onToggleStatus: (clinic: ClinicStats) => void;
  onDeleteClick: (clinic: ClinicStats) => void;
}

const ClinicCard = ({ clinic, isLoading, onToggleStatus, onDeleteClick }: ClinicCardProps) => (
  <div className="card-elevated p-6 hover:shadow-xl transition-all group">
    {/* Header */}
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-navy/10 flex items-center justify-center group-hover:bg-brand-navy/20 transition-colors">
          <Building2 className="w-6 h-6 text-brand-navy" />
        </div>
        <div>
          <h3 className="font-semibold text-lg leading-tight">{clinic.name}</h3>
          <p className="text-sm text-muted-foreground">{clinic.email}</p>
          {clinic.city && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {clinic.city}{clinic.state ? `, ${clinic.state}` : ''}
            </p>
          )}
        </div>
      </div>
      <span className={cn(
        'px-2.5 py-1 rounded-full text-xs font-semibold border',
        clinic.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
      )}>
        {clinic.is_active ? '● Active' : '○ Inactive'}
      </span>
    </div>

    {/* Stats row */}
    <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border/60">
      <StatCell value={clinic.active_users}    label="Staff"    color="text-brand-navy" />
      <StatCell value={clinic.total_patients}  label="Patients" color="text-brand-teal" />
      <StatCell value={clinic.total_doctors}   label="Doctors"  color="text-purple-600" />
      <StatCell
        value={`$${(clinic.monthly_revenue / 1000).toFixed(0)}K`}
        label="Revenue"
        color="text-emerald-700"
        bg="bg-emerald-50"
        labelColor="text-emerald-600"
      />
    </div>

    {/* Actions */}
    <div className="flex gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'flex-1 text-xs',
          clinic.is_active
            ? 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
            : 'hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
        )}
        onClick={() => onToggleStatus(clinic)}
        disabled={isLoading}
      >
        {isLoading && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
        {clinic.is_active ? 'Deactivate' : 'Activate'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDeleteClick(clinic)}
        className="text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-700 px-3"
        disabled={isLoading}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

const StatCell = ({
  value, label, color, bg = 'bg-muted/30', labelColor = 'text-muted-foreground',
}: {
  value: number | string;
  label: string;
  color: string;
  bg?: string;
  labelColor?: string;
}) => (
  <div className={`text-center p-2 rounded-lg ${bg}`}>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
    <p className={`text-xs ${labelColor}`}>{label}</p>
  </div>
);