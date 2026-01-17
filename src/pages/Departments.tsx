import { useState } from 'react';
import { Plus, Users, Stethoscope, Receipt, ChevronRight, Edit, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddDepartmentModal from '@/components/departments/AddDepartmentModal';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Department {
  id: number;
  name: string;
  head: string;
  doctors: number;
  services: number;
  patients: number;
  color: string;
  description: string;
}

const initialDepartments: Department[] = [
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
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleAddDepartment = (deptData: any) => {
    const newDepartment: Department = {
      id: departments.length + 1,
      name: deptData.name,
      head: deptData.head,
      doctors: 0,
      services: 0,
      patients: 0,
      color: deptData.color,
      description: deptData.description,
    };
    setDepartments([...departments, newDepartment]);
  };

  const handleDeleteDepartment = () => {
    if (selectedDept) {
      setDepartments(departments.filter((d) => d.id !== selectedDept.id));
      toast({
        title: 'Department Deleted',
        description: `${selectedDept.name} department has been removed.`,
      });
      setDeleteDialogOpen(false);
      setDetailModalOpen(false);
      setSelectedDept(null);
    }
  };

  const openDetailModal = (dept: Department) => {
    setSelectedDept(dept);
    setDetailModalOpen(true);
  };

  const confirmDelete = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDept(dept);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout title="Departments" subtitle="Overview of all clinic departments">
      {/* Actions */}
      <div className="flex justify-end mb-4 md:mb-6 animate-fade-up">
        <button className="btn-accent w-full sm:w-auto" onClick={() => setAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add Department</span>
        </button>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="card-elevated overflow-hidden group cursor-pointer"
            onClick={() => openDetailModal(dept)}
          >
            {/* Header with gradient */}
            <div className={`h-2 md:h-3 bg-gradient-to-r ${dept.color}`} />

            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-lg md:text-xl text-foreground truncate">
                    {dept.name}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {dept.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Edit size={14} className="text-muted-foreground" />
                  </button>
                  <button 
                    onClick={(e) => confirmDelete(dept, e)}
                    className="p-1.5 md:p-2 hover:bg-destructive/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                  <ChevronRight
                    size={18}
                    className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all hidden md:block"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 md:mb-5 text-xs md:text-sm">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={14} className="text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Department Head</p>
                  <p className="font-medium text-foreground truncate">{dept.head}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5 md:mb-1">
                    <Stethoscope size={12} />
                  </div>
                  <p className="text-base md:text-lg font-bold font-display text-foreground">
                    {dept.doctors}
                  </p>
                  <p className="text-xs text-muted-foreground">Doctors</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5 md:mb-1">
                    <Receipt size={12} />
                  </div>
                  <p className="text-base md:text-lg font-bold font-display text-foreground">
                    {dept.services}
                  </p>
                  <p className="text-xs text-muted-foreground">Services</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5 md:mb-1">
                    <Users size={12} />
                  </div>
                  <p className="text-base md:text-lg font-bold font-display text-foreground">
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
      <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Total Departments</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {departments.length}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Total Doctors</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {departments.reduce((acc, d) => acc + d.doctors, 0)}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Total Services</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {departments.reduce((acc, d) => acc + d.services, 0)}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Total Patients</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {departments.reduce((acc, d) => acc + d.patients, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Modals */}
      <AddDepartmentModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddDepartment}
      />

      {/* Department Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-4 h-10 rounded bg-gradient-to-b ${selectedDept?.color}`} />
              <div>
                <h2 className="text-xl font-display font-bold">{selectedDept?.name}</h2>
                <p className="text-sm text-muted-foreground font-normal">{selectedDept?.description}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedDept && (
            <div className="space-y-6 mt-4">
              {/* Department Head */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center">
                  <Stethoscope className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department Head</p>
                  <p className="font-semibold text-foreground">{selectedDept.head}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Stethoscope size={24} className="mx-auto text-brand-navy mb-2" />
                  <p className="text-2xl font-bold font-display">{selectedDept.doctors}</p>
                  <p className="text-sm text-muted-foreground">Doctors</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Receipt size={24} className="mx-auto text-brand-teal mb-2" />
                  <p className="text-2xl font-bold font-display">{selectedDept.services}</p>
                  <p className="text-sm text-muted-foreground">Services</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Users size={24} className="mx-auto text-secondary mb-2" />
                  <p className="text-2xl font-bold font-display">{selectedDept.patients}</p>
                  <p className="text-sm text-muted-foreground">Patients</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button className="btn-outline flex-1">
                  <Edit size={16} />
                  Edit Department
                </button>
                <button 
                  onClick={() => {
                    setDetailModalOpen(false);
                    setDeleteDialogOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {selectedDept?.name} department? This action cannot be undone and all associated data will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
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

export default Departments;
