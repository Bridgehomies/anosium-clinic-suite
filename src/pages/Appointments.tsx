import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, User, Stethoscope, X, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import appointmentService, {
  Appointment, AppointmentStatus, STATUS_DISPLAY, to12Hour,
} from '@/lib/appointmentService';
import { format } from 'date-fns';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  '08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM',
];

const RESCHEDULE_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30',
];

function apptTime(apt: Appointment) {
  return to12Hour(apt.appointment_time);
}

function doctorName(apt: Appointment) {
  const d = apt.doctor;
  if (!d) return `Doctor #${apt.doctor_id}`;
  if (d.user?.full_name) return `Dr. ${d.user.full_name}`;
  if (d.user?.first_name) return `Dr. ${d.user.first_name} ${d.user.last_name ?? ''}`.trim();
  return `Doctor #${apt.doctor_id}`;
}

function patientName(apt: Appointment) {
  const p = apt.patient;
  if (!p) return `Patient #${apt.patient_id}`;
  return p.full_name ?? `${p.first_name} ${p.last_name}`;
}

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  confirmed: 'status-active', scheduled: 'status-pending',
  checked_in: 'status-pending', in_progress: 'status-pending',
  completed: 'status-active', cancelled: 'status-cancelled',
  no_show: 'status-cancelled', rescheduled: 'status-inactive',
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  confirmed: 'bg-emerald-500', scheduled: 'bg-slate-400',
  checked_in: 'bg-amber-500', in_progress: 'bg-amber-500',
  completed: 'bg-emerald-600', cancelled: 'bg-red-400',
  no_show: 'bg-red-400', rescheduled: 'bg-blue-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

