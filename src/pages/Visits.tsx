// Visits.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Search, FileText, Pill, Stethoscope, Calendar, ChevronRight,
  Plus, Printer, Edit, Trash2, Save, Loader2, CheckCircle2,
  Clock, CreditCard, ChevronLeft, AlertCircle, CalendarClock,
  User, ArrowRight, RefreshCw, X,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  visitService,
  Visit,
  VisitStatus,
  VisitCreatePayload,
  VisitUpdatePayload,
  Prescription,
} from '@/lib/visitService';
import appointmentService, { Appointment } from '@/lib/appointmentService';
import PatientSelect from "@/components/visits/PatientSelect";
import DoctorSelect from "@/components/visits/DoctorSelect";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisitForm {
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  chief_complaint: string;
  symptoms: string;
  diagnosis: string;
  treatment_plan: string;
  prescriptions: string;
  follow_up_required: boolean;
  follow_up_date: string;
  follow_up_notes: string;
  status: VisitStatus;
  blood_pressure: string;
  temperature: string;
  pulse: string;
  weight: string;
  height: string;
}

const emptyForm = (): VisitForm => ({
  patient_id: '',
  doctor_id: '',
  appointment_id: '',
  chief_complaint: '',
  symptoms: '',
  diagnosis: '',
  treatment_plan: '',
  prescriptions: '',
  follow_up_required: false,
  follow_up_date: '',
  follow_up_notes: '',
  status: 'in_progress',
  blood_pressure: '',
  temperature: '',
  pulse: '',
  weight: '',
  height: '',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (iso?: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
};

const fmtTime = (timeStr?: string | null) => {
  if (!timeStr) return '—';
  try {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(Number(h), Number(m));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return timeStr; }
};

const doctorName = (v: Visit) => v.doctor?.user?.full_name ?? `Dr. #${v.doctor_id}`;
const patientName = (v: Visit) => v.patient?.full_name ?? `Patient #${v.patient_id}`;

const apptTypeBadge: Record<string, string> = {
  new_consultation: 'New',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  routine_checkup: 'Checkup',
};

const apptTypeColor: Record<string, string> = {
  new_consultation: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-purple-100 text-purple-700',
  emergency: 'bg-red-100 text-red-700',
  routine_checkup: 'bg-teal-100 text-teal-700',
};

const visitToForm = (v: Visit): VisitForm => ({
  patient_id: String(v.patient_id),
  doctor_id: String(v.doctor_id),
  appointment_id: v.appointment_id ? String(v.appointment_id) : '',
  chief_complaint: v.chief_complaint ?? '',
  symptoms: (v.symptoms ?? []).join(', '),
  diagnosis: v.diagnosis ?? '',
  treatment_plan: v.treatment_plan ?? '',
  prescriptions: v.prescriptions?.map(p =>
    `${p.medicine} ${p.dosage || ''} ${p.frequency ? '– ' + p.frequency : ''} ${p.duration ? '× ' + p.duration : ''}`
  ).join('\n') ?? '',
  follow_up_required: v.follow_up_required,
  follow_up_date: v.follow_up_date ?? '',
  follow_up_notes: v.follow_up_notes ?? '',
  status: v.status,
  blood_pressure: v.vitals?.blood_pressure ?? '',
  temperature: v.vitals?.temperature != null ? String(v.vitals.temperature) : '',
  pulse: v.vitals?.pulse != null ? String(v.vitals.pulse) : '',
  weight: v.vitals?.weight != null ? String(v.vitals.weight) : '',
  height: v.vitals?.height != null ? String(v.vitals.height) : '',
});

/** Pre-fill form from an appointment */
const appointmentToForm = (appt: Appointment): VisitForm => ({
  ...emptyForm(),
  patient_id: String(appt.patient_id),
  doctor_id: String(appt.doctor_id),
  appointment_id: String(appt.id),
  chief_complaint: appt.reason ?? '',
});

const formToCreatePayload = (f: VisitForm): VisitCreatePayload => {
  const payload: VisitCreatePayload = {
    patient_id: Number(f.patient_id),
    doctor_id: Number(f.doctor_id),
    appointment_id: f.appointment_id ? Number(f.appointment_id) : undefined,
    chief_complaint: f.chief_complaint.trim() || null,
    symptoms: f.symptoms.split(',').map(s => s.trim()).filter(Boolean),
    diagnosis: f.diagnosis.trim() || null,
    treatment_plan: f.treatment_plan.trim() || null,
    follow_up_required: f.follow_up_required,
    follow_up_date: f.follow_up_date || null,
    follow_up_notes: f.follow_up_notes.trim() || null,
  };

  if (f.blood_pressure || f.temperature || f.pulse || f.weight || f.height) {
    payload.vitals = {
      blood_pressure: f.blood_pressure.trim() || null,
      temperature: f.temperature ? Number(f.temperature) : null,
      pulse: f.pulse ? Number(f.pulse) : null,
      weight: f.weight ? Number(f.weight) : null,
      height: f.height ? Number(f.height) : null,
    };
  }

  if (f.prescriptions.trim()) {
    payload.prescriptions = f.prescriptions
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => ({ medicine: line, dosage: '', frequency: '', duration: '' } as Prescription));
  }

  return payload;
};

const formToUpdatePayload = (f: VisitForm): VisitUpdatePayload => ({
  chief_complaint: f.chief_complaint.trim() || null,
  symptoms: f.symptoms.split(',').map(s => s.trim()).filter(Boolean),
  diagnosis: f.diagnosis.trim() || null,
  treatment_plan: f.treatment_plan.trim() || null,
  follow_up_required: f.follow_up_required,
  follow_up_date: f.follow_up_date || null,
  follow_up_notes: f.follow_up_notes.trim() || null,
  status: f.status,
  vitals: (f.blood_pressure || f.temperature || f.pulse || f.weight || f.height)
    ? {
        blood_pressure: f.blood_pressure.trim() || null,
        temperature: f.temperature ? Number(f.temperature) : null,
        pulse: f.pulse ? Number(f.pulse) : null,
        weight: f.weight ? Number(f.weight) : null,
        height: f.height ? Number(f.height) : null,
      }
    : null,
  prescriptions: f.prescriptions.trim()
    ? f.prescriptions.split('\n').map(l => l.trim()).filter(Boolean)
        .map(line => ({ medicine: line, dosage: '', frequency: '', duration: '' } as Prescription))
    : null,
});

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: VisitStatus }) => {
  const cfg: Record<VisitStatus, { label: string; cls: string; Icon: React.ElementType }> = {
    completed:       { label: 'Completed',       cls: 'bg-green-100 text-green-700',  Icon: CheckCircle2 },
    in_progress:     { label: 'In Progress',     cls: 'bg-blue-100 text-blue-700',    Icon: Clock        },
    pending_payment: { label: 'Pending Payment', cls: 'bg-yellow-100 text-yellow-700', Icon: CreditCard  },
  };
  const { label, cls, Icon } = cfg[status] ?? cfg.in_progress;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// ─── Pending Appointments Panel ───────────────────────────────────────────────

const PendingAppointmentsPanel = ({
  appointments,
  loading,
  onRefresh,
  onSelect,
}: {
  appointments: Appointment[];
  loading: boolean;
  onRefresh: () => void;
  onSelect: (appt: Appointment) => void;
}) => {
  const actionable = appointments.filter(
    a => !['completed', 'cancelled', 'no_show'].includes(a.status)
  );

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" />
          <span className="text-sm font-semibold">Today's Appointments</span>
          {actionable.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
              {actionable.length}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="divide-y max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : actionable.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No pending appointments today</p>
          </div>
        ) : (
          actionable.map(appt => (
            <button
              key={appt.id}
              onClick={() => onSelect(appt)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={14} className="text-primary" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {appt.patient?.full_name ?? `Patient #${appt.patient_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {appt.doctor?.user?.full_name ?? `Dr. #${appt.doctor_id}`}
                      {appt.doctor?.specialization && (
                        <span className="text-muted-foreground/60"> · {appt.doctor.specialization}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={10} />
                        {fmtTime(appt.appointment_time)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${apptTypeColor[appt.appointment_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {apptTypeBadge[appt.appointment_type] ?? appt.appointment_type}
                      </span>
                      {appt.reason && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-[120px]">
                          "{appt.reason}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Start Visit
                  </span>
                  <ArrowRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Appointment Preview Banner (shown inside create form) ────────────────────

const AppointmentBanner = ({
  appt,
  onClear,
}: {
  appt: Appointment;
  onClear: () => void;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-1">
    <CalendarClock size={16} className="text-primary mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-primary">Linked Appointment · {appt.appointment_code}</p>
      <p className="text-sm font-medium mt-0.5">{appt.patient?.full_name}</p>
      <p className="text-xs text-muted-foreground">
        {appt.doctor?.user?.full_name} · {fmtTime(appt.appointment_time)} · {fmt(appt.appointment_date)}
      </p>
    </div>
    <button
      onClick={onClear}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Unlink appointment"
    >
      <X size={14} />
    </button>
  </div>
);

// ─── Visit Form Fields ────────────────────────────────────────────────────────

const VisitFormFields = ({
  form,
  onChange,
  isCreate,
  linkedAppointment,
  onClearAppointment,
}: {
  form: VisitForm;
  onChange: (patch: Partial<VisitForm>) => void;
  isCreate: boolean;
  linkedAppointment?: Appointment | null;
  onClearAppointment?: () => void;
}) => (
  <div className="space-y-7">

    {/* Linked appointment banner */}
    {isCreate && linkedAppointment && (
      <AppointmentBanner appt={linkedAppointment} onClear={onClearAppointment!} />
    )}

    {/* ── SECTION 1: Basics ── */}
    <div className="space-y-5">
      <h4 className="text-lg font-semibold border-b pb-2">Visit Information</h4>

      {isCreate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Patient <span className="text-red-600 text-base leading-none">*</span>
            </Label>
            <PatientSelect
              value={form.patient_id}
              onChange={id => onChange({ patient_id: id })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Doctor <span className="text-red-600 text-base leading-none">*</span>
            </Label>
            <DoctorSelect
              value={form.doctor_id}
              onChange={id => onChange({ doctor_id: id })}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          Chief Complaint <span className="text-red-600 text-base leading-none">*</span>
        </Label>
        <Input
          placeholder="e.g. Severe headache and nausea for 3 days"
          value={form.chief_complaint}
          onChange={e => onChange({ chief_complaint: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Main reason for today's visit</p>
      </div>

      {!isCreate && (
        <div className="space-y-2">
          <Label>Visit Status</Label>
          <Select value={form.status} onValueChange={v => onChange({ status: v as VisitStatus })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>

    {/* ── SECTION 2: Clinical ── */}
    <div className="space-y-5">
      <h4 className="text-lg font-semibold border-b pb-2">Clinical Findings</h4>

      <div className="space-y-2">
        <Label>Symptoms <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
        <Textarea
          placeholder="headache, photophobia, vomiting, neck stiffness"
          rows={2}
          value={form.symptoms}
          onChange={e => onChange({ symptoms: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Vitals</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: 'BP (mmHg)', key: 'blood_pressure' as const, ph: '120/80' },
            { label: 'Temp (°C)', key: 'temperature' as const, ph: '37.2' },
            { label: 'Pulse (bpm)', key: 'pulse' as const, ph: '82' },
            { label: 'Weight (kg)', key: 'weight' as const, ph: '68' },
            { label: 'Height (cm)', key: 'height' as const, ph: '172' },
          ].map(({ label, key, ph }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                placeholder={ph}
                value={form[key]}
                onChange={e => onChange({ [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Diagnosis</Label>
        <Textarea
          placeholder="e.g. Tension-type headache, probable viral illness"
          rows={2}
          value={form.diagnosis}
          onChange={e => onChange({ diagnosis: e.target.value })}
        />
      </div>
    </div>

    {/* ── SECTION 3: Plan & Rx ── */}
    <div className="space-y-5">
      <h4 className="text-lg font-semibold border-b pb-2">Treatment & Medications</h4>

      <div className="space-y-2">
        <Label>Treatment Plan / Instructions</Label>
        <Textarea
          placeholder="Rest, hydrate well, avoid triggers, follow-up if no improvement in 48h..."
          rows={3}
          value={form.treatment_plan}
          onChange={e => onChange({ treatment_plan: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Prescriptions</Label>
        <Textarea
          className="font-mono text-sm leading-relaxed"
          placeholder={`Tab. Paracetamol 500 mg\n1 tab every 6–8 hours for pain/fever × 3 days\n\nTab. Domperidone 10 mg\n1 tab SOS for nausea`}
          rows={6}
          value={form.prescriptions}
          onChange={e => onChange({ prescriptions: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          One medicine per block • dosage/frequency/duration on next line
        </p>
      </div>
    </div>

    {/* ── SECTION 4: Follow-up ── */}
    <div className="space-y-5 pt-3 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Follow-up Required</Label>
        <Switch
          checked={form.follow_up_required}
          onCheckedChange={checked => onChange({ follow_up_required: checked })}
        />
      </div>

      {form.follow_up_required && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-300">
          <div className="space-y-2">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={form.follow_up_date}
              onChange={e => onChange({ follow_up_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Follow-up Notes</Label>
            <Textarea
              rows={2}
              placeholder="Review blood reports, check symptom resolution..."
              value={form.follow_up_notes}
              onChange={e => onChange({ follow_up_notes: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Visits = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selected, setSelected] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Appointments
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [linkedAppointment, setLinkedAppointment] = useState<Appointment | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const [form, setForm] = useState<VisitForm>(emptyForm());

  // ── Fetch visits ──────────────────────────────────────────────────────────

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await visitService.listVisits({ page, page_size: 20 });
      setVisits(data.items);
      setTotalPages(data.total_pages);
      if (!selected && data.items.length > 0) setSelected(data.items[0]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  // ── Fetch today's appointments ────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    setApptLoading(true);
    try {
      const data = await appointmentService.getTodayAppointments();
      setAppointments(data);
    } catch {
      // non-critical – silently ignore
    } finally {
      setApptLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Select a visit ────────────────────────────────────────────────────────

  const selectVisit = async (v: Visit) => {
    setSelected(v);
    setLoadingDetail(true);
    try {
      const detail = await visitService.getVisit(v.id);
      setSelected(detail);
    } catch {
      // fallback to list data
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Start visit from appointment ──────────────────────────────────────────

  const handleSelectAppointment = (appt: Appointment) => {
    const prefilled = appointmentToForm(appt);
    setLinkedAppointment(appt);
    setForm(prefilled);
    setAddOpen(true);
  };

  const handleClearAppointment = () => {
    setLinkedAppointment(null);
    setForm(f => ({ ...f, appointment_id: '', patient_id: '', doctor_id: '', chief_complaint: '' }));
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = visits.filter(v => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      patientName(v).toLowerCase().includes(q) ||
      doctorName(v).toLowerCase().includes(q) ||
      (v.diagnosis ?? '').toLowerCase().includes(q) ||
      v.visit_code.toLowerCase().includes(q)
    );
  });

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.patient_id || !form.doctor_id || !form.chief_complaint.trim()) {
      toast.error('Patient, Doctor and Chief Complaint are required');
      return;
    }
    setSubmitting(true);
    try {
      const created = await visitService.createVisit(formToCreatePayload(form));
      setVisits(prev => [created, ...prev]);
      setSelected(created);
      setAddOpen(false);
      setLinkedAppointment(null);
      setForm(emptyForm());
      toast.success('Visit created');
      // Refresh appointments list so the started one reflects correctly
      fetchAppointments();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected || !form.chief_complaint.trim()) {
      toast.error('Chief Complaint is required');
      return;
    }
    setSubmitting(true);
    try {
      const updated = await visitService.updateVisit(selected.id, formToUpdatePayload(form));
      setVisits(prev => prev.map(v => v.id === updated.id ? updated : v));
      setSelected(updated);
      setEditOpen(false);
      toast.success('Visit updated');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const updated = await visitService.completeVisit(selected.id);
      setVisits(prev => prev.map(v => v.id === updated.id ? updated : v));
      setSelected(updated);
      setCompleteOpen(false);
      toast.success('Visit marked completed');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to complete visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await visitService.updateVisit(selected.id, { status: 'completed' });
      const remaining = visits.filter(v => v.id !== selected.id);
      setVisits(remaining);
      setSelected(remaining[0] ?? null);
      setDeleteOpen(false);
      toast.success('Visit removed');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove visit');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!selected) return;
    const w = window.open('', '_blank');
    if (!w) return;

    const rx = selected.prescriptions?.map(p =>
      `  • ${p.medicine} ${p.dosage || ''} ${p.frequency ? '– ' + p.frequency : ''} ${p.duration ? '× ' + p.duration : ''}`
    ).join('\n') || '  None';

    const syms = selected.symptoms?.join(', ') || '—';
    const v = selected.vitals;
    const vitalsStr = v
      ? `BP ${v.blood_pressure ?? '—'} | Temp ${v.temperature ?? '—'}°C | Pulse ${v.pulse ?? '—'} | Wt ${v.weight ?? '—'} kg`
      : 'Not recorded';

    w.document.write(`<html><head><title>Visit ${selected.visit_code}</title>
<style>body{font-family:system-ui,sans-serif;padding:3rem;line-height:1.6}pre{white-space:pre-wrap}</style>
</head><body><pre>
VISIT ${selected.visit_code}
${'='.repeat(40)}

PATIENT: ${patientName(selected)}
DOCTOR : ${doctorName(selected)}
DATE   : ${fmt(selected.visit_date)}
STATUS : ${selected.status.toUpperCase().replace('_', ' ')}

VITALS
------
${vitalsStr}

CHIEF COMPLAINT
---------------
${selected.chief_complaint}

SYMPTOMS
--------
${syms}

DIAGNOSIS
---------
${selected.diagnosis ?? '—'}

TREATMENT PLAN
--------------
${selected.treatment_plan ?? '—'}

PRESCRIPTIONS
-------------
${rx}

FOLLOW-UP
---------
${selected.follow_up_required ? `Yes - ${fmt(selected.follow_up_date)}\nNotes: ${selected.follow_up_notes ?? '—'}` : 'Not required'}

${'─'.repeat(60)}
Generated: ${new Date().toLocaleString()}
</pre></body></html>`);
    w.document.close();
    w.print();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Visits" subtitle="Patient visits & clinical records">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left – List + Appointments Panel */}
        <div className="lg:col-span-1 space-y-4">

          {/* Pending Appointments Panel */}
          <PendingAppointmentsPanel
            appointments={appointments}
            loading={apptLoading}
            onRefresh={fetchAppointments}
            onSelect={handleSelectAppointment}
          />

          {/* Search + New Visit */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patients, diagnosis..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={() => { setLinkedAppointment(null); setForm(emptyForm()); setAddOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 whitespace-nowrap"
            >
              <Plus size={18} /> New Visit
            </button>
          </div>

          {/* Visits list */}
          <div className="space-y-3 max-h-[calc(100vh-520px)] overflow-y-auto pr-2">
            {loading ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <Loader2 size={36} className="animate-spin mb-4" />
                <p>Loading visits...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-destructive">
                <AlertCircle size={40} className="mx-auto mb-3" />
                <p>{error}</p>
                <button onClick={fetchVisits} className="mt-4 px-4 py-2 border rounded hover:bg-muted">Retry</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-40" />
                <p>No visits found</p>
              </div>
            ) : (
              filtered.map(v => (
                <button
                  key={v.id}
                  onClick={() => selectVisit(v)}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selected?.id === v.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/40 bg-card'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold truncate">{patientName(v)}</h3>
                    <ChevronRight size={16} className={`text-muted-foreground transition-transform ${selected?.id === v.id ? 'rotate-90' : ''}`} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {v.diagnosis || v.chief_complaint}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar size={12} /> {fmt(v.visit_date)} • {doctorName(v)}
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={v.status} />
                  </div>
                </button>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 disabled:opacity-40">
                <ChevronLeft size={18} />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 disabled:opacity-40">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right – Detail */}
        <div className="lg:col-span-2 card-elevated p-5 md:p-7">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p>Loading visit details...</p>
            </div>
          ) : !selected ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <FileText size={64} className="mb-6 opacity-30" />
              <p className="text-xl font-medium">No visit selected</p>
              <p className="mt-2">Choose a visit from the list, or pick an appointment above to start one</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                <div>
                  <h2 className="text-2xl font-bold">{patientName(selected)}</h2>
                  <p className="text-muted-foreground mt-1">
                    {selected.visit_code} • {fmt(selected.visit_date)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={selected.status} />
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                    title="Remove visit"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
                <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stethoscope size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="font-medium">{doctorName(selected)}</p>
                    {selected.doctor?.specialization && (
                      <p className="text-xs text-muted-foreground">{selected.doctor.specialization}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Calendar size={20} className="text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                    <p className="font-medium">
                      {selected.follow_up_required ? fmt(selected.follow_up_date) : 'Not required'}
                    </p>
                  </div>
                </div>
              </div>

              {selected.vitals && (
                <div className="mb-7">
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-3">Vitals</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'BP', value: selected.vitals.blood_pressure },
                      { label: 'Temp', value: selected.vitals.temperature ? `${selected.vitals.temperature} °C` : null },
                      { label: 'Pulse', value: selected.vitals.pulse ? `${selected.vitals.pulse} bpm` : null },
                      { label: 'Weight', value: selected.vitals.weight ? `${selected.vitals.weight} kg` : null },
                    ].map(({ label, value }) => value && (
                      <div key={label} className="p-3 bg-muted/40 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {selected.chief_complaint && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText size={16} /> Chief Complaint
                    </h3>
                    <p className="p-4 bg-muted/30 rounded-xl">{selected.chief_complaint}</p>
                  </div>
                )}

                {selected.symptoms?.length ? (
                  <div>
                    <h3 className="font-semibold mb-2">Symptoms</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.symptoms.map(s => (
                        <span key={s} className="px-3 py-1 bg-muted rounded-full text-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.diagnosis && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText size={16} /> Diagnosis
                    </h3>
                    <p className="p-4 bg-muted/30 rounded-xl">{selected.diagnosis}</p>
                  </div>
                )}

                {selected.treatment_plan && (
                  <div>
                    <h3 className="font-semibold mb-2">Treatment Plan</h3>
                    <p className="p-4 bg-muted/30 rounded-xl whitespace-pre-wrap">{selected.treatment_plan}</p>
                  </div>
                )}

                {selected.prescriptions?.length ? (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Pill size={16} /> Prescriptions
                    </h3>
                    <div className="space-y-3">
                      {selected.prescriptions.map((p, i) => (
                        <div key={i} className="p-4 bg-muted/30 rounded-xl">
                          <p className="font-medium">{p.medicine}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.dosage && `${p.dosage} • `}
                            {p.frequency && `${p.frequency} • `}
                            {p.duration && `× ${p.duration}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.follow_up_notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Follow-up Notes</h3>
                    <p className="p-4 bg-muted/30 rounded-xl">{selected.follow_up_notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button
                  onClick={() => { setForm(visitToForm(selected)); setEditOpen(true); }}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Edit size={18} /> Edit Visit
                </button>

                {selected.status === 'in_progress' && (
                  <button
                    onClick={() => setCompleteOpen(true)}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Mark Complete
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="flex-1 border py-2.5 rounded-lg hover:bg-muted flex items-center justify-center gap-2"
                >
                  <Printer size={18} /> Print Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={addOpen || editOpen} onOpenChange={open => {
        if (!open) {
          setAddOpen(false);
          setEditOpen(false);
          if (!editOpen) setLinkedAppointment(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">
              {addOpen ? 'New Visit' : 'Edit Visit'}
            </DialogTitle>
            <DialogDescription>
              {addOpen
                ? linkedAppointment
                  ? `Starting visit for ${linkedAppointment.patient?.full_name} · Appointment ${linkedAppointment.appointment_code}`
                  : 'Record a new patient consultation'
                : 'Update visit details'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <VisitFormFields
              form={form}
              onChange={patch => setForm(f => ({ ...f, ...patch }))}
              isCreate={addOpen}
              linkedAppointment={linkedAppointment}
              onClearAppointment={handleClearAppointment}
            />
          </div>

          <DialogFooter className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              onClick={() => { addOpen ? setAddOpen(false) : setEditOpen(false); if (addOpen) setLinkedAppointment(null); }}
              className="px-5 py-2.5 border rounded-lg hover:bg-muted"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={addOpen ? handleCreate : handleUpdate}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70"
              disabled={submitting}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {addOpen ? 'Create Visit' : 'Save Changes'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete dialog */}
      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Visit</AlertDialogTitle>
            <AlertDialogDescription>
              Mark visit for <strong>{selected ? patientName(selected) : ''}</strong> as completed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Completing…' : 'Yes, Complete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Visit</AlertDialogTitle>
            <AlertDialogDescription>
              Remove visit for <strong>{selected ? patientName(selected) : ''}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submitting}
            >
              {submitting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Visits;