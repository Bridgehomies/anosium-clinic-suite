import { useState } from 'react';
import { Plus, Users, Stethoscope, Receipt, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const departments = [
  {
    id: 1,
    name: 'Cardiology',
    head: 'Dr. Michael Chen',
    doctors: 8,
    services: 12,
    patients: 245,
    color: 'from-rose-500 to-red-500',
    description: 'Heart and cardiovascular system care',
  },
  {
    id: 2,
    name: 'Dermatology',
    head: 'Dr. Emily Parker',
    doctors: 5,
    services: 18,
    patients: 189,
    color: 'from-amber-500 to-orange-500',
    description: 'Skin, hair, and nail treatments',
  },
  {
    id: 3,
    name: 'Orthopedics',
    head: 'Dr. James Wilson',
    doctors: 6,
    services: 15,
    patients: 312,
    color: 'from-emerald-500 to-green-500',
    description: 'Bone, joint, and muscle care',
  },
  {
    id: 4,
    name: 'Pediatrics',
    head: 'Dr. Sarah Lee',
    doctors: 7,
    services: 20,
    patients: 428,
    color: 'from-sky-500 to-blue-500',
    description: 'Child and adolescent healthcare',
  },
  {
    id: 5,
    name: 'Neurology',
    head: 'Dr. Robert Martinez',
    doctors: 4,
    services: 10,
    patients: 156,
    color: 'from-violet-500 to-purple-500',
    description: 'Brain and nervous system disorders',
  },
  {
    id: 6,
    name: 'General Medicine',
    head: 'Dr. Amanda Ross',
    doctors: 12,
    services: 25,
    patients: 567,
    color: 'from-brand-navy to-brand-teal',
    description: 'Primary care and general health',
  },
];

const Departments = () => {
  const [selectedDept, setSelectedDept] = useState<typeof departments[0] | null>(null);

  return (
    <DashboardLayout title="Departments" subtitle="Overview of all clinic departments">
      {/* Actions */}
      <div className="flex justify-end mb-6 animate-fade-up">
        <button className="btn-accent">
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="card-elevated overflow-hidden group cursor-pointer"
            onClick={() => setSelectedDept(dept)}
          >
            {/* Header with gradient */}
            <div className={`h-3 bg-gradient-to-r ${dept.color}`} />

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dept.description}
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 mb-5 text-sm">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Stethoscope size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground">Department Head</p>
                  <p className="font-medium text-foreground">{dept.head}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Stethoscope size={14} />
                  </div>
                  <p className="text-lg font-bold font-display text-foreground">
                    {dept.doctors}
                  </p>
                  <p className="text-xs text-muted-foreground">Doctors</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Receipt size={14} />
                  </div>
                  <p className="text-lg font-bold font-display text-foreground">
                    {dept.services}
                  </p>
                  <p className="text-xs text-muted-foreground">Services</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users size={14} />
                  </div>
                  <p className="text-lg font-bold font-display text-foreground">
                    {dept.patients}
                  </p>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-2">Total Departments</p>
          <p className="text-3xl font-bold font-display text-foreground">
            {departments.length}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-2">Total Doctors</p>
          <p className="text-3xl font-bold font-display text-foreground">
            {departments.reduce((acc, d) => acc + d.doctors, 0)}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-2">Total Services</p>
          <p className="text-3xl font-bold font-display text-foreground">
            {departments.reduce((acc, d) => acc + d.services, 0)}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground mb-2">Total Patients</p>
          <p className="text-3xl font-bold font-display text-foreground">
            {departments.reduce((acc, d) => acc + d.patients, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Departments;
