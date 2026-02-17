/**
 * Patients Page
 * Connects to the real backend API via apiClient.
 *
 * API endpoints used:
 *   GET    /api/v1/patients              – list with pagination + search + gender + is_active
 *   POST   /api/v1/patients              – create patient
 *   DELETE /api/v1/patients/{id}         – soft-delete patient
 *   GET    /api/v1/patients/{id}/history – visit history
 *   GET    /api/v1/patients/{id}/stats   – patient stats (totalVisits, outstandingBalance)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, User,
  Phone, Mail, Calendar, Trash2, Edit2,
  Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientProfileModal, { Visit, Payment } from '@/components/patients/PatientProfileModal';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import AddPatientModal, { PatientFormData } from '@/components/patients/AddPatientModal';
import EditPatientModal, { EditPatientFormData } from '@/components/patients/Editpatientmodal';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiPatient {
  id: number;
  tenant_id: number;
  patient_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email: string | null;
  phone: string;
  alternate_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  blood_group: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-' | null;
  allergies: string | null;
  chronic_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  registration_date: string;
  referred_by: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface PatientStats {
  total_visits: number;
  outstanding_balance: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Shape expected by PatientProfileModal */
interface PatientForModal {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: string;
  insuranceProvider: string;
  insuranceId: string;
  lastVisit: string;
  status: string;
  totalVisits: number;
  outstandingBalance: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toModalPatient(p: ApiPatient, stats?: PatientStats): PatientForModal {
  return {
    id: p.id,
    name: p.full_name,
    email: p.email ?? '',
    phone: p.phone,
    address: [p.address, p.city, p.state, p.postal_code].filter(Boolean).join(', '),
    dob: p.date_of_birth,
    bloodType: p.blood_group ?? 'Unknown',
    allergies: p.allergies ? p.allergies.split(',').map((a) => a.trim()) : [],
    emergencyContact: [p.emergency_contact_name, p.emergency_contact_phone]
      .filter(Boolean)
      .join(' – '),
    insuranceProvider: '',   // Not in current backend schema
    insuranceId: '',          // Not in current backend schema
    lastVisit: p.updated_at ? p.updated_at.split('T')[0] : p.registration_date,
    status: p.is_active ? 'active' : 'inactive',
    totalVisits: stats?.total_visits ?? 0,
    outstandingBalance: stats?.outstanding_balance ?? 0,
  };
}

const STATUS_OPTIONS = ['All', 'Active', 'Inactive'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const Patients = () => {
  // ── Data ─────────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Stats cache: patientId → PatientStats
  const [statsCache, setStatsCache] = useState<Record<number, PatientStats>>({});

  // ── UI ───────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('All');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // ── Fetch patients ─────────────────────────────────────────────────────────
  //
  // Params are passed explicitly so the function stays stable (no deps on
  // component state) and we never need to suppress the exhaustive-deps warning.

  const fetchPatients = useCallback(async (
    searchValue: string,
    statusValue: StatusFilter,
    pageValue: number,
  ) => {
    const fetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number | boolean> = {
        page: pageValue,
        page_size: PAGE_SIZE,
      };

      if (searchValue.trim().length >= 2) params.search = searchValue.trim();
      if (statusValue === 'Active') params.is_active = true;
      else if (statusValue === 'Inactive') params.is_active = false;

      const resp = await apiClient.get<PaginatedResponse<ApiPatient>>('/patients', { params });

      // Discard if a newer fetch has started
      if (fetchId !== fetchIdRef.current) return;

      setPatients(resp.data.items);
      setTotal(resp.data.total);
      setTotalPages(resp.data.total_pages);
    } catch (err: any) {
      if (fetchId !== fetchIdRef.current) return;
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Failed to load patients';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load patients.' });
    } finally {
      if (fetchId === fetchIdRef.current) setIsLoading(false);
    }
  }, []); // intentionally stable — all params passed at call site

  // ── Sync fetch with filter/page changes ────────────────────────────────────
  useEffect(() => {
    fetchPatients(searchTerm, filterStatus, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, page]);
  // searchTerm is handled via debounce below; filterStatus + page changes always
  // reset to consistent state before the effect fires.

  // ── Search (debounced) ─────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      // Reset page to 1 then fetch — both synchronously in this callback
      setPage(1);
      fetchPatients(value, filterStatus, 1);
    }, 400);
  };

  // ── Filter change ──────────────────────────────────────────────────────────
  // setPage + setFilterStatus both enqueue state updates, so the useEffect
  // above will fire once with the new values on the next render.
  const handleFilterChange = (status: StatusFilter) => {
    setFilterStatus(status);
    setPage(1);
  };

  // ── Fetch patient stats (lazy, cached) ────────────────────────────────────

  const fetchPatientStats = async (patientId: number): Promise<PatientStats> => {
    if (statsCache[patientId]) return statsCache[patientId];
    try {
      const resp = await apiClient.get<PatientStats>(`/patients/${patientId}/stats`);
      setStatsCache((prev) => ({ ...prev, [patientId]: resp.data }));
      return resp.data;
    } catch {
      return { total_visits: 0, outstanding_balance: 0 };
    }
  };

  // ── Fetch visits (passed to PatientProfileModal) ───────────────────────────

  const fetchVisits = async (patientId: number): Promise<Visit[]> => {
    try {
      const resp = await apiClient.get<{ visits: Visit[] }>(`/patients/${patientId}/history`);
      return resp.data.visits ?? [];
    } catch {
      throw new Error('Could not load visit history.');
    }
  };

  // ── Fetch payments (passed to PatientProfileModal) ─────────────────────────
  // TODO: wire to a real billing endpoint when available.
  const fetchPayments = async (_patientId: number): Promise<Payment[]> => {
    // Placeholder: return empty until billing API is implemented.
    return [];
  };

  // ── Open profile (also fetches stats) ─────────────────────────────────────

  const handleViewProfile = async (patient: ApiPatient) => {
    setSelectedPatient(patient);
    setProfileModalOpen(true);
    // Pre-fetch stats so the modal header shows accurate numbers
    fetchPatientStats(patient.id);
  };

  // ── Open edit (from card dropdown or profile modal) ────────────────────────

  const handleOpenEdit = (patientId: number) => {
    // If called from the profile modal, close it first then open edit
    const patient = patients.find((p) => p.id === patientId) ?? selectedPatient;
    if (!patient) return;
    setSelectedPatient(patient);
    setProfileModalOpen(false);
    setEditModalOpen(true);
  };

  // ── Save edited patient ────────────────────────────────────────────────────

  const handleSavePatient = async (patientId: number, data: EditPatientFormData): Promise<void> => {
    const payload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      email: data.email || undefined,
      phone: data.phone.replace(/[^+\d]/g, ''),
      alternate_phone: data.alternate_phone
        ? data.alternate_phone.replace(/[^+\d]/g, '')
        : undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      postal_code: data.postal_code || undefined,
      blood_group: data.blood_group || undefined,
      allergies: data.allergies || undefined,
      chronic_conditions: data.chronic_conditions || undefined,
      emergency_contact_name: data.emergency_contact_name || undefined,
      emergency_contact_phone: data.emergency_contact_phone
        ? data.emergency_contact_phone.replace(/[^+\d]/g, '')
        : undefined,
      referred_by: data.referred_by || undefined,
      notes: data.notes || undefined,
    };

    try {
      const resp = await apiClient.put<ApiPatient>(`/patients/${patientId}`, payload);
      // Update the patient in the local list optimistically
      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? resp.data : p)),
      );
      // Invalidate stats cache for this patient so fresh data is fetched next open
      setStatsCache((prev) => {
        const next = { ...prev };
        delete next[patientId];
        return next;
      });
      toast({
        title: 'Patient updated',
        description: `${resp.data.full_name}'s record has been saved.`,
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Failed to update patient';
      throw new Error(msg);
    }
  };

  // ── Add patient ────────────────────────────────────────────────────────────

  const handleAddPatient = async (formData: PatientFormData): Promise<void> => {
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    const payload = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: formData.dob,
      gender: formData.gender,               // now collected from the form
      phone: formData.phone.replace(/[^+\d]/g, ''),
      email: formData.email || undefined,
      address: formData.address || undefined,
      blood_group: formData.bloodType || undefined,
      allergies: formData.allergies || undefined,
      emergency_contact_name: formData.emergencyContact || undefined,
      emergency_contact_phone: formData.emergencyPhone
        ? formData.emergencyPhone.replace(/[^+\d]/g, '')
        : undefined,
      notes: formData.notes || undefined,
    };

    try {
      await apiClient.post<ApiPatient>('/patients', payload);
      toast({ title: 'Patient added', description: `${formData.name} registered successfully.` });
      // Refresh to page 1 so the new patient is visible
      setPage(1);
      fetchPatients(searchTerm, filterStatus, 1);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e: any) => e.msg).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Failed to add patient';
      // Re-throw as Error so the modal's catch block can display it inline
      throw new Error(msg);
    }
  };

  // ── Delete patient ─────────────────────────────────────────────────────────

  const confirmDelete = (patient: ApiPatient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    setIsDeleting(true);

    // Optimistic removal from UI
    setPatients((prev) => prev.filter((p) => p.id !== selectedPatient.id));
    setTotal((prev) => prev - 1);

    try {
      await apiClient.delete(`/patients/${selectedPatient.id}`);
      toast({
        title: 'Patient removed',
        description: `${selectedPatient.full_name} has been deactivated.`,
      });
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    } catch (err: any) {
      // Roll back on failure
      fetchPatients(searchTerm, filterStatus, page);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err?.response?.data?.detail ?? 'Could not delete patient.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Schedule appointment ───────────────────────────────────────────────────

  const handleScheduleAppointment = () => {
    setProfileModalOpen(false);
    setAppointmentModalOpen(true);
  };

  // ── Collect payment ────────────────────────────────────────────────────────
  const handleCollectPayment = (amount: number) => {
    // TODO: open payment collection flow
    toast({ title: 'Collect Payment', description: `Amount due: $${amount.toLocaleString()}` });
  };

  // ── Generate report ────────────────────────────────────────────────────────
  const handleGenerateReport = (patientId: number) => {
    // TODO: trigger report generation / download
    toast({ title: 'Report', description: `Generating report for patient #${patientId}…` });
  };

  // ── Add note ───────────────────────────────────────────────────────────────
  const handleAddNote = (patientId: number) => {
    // TODO: open note editor
    toast({ title: 'Add Note', description: `Opening note editor for patient #${patientId}…` });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const renderStatusBadge = (isActive: boolean) => (
    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
      {isActive ? 'active' : 'inactive'}
    </span>
  );

  const selectedModalPatient = selectedPatient
    ? toModalPatient(selectedPatient, statsCache[selectedPatient.id])
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Patients" subtitle={`${total} total patients`}>

      {/* ── Actions Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by name, phone or code…"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-modern pl-11 w-full"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              className={`btn-ghost flex-1 sm:flex-none ${showFilters ? 'bg-muted' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button
              className="btn-ghost flex-1 sm:flex-none"
              onClick={() => fetchPatients(searchTerm, filterStatus, page)}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              className="btn-accent flex-1 sm:flex-none"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus size={18} />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-brand-navy text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Loading Skeleton ─────────────────────────────────────────── */}
      {isLoading && patients.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-elevated p-4 md:p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-4/5" />
                <div className="h-3 bg-muted rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────────────── */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertCircle size={40} className="text-destructive" />
          <p className="text-muted-foreground max-w-sm">{error}</p>
          <button
            className="btn-outline"
            onClick={() => fetchPatients(searchTerm, filterStatus, page)}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* ── Patients Grid ─────────────────────────────────────────────── */}
      {!error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 stagger-children">
          {patients.map((patient) => (
            <div key={patient.id} className="card-elevated p-4 md:p-6 group">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy/10 to-brand-teal/10 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-brand-navy" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-sm md:text-base text-foreground truncate">
                      {patient.full_name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {renderStatusBadge(patient.is_active)}
                      <span className="text-xs text-muted-foreground">
                        #{patient.patient_code}
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-muted rounded-lg transition-opacity flex-shrink-0">
                      <MoreHorizontal size={18} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-popover">
                    <DropdownMenuItem onClick={() => handleViewProfile(patient)}>
                      <User size={14} className="mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenEdit(patient.id)}>
                      <Edit2 size={14} className="mr-2" />
                      Edit Patient
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedPatient(patient);
                        setAppointmentModalOpen(true);
                      }}
                    >
                      <Calendar size={14} className="mr-2" />
                      Book Appointment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => confirmDelete(patient)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Patient
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Card Body */}
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                {patient.email && (
                  <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                    <Mail size={12} className="flex-shrink-0" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                  <Phone size={12} className="flex-shrink-0" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                  <Calendar size={12} className="flex-shrink-0" />
                  <span>Registered: {patient.registration_date}</span>
                </div>
                {patient.blood_group && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {patient.blood_group}
                    </span>
                    {patient.age && (
                      <span className="text-xs text-muted-foreground">Age {patient.age}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground capitalize">{patient.gender}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {patient.city || patient.address || '—'}
                  </p>
                </div>
                <button
                  onClick={() => handleViewProfile(patient)}
                  className="btn-outline text-xs md:text-sm py-1.5 md:py-2 px-3 md:px-4"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────────── */}
      {!isLoading && !error && patients.length === 0 && (
        <div className="text-center py-16">
          <User size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No patients found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm
              ? 'Try a different search term or clear the filter.'
              : 'Add your first patient to get started.'}
          </p>
          {!searchTerm && (
            <button className="btn-accent mt-4" onClick={() => setAddModalOpen(true)}>
              <Plus size={16} />
              Add Patient
            </button>
          )}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && !error && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            className="btn-ghost px-4 py-2 text-sm"
            disabled={page === 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-ghost px-4 py-2 text-sm"
            disabled={page === totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <PatientProfileModal
        patient={selectedModalPatient}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        onScheduleAppointment={handleScheduleAppointment}
        onCollectPayment={handleCollectPayment}
        onGenerateReport={handleGenerateReport}
        onAddNote={handleAddNote}
        onEdit={handleOpenEdit}
        fetchVisits={fetchVisits}
        fetchPayments={fetchPayments}
      />

      <AppointmentBookingModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
      />

      <AddPatientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddPatient}
      />

      <EditPatientModal
        patient={selectedPatient}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleSavePatient}
      />

      {/* ── Delete Confirmation ─────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{selectedPatient?.full_name}</strong>? The patient will be
              deactivated and hidden from active records, but their data is
              retained for compliance purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Patients;