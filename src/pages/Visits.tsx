import { useState } from 'react';
import { Search, Filter, FileText, Pill, Stethoscope, Calendar, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const visits = [
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

const Visits = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(visits[0]);

  const filteredVisits = visits.filter(
    (visit) =>
      visit.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Visits" subtitle="Track patient visits and treatments">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visit List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative animate-fade-up">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search visits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11"
            />
          </div>

          <div className="space-y-3 stagger-children">
            {filteredVisits.map((visit) => (
              <button
                key={visit.id}
                onClick={() => setSelectedVisit(visit)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedVisit.id === visit.id
                    ? 'bg-brand-teal-light border-2 border-brand-teal'
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
                  <span>{visit.doctor}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visit Details */}
        <div className="lg:col-span-2 card-elevated p-6 animate-fade-up">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {selectedVisit.patient}
              </h2>
              <p className="text-muted-foreground">{selectedVisit.date}</p>
            </div>
            <span
              className={`status-badge ${
                selectedVisit.status === 'completed'
                  ? 'status-active'
                  : 'status-pending'
              }`}
            >
              {selectedVisit.status.replace('-', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-navy/10 flex items-center justify-center">
                  <Stethoscope size={18} className="text-brand-navy" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attending Doctor</p>
                  <p className="font-semibold">{selectedVisit.doctor}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-teal/10 flex items-center justify-center">
                  <Calendar size={18} className="text-brand-teal" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Follow-up Date</p>
                  <p className="font-semibold">{selectedVisit.followUp}</p>
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
                {selectedVisit.prescription}
              </p>
            </div>

            <div>
              <h3 className="font-display font-semibold text-foreground mb-3">
                Clinical Notes
              </h3>
              <p className="p-4 bg-muted/30 rounded-xl text-muted-foreground">
                {selectedVisit.notes}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button className="btn-primary flex-1">Edit Visit</button>
            <button className="btn-outline flex-1">Print Report</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Visits;
