import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, CreditCard, Banknote, Smartphone, Download,
  Eye, DollarSign, TrendingUp, ArrowUpRight, RefreshCw, AlertCircle,
  Building2, Shield, Wallet, CheckCircle2, Clock, X, ChevronRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentCollectionModal from '@/components/payments/PaymentCollectionModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import billingService, { Invoice, Payment } from '@/lib/billingService';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_ICONS: Record<string, React.ElementType> = {
  card:          CreditCard,
  cash:          Banknote,
  upi:           Smartphone,
  bank_transfer: Building2,
  insurance:     Shield,
  wallet:        Wallet,
};

const METHOD_LABELS: Record<string, string> = {
  card:          'Card',
  cash:          'Cash',
  upi:           'UPI',
  bank_transfer: 'Bank Transfer',
  insurance:     'Insurance',
  wallet:        'Wallet',
};

const METHOD_COLORS: Record<string, string> = {
  card:          'text-blue-500  bg-blue-50',
  cash:          'text-emerald-500 bg-emerald-50',
  upi:           'text-violet-500 bg-violet-50',
  bank_transfer: 'text-sky-500   bg-sky-50',
  insurance:     'text-amber-500  bg-amber-50',
  wallet:        'text-pink-500   bg-pink-50',
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; classes: string; dot: string }> = {
  PAID:           { label: 'Paid',     icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_PAID: { label: 'Partial',  icon: Clock,        classes: 'bg-amber-50  text-amber-700  border-amber-200',   dot: 'bg-amber-500'   },
  PENDING:        { label: 'Pending',  icon: Clock,        classes: 'bg-slate-50  text-slate-600  border-slate-200',   dot: 'bg-slate-400'   },
  OVERDUE:        { label: 'Overdue',  icon: AlertCircle,  classes: 'bg-red-50    text-red-700    border-red-200',     dot: 'bg-red-500'     },
  DRAFT:          { label: 'Draft',    icon: Clock,        classes: 'bg-slate-50  text-slate-500  border-slate-200',   dot: 'bg-slate-300'   },
  CANCELLED:      { label: 'Cancelled',icon: X,            classes: 'bg-red-50    text-red-600    border-red-200',     dot: 'bg-red-400'     },
};

const FILTER_METHODS = ['All', 'card', 'cash', 'upi', 'bank_transfer', 'insurance', 'wallet'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Component ────────────────────────────────────────────────────────────────

const Payments = () => {
  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [allPayments,  setAllPayments]  = useState<Payment[]>([]);
  const [summary,      setSummary]      = useState({ collected: 0, processing: 0, outstanding: 0 });
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefresh,    setIsRefresh]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterMethod, setFilterMethod] = useState('All');

  // Modals
  const [viewPayment,     setViewPayment]     = useState<Payment | null>(null);
  const [collectInvoice,  setCollectInvoice]  = useState<Invoice | null>(null);
  const [collectOpen,     setCollectOpen]     = useState(false);

  // ── Data ───────────────────────────────────────────────────────────────────

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefresh(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [invoiceRes, paymentRes] = await Promise.all([
        billingService.getInvoices({ limit: 100 }),
        fetch('/api/v1/billing/payments?limit=100', { headers })
          .then(r => r.ok ? r.json() : { items: [] })
          .catch(() => ({ items: [] })),
      ]);

      setInvoices(invoiceRes.items);
      setAllPayments(paymentRes.items ?? []);

      const collected   = invoiceRes.items.filter(i => i.status === 'PAID')
                            .reduce((s: number, i: Invoice) => s + (i.paid_amount ?? 0), 0);
      const processing  = invoiceRes.items.filter(i => i.status === 'PARTIALLY_PAID')
                            .reduce((s: number, i: Invoice) => s + (i.balance_amount ?? 0), 0);
      const outstanding = invoiceRes.items.filter(i => ['PENDING', 'OVERDUE'].includes(i.status))
                            .reduce((s: number, i: Invoice) => s + (i.total_amount ?? 0), 0);

      setSummary({ collected, processing, outstanding });
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
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (p.invoice?.patient?.full_name ?? '').toLowerCase().includes(q) ||
      (p.invoice?.invoice_number ?? '').toLowerCase().includes(q) ||
      (p.reference_number ?? '').toLowerCase().includes(q);
    const matchMethod = filterMethod === 'All' || p.payment_method === filterMethod;
    return matchSearch && matchMethod;
  });

  const outstandingInvoices = invoices.filter(i =>
    ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status)
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCollect = (invoice: Invoice) => {
    setCollectInvoice(invoice);
    setCollectOpen(true);
  };

  const handlePaymentComplete = useCallback(async () => {
    setCollectOpen(false);
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
    a.href     = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Payments exported');
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout title="Payments" subtitle="Track and collect patient payments">
        <div className="flex items-center justify-center h-64 gap-3">
          <RefreshCw size={20} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading payments…</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Payments" subtitle="Track and collect patient payments">
        <div className="card-elevated p-10 text-center max-w-md mx-auto mt-8">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Failed to load</h3>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <button className="btn-accent" onClick={() => loadData()}>Try Again</button>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Payments" subtitle="Track and collect patient payments">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Collected */}
        <div className="card-elevated p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Collected</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(summary.collected)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {invoices.filter(i => i.status === 'PAID').length} invoices paid
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="card-elevated p-5 border-l-4 border-l-amber-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Processing</p>
              <p className="text-2xl font-bold text-amber-600">{fmt(summary.processing)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {invoices.filter(i => i.status === 'PARTIALLY_PAID').length} partial payments
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-600" />
            </div>
          </div>
        </div>

        {/* Outstanding */}
        <div className="card-elevated p-5 border-l-4 border-l-red-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{fmt(summary.outstanding)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {outstandingInvoices.length} unpaid invoice{outstandingInvoices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <ArrowUpRight size={18} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Payment History (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, invoice, reference…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-modern pl-10 w-full h-10 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => loadData(true)}
                disabled={isRefresh}
                className="btn-ghost h-10 w-10 p-0 flex items-center justify-center"
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefresh ? 'animate-spin' : ''} />
              </button>
              <button onClick={handleExport} className="btn-ghost h-10 px-3 text-sm flex items-center gap-2">
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Method filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_METHODS.map(method => (
              <button
                key={method}
                onClick={() => setFilterMethod(method)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  filterMethod === method
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                {method === 'All' ? 'All Methods' : METHOD_LABELS[method] ?? method}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <CreditCard size={24} className="text-slate-400" />
                </div>
                <p className="font-medium text-slate-600 mb-1">
                  {allPayments.length === 0 ? 'No payments yet' : 'No results found'}
                </p>
                <p className="text-sm text-slate-400">
                  {allPayments.length === 0
                    ? 'Payments you collect will appear here.'
                    : 'Try adjusting your search or filters.'}
                </p>
                {(searchTerm || filterMethod !== 'All') && (
                  <button
                    onClick={() => { setSearchTerm(''); setFilterMethod('All'); }}
                    className="mt-4 text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table min-w-[660px]">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Patient</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => {
                      const MethodIcon = METHOD_ICONS[payment.payment_method] ?? DollarSign;
                      const methodColors = METHOD_COLORS[payment.payment_method] ?? 'text-slate-500 bg-slate-50';
                      const invStatus  = payment.invoice?.status ?? 'PENDING';
                      const statusCfg  = STATUS_CONFIG[invStatus] ?? STATUS_CONFIG.PENDING;

                      return (
                        <tr key={payment.id} className="group">
                          <td>
                            <span className="text-sm font-mono font-medium text-slate-700">
                              {payment.invoice?.invoice_number ?? `PAY-${payment.id}`}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm text-slate-800">
                              {payment.invoice?.patient?.full_name ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm font-bold text-slate-900">
                              {fmt(payment.amount)}
                            </span>
                          </td>
                          <td>
                            <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', methodColors)}>
                              <MethodIcon size={11} />
                              {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                            </div>
                          </td>
                          <td>
                            <span className="text-sm text-slate-500">
                              {fmtDate(payment.payment_date)}
                            </span>
                          </td>
                          <td>
                            <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', statusCfg.classes)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                              {statusCfg.label}
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => setViewPayment(payment)}
                              className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
                              title="View details"
                            >
                              <Eye size={14} className="text-slate-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Row count */}
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-400">
                    {filteredPayments.length} of {allPayments.length} payment{allPayments.length !== 1 ? 's' : ''}
                    {(searchTerm || filterMethod !== 'All') ? ' (filtered)' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Outstanding (1/3) ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Outstanding</h3>
              <p className="text-xs text-slate-400 mt-0.5">Awaiting collection</p>
            </div>
            {outstandingInvoices.length > 0 && (
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                {outstandingInvoices.length}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {outstandingInvoices.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} className="text-emerald-500" />
                </div>
                <p className="font-medium text-slate-700 mb-0.5">All clear!</p>
                <p className="text-sm text-slate-400">No outstanding payments.</p>
              </div>
            ) : (
              outstandingInvoices.map(invoice => {
                const balance  = invoice.balance_amount ?? invoice.balance ?? invoice.total_amount ?? 0;
                const isOverdue = invoice.status === 'OVERDUE' ||
                  (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'PAID');
                const patientName = invoice.patient?.full_name ?? `#${invoice.invoice_number}`;

                return (
                  <div key={invoice.id} className={cn(
                    'card-elevated p-4 border-l-4 transition-shadow hover:shadow-md',
                    isOverdue ? 'border-l-red-400' : invoice.status === 'PARTIALLY_PAID' ? 'border-l-amber-400' : 'border-l-slate-300'
                  )}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{patientName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{invoice.invoice_number}</p>
                      </div>
                      <span className={cn(
                        'shrink-0 text-[11px] px-2 py-0.5 rounded-full font-semibold border',
                        isOverdue
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : invoice.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                      )}>
                        {isOverdue ? 'Overdue' : invoice.status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xl font-bold text-slate-900">{fmt(balance)}</p>
                        {invoice.due_date && (
                          <p className={cn(
                            'text-xs mt-0.5 font-medium',
                            isOverdue ? 'text-red-500' : 'text-slate-400'
                          )}>
                            Due {fmtDate(invoice.due_date)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCollect(invoice)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
                      >
                        Collect
                        <ChevronRight size={13} />
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
      <Dialog open={!!viewPayment} onOpenChange={open => !open && setViewPayment(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Payment Details</DialogTitle>
            <DialogDescription className="text-xs">
              {viewPayment?.invoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {viewPayment && (() => {
            const MethodIcon   = METHOD_ICONS[viewPayment.payment_method] ?? DollarSign;
            const methodColors = METHOD_COLORS[viewPayment.payment_method] ?? 'text-slate-500 bg-slate-50';
            const invStatus    = viewPayment.invoice?.status ?? 'PENDING';
            const statusCfg    = STATUS_CONFIG[invStatus] ?? STATUS_CONFIG.PENDING;

            return (
              <div className="space-y-4 pt-2">
                {/* Amount hero */}
                <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Amount Collected</p>
                  <p className="text-3xl font-bold text-slate-900">{fmt(viewPayment.amount)}</p>
                  <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-2', methodColors)}>
                    <MethodIcon size={12} />
                    {METHOD_LABELS[viewPayment.payment_method] ?? viewPayment.payment_method}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Patient</p>
                    <p className="font-semibold text-slate-800 text-xs leading-tight">
                      {viewPayment.invoice?.patient?.full_name ?? '—'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Date</p>
                    <p className="font-semibold text-slate-800 text-xs">
                      {fmtDate(viewPayment.payment_date)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Status</p>
                    <div className={cn('inline-flex items-center gap-1 text-xs font-semibold')}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                      <span className={statusCfg.classes.split(' ')[1]}>{statusCfg.label}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Reference</p>
                    <p className="font-semibold text-slate-800 text-xs truncate">
                      {viewPayment.reference_number || '—'}
                    </p>
                  </div>
                </div>

                {viewPayment.notes && (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{viewPayment.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Collect Payment Modal ── */}
      <PaymentCollectionModal
        invoice={collectInvoice}
        open={collectOpen}
        onOpenChange={setCollectOpen}
        onPaymentComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
};

export default Payments;