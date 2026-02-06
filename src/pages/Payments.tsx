import { useState } from 'react';
import { Search, Filter, CreditCard, Banknote, Smartphone, Download, Eye, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentCollectionModal from '@/components/payments/PaymentCollectionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Payment {
  id: number;
  invoiceNumber: string;
  patient: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'ONLINE' | 'OTHER';
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  status: 'completed' | 'pending' | 'refunded';
}

const initialPayments: Payment[] = [
  { id: 1, invoiceNumber: 'INV-2024-001', patient: 'Sarah Johnson', amount: 253, paymentMethod: 'CARD', paymentDate: '2024-01-15', referenceNumber: 'PAY-001', notes: '', status: 'completed' },
  { id: 2, invoiceNumber: 'INV-2024-002', patient: 'Robert Williams', amount: 100, paymentMethod: 'CASH', paymentDate: '2024-01-18', referenceNumber: 'PAY-002', notes: 'Partial payment', status: 'completed' },
  { id: 3, invoiceNumber: 'INV-2024-006', patient: 'James Anderson', amount: 450, paymentMethod: 'INSURANCE', paymentDate: '2024-01-19', referenceNumber: 'INS-34521', notes: 'Insurance claim approved', status: 'completed' },
  { id: 4, invoiceNumber: 'INV-2024-007', patient: 'Lisa Park', amount: 180, paymentMethod: 'ONLINE', paymentDate: '2024-01-20', referenceNumber: 'ONL-99812', notes: '', status: 'completed' },
  { id: 5, invoiceNumber: 'INV-2024-008', patient: 'Michael Torres', amount: 320, paymentMethod: 'CARD', paymentDate: '2024-01-21', referenceNumber: 'PAY-005', notes: '', status: 'pending' },
  { id: 6, invoiceNumber: 'INV-2024-009', patient: 'Anna Kim', amount: 95, paymentMethod: 'CASH', paymentDate: '2024-01-22', referenceNumber: 'PAY-006', notes: 'Refunded due to service cancellation', status: 'refunded' },
];

const outstandingList = [
  { id: 101, patient: 'David Brown', amount: 550, dueDate: '2024-02-22', status: 'pending' },
  { id: 102, patient: 'Maria Garcia', amount: 408, dueDate: '2024-01-30', status: 'overdue' },
  { id: 103, patient: 'Emily Chen', amount: 82.5, dueDate: '2024-02-25', status: 'pending' },
];

const methodIcons: Record<string, React.ElementType> = {
  CARD: CreditCard, CASH: Banknote, ONLINE: Smartphone, BANK_TRANSFER: CreditCard, INSURANCE: DollarSign, OTHER: DollarSign,
};

