import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, User, Stethoscope, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import appointmentService, { to24Hour, to12Hour, DoctorAvailabilitySlot } from '@/lib/appointmentService';
import apiClient from '@/lib/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppointmentBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAppointment?: (appointment: any) => void;
  preSelectedDoctor?: { id: number; name: string; specialization: string } | null;
}

interface PatientOption { id: number; full_name: string; phone: string; }
interface DoctorOption  { id: number; name: string; specialization: string; avatar: string; }
interface ServiceOption { id: number; name: string; duration: string; price: string; }

const STEP_LABELS = ['Patient', 'Doctor & Service', 'Date & Time', 'Confirm'];

const FALLBACK_SERVICES: ServiceOption[] = [
  { id: 1, name: 'General Checkup',  duration: '30 min', price: '' },
  { id: 2, name: 'Consultation',     duration: '45 min', price: '' },
  { id: 3, name: 'Follow-up',        duration: '20 min', price: '' },
  { id: 4, name: 'Lab Work',         duration: '15 min', price: '' },
  { id: 5, name: 'Specialist Visit', duration: '60 min', price: '' },
];

const APPOINTMENT_TYPE_MAP: Record<string, 'new_consultation'|'follow_up'|'routine_checkup'> = {
  'General Checkup':  'routine_checkup',
  'Consultation':     'new_consultation',
  'Follow-up':        'follow_up',
  'Lab Work':         'new_consultation',
  'Specialist Visit': 'new_consultation',
};

// ── Component ─────────────────────────────────────────────────────────────────

