import { 
  X, User, Phone, Mail, Calendar, MapPin, 
  CreditCard, FileText, Clock, AlertCircle,
  Plus, Stethoscope, Receipt, ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Visit {
  id: number;
  date: string;
  doctor: string;
  type: string;
  diagnosis: string;
  status: 'completed' | 'follow-up' | 'pending';
}

interface Payment {
  id: number;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  service: string;
}

interface Patient {
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
  totalVisits: number;
  lastVisit: string;
  outstandingBalance: number;
}

interface PatientProfileModalProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleAppointment?: () => void;
  onCollectPayment?: (amount: number) => void;
}

const sampleVisits: Visit[] = [
  { id: 1, date: '2024-01-15', doctor: 'Dr. Michael Chen', type: 'General Checkup', diagnosis: 'Routine examination - all clear', status: 'completed' },
  { id: 2, date: '2024-01-02', doctor: 'Dr. Emily Parker', type: 'Cardiology', diagnosis: 'Blood pressure monitoring', status: 'follow-up' },
  { id: 3, date: '2023-12-18', doctor: 'Dr. James Wilson', type: 'Dermatology', diagnosis: 'Skin allergy treatment', status: 'completed' },
  { id: 4, date: '2023-11-25', doctor: 'Dr. Sarah Lee', type: 'Orthopedics', diagnosis: 'Physical therapy session', status: 'completed' },
];

const samplePayments: Payment[] = [
  { id: 1, date: '2024-01-15', amount: 120, status: 'paid', service: 'General Checkup' },
  { id: 2, date: '2024-01-02', amount: 200, status: 'pending', service: 'Cardiology Consultation' },
  { id: 3, date: '2023-12-18', amount: 150, status: 'paid', service: 'Dermatology Visit' },
  { id: 4, date: '2023-11-25', amount: 180, status: 'overdue', service: 'Physical Therapy' },
];

const PatientProfileModal = ({
  patient,
  open,
  onOpenChange,
  onScheduleAppointment,
  onCollectPayment,
}: PatientProfileModalProps) => {
  if (!patient) return null;

  const pendingPayments = samplePayments.filter(p => p.status !== 'paid');
  const totalOutstanding = pendingPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold">{patient.name}</h2>
                <p className="text-white/70 text-sm mt-1">Patient ID: #{patient.id.toString().padStart(5, '0')}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                    Blood Type: {patient.bloodType}
                  </span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                    {patient.totalVisits} visits
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs">Last Visit</p>
              <p className="font-semibold">{patient.lastVisit}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-xs">Total Visits</p>
              <p className="font-semibold">{patient.totalVisits}</p>
            </div>
            <div className={cn(
              "rounded-xl p-3",
              totalOutstanding > 0 ? "bg-red-500/20" : "bg-emerald-500/20"
            )}>
              <p className="text-white/60 text-xs">Outstanding</p>
              <p className="font-semibold">${totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[55vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{patient.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{patient.address}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>DOB: {patient.dob}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-sm mb-2">Insurance</h4>
                <p className="text-sm text-muted-foreground">{patient.insuranceProvider}</p>
                <p className="text-xs text-muted-foreground">ID: {patient.insuranceId}</p>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-sm mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((allergy, idx) => (
                    <span key={idx} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-sm mb-2">Emergency Contact</h4>
                <p className="text-sm text-muted-foreground">{patient.emergencyContact}</p>
              </div>
            </div>

            {/* Middle Column - Visit History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Visit History
                </h3>
                <button className="text-xs text-brand-teal hover:underline">View All</button>
              </div>
              
              <div className="space-y-3">
                {sampleVisits.map((visit) => (
                  <div key={visit.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{visit.type}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{visit.doctor}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        visit.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                        visit.status === 'follow-up' ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {visit.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{visit.diagnosis}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{visit.date}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Payments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Payment History
                </h3>
                <button className="text-xs text-brand-teal hover:underline">View All</button>
              </div>

              {totalOutstanding > 0 && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Outstanding Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">${totalOutstanding.toLocaleString()}</p>
                  <button
                    onClick={() => onCollectPayment?.(totalOutstanding)}
                    className="w-full mt-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Collect Payment
                  </button>
                </div>
              )}
              
              <div className="space-y-3">
                {samplePayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{payment.service}</p>
                      <p className="text-xs text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${payment.amount}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        payment.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                        payment.status === 'pending' ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Quick Actions */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex gap-3">
            <button
              onClick={onScheduleAppointment}
              className="flex-1 py-3 rounded-xl font-medium bg-brand-teal text-white hover:bg-brand-teal/90 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Appointment
            </button>
            <button className="flex-1 py-3 rounded-xl font-medium bg-brand-navy text-white hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button className="py-3 px-4 rounded-xl font-medium border border-border hover:bg-muted transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientProfileModal;
