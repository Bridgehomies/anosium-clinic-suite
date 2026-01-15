import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, User, Stethoscope, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';

const appointments = [
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

const statusColors = {
  confirmed: 'bg-emerald-500',
  'in-progress': 'bg-amber-500',
  pending: 'bg-slate-400',
  cancelled: 'bg-red-400',
};

const Appointments = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate] = useState(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <DashboardLayout title="Appointments" subtitle="Manage patient appointments">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6 animate-fade-up">
        <div className="flex items-center gap-4">
          <button className="btn-ghost p-2">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-display font-semibold text-lg">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
          <button className="btn-ghost p-2">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                view === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
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
            New Appointment
          </button>
        </div>
      </div>

      {view === 'list' ? (
        /* List View */
        <div className="card-elevated overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <User size={18} className="text-muted-foreground" />
                      </div>
                      <span className="font-medium">{appointment.patient}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-secondary" />
                      <span>{appointment.doctor}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <span>{appointment.time}</span>
                    </div>
                  </td>
                  <td>{appointment.type}</td>
                  <td>{appointment.duration}</td>
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
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 transition-colors text-xs font-medium">
                        Edit
                      </button>
                      <button className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 transition-colors text-xs font-medium">
                        Reschedule
                      </button>
                      <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Calendar View */
        <div className="card-elevated p-6">
          <div className="grid grid-cols-[80px_1fr] gap-4">
            {/* Time Column */}
            <div className="space-y-4">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-20 flex items-start text-sm text-muted-foreground"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Appointments Column */}
            <div className="relative border-l border-border pl-4 space-y-4">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-20 border-b border-border/50 relative"
                >
                  {appointments
                    .filter((apt) => apt.time === time)
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className={`absolute top-0 left-0 right-4 p-3 rounded-lg ${
                          apt.status === 'cancelled'
                            ? 'bg-red-50 border-l-4 border-red-400'
                            : 'bg-brand-teal-light border-l-4 border-brand-teal'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {apt.patient}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {apt.doctor} • {apt.type}
                            </p>
                          </div>
                          <span
                            className={`w-2 h-2 rounded-full ${
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
      />
    </DashboardLayout>
  );
};

export default Appointments;