const methodLabels: Record<string, string> = {
  CARD: 'Card', CASH: 'Cash', ONLINE: 'Online', BANK_TRANSFER: 'Bank Transfer', INSURANCE: 'Insurance', OTHER: 'Other',
};

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [outstanding, setOutstanding] = useState(outstandingList);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedOutstanding, setSelectedOutstanding] = useState<typeof outstandingList[0] | null>(null);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.patient.toLowerCase().includes(searchTerm.toLowerCase()) || p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMethod === 'All' || p.paymentMethod === filterMethod;
    return matchesSearch && matchesFilter;
  });

  const totalCollected = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = outstanding.reduce((s, o) => s + o.amount, 0);

  const handleCollect = (item: typeof outstandingList[0]) => {
    setSelectedOutstanding(item);
    setCollectModalOpen(true);
  };

  const handlePaymentComplete = (paymentId: number) => {
    setOutstanding(prev => prev.filter(o => o.id !== paymentId));
    const completedItem = outstanding.find(o => o.id === paymentId);
    if (completedItem) {
      setPayments(prev => [{
        id: Date.now(), invoiceNumber: `INV-2024-${String(payments.length + 1).padStart(3, '0')}`,
        patient: completedItem.patient, amount: completedItem.amount, paymentMethod: 'CARD',
        paymentDate: new Date().toISOString().split('T')[0], referenceNumber: `PAY-${Date.now().toString().slice(-6)}`,
        notes: '', status: 'completed',
      }, ...prev]);
    }
    toast.success('Payment collected successfully');
  };

  const handleExport = () => {
    const csv = ['Invoice,Patient,Amount,Method,Date,Reference,Status', ...payments.map(p => `${p.invoiceNumber},${p.patient},${p.amount},${methodLabels[p.paymentMethod]},${p.paymentDate},${p.referenceNumber},${p.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'payments-export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Payments exported');
  };

  return (
    <DashboardLayout title="Payments" subtitle="Track and collect patient payments">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-children">
        <div className="card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold font-display text-emerald-600">${totalCollected.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp size={20} className="text-emerald-600" /></div>
          </div>
        </div>
        <div className="card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold font-display text-amber-600">${totalPending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><CreditCard size={20} className="text-amber-600" /></div>
          </div>
        </div>
        <div className="card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold font-display text-red-600">${totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><ArrowUpRight size={20} className="text-red-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History */}
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 sm:max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Search payments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-modern pl-11 w-full" />
              </div>
              <div className="flex gap-2">
                <button className={`btn-ghost ${showFilters ? 'bg-muted' : ''}`} onClick={() => setShowFilters(!showFilters)}><Filter size={18} /></button>
                <button className="btn-ghost" onClick={handleExport}><Download size={18} /><span className="hidden sm:inline">Export</span></button>
              </div>
            </div>
            {showFilters && (
              <div className="flex flex-wrap gap-2 animate-fade-up">
                {['All', 'CARD', 'CASH', 'ONLINE', 'BANK_TRANSFER', 'INSURANCE'].map((method) => (
                  <button key={method} onClick={() => setFilterMethod(method)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterMethod === method ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {method === 'All' ? 'All' : methodLabels[method] || method}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[700px]">
                <thead>
                  <tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const MethodIcon = methodIcons[payment.paymentMethod] || DollarSign;
                    return (
                      <tr key={payment.id}>
                        <td><span className="text-sm font-medium">{payment.invoiceNumber}</span></td>
                        <td><span className="text-sm">{payment.patient}</span></td>
                        <td><span className="text-sm font-semibold">${payment.amount.toFixed(2)}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <MethodIcon size={14} className="text-muted-foreground" />
                            <span className="text-sm">{methodLabels[payment.paymentMethod]}</span>
                          </div>
                        </td>
                        <td><span className="text-sm text-muted-foreground">{payment.paymentDate}</span></td>
                        <td>
                          <span className={`status-badge border ${payment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : payment.status === 'refunded' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => { setSelectedPayment(payment); setViewModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Eye size={14} className="text-muted-foreground" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Outstanding Payments */}
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">Outstanding</h3>
          <div className="space-y-3">
            {outstanding.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <CreditCard size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">All payments collected!</p>
              </div>
            ) : (
              outstanding.map((item) => (
                <div key={item.id} className="card-elevated p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{item.patient}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'overdue' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold font-display">${item.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Due: {item.dueDate}</p>
                    </div>
                    <button onClick={() => handleCollect(item)} className="btn-accent py-2 px-3 text-xs">
                      Collect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View Payment Detail */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Transaction information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Invoice</p><p className="font-medium">{selectedPayment.invoiceNumber}</p></div>
                <div><p className="text-muted-foreground">Patient</p><p className="font-medium">{selectedPayment.patient}</p></div>
                <div><p className="text-muted-foreground">Amount</p><p className="font-bold text-lg">${selectedPayment.amount.toFixed(2)}</p></div>
                <div><p className="text-muted-foreground">Method</p><p className="font-medium">{methodLabels[selectedPayment.paymentMethod]}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{selectedPayment.paymentDate}</p></div>
                <div><p className="text-muted-foreground">Reference</p><p className="font-medium">{selectedPayment.referenceNumber}</p></div>
              </div>
              {selectedPayment.notes && <div className="p-3 bg-muted/30 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{selectedPayment.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collect Payment Modal */}
      <PaymentCollectionModal
        payment={selectedOutstanding}
        open={collectModalOpen}
        onOpenChange={setCollectModalOpen}
        onPaymentComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
};

export default Payments;