const AppointmentBookingModal = ({
  open, onOpenChange, onBookAppointment, preSelectedDoctor,
}: AppointmentBookingModalProps) => {
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Data state
  const [patients,  setPatients]  = useState<PatientOption[]>([]);
  const [doctors,   setDoctors]   = useState<DoctorOption[]>([]);
  const [services,  setServices]  = useState<ServiceOption[]>(FALLBACK_SERVICES);
  const [availableSlots, setAvailableSlots] = useState<DoctorAvailabilitySlot[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors,  setLoadingDoctors]  = useState(false);
  const [loadingSlots,    setLoadingSlots]    = useState(false);

  // Selections
  const [selectedPatientId,  setSelectedPatientId]  = useState<number | null>(null);
  const [selectedDoctorId,   setSelectedDoctorId]   = useState<number | null>(null);
  const [selectedServiceId,  setSelectedServiceId]  = useState<number | null>(null);
  const [selectedDate,       setSelectedDate]        = useState<Date | undefined>();
  const [selectedTime,       setSelectedTime]        = useState('');
  const [notes,              setNotes]               = useState('');

  // ── Fetch patients on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoadingPatients(true);
    apiClient.get('/patients', { params: { page: 1, page_size: 50 } })
      .then(res => {
        const items = res.data?.items ?? [];
        setPatients(items.map((p: any) => ({
          id: p.id,
          full_name: p.full_name ?? `${p.first_name} ${p.last_name}`,
          phone: p.phone,
        })));
      })
      .catch(() => toast.error('Could not load patients'))
      .finally(() => setLoadingPatients(false));
  }, [open]);

  // ── Fetch doctors on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setLoadingDoctors(true);
    apiClient.get('/doctors', { params: { page: 1, page_size: 50, is_active: true } })
      .then(res => {
        const items = res.data?.items ?? [];
        const mapped: DoctorOption[] = items.map((d: any) => {
          const name = d.user?.full_name ?? d.user?.first_name
            ? `Dr. ${d.user.first_name} ${d.user.last_name}`
            : `Doctor #${d.id}`;
          const initials = name.replace(/^Dr\.\s*/i, '').split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
          return { id: d.id, name, specialization: d.specialization, avatar: initials };
        });
        // Merge preSelectedDoctor if not present
        if (preSelectedDoctor && !mapped.find(d => d.id === preSelectedDoctor.id)) {
          const initials = preSelectedDoctor.name.replace(/^Dr\.\s*/i, '').split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
          mapped.unshift({ id: preSelectedDoctor.id, name: preSelectedDoctor.name, specialization: preSelectedDoctor.specialization, avatar: initials });
        }
        setDoctors(mapped);
      })
      .catch(() => toast.error('Could not load doctors'))
      .finally(() => setLoadingDoctors(false));
  }, [open, preSelectedDoctor]);

  // ── Fetch services ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    apiClient.get('/services', { params: { page: 1, page_size: 50, is_active: true } })
      .then(res => {
        const items = res.data?.items ?? [];
        if (items.length === 0) return;
        setServices(items.map((s: any) => ({
          id: s.id,
          name: s.name,
          duration: s.estimated_duration_minutes ? `${s.estimated_duration_minutes} min` : '30 min',
          price: s.base_price ? `$${(s.base_price / 100).toFixed(0)}` : '',
        })));
      })
      .catch(() => { /* Keep fallback services */ });
  }, [open]);

  // ── Pre-select doctor ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open && preSelectedDoctor) {
      setSelectedDoctorId(preSelectedDoctor.id);
    }
  }, [open, preSelectedDoctor]);

  // ── Fetch available slots when doctor + date selected ─────────────────────
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    setLoadingSlots(true);
    setSelectedTime('');
    appointmentService.getDoctorAvailability(selectedDoctorId, dateStr, dateStr)
      .then(slots => setAvailableSlots(slots.filter(s => s.is_available)))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctorId, selectedDate]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor  = doctors.find(d => d.id === selectedDoctorId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  const timeOptions = availableSlots.length > 0
    ? availableSlots.map(s => to12Hour(s.time))
    : ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
       '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'];

  const canProceed = () => {
    switch (step) {
      case 1: return selectedPatientId !== null;
      case 2: return selectedDoctorId !== null && selectedServiceId !== null;
      case 3: return selectedDate !== undefined && selectedTime !== '';
      case 4: return true;
      default: return false;
    }
  };

  const handleBook = async () => {
    if (!selectedPatientId || !selectedDoctorId || !selectedDate || !selectedTime) return;
    setIsBooking(true);
    try {
      const appointment = await appointmentService.createAppointment({
        patient_id: selectedPatientId,
        doctor_id: selectedDoctorId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: to24Hour(selectedTime),
        appointment_type: APPOINTMENT_TYPE_MAP[selectedService?.name ?? ''] ?? 'new_consultation',
        duration_minutes: selectedService?.duration
          ? parseInt(selectedService.duration)
          : 30,
        notes: notes || undefined,
      });
      setIsComplete(true);
      setTimeout(() => {
        onBookAppointment?.(appointment);
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.log('[Booking Error Detail]', JSON.stringify(err?.response?.data, null, 2)); // ← add this
      const msg = err?.response?.data?.detail ?? 'Failed to book appointment';
      toast.error(typeof msg === 'string' ? msg : 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleClose = () => {
    setStep(1); setSelectedPatientId(null); setSelectedDoctorId(null);
    setSelectedServiceId(null); setSelectedDate(undefined); setSelectedTime('');
    setNotes(''); setIsComplete(false); setAvailableSlots([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-white">
              Book Appointment
              {preSelectedDoctor && (
                <span className="ml-2 text-sm font-normal text-white/70">with {preSelectedDoctor.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between mt-6">
            {[1,2,3,4].map(s => (
              <div key={s} className="flex items-center">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  step >= s ? 'bg-white text-brand-navy' : 'bg-white/20 text-white/60')}>
                  {isComplete && s <= step ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={cn('w-12 md:w-20 h-0.5 mx-2', step > s ? 'bg-white' : 'bg-white/20')} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/70">
            {STEP_LABELS.map(l => <span key={l}>{l}</span>)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isComplete ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">Appointment Booked!</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                {selectedPatient?.full_name} with {selectedDoctor?.name}<br />
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
              </p>
            </div>
          ) : (
            <>
              {/* Step 1 — Patient */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <label className="text-sm font-medium block">Select Patient</label>
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="space-y-2">
                      {patients.map(p => (
                        <button key={p.id} onClick={() => setSelectedPatientId(p.id)}
                          className={cn('w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                            selectedPatientId === p.id ? 'border-brand-teal bg-brand-teal/5' : 'border-border hover:border-muted-foreground/30')}>
                          <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-brand-navy" />
                          </div>
                          <div>
                            <p className="font-medium">{p.full_name}</p>
                            <p className="text-sm text-muted-foreground">{p.phone}</p>
                          </div>
                          {selectedPatientId === p.id && <CheckCircle className="w-5 h-5 text-brand-teal ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 — Doctor & Service */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Select Doctor</label>
                    {loadingDoctors ? (
                      <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {doctors.map(d => (
                          <button key={d.id} onClick={() => setSelectedDoctorId(d.id)}
                            className={cn('flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                              selectedDoctorId === d.id ? 'border-brand-teal bg-brand-teal/5' : 'border-border hover:border-muted-foreground/30')}>
                            <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              {d.avatar}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{d.name}</p>
                              <p className="text-xs text-muted-foreground">{d.specialization}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">Select Service</label>
                    <div className="space-y-2">
                      {services.map(s => (
                        <button key={s.id} onClick={() => setSelectedServiceId(s.id)}
                          className={cn('w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all',
                            selectedServiceId === s.id ? 'border-brand-teal bg-brand-teal/5' : 'border-border hover:border-muted-foreground/30')}>
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-4 h-4 text-brand-teal" />
                            <span className="font-medium text-sm">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{s.duration}</span>
                            {s.price && <span className="font-semibold text-brand-navy">{s.price}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Date & Time */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Select Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn('w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                          selectedDate ? 'border-brand-teal bg-brand-teal/5' : 'border-border')}>
                          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                          {selectedDate
                            ? <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                            : <span className="text-muted-foreground">Pick a date</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate}
                          disabled={d => d < new Date()} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      Select Time {loadingSlots && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
                    </label>
                    {availableSlots.length === 0 && selectedDate && !loadingSlots && (
                      <p className="text-xs text-muted-foreground mb-2">Showing default slots — doctor availability not set</p>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {timeOptions.map(time => (
                        <button key={time} onClick={() => setSelectedTime(time)}
                          className={cn('py-2 px-3 rounded-lg text-sm font-medium transition-all',
                            selectedTime === time ? 'bg-brand-teal text-white' : 'bg-muted hover:bg-muted/80')}>
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 — Confirm */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold">Appointment Summary</h4>
                    <div className="flex items-center gap-3"><User className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{selectedPatient?.full_name}</span></div>
                    <div className="flex items-center gap-3"><Stethoscope className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{selectedDoctor?.name} — {selectedDoctor?.specialization}</span></div>
                    <div className="flex items-center gap-3"><CalendarIcon className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span></div>
                    <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{selectedTime}</span></div>
                    {selectedService && (
                      <div className="pt-2 border-t border-border space-y-1">
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService.name}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Duration</span><span>{selectedService.duration}</span></div>
                        {selectedService.price && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Price</span><span className="font-semibold text-brand-navy">{selectedService.price}</span></div>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Any special requirements or notes..."
                      className="w-full p-3 rounded-xl border border-border bg-background resize-none h-20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isComplete && (
          <div className="p-6 pt-0 flex gap-3">
            {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 btn-ghost py-3">Back</button>}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className={cn('flex-1 py-3 rounded-xl font-medium transition-all',
                  canProceed() ? 'bg-brand-teal text-white hover:bg-brand-teal/90' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
                Continue
              </button>
            ) : (
              <button onClick={handleBook} disabled={isBooking}
                className="flex-1 py-3 rounded-xl font-medium bg-brand-navy text-white hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2">
                {isBooking ? <><Loader2 className="w-4 h-4 animate-spin" />Booking...</> : 'Confirm Booking'}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingModal;