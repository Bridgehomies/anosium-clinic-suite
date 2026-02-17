import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Star, Clock, Users,
  Edit, Trash2, Eye, RefreshCw, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddDoctorModal, { type DoctorFormData } from '@/components/doctors/AddDoctorModal';
import EditDoctorModal, { type DoctorEditPayload } from '@/components/doctors/EditDoctorModal';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import { toast } from '@/hooks/use-toast';
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

// ─── API Types ────────────────────────────────────────────────────────────────

interface BackendDoctor {
  id: number;
  tenant_id: number;
  user_id: number;
  department_id: number | null;
  doctor_code: string;
  specialization: string;
  qualification: string | null;
  license_number: string | null;
  experience_years: number | null;
  consultation_fee: number;
  average_consultation_time: number;
  bio: string | null;
  availability_schedule: Record<string, unknown>;
  is_available: boolean;
  is_active: boolean;
  joined_date: string | null;
  created_at: string;
  updated_at: string | null;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    full_name: string;
    role: string;
    is_active: boolean;
  } | null;
  department: { id: number; name: string; code: string } | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── UI type ──────────────────────────────────────────────────────────────────

interface UIDoctor {
  id: number;
  backendId: number;
  userId: number;
  name: string;
  specialization: string;
  department: string;
  email: string;
  phone: string;
  rating: number;
  patients: number;
  availability: 'Available' | 'Busy' | 'On Leave';
  experience: string;
  isAvailable: boolean;
  isActive: boolean;
  consultationFee?: number;
  licenseNumber?: string;
  qualification?: string;
  bio?: string;
}

// ─── Phone sanitiser ──────────────────────────────────────────────────────────

function sanitizePhone(raw: string): string | null {
  if (!raw) return null;
  let s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('+')) s = '+' + s.slice(1).replace(/^0+/, '');
  else s = s.replace(/^0+/, '');
  if (!s.startsWith('+') && s.length > 0) s = '+1' + s;
  const digits = s.slice(1);
  if (digits.length < 1 || digits.length > 15) return null;
  return /^\+?[1-9]\d{1,14}$/.test(s) ? s : null;
}

// ─── API client ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail) || 'API request failed'
    );
  }
  return res.json() as Promise<T>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

