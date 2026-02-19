import { useState, useEffect } from 'react';
import {
  CreditCard, Banknote, Smartphone, Building2, Shield, Wallet,
  CheckCircle, AlertCircle, X, ChevronRight, Loader2, Receipt,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import billingService, { Invoice, PaymentCreate } from '@/lib/billingService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentCollectionModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: (invoiceId: number) => void;
}

// ─── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS: {
  id: PaymentCreate['payment_method'];
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
}[] = [
  { id: 'card',          name: 'Card',          icon: CreditCard,  description: 'Visa, Mastercard, Amex',    color: 'text-blue-500'   },
  { id: 'cash',          name: 'Cash',          icon: Banknote,    description: 'Physical currency',         color: 'text-emerald-500' },
  { id: 'upi',           name: 'UPI',           icon: Smartphone,  description: 'GPay, PhonePe, Paytm',      color: 'text-violet-500'  },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2,   description: 'NEFT / RTGS / IMPS',        color: 'text-sky-500'     },
  { id: 'insurance',     name: 'Insurance',     icon: Shield,      description: 'Direct insurance claim',    color: 'text-amber-500'   },
  { id: 'wallet',        name: 'Wallet',        icon: Wallet,      description: 'Prepaid wallet balance',    color: 'text-pink-500'    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentCollectionModal = ({
  invoice,
  open,
  onOpenChange,
  onPaymentComplete,
}: PaymentCollectionModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentCreate['payment_method'] | null>(null);
  const [paymentType,    setPaymentType]    = useState<'full' | 'partial'>('full');
  const [partialAmount,  setPartialAmount]  = useState('');
  const [reference,      setReference]      = useState('');
  const [notes,          setNotes]          = useState('');
  const [processing,     setProcessing]     = useState(false);
  const [completed,      setCompleted]      = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [step,           setStep]           = useState<'amount' | 'method' | 'confirm'>('amount');

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedMethod(null);
        setPaymentType('full');
        setPartialAmount('');
        setReference('');
        setNotes('');
        setProcessing(false);
        setCompleted(false);
        setError(null);
        setStep('amount');
      }, 300);
    }
  }, [open]);

  if (!invoice) return null;

  const balance = invoice.balance_amount > 0 ? invoice.balance_amount : (invoice.balance ?? 0);
  const partialNum = parseFloat(partialAmount) || 0;
  const payAmount  = paymentType === 'partial' ? partialNum : balance;
  const remaining  = balance - payAmount;

  const isPartialValid =
    paymentType === 'full' ||
    (partialAmount !== '' && !isNaN(partialNum) && partialNum > 0 && partialNum <= balance);

  const isOverPayment =
    paymentType === 'partial' && partialAmount !== '' && !isNaN(partialNum) && partialNum > balance;

  const canProceedAmount = isPartialValid && !isOverPayment;
  const canProceedMethod = canProceedAmount && selectedMethod !== null;
  const canSubmit        = canProceedMethod && !processing;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProcessPayment = async () => {
    if (!canSubmit || !invoice) return;
    setError(null);
    setProcessing(true);

    try {
      await billingService.createPayment({
        invoice_id:       invoice.id,
        patient_id:       invoice.patient_id,
        amount:           payAmount,
        payment_method:   selectedMethod!,
        payment_date:     new Date().toISOString(),
        reference_number: reference.trim() || undefined,
        notes:            notes.trim() || undefined,
      });

      setCompleted(true);
      setTimeout(() => {
        onPaymentComplete?.(invoice.id);
        onOpenChange(false);
      }, 2200);
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? 'Payment failed. Please try again.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const selectedMethodObj = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  // ── Steps ─────────────────────────────────────────────────────────────────

  const STEPS = [
    { key: 'amount',  label: 'Amount'  },
    { key: 'method',  label: 'Method'  },
    { key: 'confirm', label: 'Confirm' },
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-8 overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border border-white/5" />
          <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full border border-white/5" />

          <div className="flex items-start justify-between relative">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-white/50 tracking-widest uppercase">Collect Payment</span>
              </div>
              <p className="text-white/40 text-xs mb-1 font-medium">{invoice.invoice_number}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-white/60 text-lg font-light">$</span>
                <span className="text-4xl font-bold text-white tracking-tight">{fmt(balance)}</span>
              </div>
              <p className="text-white/40 text-xs mt-1">Outstanding balance</p>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {invoice.due_date && (
            <div className={cn(
              'mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              invoice.status === 'OVERDUE'
                ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', invoice.status === 'OVERDUE' ? 'bg-red-400' : 'bg-amber-400')} />
              Due {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}

          {/* Step progress */}
          {!completed && (
            <div className="mt-5 flex items-center gap-0">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <button
                    onClick={() => {
                      if (s.key === 'amount') setStep('amount');
                      if (s.key === 'method' && canProceedAmount) setStep('method');
                    }}
                    className="flex items-center gap-1.5 group"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                      step === s.key
                        ? 'bg-emerald-500 text-white scale-110'
                        : STEPS.findIndex(x => x.key === step) > i
                          ? 'bg-emerald-500/30 text-emerald-400'
                          : 'bg-white/10 text-white/30'
                    )}>
                      {STEPS.findIndex(x => x.key === step) > i
                        ? <CheckCircle className="w-3 h-3" />
                        : i + 1}
                    </div>
                    <span className={cn(
                      'text-[11px] font-medium transition-colors',
                      step === s.key ? 'text-white' : 'text-white/30'
                    )}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="w-6 h-px bg-white/10 mx-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="bg-white">

          {/* ── SUCCESS ── */}
          {completed && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="absolute inset-0 rounded-full bg-emerald-200/40 animate-ping" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Payment Collected!</h3>
              <p className="text-slate-500 text-sm mt-1.5">
                <span className="font-semibold text-slate-700">${fmt(payAmount)}</span> via {selectedMethodObj?.name}
              </p>
              {remaining > 0 && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-full">
                  ${fmt(remaining)} remaining on this invoice
                </p>
              )}
            </div>
          )}

          {/* ── STEP: AMOUNT ── */}
          {!completed && step === 'amount' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentType('full')}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    paymentType === 'full'
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  {paymentType === 'full' && (
                    <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-emerald-500" />
                  )}
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full</p>
                  <p className="text-xl font-bold text-slate-900">${fmt(balance)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Clears balance</p>
                </button>

                <button
                  onClick={() => setPaymentType('partial')}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    paymentType === 'partial'
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  {paymentType === 'partial' && (
                    <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-emerald-500" />
                  )}
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Partial</p>
                  <p className="text-xl font-bold text-slate-900">Custom</p>
                  <p className="text-xs text-slate-400 mt-0.5">Enter amount</p>
                </button>
              </div>

              {paymentType === 'partial' && (
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={partialAmount}
                      onChange={e => setPartialAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      max={balance}
                      autoFocus
                      className={cn(
                        'w-full pl-8 pr-4 py-3.5 rounded-xl border-2 text-xl font-bold text-center focus:outline-none transition-colors',
                        isOverPayment
                          ? 'border-red-300 bg-red-50 text-red-700 focus:border-red-400'
                          : partialAmount && isPartialValid
                            ? 'border-emerald-400 bg-emerald-50/50 text-slate-900 focus:border-emerald-500'
                            : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-400'
                      )}
                    />
                  </div>

                  {isOverPayment && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Exceeds balance of ${fmt(balance)}
                    </div>
                  )}

                  {isPartialValid && !isOverPayment && partialAmount && (
                    <div className="flex items-center justify-between text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                      <span className="text-amber-700">Remaining after payment</span>
                      <span className="font-bold text-amber-800">${fmt(remaining)}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setStep('method')}
                disabled={!canProceedAmount}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                  canProceedAmount
                    ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP: METHOD ── */}
          {!completed && step === 'method' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                      selectedMethod === method.id
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      selectedMethod === method.id ? 'bg-emerald-100' : 'bg-slate-100'
                    )}>
                      <method.icon className={cn('w-4 h-4', selectedMethod === method.id ? 'text-emerald-600' : 'text-slate-400')} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{method.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{method.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 py-3 rounded-xl font-medium text-sm border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!canProceedMethod}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                    canProceedMethod
                      ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: CONFIRM ── */}
          {!completed && step === 'confirm' && (
            <div className="p-5 space-y-4">

              {/* Summary card */}
              <div className="rounded-xl border-2 border-slate-100 bg-slate-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                  <span className="text-xs text-white/50 font-medium uppercase tracking-wide">Payment Summary</span>
                  <span className="text-white font-bold text-sm">${fmt(payAmount)}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-500">Method</span>
                    <div className="flex items-center gap-1.5">
                      {selectedMethodObj && (
                        <selectedMethodObj.icon className={cn('w-3.5 h-3.5', selectedMethodObj.color)} />
                      )}
                      <span className="text-xs font-semibold text-slate-700">{selectedMethodObj?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-slate-500">Type</span>
                    <span className="text-xs font-semibold text-slate-700 capitalize">{paymentType}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-xs text-slate-500">Remaining</span>
                      <span className="text-xs font-semibold text-amber-600">${fmt(remaining)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional fields */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Reference <span className="normal-case font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Transaction / UTR / Cheque no."
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-400 transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Notes <span className="normal-case font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    placeholder="Additional notes…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-lg border-2 border-slate-200 text-sm focus:outline-none focus:border-emerald-400 transition-colors resize-none bg-white"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep('method')}
                  disabled={processing}
                  className="flex-1 py-3 rounded-xl font-medium text-sm border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={!canSubmit}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                    canSubmit
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-200'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm ${fmt(payAmount)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCollectionModal;