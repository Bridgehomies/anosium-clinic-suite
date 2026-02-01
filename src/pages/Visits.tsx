import { useState } from 'react';
import { Search, FileText, Pill, Stethoscope, Calendar, ChevronRight, Plus, Printer, Edit, Trash2, X, Save } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Visit {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  diagnosis: string;
  prescription: string;
  followUp: string;
  status: string;
  notes: string;
}

const initialVisits: Visit[] = [
  {
    id: 1,
    patient: 'Sarah Johnson',
    doctor: 'Dr. Michael Chen',
    date: '2024-01-10',
    diagnosis: 'Hypertension',
    prescription: 'Lisinopril 10mg',
    followUp: '2024-02-10',
    status: 'completed',
    notes: 'Blood pressure elevated. Prescribed medication and lifestyle changes.',
  },
  {
    id: 2,
    patient: 'Robert Williams',
    doctor: 'Dr. Emily Parker',
    date: '2024-01-08',
    diagnosis: 'Eczema',
    prescription: 'Hydrocortisone cream',
    followUp: '2024-01-22',
    status: 'follow-up-scheduled',
    notes: 'Mild skin irritation on arms. Prescribed topical treatment.',
  },
  {
    id: 3,
    patient: 'Maria Garcia',
    doctor: 'Dr. James Wilson',
    date: '2024-01-05',
    diagnosis: 'Lower back pain',
    prescription: 'Physical therapy',
    followUp: '2024-01-19',
    status: 'completed',
    notes: 'Chronic lower back pain. Referred to physical therapy.',
  },
  {
    id: 4,
    patient: 'David Brown',
    doctor: 'Dr. Sarah Lee',
    date: '2023-12-20',
    diagnosis: 'Annual checkup',
    prescription: 'Vitamin D supplement',
    followUp: '2024-06-20',
    status: 'completed',
    notes: 'Routine annual examination. All vitals normal. Vitamin D slightly low.',
  },
];

const doctors = [
  'Dr. Michael Chen',
  'Dr. Emily Parker',
  'Dr. James Wilson',
  'Dr. Sarah Lee',
  'Dr. Robert Kim',
];

const Visits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [selectedVisit, setSelectedVisit] = useState<Visit>(visits[0]);
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<Visit | null>(null);

  // Form states
  const [formData, setFormData] = useState<Omit<Visit, 'id'>>({
    patient: '',
    doctor: '',
    date: '',
    diagnosis: '',
    prescription: '',
    followUp: '',
    status: 'completed',
    notes: '',
  });

  const filteredVisits = visits.filter(
    (visit) =>
      visit.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVisit = () => {
    if (!formData.patient || !formData.doctor || !formData.date || !formData.diagnosis) {
      toast.error('Please fill in all required fields');
      return;
    }
    const newVisit: Visit = {
      ...formData,
      id: Date.now(),
    };
    setVisits([newVisit, ...visits]);
    setSelectedVisit(newVisit);
    setAddModalOpen(false);
    resetForm();
    toast.success('Visit added successfully');
  };

  const handleEditVisit = () => {
    if (!formData.patient || !formData.doctor || !formData.date || !formData.diagnosis) {
      toast.error('Please fill in all required fields');
      return;
    }
    const updatedVisits = visits.map(v => 
      v.id === selectedVisit.id ? { ...formData, id: selectedVisit.id } : v
    );
    setVisits(updatedVisits);
    setSelectedVisit({ ...formData, id: selectedVisit.id });
    setEditModalOpen(false);
    toast.success('Visit updated successfully');
  };

  const handleDeleteVisit = () => {
    if (!visitToDelete) return;
    const updatedVisits = visits.filter(v => v.id !== visitToDelete.id);
    setVisits(updatedVisits);
    if (selectedVisit.id === visitToDelete.id && updatedVisits.length > 0) {
      setSelectedVisit(updatedVisits[0]);
    }
    setDeleteDialogOpen(false);
    setVisitToDelete(null);
    toast.success('Visit deleted successfully');
  };

  const openEditModal = () => {
    setFormData({
      patient: selectedVisit.patient,
      doctor: selectedVisit.doctor,
      date: selectedVisit.date,
      diagnosis: selectedVisit.diagnosis,
      prescription: selectedVisit.prescription,
      followUp: selectedVisit.followUp,
      status: selectedVisit.status,
      notes: selectedVisit.notes,
    });
    setEditModalOpen(true);
  };

  const openDeleteDialog = (visit: Visit) => {
    setVisitToDelete(visit);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      patient: '',
      doctor: '',
      date: '',
      diagnosis: '',
      prescription: '',
      followUp: '',
      status: 'completed',
      notes: '',
    });
  };

  const handlePrintReport = () => {
    const printContent = `
VISIT REPORT
============

Patient: ${selectedVisit.patient}
Date: ${selectedVisit.date}
Doctor: ${selectedVisit.doctor}
Status: ${selectedVisit.status.replace('-', ' ')}

DIAGNOSIS
---------
${selectedVisit.diagnosis}

PRESCRIPTION
------------
${selectedVisit.prescription}

CLINICAL NOTES
--------------
${selectedVisit.notes}

FOLLOW-UP
---------
Scheduled: ${selectedVisit.followUp}

---
Generated on: ${new Date().toLocaleDateString()}
AnosiumAI Clinic Management System
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Visit Report - ${selectedVisit.patient}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 40px; line-height: 1.6; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${printContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('Print dialog opened');
  };

  const VisitFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient">Patient Name *</Label>
          <Input
            id="patient"
            value={formData.patient}
            onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            placeholder="Enter patient name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doctor">Doctor *</Label>
          <Select 
            value={formData.doctor} 
            onValueChange={(value) => setFormData({ ...formData, doctor: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-popover">
              {doctors.map((doc) => (
                <SelectItem key={doc} value={doc}>{doc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Visit Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="followUp">Follow-up Date</Label>
          <Input
            id="followUp"
            type="date"
            value={formData.followUp}
            onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnosis *</Label>
          <Input
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="Enter diagnosis"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100] bg-popover">
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="follow-up-scheduled">Follow-up Scheduled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prescription">Prescription</Label>
        <Input
          id="prescription"
          value={formData.prescription}
          onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
          placeholder="Enter prescription details"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Clinical Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter clinical notes..."
          rows={4}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Visits" subtitle="Track patient visits and treatments">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visit List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-11 w-full"
              />
            </div>
            <button 
              onClick={() => {
                resetForm();
                setAddModalOpen(true);
              }}
              className="btn-accent flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span className="sm:inline">Add Visit</span>
            </button>
          </div>

          <div className="space-y-3 stagger-children max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredVisits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>No visits found</p>
              </div>
            ) : (
              filteredVisits.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedVisit.id === visit.id
                      ? 'bg-accent border-2 border-secondary'
                      : 'card-elevated hover:shadow-medium'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{visit.patient}</h3>
                    <ChevronRight
                      size={16}
                      className={`text-muted-foreground transition-transform ${
                        selectedVisit.id === visit.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  <p className="text-sm text-secondary font-medium">{visit.diagnosis}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>{visit.date}</span>
                    <span>•</span>
                    <span className="truncate">{visit.doctor}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Visit Details */}
        <div className="lg:col-span-2 card-elevated p-4 md:p-6 animate-fade-up">
          {visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
              <FileText size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-medium">No visits yet</p>
              <p className="text-sm">Add your first visit to get started</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                    {selectedVisit.patient}
                  </h2>
                  <p className="text-muted-foreground">{selectedVisit.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`status-badge ${
                      selectedVisit.status === 'completed'
                        ? 'status-active'
                        : 'status-pending'
                    }`}
                  >
                    {selectedVisit.status.replace('-', ' ')}
                  </span>
                  <button 
                    onClick={() => openDeleteDialog(selectedVisit)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete visit"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Stethoscope size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Attending Doctor</p>
                      <p className="font-semibold">{selectedVisit.doctor}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Calendar size={18} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Follow-up Date</p>
                      <p className="font-semibold">{selectedVisit.followUp || 'Not scheduled'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-secondary" />
                    Diagnosis
                  </h3>
                  <p className="p-4 bg-muted/30 rounded-xl text-foreground">
                    {selectedVisit.diagnosis}
                  </p>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Pill size={18} className="text-secondary" />
                    Prescription
                  </h3>
                  <p className="p-4 bg-muted/30 rounded-xl text-foreground">
                    {selectedVisit.prescription || 'No prescription'}
                  </p>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-foreground mb-3">
                    Clinical Notes
                  </h3>
                  <p className="p-4 bg-muted/30 rounded-xl text-muted-foreground">
                    {selectedVisit.notes || 'No notes'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button 
                  onClick={openEditModal}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Edit size={18} />
                  Edit Visit
                </button>
                <button 
                  onClick={handlePrintReport}
                  className="btn-outline flex-1 flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Visit Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Visit</DialogTitle>
            <DialogDescription>Record a new patient visit</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <VisitFormFields />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button onClick={() => setAddModalOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleAddVisit} className="btn-accent flex items-center gap-2">
              <Save size={18} />
              Add Visit
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Visit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Visit</DialogTitle>
            <DialogDescription>Update visit information</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <VisitFormFields />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button onClick={() => setEditModalOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={handleEditVisit} className="btn-accent flex items-center gap-2">
              <Save size={18} />
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Visit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the visit for "{visitToDelete?.patient}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVisit}
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

export default Visits;
