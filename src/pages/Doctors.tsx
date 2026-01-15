import { useState } from 'react';
import { Plus, Search, Filter, Star, Clock, Users } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const doctors = [
  {
    id: 1,
    name: 'Dr. Michael Chen',
    specialization: 'Cardiology',
    department: 'Cardiology',
    email: 'michael.chen@anosium.ai',
    phone: '+1 (555) 111-2222',
    rating: 4.9,
    patients: 142,
    availability: 'Available',
    experience: '15 years',
  },
  {
    id: 2,
    name: 'Dr. Emily Parker',
    specialization: 'Dermatology',
    department: 'Dermatology',
    email: 'emily.parker@anosium.ai',
    phone: '+1 (555) 222-3333',
    rating: 4.8,
    patients: 98,
    availability: 'Busy',
    experience: '10 years',
  },
  {
    id: 3,
    name: 'Dr. James Wilson',
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    email: 'james.wilson@anosium.ai',
    phone: '+1 (555) 333-4444',
    rating: 4.7,
    patients: 167,
    availability: 'Available',
    experience: '20 years',
  },
  {
    id: 4,
    name: 'Dr. Sarah Lee',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    email: 'sarah.lee@anosium.ai',
    phone: '+1 (555) 444-5555',
    rating: 4.9,
    patients: 215,
    availability: 'Available',
    experience: '12 years',
  },
  {
    id: 5,
    name: 'Dr. Robert Martinez',
    specialization: 'Neurology',
    department: 'Neurology',
    email: 'robert.martinez@anosium.ai',
    phone: '+1 (555) 555-6666',
    rating: 4.6,
    patients: 89,
    availability: 'On Leave',
    experience: '8 years',
  },
];

const Doctors = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Doctors" subtitle="Manage your medical staff">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6 animate-fade-up">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search doctors..."
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
            Add Doctor
          </button>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="card-elevated p-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-2xl">
                  {doctor.name.split(' ').slice(1).map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      {doctor.name}
                    </h3>
                    <p className="text-secondary font-medium">{doctor.specialization}</p>
                  </div>
                  <span
                    className={`status-badge ${
                      doctor.availability === 'Available'
                        ? 'status-active'
                        : doctor.availability === 'Busy'
                        ? 'status-pending'
                        : 'status-inactive'
                    }`}
                  >
                    {doctor.availability}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {doctor.department} Department
                </p>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{doctor.rating}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <span>{doctor.patients} patients</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} />
                    <span>{doctor.experience}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button className="btn-outline text-sm py-2 px-4 flex-1">
                    View Profile
                  </button>
                  <button className="btn-accent text-sm py-2 px-4 flex-1">
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Doctors;
