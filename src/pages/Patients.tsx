import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, User, Phone, Mail, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientProfileModal from '@/components/patients/PatientProfileModal';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';

const patients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY',
    dob: '1985-03-15',
    bloodType: 'A+',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContact: 'John Johnson - +1 (555) 111-2222',
    insuranceProvider: 'BlueCross BlueShield',
    insuranceId: 'BC-12345678',
    lastVisit: '2024-01-10',
    status: 'active',
    totalVisits: 12,
    outstandingBalance: 380,
  },
  {
    id: 2,
    name: 'Robert Williams',
    email: 'robert.w@email.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave, Los Angeles, CA',
    dob: '1978-07-22',
    bloodType: 'O-',
    allergies: ['Latex'],
    emergencyContact: 'Mary Williams - +1 (555) 222-3333',
    insuranceProvider: 'Aetna',
    insuranceId: 'AE-87654321',
    lastVisit: '2024-01-08',
    status: 'active',
    totalVisits: 8,
    outstandingBalance: 0,
  },
  {
    id: 3,
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine Rd, Chicago, IL',
    dob: '1992-11-08',
    bloodType: 'B+',
    allergies: [],
    emergencyContact: 'Carlos Garcia - +1 (555) 333-4444',
    insuranceProvider: 'UnitedHealthcare',
    insuranceId: 'UH-11223344',
    lastVisit: '2024-01-05',
    status: 'pending',
    totalVisits: 3,
    outstandingBalance: 150,
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '+1 (555) 456-7890',
    address: '321 Elm St, Houston, TX',
    dob: '1965-02-28',
    bloodType: 'AB+',
    allergies: ['Aspirin', 'Shellfish'],
    emergencyContact: 'Lisa Brown - +1 (555) 444-5555',
    insuranceProvider: 'Cigna',
    insuranceId: 'CG-55667788',
    lastVisit: '2023-12-20',
    status: 'inactive',
    totalVisits: 25,
    outstandingBalance: 0,
  },
  {
    id: 5,
    name: 'Emily Chen',
    email: 'emily.chen@email.com',
    phone: '+1 (555) 567-8901',
    address: '654 Maple Dr, Seattle, WA',
    dob: '1990-09-12',
    bloodType: 'A-',
    allergies: ['Sulfa drugs'],
    emergencyContact: 'Michael Chen - +1 (555) 555-6666',
    insuranceProvider: 'Kaiser Permanente',
    insuranceId: 'KP-99887766',
    lastVisit: '2024-01-12',
    status: 'active',
    totalVisits: 5,
    outstandingBalance: 200,
  },
];

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (patient: typeof patients[0]) => {
    setSelectedPatient(patient);
    setProfileModalOpen(true);
  };

  const handleScheduleAppointment = () => {
    setProfileModalOpen(false);
    setAppointmentModalOpen(true);
  };

  return (
    <DashboardLayout title="Patients" subtitle="Manage your patient records">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6 animate-fade-up">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-modern pl-11"
          />
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost">
            <Filter size={18} />
            Filters
          </button>
          <button className="btn-accent">
            <Plus size={18} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="card-elevated p-6 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-navy/10 to-brand-teal/10 flex items-center justify-center">
                  <User size={24} className="text-brand-navy" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">
                    {patient.name}
                  </h3>
                  <span
                    className={`status-badge ${
                      patient.status === 'active'
                        ? 'status-active'
                        : patient.status === 'pending'
                        ? 'status-pending'
                        : 'status-inactive'
                    }`}
                  >
                    {patient.status}
                  </span>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg">
                <MoreHorizontal size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={14} />
                <span className="truncate">{patient.email}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone size={14} />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar size={14} />
                <span>Last visit: {patient.lastVisit}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-display text-foreground">
                  {patient.totalVisits}
                </p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <button 
                onClick={() => handleViewProfile(patient)}
                className="btn-outline text-sm py-2 px-4"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <PatientProfileModal
        patient={selectedPatient}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        onScheduleAppointment={handleScheduleAppointment}
      />

      <AppointmentBookingModal
        open={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
      />
    </DashboardLayout>
  );
};

export default Patients;
