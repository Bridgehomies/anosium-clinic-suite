import { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Payment {
  id: number;
  patient: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface PaymentCollectionModalProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: (paymentId: number, method: string) => void;
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, Amex',
  },
  {
    id: 'cash',
    name: 'Cash Payment',
    icon: Banknote,
    description: 'Physical currency',
  },
  {
    id: 'mobile',
    name: 'Mobile Payment',
    icon: Smartphone,
    description: 'Apple Pay, Google Pay',
  },
];

const PaymentCollectionModal = ({
  payment,
  open,
  onOpenChange,
  onPaymentComplete,
}: PaymentCollectionModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');

  const handleProcessPayment = async () => {
    if (!selectedMethod || !payment) return;
    
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setProcessing(false);
    setCompleted(true);
    
    // Reset after showing success
    setTimeout(() => {
      onPaymentComplete?.(payment.id, selectedMethod);
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setSelectedMethod(null);
    setProcessing(false);
    setCompleted(false);
    setPartialAmount('');
    setPaymentType('full');
    onOpenChange(false);
  };

  const finalAmount = paymentType === 'partial' && partialAmount 
    ? parseFloat(partialAmount) 
    : payment?.amount || 0;

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-white">
              Collect Payment
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-1">
            <p className="text-white/80 text-sm">Patient</p>
            <p className="text-lg font-semibold">{payment.patient}</p>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-white/80 text-sm">Outstanding Amount</p>
              <p className="text-3xl font-bold font-display">${payment.amount.toLocaleString()}</p>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium",
              payment.status === 'overdue' 
                ? "bg-red-500/20 text-red-200" 
                : "bg-amber-500/20 text-amber-200"
            )}>
              Due: {payment.dueDate}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {completed ? (
            <div className="flex flex-col items-center justify-center py-8 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                ${finalAmount.toLocaleString()} collected via {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </p>
            </div>
          ) : (
            <>
              {/* Payment Type Selection */}
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-3">Payment Amount</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentType('full')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium",
                      paymentType === 'full'
                        ? "border-brand-teal bg-brand-teal/5 text-brand-navy"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    Full Amount
                    <p className="text-lg font-bold mt-1">${payment.amount.toLocaleString()}</p>
                  </button>
                  <button
                    onClick={() => setPaymentType('partial')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium",
                      paymentType === 'partial'
                        ? "border-brand-teal bg-brand-teal/5 text-brand-navy"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    Partial Payment
                    {paymentType === 'partial' && (
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        className="w-full mt-2 px-3 py-2 rounded-lg border border-border text-center font-bold"
                        onClick={(e) => e.stopPropagation()}
                        max={payment.amount}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-3">Select Payment Method</p>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                        selectedMethod === method.id
                          ? "border-brand-teal bg-brand-teal/5"
                          : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        selectedMethod === method.id
                          ? "bg-brand-teal text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <method.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="w-5 h-5 text-brand-teal ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partial payment warning */}
              {paymentType === 'partial' && partialAmount && parseFloat(partialAmount) < payment.amount && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Partial Payment</p>
                    <p className="text-sm text-amber-700">
                      Remaining balance after payment: ${(payment.amount - parseFloat(partialAmount)).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 btn-ghost py-3"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={!selectedMethod || processing || (paymentType === 'partial' && !partialAmount)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                    selectedMethod && !processing
                      ? "bg-brand-teal text-white hover:bg-brand-teal/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Collect ${finalAmount.toLocaleString()}
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