const Appointments = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // API state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [editModalOpen,       setEditModalOpen]       = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelDialogOpen,    setCancelDialogOpen]    = useState(false);
  const [selectedApt,         setSelectedApt]         = useState<Appointment | null>(null);
  const [actionLoading,       setActionLoading]       = useState(false);

  // Edit form
  const [editNotes,  setEditNotes]  = useState('');
  const [editStatus, setEditStatus] = useState<AppointmentStatus>('scheduled');

  // Reschedule form
  const [rescheduleTime,   setRescheduleTime]   = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Cancel form
  const [cancelReason, setCancelReason] = useState('');

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const res = await appointmentService.getAppointments({
        page,
        page_size: 20,
        from_date: dateStr,
        to_date: dateStr,
      });
      setAppointments(res.items);
      setTotalPages(res.total_pages);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [currentDate, page]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Date nav ────────────────────────────────────────────────────────────────
  const navigate = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
    setPage(1);
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (apt: Appointment) => {
    setSelectedApt(apt);
    setEditNotes(apt.notes ?? '');
    setEditStatus(apt.status);
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedApt) return;
    setActionLoading(true);
    try {
      const updated = await appointmentService.updateAppointment(selectedApt.id, {
        notes: editNotes || null,
        status: editStatus,
      });
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setEditModalOpen(false);
      toast.success('Appointment updated');
    } catch {
      toast.error('Failed to update appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reschedule ──────────────────────────────────────────────────────────────
  const openReschedule = (apt: Appointment) => {
    setSelectedApt(apt);
    setRescheduleTime('');
    setRescheduleReason('');
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedApt || !rescheduleTime || !rescheduleReason) return;
    setActionLoading(true);
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const updated = await appointmentService.rescheduleAppointment(
        selectedApt.id, dateStr, rescheduleTime, rescheduleReason
      );
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setRescheduleModalOpen(false);
      toast.success('Appointment rescheduled');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to reschedule');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const openCancel = (apt: Appointment) => {
    setSelectedApt(apt);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCancel = async () => {
    if (!selectedApt) return;
    setActionLoading(true);
    try {
      await appointmentService.cancelAppointment(selectedApt.id, cancelReason || 'Cancelled by staff');
      setAppointments(prev => prev.map(a =>
        a.id === selectedApt.id ? { ...a, status: 'cancelled' as AppointmentStatus } : a
      ));
      setCancelDialogOpen(false);
      toast.success('Appointment cancelled');
    } catch {
      toast.error('Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Book callback ───────────────────────────────────────────────────────────
  const handleBookAppointment = (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
    toast.success('Appointment booked');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Appointments" subtitle="Manage patient appointments">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start">
            <button onClick={() => navigate(-1)} className="btn-ghost p-1.5 sm:p-2"><ChevronLeft size={18} /></button>
            <h2 className="font-display font-semibold text-sm md:text-lg text-center min-w-[180px]">
              {currentDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </h2>
            <button onClick={() => navigate(1)} className="btn-ghost p-1.5 sm:p-2"><ChevronRight size={18} /></button>
          </div>
          <div className="flex gap-2 sm:gap-3 justify-between sm:justify-end">
            <div className="flex rounded-lg bg-muted p-0.5 sm:p-1">
              {(['list','calendar'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all capitalize ${view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => setBookingModalOpen(true)} className="btn-accent">
              <Plus size={18} />
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'list' ? (
        <>
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[800px]">
                <thead>
                  <tr><th>Patient</th><th>Doctor</th><th>Time</th><th>Type</th><th className="hidden md:table-cell">Duration</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No appointments for this day</td></tr>
                  ) : appointments.map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm md:text-base truncate max-w-[100px] md:max-w-none">{patientName(apt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Stethoscope size={14} className="text-secondary flex-shrink-0" />
                          <span className="text-sm truncate max-w-[80px] md:max-w-none">{doctorName(apt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{apptTime(apt)}</span>
                        </div>
                      </td>
                      <td className="text-sm capitalize">{apt.appointment_type.replace(/_/g, ' ')}</td>
                      <td className="hidden md:table-cell text-sm">{apt.duration_minutes} min</td>
                      <td>
                        <span className={`status-badge ${STATUS_BADGE_CLASS[apt.status]}`}>
                          {STATUS_DISPLAY[apt.status]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 md:gap-2">
                          <button onClick={() => openEdit(apt)}
                            className="inline-flex items-center justify-center h-7 md:h-8 px-2 md:px-3 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors text-xs font-medium">
                            Edit
                          </button>
                          <button onClick={() => openReschedule(apt)}
                            className="hidden sm:inline-flex items-center justify-center h-7 md:h-8 px-2 md:px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium">
                            Reschedule
                          </button>
                          {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                            <button onClick={() => openCancel(apt)}
                              className="inline-flex items-center justify-center h-7 md:h-8 w-7 md:w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1.5 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      ) : (
        /* Calendar View */
        <div className="card-elevated p-4 md:p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-2 md:gap-4">
            <div className="space-y-2 md:space-y-4">
              {TIME_SLOTS.map(time => (
                <div key={time} className="h-16 md:h-20 flex items-start text-xs md:text-sm text-muted-foreground">{time}</div>
              ))}
            </div>
            <div className="relative border-l border-border pl-2 md:pl-4 space-y-2 md:space-y-4">
              {TIME_SLOTS.map(time => (
                <div key={time} className="h-16 md:h-20 border-b border-border/50 relative">
                  {appointments.filter(apt => apptTime(apt) === time).map(apt => (
                    <div key={apt.id} onClick={() => openEdit(apt)}
                      className={`absolute top-0 left-0 right-2 md:right-4 p-2 md:p-3 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] ${
                        apt.status === 'cancelled' ? 'bg-destructive/10 border-l-4 border-destructive' : 'bg-accent border-l-4 border-secondary'}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{patientName(apt)}</p>
                          <p className="text-xs text-muted-foreground truncate">{doctorName(apt)} • {apt.appointment_type.replace(/_/g,' ')}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[apt.status]}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <AppointmentBookingModal open={bookingModalOpen} onOpenChange={setBookingModalOpen} onBookAppointment={handleBookAppointment} />

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Appointment</DialogTitle><DialogDescription>Update appointment details</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={v => setEditStatus(v as AppointmentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {(Object.keys(STATUS_DISPLAY) as AppointmentStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_DISPLAY[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditModalOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleEdit} disabled={actionLoading} className="btn-accent">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reschedule Appointment</DialogTitle><DialogDescription>Select a new time and provide a reason</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="mb-3 block">Select New Time</Label>
              <div className="grid grid-cols-3 gap-2">
                {RESCHEDULE_SLOTS.map(t => {
                  const label = to12Hour(t);
                  return (
                    <button key={t} onClick={() => setRescheduleTime(t)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${rescheduleTime === t ? 'bg-secondary text-secondary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for rescheduling</Label>
              <Input value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} placeholder="e.g. Patient requested new time" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setRescheduleModalOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleReschedule} disabled={actionLoading || !rescheduleTime || !rescheduleReason} className="btn-accent disabled:opacity-50">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reschedule'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel the appointment for "{selectedApt ? patientName(selectedApt) : ''}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason (optional)" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Appointments;