import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, CreditCard, Banknote, Smartphone, Download,
  Eye, DollarSign, TrendingUp, ArrowUpRight, RefreshCw, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentCollectionModal from '@/components/payments/PaymentCollectionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import billingService, { Invoice, Payment } from '@/lib/billingService';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_ICONS: Record<string, React.ElementType> = {
  card:          CreditCard,
  cash:          Banknote,
  upi:           Smartphone,
  bank_transfer: CreditCard,
  insurance:     DollarSign,
  wallet:        DollarSign,
};

const METHOD_LABELS: Record<string, string> = {
  card:          'Card',
  cash:          'Cash',
  upi:           'UPI',
  bank_transfer: 'Bank Transfer',
  insurance:     'Insurance',
  wallet:        'Wallet',
};

// Display badge config per frontend status
const STATUS_CONFIG: Record<Invoice['status'], { label: string; classes: string }> = {
  PAID:          { label: 'Paid',          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PARTIALLY_PAID:{ label: 'Partial',       classes: 'bg-amber-50  text-amber-700  border-amber-200'  },
  PENDING:       { label: 'Pending',       classes: 'bg-amber-50  text-amber-700  border-amber-200'  },
  OVERDUE:       { label: 'Overdue',       classes: 'bg-red-50    text-red-700    border-red-200'    },
  DRAFT:         { label: 'Draft',         classes: 'bg-slate-50  text-slate-600  border-slate-200'  },
  CANCELLED:     { label: 'Cancelled',     classes: 'bg-red-50    text-red-700    border-red-200'    },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentSummaryCards {
  totalCollected: number;
  totalProcessing: number;
  totalOutstanding: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Payments = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [invoices,       setInvoices]       = useState<Invoice[]>([]);
  const [allPayments,    setAllPayments]    = useState<Payment[]>([]);
  const [summaryCards,   setSummaryCards]   = useState<PaymentSummaryCards>({
    totalCollected:   0,
    totalProcessing:  0,
    totalOutstanding: 0,
  });

  const [isLoading,  setIsLoading]  = useState(true);
  const [isRefresh,  setIsRefresh]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterMethod,  setFilterMethod]  = useState<string>('All');
  const [showFilters,   setShowFilters]   = useState(false);

  // Detail modal
  const [viewModalOpen,    setViewModalOpen]    = useState(false);
  const [selectedPayment,  setSelectedPayment]  = useState<Payment | null>(null);

  // Collect modal
  const [collectModalOpen,     setCollectModalOpen]     = useState(false);
  const [selectedInvoice,      setSelectedInvoice]      = useState<Invoice | null>(null);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else         setIsRefresh(true);
    setError(null);

    try {
      const [invoiceRes, paymentRes, summaryRes] = await Promise.all([
        billingService.getInvoices({ limit: 100 }),
        // GET /billing/payments — paginated list of all payments
        fetch('/api/v1/billing/payments?limit=100', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        }).then(r => r.json()).catch(() => ({ items: [] })),
        billingService.getRevenueReport(),
      ]);

      setInvoices(invoiceRes.items);
      setAllPayments(paymentRes.items ?? []);

      // Build summary cards from live data
      const collected   = invoiceRes.items.filter(i => i.status === 'PAID')
                            .reduce((s, i) => s + i.paid_amount, 0);
      const processing  = invoiceRes.items.filter(i => i.status === 'PARTIALLY_PAID')
                            .reduce((s, i) => s + i.balance_amount, 0);
      const outstanding = invoiceRes.items.filter(i => ['PENDING','OVERDUE'].includes(i.status))
                            .reduce((s, i) => s + i.total_amount, 0);

      setSummaryCards({ totalCollected: collected, totalProcessing: processing, totalOutstanding: outstanding });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Failed to load billing data';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefresh(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredPayments = allPayments.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (p.invoice?.patient?.full_name ?? '').toLowerCase().includes(search) ||
      (p.invoice?.invoice_number ?? '').toLowerCase().includes(search) ||
      (p.reference_number ?? '').toLowerCase().includes(search);
    const matchesMethod = filterMethod === 'All' || p.payment_method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  // Outstanding = unpaid / partially-paid invoices
  const outstandingInvoices = invoices.filter(i =>
    ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status)
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCollect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCollectModalOpen(true);
  };

  const handlePaymentComplete = useCallback(async () => {
    setCollectModalOpen(false);
    await loadData(true);
    toast.success('Payment collected successfully');
  }, [loadData]);

  const handleExport = () => {
    const csv = [
      'Invoice,Patient,Amount,Method,Date,Reference,Status',
      ...allPayments.map(p =>
        [
          p.invoice?.invoice_number ?? '',
          p.invoice?.patient?.full_name ?? '',
          p.amount.toFixed(2),
          METHOD_LABELS[p.payment_method] ?? p.payment_method,
          p.payment_date?.split('T')[0] ?? '',
          p.reference_number ?? '',
          p.invoice?.status ?? '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'payments-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Payments exported');
  };

  const fmt = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Render helpers ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout title="Payments" subtitle="Track and collect patient payments">
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Payments" subtitle="Track and collect patient payments">
        <div className="card-elevated p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button className="btn-accent" onClick={() => loadData()}>Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Payments" subtitle="Track and collect patient payments">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-children">
        <div className="card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold font-display text-emerald-600">
                {fmt(summaryCards.totalCollected)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Processing</p>
              <p className="text-2xl font-bold font-display text-amber-600">
                {fmt(summaryCards.totalProcessing)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <CreditCard size={20} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold font-display text-red-600">
                {fmt(summaryCards.totalOutstanding)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowUpRight size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Payment History ── */}
        <div className="lg:col-span-2">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 sm:max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by patient, invoice or reference…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input-modern pl-11 w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  className={`btn-ghost ${showFilters ? 'bg-muted' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Filter"
                >
                  <Filter size={18} />
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => loadData(true)}
                  title="Refresh"
                  disabled={isRefresh}
                >
                  <RefreshCw size={18} className={isRefresh ? 'animate-spin' : ''} />
                </button>
                <button className="btn-ghost" onClick={handleExport}>
                  <Download size={18} />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 animate-fade-up">
                {['All', 'card', 'cash', 'upi', 'bank_transfer', 'insurance', 'wallet'].map(method => (
                  <button
                    key={method}
                    onClick={() => setFilterMethod(method)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filterMethod === method
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {method === 'All' ? 'All' : METHOD_LABELS[method] ?? method}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {allPayments.length === 0 ? 'No payments recorded yet.' : 'No payments match your filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table min-w-[700px]">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Patient</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => {
                      const MethodIcon = METHOD_ICONS[payment.payment_method] ?? DollarSign;
                      const invStatus  = payment.invoice?.status ?? 'PENDING';
                      const statusCfg  = STATUS_CONFIG[invStatus] ?? STATUS_CONFIG.PENDING;

                      return (
                        <tr key={payment.id}>
                          <td>
                            <span className="text-sm font-medium">
                              {payment.invoice?.invoice_number ?? `PAY-${payment.id}`}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm">
                              {payment.invoice?.patient?.full_name ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm font-semibold">
                              {fmt(payment.amount)}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <MethodIcon size={14} className="text-muted-foreground" />
                              <span className="text-sm">
                                {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="text-sm text-muted-foreground">
                              {payment.payment_date?.split('T')[0] ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge border ${statusCfg.classes}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => { setSelectedPayment(payment); setViewModalOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                              title="View details"
                            >
                              <Eye size={14} className="text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Outstanding Invoices ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Outstanding</h3>
            {outstandingInvoices.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {outstandingInvoices.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <CreditCard size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">All payments collected!</p>
              </div>
            ) : (
              outstandingInvoices.map(invoice => {
                const cfg     = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.PENDING;
                const balance = invoice.balance_amount ?? invoice.balance ?? invoice.total_amount;
                const isOverdue = invoice.status === 'OVERDUE' ||
                  (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'PAID');

                return (
                  <div key={invoice.id} className="card-elevated p-4 group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        {invoice.patient?.full_name ?? `Invoice #${invoice.invoice_number}`}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        isOverdue
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {isOverdue ? 'overdue' : cfg.label.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold font-display">{fmt(balance)}</p>
                        {invoice.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {invoice.due_date}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {invoice.invoice_number}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCollect(invoice)}
                        className="btn-accent py-2 px-3 text-xs"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Detail Modal ── */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Transaction information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Invoice</p>
                  <p className="font-medium">{selectedPayment.invoice?.invoice_number ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedPayment.invoice?.patient?.full_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">{fmt(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Method</p>
                  <p className="font-medium">
                    {METHOD_LABELS[selectedPayment.payment_method] ?? selectedPayment.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedPayment.payment_date?.split('T')[0] ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-medium">{selectedPayment.reference_number ?? '—'}</p>
                </div>
              </div>
              {selectedPayment.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Collect Payment Modal ── */}
      <PaymentCollectionModal
        invoice={selectedInvoice}
        open={collectModalOpen}
        onOpenChange={setCollectModalOpen}
        onPaymentComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
};

export default Payments;