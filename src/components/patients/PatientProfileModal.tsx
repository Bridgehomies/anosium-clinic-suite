import { useState, useEffect } from 'react';
import {
  User, Phone, Mail, Calendar, MapPin,
  FileText, AlertCircle, Edit2,
  Plus, Stethoscope, Receipt, ChevronRight, Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Visit {
  id: number;
  date: string;
  doctor: string;
  type: string;
  diagnosis: string;
  status: 'completed' | 'follow-up' | 'pending';
}

export interface Payment {
  id: number;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  service: string;
}

export interface PatientForModal {
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

interface PatientProfileModalProps {
  patient: PatientForModal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleAppointment?: () => void;
  onCollectPayment?: (amount: number) => void;
  onGenerateReport?: (patientId: number) => void;
  onAddNote?: (patientId: number) => void;
  onEdit?: (patientId: number) => void;
  /** Async loaders — parent provides these so the modal stays decoupled from apiClient */
  fetchVisits?: (patientId: number) => Promise<Visit[]>;
  fetchPayments?: (patientId: number) => Promise<Payment[]>;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const VisitStatusBadge = ({ status }: { status: Visit['status'] }) => (
  <span
    className={cn(
      'text-xs px-1.5 md:px-2 py-0.5 rounded-full flex-shrink-0',
      status === 'completed' && 'bg-emerald-50 text-emerald-600',
      status === 'follow-up' && 'bg-amber-50 text-amber-600',
      status === 'pending' && 'bg-slate-100 text-slate-600',
    )}
  >
    {status}
  </span>
);

const PaymentStatusBadge = ({ status }: { status: Payment['status'] }) => (
  <span
    className={cn(
      'text-xs px-1.5 md:px-2 py-0.5 rounded-full',
      status === 'paid' && 'bg-emerald-50 text-emerald-600',
      status === 'pending' && 'bg-amber-50 text-amber-600',
      status === 'overdue' && 'bg-red-50 text-red-600',
    )}
  >
    {status}
  </span>
);

const SectionLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
);

const SectionError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-2 py-6 text-center">
    <AlertCircle className="w-5 h-5 text-destructive" />
    <p className="text-xs text-muted-foreground">{message}</p>
    <button onClick={onRetry} className="text-xs text-brand-teal hover:underline">
      Retry
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const PatientProfileModal = ({
  patient,
  open,
  onOpenChange,
  onScheduleAppointment,
  onCollectPayment,
  onGenerateReport,
  onAddNote,
  onEdit,
  fetchVisits,
  fetchPayments,
}: PatientProfileModalProps) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [visitsError, setVisitsError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  // ── Load patient-specific data when modal opens ─────────────────────────────

  const loadVisits = async (patientId: number) => {
    if (!fetchVisits) return;
    setVisitsLoading(true);
    setVisitsError(null);
    try {
      const data = await fetchVisits(patientId);
      setVisits(data);
    } catch {
      setVisitsError('Could not load visit history.');
    } finally {
      setVisitsLoading(false);
    }
  };

  const loadPayments = async (patientId: number) => {
    if (!fetchPayments) return;
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const data = await fetchPayments(patientId);
      setPayments(data);
    } catch {
      setPaymentsError('Could not load payment history.');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !patient) {
      // Clear stale data when closed
      setVisits([]);
      setPayments([]);
      setVisitsError(null);
      setPaymentsError(null);
      return;
    }
    loadVisits(patient.id);
    loadPayments(patient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient?.id]);

  if (!patient) return null;

  // Outstanding balance comes from the patient prop (source of truth from /stats),
  // not recomputed from the payments list which may be partial.
  const totalOutstanding = patient.outstandingBalance;

  const pendingPayments = payments.filter((p) => p.status !== 'paid');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-[95vw] p-0 overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-4 md:p-6 text-white flex-shrink-0">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-display font-semibold truncate">
                {patient.name}
              </h2>
              <p className="text-white/70 text-xs md:text-sm mt-0.5">
                Patient ID: #{patient.id.toString().padStart(5, '0')}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 md:mt-2">
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  Blood: {patient.bloodType}
                </span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  {patient.totalVisits} visits
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-6">
            <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-3">
              <p className="text-white/60 text-xs">Last Visit</p>
              <p className="font-semibold text-sm md:text-base truncate">{patient.lastVisit}</p>
            </div>
            <div className="bg-white/10 rounded-lg md:rounded-xl p-2 md:p-3">
              <p className="text-white/60 text-xs">Total Visits</p>
              <p className="font-semibold text-sm md:text-base">{patient.totalVisits}</p>
            </div>
            <div
              className={cn(
                'rounded-lg md:rounded-xl p-2 md:p-3',
                totalOutstanding > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20',
              )}
            >
              <p className="text-white/60 text-xs">Outstanding</p>
              <p className="font-semibold text-sm md:text-base">
                ${totalOutstanding.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* ── Left: Contact Info ── */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                Contact Information
              </h3>

              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="line-clamp-2">{patient.address || '—'}</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>DOB: {patient.dob}</span>
                </div>
              </div>

              {/* Insurance */}
              <div className="pt-3 md:pt-4 border-t border-border">
                <h4 className="font-medium text-xs md:text-sm mb-1.5 md:mb-2">Insurance</h4>
                {patient.insuranceProvider ? (
                  <>
                    <p className="text-xs md:text-sm text-muted-foreground">{patient.insuranceProvider}</p>
                    {patient.insuranceId && (
                      <p className="text-xs text-muted-foreground">ID: {patient.insuranceId}</p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Not on file</p>
                )}
              </div>

              {/* Allergies */}
              <div className="pt-3 md:pt-4 border-t border-border">
                <h4 className="font-medium text-xs md:text-sm mb-1.5 md:mb-2">Allergies</h4>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">None recorded</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="pt-3 md:pt-4 border-t border-border">
                <h4 className="font-medium text-xs md:text-sm mb-1.5 md:mb-2">Emergency Contact</h4>
                {patient.emergencyContact ? (
                  <p className="text-xs md:text-sm text-muted-foreground">{patient.emergencyContact}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Not on file</p>
                )}
              </div>
            </div>

            {/* ── Middle: Visit History ── */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <Stethoscope className="w-4 h-4" />
                  Visit History
                </h3>
              </div>

              {visitsLoading && <SectionLoader />}

              {visitsError && !visitsLoading && (
                <SectionError
                  message={visitsError}
                  onRetry={() => loadVisits(patient.id)}
                />
              )}

              {!visitsLoading && !visitsError && visits.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  No visit history available.
                </p>
              )}

              {!visitsLoading && !visitsError && (
                <div className="space-y-2 md:space-y-3">
                  {visits.slice(0, 3).map((visit) => (
                    <div
                      key={visit.id}
                      className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate">{visit.type}</p>
                          <p className="text-xs text-muted-foreground truncate">{visit.doctor}</p>
                        </div>
                        <VisitStatusBadge status={visit.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 md:mt-2 line-clamp-1">
                        {visit.diagnosis}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 md:mt-2">
                        <span className="text-xs text-muted-foreground">{visit.date}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Payments ── */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <Receipt className="w-4 h-4" />
                  Payment History
                </h3>
              </div>

              {/* Outstanding balance banner — driven by patient prop */}
              {totalOutstanding > 0 && (
                <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs md:text-sm font-medium text-red-700">
                      Outstanding Balance
                    </span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-red-600">
                    ${totalOutstanding.toLocaleString()}
                  </p>
                  <button
                    onClick={() => onCollectPayment?.(totalOutstanding)}
                    className="w-full mt-2 md:mt-3 py-1.5 md:py-2 bg-red-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Collect Payment
                  </button>
                </div>
              )}

              {paymentsLoading && <SectionLoader />}

              {paymentsError && !paymentsLoading && (
                <SectionError
                  message={paymentsError}
                  onRetry={() => loadPayments(patient.id)}
                />
              )}

              {!paymentsLoading && !paymentsError && payments.length === 0 && (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  No payment records available.
                </p>
              )}

              {!paymentsLoading && !paymentsError && (
                <div className="space-y-2 md:space-y-3">
                  {payments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-2.5 md:p-3 rounded-lg md:rounded-xl bg-muted/30"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-xs md:text-sm truncate">{payment.service}</p>
                        <p className="text-xs text-muted-foreground">{payment.date}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-xs md:text-sm">${payment.amount}</p>
                        <PaymentStatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="p-3 md:p-4 border-t border-border bg-muted/30 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <button
              onClick={onScheduleAppointment}
              className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl font-medium bg-brand-teal text-white hover:bg-brand-teal/90 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Calendar className="w-4 h-4" />
              Schedule Appointment
            </button>
            <button
              onClick={() => onEdit?.(patient.id)}
              className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl font-medium border border-brand-navy text-brand-navy hover:bg-brand-navy/5 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Patient
            </button>
            <button
              onClick={() => onGenerateReport?.(patient.id)}
              className="flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl font-medium bg-brand-navy text-white hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button
              onClick={() => onAddNote?.(patient.id)}
              className="py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl font-medium border border-border hover:bg-muted transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:hidden">Note</span>
              <span className="hidden sm:inline">Add Note</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientProfileModal;