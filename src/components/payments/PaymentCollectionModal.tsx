import { useState } from 'react';
import { CreditCard, Banknote, Smartphone, Building2, Shield, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import billingService, { Invoice, PaymentCreate } from '@/lib/billingService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentCollectionModalProps {
  /** Full Invoice object from billingService (amounts in paise/cents) */
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the invoice id after a successful payment so parent can refresh */
  onPaymentComplete?: (invoiceId: number) => void;
}

// ─── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS: {
  id: PaymentCreate['payment_method'];
  name: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { id: 'card',          name: 'Credit / Debit Card', icon: CreditCard,  description: 'Visa, Mastercard, Amex' },
  { id: 'cash',          name: 'Cash',                icon: Banknote,    description: 'Physical currency' },
  { id: 'upi',           name: 'UPI',                 icon: Smartphone,  description: 'Google Pay, PhonePe, Paytm' },
  { id: 'bank_transfer', name: 'Bank Transfer',       icon: Building2,   description: 'NEFT / RTGS / IMPS' },
  { id: 'insurance',     name: 'Insurance',           icon: Shield,      description: 'Direct insurance claim' },
  { id: 'wallet',        name: 'Wallet',              icon: Wallet,      description: 'Prepaid wallet balance' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number as a display amount with 2 decimal places. */
const toDisplay = (amount: number) => amount.toFixed(2);

/** Parse a display string to a number for comparison / API submission. */
const toNumber = (displayStr: string) => parseFloat(displayStr);

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentCollectionModal = ({
  invoice,
  open,
  onOpenChange,
  onPaymentComplete,
}: PaymentCollectionModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentCreate['payment_method'] | null>(null);
  const [paymentType, setPaymentType]       = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount]   = useState('');
  const [reference, setReference]           = useState('');
  const [notes, setNotes]                   = useState('');
  const [processing, setProcessing]         = useState(false);
  const [completed, setCompleted]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  if (!invoice) return null;

  // balance_amount is the outstanding amount; fall back to balance if not present
  const balance        = invoice.balance_amount > 0 ? invoice.balance_amount : invoice.balance;
  const balanceDisplay = toDisplay(balance);

  const partialDisplay  = partialAmount.trim();
  const partialNum      = toNumber(partialDisplay);
  const finalDisplay    = paymentType === 'partial' && partialDisplay
    ? partialDisplay
    : balanceDisplay;

  const remainingDisplay = paymentType === 'partial' && partialDisplay
    ? toDisplay(balance - partialNum)
    : '0.00';

  const isPartialValid =
    paymentType === 'full' ||
    (partialDisplay !== '' &&
      !isNaN(partialNum) &&
      partialNum > 0 &&
      partialNum <= balance);

  const isOverPayment =
    paymentType === 'partial' &&
    partialDisplay !== '' &&
    !isNaN(partialNum) &&
    partialNum > balance;

  const canSubmit = selectedMethod !== null && isPartialValid && !processing;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProcessPayment = async () => {
    if (!canSubmit || !invoice) return;
    setError(null);
    setProcessing(true);

    const amount =
      paymentType === 'partial'
        ? partialNum
        : balance;

    try {
      await billingService.createPayment({
        invoice_id:      invoice.id,
        patient_id:      invoice.patient_id,
        amount,
        payment_method:  selectedMethod!,
        payment_date:    new Date().toISOString(),
        reference_number: reference.trim() || undefined,
        notes:           notes.trim() || undefined,
      });

      setCompleted(true);

      setTimeout(() => {
        onPaymentComplete?.(invoice.id);
        handleClose();
      }, 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        'Payment failed. Please try again.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setPaymentType('full');
    setPartialAmount('');
    setReference('');
    setNotes('');
    setProcessing(false);
    setCompleted(false);
    setError(null);
    onOpenChange(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-white">Collect Payment</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-1">
            <p className="text-white/70 text-xs uppercase tracking-wide">Invoice</p>
            <p className="text-base font-semibold">{invoice.invoice_number}</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-white/70 text-sm">Outstanding Balance</p>
              <p className="text-3xl font-bold font-display">${balanceDisplay}</p>
            </div>
            {invoice.due_date && (
              <div className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium',
                invoice.status === 'OVERDUE'
                  ? 'bg-red-500/20 text-red-200'
                  : 'bg-amber-500/20 text-amber-200'
              )}>
                Due: {new Date(invoice.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">

          {completed ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ${finalDisplay} collected via{' '}
                {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
              </p>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Payment amount */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Payment Amount</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentType('full')}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium text-left',
                      paymentType === 'full'
                        ? 'border-brand-teal bg-brand-teal/5 text-brand-navy'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    Full Amount
                    <p className="text-lg font-bold mt-1">${balanceDisplay}</p>
                  </button>

                  <button
                    onClick={() => setPaymentType('partial')}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium text-left',
                      paymentType === 'partial'
                        ? 'border-brand-teal bg-brand-teal/5 text-brand-navy'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    Partial Payment
                    {paymentType === 'partial' && (
                      <input
                        type="number"
                        placeholder="0.00"
                        value={partialAmount}
                        onChange={e => setPartialAmount(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        min="0.01"
                        step="0.01"
                        max={balanceDisplay}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-border text-center font-bold text-base focus:outline-none focus:ring-2 focus:ring-brand-teal"
                      />
                    )}
                  </button>
                </div>

                {/* Partial remaining balance info */}
                {paymentType === 'partial' && partialDisplay && isPartialValid && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mt-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Remaining balance after payment: <strong>${remainingDisplay}</strong>
                    </p>
                  </div>
                )}

                {/* Over-payment warning */}
                {isOverPayment && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 mt-3">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      Amount exceeds outstanding balance of ${balanceDisplay}.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Payment Method</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                        selectedMethod === method.id
                          ? 'border-brand-teal bg-brand-teal/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0',
                        selectedMethod === method.id
                          ? 'bg-brand-teal text-white'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        <method.icon className="w-4 h-4" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="w-4 h-4 text-brand-teal shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional reference / notes */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Reference Number <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Transaction / cheque / UTR number"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Notes <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    placeholder="Any additional notes…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  disabled={processing}
                  className="flex-1 btn-ghost py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={!canSubmit}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm',
                    canSubmit
                      ? 'bg-brand-teal text-white hover:bg-brand-teal/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Collect ${finalDisplay}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentCollectionModal;