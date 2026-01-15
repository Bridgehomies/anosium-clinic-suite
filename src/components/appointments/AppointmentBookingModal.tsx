import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, User, Stethoscope, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AppointmentBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAppointment?: (appointment: AppointmentData) => void;
}

interface AppointmentData {
  patient: string;
  doctor: string;
  date: Date;
  time: string;
  service: string;
  notes: string;
}

const doctors = [
  { id: 1, name: 'Dr. Michael Chen', specialty: 'General Medicine', avatar: 'MC' },
  { id: 2, name: 'Dr. Emily Parker', specialty: 'Cardiology', avatar: 'EP' },
  { id: 3, name: 'Dr. James Wilson', specialty: 'Dermatology', avatar: 'JW' },
  { id: 4, name: 'Dr. Sarah Lee', specialty: 'Orthopedics', avatar: 'SL' },
  { id: 5, name: 'Dr. Robert Martinez', specialty: 'Pediatrics', avatar: 'RM' },
];

const services = [
  { id: 1, name: 'General Checkup', duration: '30 min', price: '$75' },
  { id: 2, name: 'Consultation', duration: '45 min', price: '$120' },
  { id: 3, name: 'Follow-up', duration: '20 min', price: '$50' },
  { id: 4, name: 'Lab Work', duration: '15 min', price: '$45' },
  { id: 5, name: 'Specialist Visit', duration: '60 min', price: '$200' },
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

const patients = [
  { id: 1, name: 'Sarah Johnson', phone: '+1 555-0123' },
  { id: 2, name: 'Robert Williams', phone: '+1 555-0124' },
  { id: 3, name: 'Maria Garcia', phone: '+1 555-0125' },
  { id: 4, name: 'David Brown', phone: '+1 555-0126' },
];

const AppointmentBookingModal = ({
  open,
  onOpenChange,
  onBookAppointment,
}: AppointmentBookingModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleBook = async () => {
    setIsBooking(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsBooking(false);
    setIsComplete(true);
    
    setTimeout(() => {
      onBookAppointment?.({
        patient: selectedPatient,
        doctor: doctors.find(d => d.id === selectedDoctor)?.name || '',
        date: selectedDate!,
        time: selectedTime,
        service: services.find(s => s.id === selectedService)?.name || '',
        notes,
      });
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPatient('');
    setSelectedDoctor(null);
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedService(null);
    setNotes('');
    setIsComplete(false);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedPatient !== '';
      case 2: return selectedDoctor !== null && selectedService !== null;
      case 3: return selectedDate !== undefined && selectedTime !== '';
      case 4: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-white">
              Book New Appointment
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step >= s 
                    ? "bg-white text-brand-navy" 
                    : "bg-white/20 text-white/60"
                )}>
                  {isComplete && s <= step ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={cn(
                    "w-12 md:w-20 h-0.5 mx-2",
                    step > s ? "bg-white" : "bg-white/20"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/70">
            <span>Patient</span>
            <span>Doctor & Service</span>
            <span>Date & Time</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isComplete ? (
            <div className="flex flex-col items-center justify-center py-8 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Appointment Booked!</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                {selectedPatient} with {doctors.find(d => d.id === selectedDoctor)?.name}<br />
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Patient Selection */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Select Patient
                    </label>
                    <div className="space-y-2">
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient.name)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                            selectedPatient === patient.name
                              ? "border-brand-teal bg-brand-teal/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className="w-10 h-10 rounded-full bg-brand-navy/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-brand-navy" />
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.phone}</p>
                          </div>
                          {selectedPatient === patient.name && (
                            <CheckCircle className="w-5 h-5 text-brand-teal ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Doctor & Service Selection */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Select Doctor
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {doctors.map((doctor) => (
                        <button
                          key={doctor.id}
                          onClick={() => setSelectedDoctor(doctor.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                            selectedDoctor === doctor.id
                              ? "border-brand-teal bg-brand-teal/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-medium">
                            {doctor.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Select Service
                    </label>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                            selectedService === service.id
                              ? "border-brand-teal bg-brand-teal/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-4 h-4 text-brand-teal" />
                            <span className="font-medium text-sm">{service.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">{service.duration}</span>
                            <span className="font-semibold text-brand-navy">{service.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Date & Time Selection */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Select Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                          selectedDate ? "border-brand-teal bg-brand-teal/5" : "border-border"
                        )}>
                          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                          {selectedDate ? (
                            <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                          ) : (
                            <span className="text-muted-foreground">Pick a date</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Select Time
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                            selectedTime === time
                              ? "bg-brand-teal text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-foreground">Appointment Summary</h4>
                    
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPatient}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {doctors.find(d => d.id === selectedDoctor)?.name} - {doctors.find(d => d.id === selectedDoctor)?.specialty}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedTime}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{services.find(s => s.id === selectedService)?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{services.find(s => s.id === selectedService)?.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold text-brand-navy">{services.find(s => s.id === selectedService)?.price}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements or notes..."
                      className="w-full p-3 rounded-xl border border-border bg-background resize-none h-20 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isComplete && (
          <div className="p-6 pt-0 flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 btn-ghost py-3"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  "flex-1 py-3 rounded-xl font-medium transition-all",
                  canProceed()
                    ? "bg-brand-teal text-white hover:bg-brand-teal/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleBook}
                disabled={isBooking}
                className="flex-1 py-3 rounded-xl font-medium bg-brand-navy text-white hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2"
              >
                {isBooking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingModal;
