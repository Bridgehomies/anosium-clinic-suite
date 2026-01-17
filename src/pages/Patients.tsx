import { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, User, Phone, Mail, Calendar, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PatientProfileModal from '@/components/patients/PatientProfileModal';
import AppointmentBookingModal from '@/components/appointments/AppointmentBookingModal';
import AddPatientModal from '@/components/patients/AddPatientModal';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  lastVisit: string;
  status: string;
  totalVisits: number;
  outstandingBalance: number;
}

const initialPatients: Patient[] = [
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
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || patient.status === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleViewProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setProfileModalOpen(true);
  };

  const handleScheduleAppointment = () => {
    setProfileModalOpen(false);
    setAppointmentModalOpen(true);
  };

  const handleAddPatient = (patientData: any) => {
    const newPatient: Patient = {
      id: patients.length + 1,
      name: patientData.name,
      email: patientData.email,
      phone: patientData.phone,
      address: patientData.address,
      dob: patientData.dob,
      bloodType: patientData.bloodType,
      allergies: patientData.allergies ? patientData.allergies.split(',').map((a: string) => a.trim()) : [],
      emergencyContact: `${patientData.emergencyContact} - ${patientData.emergencyPhone}`,
      insuranceProvider: patientData.insuranceProvider,
      insuranceId: patientData.insuranceId,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'active',
      totalVisits: 0,
      outstandingBalance: 0,
    };
    setPatients([...patients, newPatient]);
  };

  const handleDeletePatient = () => {
    if (selectedPatient) {
      setPatients(patients.filter((p) => p.id !== selectedPatient.id));
      toast({
        title: 'Patient Removed',
        description: `${selectedPatient.name} has been removed from records.`,
      });
      setDeleteDialogOpen(false);
      setSelectedPatient(null);
    }
  };

  const confirmDelete = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
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
          <button 
            className={`btn-ghost ${showFilters ? 'bg-muted' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <button className="btn-accent" onClick={() => setAddModalOpen(true)}>
            <Plus size={18} />
            Add Patient
          </button>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-up">
          {['All', 'Active', 'Pending', 'Inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-brand-navy text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg">
                    <MoreHorizontal size={18} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewProfile(patient)}>
                    <User size={14} className="mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit size={14} className="mr-2" />
                    Edit Patient
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setSelectedPatient(patient);
                    setAppointmentModalOpen(true);
                  }}>
                    <Calendar size={14} className="mr-2" />
                    Book Appointment
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => confirmDelete(patient)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete Patient
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

            {patient.outstandingBalance > 0 && (
              <div className="mt-3 p-2 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Outstanding: ${patient.outstandingBalance}
                </p>
              </div>
            )}

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

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No patients found matching your criteria.</p>
        </div>
      )}

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

      <AddPatientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddPatient}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPatient?.name}? This action cannot be undone and all associated records will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Patients;
