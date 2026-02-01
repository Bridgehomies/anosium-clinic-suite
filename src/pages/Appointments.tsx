import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, User, Stethoscope, X, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: string;
  duration: string;
}

const initialAppointments: Appointment[] = [
  {
    id: 1,
    patient: 'Sarah Johnson',
    doctor: 'Dr. Michael Chen',
    date: '2024-01-15',
    time: '09:00 AM',
    type: 'General Checkup',
    status: 'confirmed',
    duration: '30 min',
  },
  {
    id: 2,
    patient: 'Robert Williams',
    doctor: 'Dr. Emily Parker',
    date: '2024-01-15',
    time: '10:30 AM',
    type: 'Follow-up',
    status: 'in-progress',
    duration: '45 min',
  },
  {
    id: 3,
    patient: 'Maria Garcia',
    doctor: 'Dr. James Wilson',
    date: '2024-01-15',
    time: '11:00 AM',
    type: 'Consultation',
    status: 'pending',
    duration: '30 min',
  },
  {
    id: 4,
    patient: 'David Brown',
    doctor: 'Dr. Sarah Lee',
    date: '2024-01-15',
    time: '02:00 PM',
    type: 'Surgery Prep',
    status: 'confirmed',
    duration: '60 min',
  },
  {
    id: 5,
    patient: 'Emily Chen',
    doctor: 'Dr. Robert Martinez',
    date: '2024-01-15',
    time: '03:30 PM',
    type: 'Lab Results',
    status: 'cancelled',
    duration: '20 min',
  },
];

const timeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const doctors = [
  'Dr. Michael Chen',
  'Dr. Emily Parker',
  'Dr. James Wilson',
  'Dr. Sarah Lee',
  'Dr. Robert Martinez',
];

const appointmentTypes = [
  'General Checkup',
  'Follow-up',
  'Consultation',
  'Surgery Prep',
  'Lab Results',
  'Specialist Visit',
];

const statusColors = {
  confirmed: 'bg-emerald-500',
  'in-progress': 'bg-amber-500',
  pending: 'bg-slate-400',
  cancelled: 'bg-red-400',
};

const Appointments = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    patient: '',
    doctor: '',
    time: '',
    type: '',
    status: '',
    duration: '',
  });

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      patient: appointment.patient,
      doctor: appointment.doctor,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      duration: appointment.duration,
    });
    setEditModalOpen(true);
  };

  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      patient: appointment.patient,
      doctor: appointment.doctor,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      duration: appointment.duration,
    });
    setRescheduleModalOpen(true);
  };

  const openDeleteDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedAppointment) return;
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? { ...apt, ...editForm }
        : apt
    ));
    setEditModalOpen(false);
    toast.success('Appointment updated successfully');
  };

  const handleReschedule = () => {
    if (!selectedAppointment) return;
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? { ...apt, time: editForm.time, status: 'pending' }
        : apt
    ));
    setRescheduleModalOpen(false);
    toast.success('Appointment rescheduled successfully');
  };

  const handleCancel = () => {
    if (!selectedAppointment) return;
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? { ...apt, status: 'cancelled' }
        : apt
    ));
    setDeleteDialogOpen(false);
    toast.success('Appointment cancelled');
  };

  const handleBookAppointment = (data: any) => {
    const newAppointment: Appointment = {
      id: Date.now(),
      patient: data.patient,
      doctor: data.doctor,
      date: data.date.toISOString().split('T')[0],
      time: data.time,
      type: data.service,
      status: 'confirmed',
      duration: '30 min',
    };
    setAppointments(prev => [...prev, newAppointment]);
    toast.success('Appointment booked successfully');
  };

  return (
    <DashboardLayout title="Appointments" subtitle="Manage patient appointments">
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start">
            <button onClick={handlePrevDay} className="btn-ghost p-1.5 sm:p-2">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-display font-semibold text-sm md:text-lg text-center min-w-[180px]">
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
            <button onClick={handleNextDay} className="btn-ghost p-1.5 sm:p-2">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex gap-2 sm:gap-3 justify-between sm:justify-end">
            <div className="flex rounded-lg bg-muted p-0.5 sm:p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                  view === 'list'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                  view === 'calendar'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Calendar
              </button>
            </div>
            <button 
              onClick={() => setBookingModalOpen(true)}
              className="btn-accent"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Appointment</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        /* List View */
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[800px]">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th className="hidden md:table-cell">Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-muted-foreground" />
                        </div>
                        <span className="font-medium text-sm md:text-base truncate max-w-[100px] md:max-w-none">{appointment.patient}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Stethoscope size={14} className="text-secondary flex-shrink-0" />
                        <span className="text-sm truncate max-w-[80px] md:max-w-none">{appointment.doctor}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Clock size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{appointment.time}</span>
                      </div>
                    </td>
                    <td className="text-sm">{appointment.type}</td>
                    <td className="hidden md:table-cell text-sm">{appointment.duration}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          appointment.status === 'confirmed'
                            ? 'status-active'
                            : appointment.status === 'in-progress'
                            ? 'status-pending'
                            : appointment.status === 'cancelled'
                            ? 'status-cancelled'
                            : 'status-inactive'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button 
                          onClick={() => openEditModal(appointment)}
                          className="inline-flex items-center justify-center h-7 md:h-8 px-2 md:px-3 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => openRescheduleModal(appointment)}
                          className="hidden sm:inline-flex items-center justify-center h-7 md:h-8 px-2 md:px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                        >
                          Reschedule
                        </button>
                        <button 
                          onClick={() => openDeleteDialog(appointment)}
                          className="inline-flex items-center justify-center h-7 md:h-8 w-7 md:w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="card-elevated p-4 md:p-6">
          <div className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_1fr] gap-2 md:gap-4">
            {/* Time Column */}
            <div className="space-y-2 md:space-y-4">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-16 md:h-20 flex items-start text-xs md:text-sm text-muted-foreground"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Appointments Column */}
            <div className="relative border-l border-border pl-2 md:pl-4 space-y-2 md:space-y-4">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-16 md:h-20 border-b border-border/50 relative"
                >
                  {appointments
                    .filter((apt) => apt.time === time)
                    .map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => openEditModal(apt)}
                        className={`absolute top-0 left-0 right-2 md:right-4 p-2 md:p-3 rounded-lg cursor-pointer transition-transform hover:scale-[1.02] ${
                          apt.status === 'cancelled'
                            ? 'bg-destructive/10 border-l-4 border-destructive'
                            : 'bg-accent border-l-4 border-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {apt.patient}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {apt.doctor} • {apt.type}
                            </p>
                          </div>
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              statusColors[apt.status as keyof typeof statusColors]
                            }`}
                          />
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
      <AppointmentBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        onBookAppointment={handleBookAppointment}
      />

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Input 
                value={editForm.patient} 
                onChange={(e) => setEditForm({ ...editForm, patient: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={editForm.doctor} onValueChange={(v) => setEditForm({ ...editForm, doctor: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {doctors.map((doc) => (
                    <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditModalOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleEdit} className="btn-accent">Save Changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Select a new time for this appointment</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-3 block">Select New Time</Label>
            <div className="grid grid-cols-3 gap-2">
              {['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
                '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'].map((time) => (
                <button
                  key={time}
                  onClick={() => setEditForm({ ...editForm, time })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    editForm.time === time
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setRescheduleModalOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleReschedule} className="btn-accent">Reschedule</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the appointment for "{selectedAppointment?.patient}"? 
              This will notify the patient about the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Appointments;
