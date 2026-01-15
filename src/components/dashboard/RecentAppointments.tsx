import { Clock, User, Stethoscope } from 'lucide-react';

const appointments = [
  {
    id: 1,
    patient: 'Sarah Johnson',
    doctor: 'Dr. Michael Chen',
    time: '09:00 AM',
    status: 'confirmed',
    type: 'General Checkup',
  },
  {
    id: 2,
    patient: 'Robert Williams',
    doctor: 'Dr. Emily Parker',
    time: '10:30 AM',
    status: 'in-progress',
    type: 'Cardiology',
  },
  {
    id: 3,
    patient: 'Maria Garcia',
    doctor: 'Dr. James Wilson',
    time: '11:00 AM',
    status: 'pending',
    type: 'Dermatology',
  },
  {
    id: 4,
    patient: 'David Brown',
    doctor: 'Dr. Sarah Lee',
    time: '02:00 PM',
    status: 'confirmed',
    type: 'Orthopedics',
  },
];

const statusStyles = {
  confirmed: 'status-active',
  'in-progress': 'status-pending',
  pending: 'status-inactive',
  cancelled: 'status-cancelled',
};

const RecentAppointments = () => {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Today's Appointments
        </h3>
        <button className="text-sm text-secondary font-medium hover:underline">
          View all
        </button>
      </div>
      <div className="space-y-4">
        {appointments.map((appointment, index) => (
          <div
            key={appointment.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy/10 to-brand-teal/10 flex items-center justify-center">
              <User size={20} className="text-brand-navy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {appointment.patient}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Stethoscope size={12} />
                  <span className="text-xs truncate">{appointment.doctor}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={12} />
                  <span className="text-xs">{appointment.time}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`status-badge ${statusStyles[appointment.status as keyof typeof statusStyles]}`}>
                {appointment.status}
              </span>
              <span className="text-xs text-muted-foreground">{appointment.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAppointments;