// stats param reserved for when GET /doctors/{id}/stats is fixed on the backend
function mapDoctor(d: BackendDoctor, stats?: { average_rating?: number | null; total_patients?: number }): UIDoctor {
  const availability: UIDoctor['availability'] = d.is_available
    ? 'Available'
    : d.is_active
    ? 'Busy'
    : 'On Leave';
  return {
    id: d.id,
    backendId: d.id,
    userId: d.user_id,
    name: d.user?.full_name ?? `Doctor #${d.id}`,
    specialization: d.specialization,
    department: d.department?.name ?? 'General',
    email: d.user?.email ?? '',
    phone: d.user?.phone ?? 'N/A',
    rating: stats?.average_rating ?? 0,
    patients: stats?.total_patients ?? 0,
    availability,
    experience: d.experience_years != null ? `${d.experience_years} years` : 'N/A',
    isAvailable: d.is_available,
    isActive: d.is_active,
    consultationFee: d.consultation_fee,
    licenseNumber: d.license_number ?? undefined,
    qualification: d.qualification ?? undefined,
    bio: d.bio ?? undefined,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useDoctors() {
  const [doctors, setDoctors] = useState<UIDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDoctors = useCallback(async (currentPage = 1, departmentId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: '20',
        is_active: 'true',
      });
      if (departmentId) params.set('department_id', String(departmentId));

      const data = await apiFetch<PaginatedResponse<BackendDoctor>>(`/doctors?${params}`);

      // Stats endpoint (GET /doctors/{id}/stats) currently returns 500 on the server.
      // Map doctors without stats — rating and patient count will show as 0/N/A until
      // the backend is fixed. Remove this comment and restore enrichment then.
      const mapped = data.items.map((d) => mapDoctor(d));

      setDoctors(mapped);
      setPage(data.page);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  return { doctors, setDoctors, loading, error, page, totalPages, fetchDoctors };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Doctors = () => {
  const { doctors, setDoctors, loading, error, page, totalPages, fetchDoctors } = useDoctors();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Each operation uses a separate doctor state to avoid conflicts
  const [selectedDoctor, setSelectedDoctor] = useState<UIDoctor | null>(null);   // delete
  const [editingDoctor, setEditingDoctor] = useState<UIDoctor | null>(null);     // edit
  const [schedulingDoctor, setSchedulingDoctor] = useState<UIDoctor | null>(null); // schedule

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Client-side filter
  const filteredDoctors = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAvailability === 'All' || d.availability === filterAvailability;
    return matchesSearch && matchesFilter;
  });

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAddDoctor = async (doctorData: DoctorFormData) => {
    try {
      const cleanPhone = doctorData.sanitizedPhone || sanitizePhone(doctorData.phone);
      if (!cleanPhone) {
        toast({ title: 'Invalid Phone', description: 'Enter a valid phone number.', variant: 'destructive' });
        return;
      }
      const nameParts = doctorData.name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
      const newUser = await apiFetch<{ id: number }>('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: doctorData.email,
          first_name: nameParts[0] || 'Doctor',
          last_name: nameParts.slice(1).join(' ') || 'Doctor',
          phone: cleanPhone,
          role: 'doctor',
          password: `TempPass${Math.random().toString(36).slice(2, 10)}!1`,
        }),
      });

      const expYears: number | undefined =
        doctorData.experienceYears !== undefined
          ? doctorData.experienceYears
          : (() => {
              const y = parseInt((doctorData.experience ?? '').replace(/[^\d]/g, ''), 10);
              return !isNaN(y) && y >= 0 && y <= 70 ? y : undefined;
            })();

      const doctorPayload: Record<string, unknown> = {
        user_id: newUser.id,
        specialization: doctorData.specialization,
      };
      if (expYears !== undefined) doctorPayload.experience_years = expYears;
      if (doctorData.experience?.trim()) doctorPayload.qualification = doctorData.experience.trim();
      if (doctorData.bio?.trim()) doctorPayload.bio = doctorData.bio.trim();

      await apiFetch<BackendDoctor>('/doctors', {
        method: 'POST',
        body: JSON.stringify(doctorPayload),
      });
      toast({ title: 'Doctor Added', description: `${doctorData.name} has been added successfully.` });
      fetchDoctors();
    } catch (err) {
      toast({
        title: 'Error Adding Doctor',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    }
  };

  // ── Edit (open modal) ────────────────────────────────────────────────────────
  const openEditModal = (doctor: UIDoctor) => {
    setEditingDoctor(doctor);
    setEditModalOpen(true);
  };

  // ── Edit (save) — uses PUT, not PATCH (backend returns 405 on PATCH) ─────────
  const handleEditSave = async (id: number, payload: DoctorEditPayload) => {
    const { first_name, last_name, phone: userPhone, is_available, ...doctorFields } = payload;

    // PUT /doctors/{id} — profile fields (NOT is_available; that has its own endpoint)
    const updated = await apiFetch<BackendDoctor>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorFields),
    });

    // PUT /doctors/{id}/availability — only if availability changed
    if (is_available !== undefined && editingDoctor && is_available !== editingDoctor.isAvailable) {
      await apiFetch(`/doctors/${id}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ is_available }),
      });
    }

    // PUT /users/{userId} — only if user-level fields changed
    const userChanges: Record<string, unknown> = {};
    if (first_name) userChanges.first_name = first_name;
    if (last_name) userChanges.last_name = last_name;
    if (userPhone) userChanges.phone = userPhone;

    if (Object.keys(userChanges).length > 0 && editingDoctor?.userId) {
      await apiFetch(`/users/${editingDoctor.userId}`, {
        method: 'PUT',
        body: JSON.stringify(userChanges),
      });
    }

    // Reflect all changes in local state
    const merged: BackendDoctor = {
      ...updated,
      is_available: is_available !== undefined ? is_available : updated.is_available,
    };
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...mapDoctor(merged) } : d)));
  };

  // ── Schedule (open modal) ─────────────────────────────────────────────────────
  const openScheduleModal = (doctor: UIDoctor) => {
    setSchedulingDoctor(doctor);
    setScheduleModalOpen(true);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const confirmDelete = (doctor: UIDoctor) => {
    setSelectedDoctor(doctor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    setDeletingId(selectedDoctor.id);
    try {
      await apiFetch(`/doctors/${selectedDoctor.backendId}?soft_delete=true`, { method: 'DELETE' });
      setDoctors((prev) => prev.filter((d) => d.id !== selectedDoctor.id));
      toast({ title: 'Doctor Removed', description: `${selectedDoctor.name} has been removed.` });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove doctor.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSelectedDoctor(null);
    }
  };

  // ── Toggle availability ───────────────────────────────────────────────────────
  const handleToggleAvailability = async (doctor: UIDoctor) => {
    setTogglingId(doctor.id);
    try {
      // Try POST /toggle-availability first (convenience endpoint).
      // If that fails, fall back to PUT /availability with an explicit value
      // (both are in the OpenAPI spec).
      let updated: BackendDoctor;
      try {
        updated = await apiFetch<BackendDoctor>(
          `/doctors/${doctor.backendId}/toggle-availability`,
          { method: 'POST' }
        );
      } catch {
        updated = await apiFetch<BackendDoctor>(
          `/doctors/${doctor.backendId}/availability`,
          {
            method: 'PUT',
            body: JSON.stringify({ is_available: !doctor.isAvailable }),
          }
        );
      }
      const newAvailability: UIDoctor['availability'] = updated.is_available
        ? 'Available'
        : updated.is_active
        ? 'Busy'
        : 'On Leave';
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id
            ? { ...d, isAvailable: updated.is_available, isActive: updated.is_active, availability: newAvailability }
            : d
        )
      );
      toast({ title: 'Availability Updated', description: `${doctor.name} is now ${newAvailability.toLowerCase()}.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to toggle.', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Doctors" subtitle="Manage your medical staff">

      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11 w-full"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button className="btn-ghost" onClick={() => fetchDoctors(page)} title="Refresh">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              className={`btn-ghost flex-1 sm:flex-none ${showFilters ? 'bg-muted' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button className="btn-accent flex-1 sm:flex-none" onClick={() => setAddModalOpen(true)}>
              <Plus size={18} />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {['All', 'Available', 'Busy', 'On Leave'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterAvailability(status)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  filterAvailability === status
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

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-elevated p-4 md:p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle size={40} className="text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <button className="btn-outline" onClick={() => fetchDoctors()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Doctors grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 stagger-children">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="card-elevated p-4 md:p-6 group">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl sm:text-2xl">
                      {doctor.name.split(' ').filter((w) => !/^dr\.?$/i.test(w)).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-base md:text-lg text-foreground truncate">{doctor.name}</h3>
                        <p className="text-secondary font-medium text-sm">{doctor.specialization}</p>
                      </div>
                      <span
                        className={`status-badge self-start cursor-pointer transition-opacity hover:opacity-80 ${
                          doctor.availability === 'Available' ? 'status-active' : doctor.availability === 'Busy' ? 'status-pending' : 'status-inactive'
                        }`}
                        title="Click to toggle availability"
                        onClick={() => handleToggleAvailability(doctor)}
                      >
                        {togglingId === doctor.id ? '…' : doctor.availability}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground mt-1">{doctor.department} Department</p>

                    <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-3 md:mt-4">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Star size={14} className={doctor.rating > 0 ? 'text-amber-500 fill-amber-500 flex-shrink-0' : 'text-muted-foreground flex-shrink-0'} />
                        <span className="font-semibold text-sm">{doctor.rating > 0 ? doctor.rating.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                        <Users size={14} className="flex-shrink-0" />
                        <span className="text-xs md:text-sm">{doctor.patients} patients</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                        <Clock size={14} className="flex-shrink-0" />
                        <span className="text-xs md:text-sm">{doctor.experience}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 md:mt-5">
                      {/* Edit: opens edit modal */}
                      <button
                        onClick={() => openEditModal(doctor)}
                        title="Edit doctor"
                        className="btn-outline text-xs md:text-sm py-1.5 md:py-2 px-2 md:px-3 flex items-center gap-1.5 md:gap-2"
                      >
                        <Edit size={14} />
                        <span className="hidden xs:inline">Edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => confirmDelete(doctor)}
                        disabled={deletingId === doctor.id}
                        title="Remove doctor"
                        className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all text-xs md:text-sm disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Schedule: opens booking modal pre-filled with this doctor */}
                      <button
                        onClick={() => openScheduleModal(doctor)}
                        title="Book appointment with this doctor"
                        className="btn-accent text-xs md:text-sm py-1.5 md:py-2 px-3 md:px-4 ml-auto"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No doctors found matching your criteria.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button className="btn-outline px-3 py-1.5 text-sm" disabled={page <= 1 || loading} onClick={() => fetchDoctors(page - 1)}>Previous</button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button className="btn-outline px-3 py-1.5 text-sm" disabled={page >= totalPages || loading} onClick={() => fetchDoctors(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* ── Modals (order: Add → Edit → Schedule → Delete) ───────────────────── */}

      {/* 1. Add new doctor */}
      <AddDoctorModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddDoctor}
      />

      {/* 2. Edit existing doctor — PUT /doctors/{id}, not PATCH (405) */}
      <EditDoctorModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        doctor={editingDoctor ? {
          id: editingDoctor.id,
          userId: editingDoctor.userId,
          name: editingDoctor.name,
          email: editingDoctor.email,
          phone: editingDoctor.phone,
          specialization: editingDoctor.specialization,
          department: editingDoctor.department,
          experience: editingDoctor.experience,
          bio: editingDoctor.bio ?? '',
          isAvailable: editingDoctor.isAvailable,
          consultationFee: editingDoctor.consultationFee,
          licenseNumber: editingDoctor.licenseNumber,
          qualification: editingDoctor.qualification,
        } : null}
        onSave={handleEditSave}
      />

      {/* 3. Book appointment — pre-selects this doctor in the wizard */}
      <AppointmentBookingModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        preSelectedDoctor={schedulingDoctor ? {
          id: schedulingDoctor.id,
          name: schedulingDoctor.name,
          specialization: schedulingDoctor.specialization,
        } : null}
        onBookAppointment={(appt) => {
          toast({
            title: 'Appointment Booked',
            description: `${appt.patient} with ${appt.doctor} on ${appt.date.toLocaleDateString()}.`,
          });
        }}
      />

      {/* 4. Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedDoctor?.name}? The record will be
              soft-deleted and hidden from active lists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDoctor}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Doctors;