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
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start">
            <button className="btn-ghost p-1.5 sm:p-2">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-display font-semibold text-sm md:text-lg text-center">
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
            <button className="btn-ghost p-1.5 sm:p-2">
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
                        <button className="inline-flex items-center justify-center h-7 md:h-8 px-2 md:px-3 rounded-lg bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 transition-colors text-xs font-medium">
                          Edit
                        </button>
                        <button className="hidden sm:inline-flex items-center justify-center h-7 md:h-8 px-2 md:px-3 rounded-lg bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20 transition-colors text-xs font-medium">
                          Reschedule
                        </button>
                        <button className="inline-flex items-center justify-center h-7 md:h-8 w-7 md:w-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
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
                        className={`absolute top-0 left-0 right-2 md:right-4 p-2 md:p-3 rounded-lg ${
                          apt.status === 'cancelled'
                            ? 'bg-red-50 border-l-4 border-red-400'
                            : 'bg-brand-teal-light border-l-4 border-brand-teal'
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
      />
    </DashboardLayout>
  );
};

export default Appointments;
