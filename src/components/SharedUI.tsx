import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Check, X, Trash2, RefreshCw } from 'lucide-react';

// ─── Password Strength ────────────────────────────────────────────────────────

export const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  const checks = [
    { label: '8+ characters',   met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number',           met: /\d/.test(password) },
  ];
  const strength = checks.filter(c => c.met).length;
  const colors   = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400'];
  const labels   = ['Weak', 'Fair', 'Strong'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < strength ? colors[strength - 1] : 'bg-muted')} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map(c => (
            <span key={c.label} className={cn('flex items-center gap-1 text-xs transition-colors', c.met ? 'text-emerald-600' : 'text-muted-foreground')}>
              {c.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {c.label}
            </span>
          ))}
        </div>
        {strength > 0 && (
          <span className={cn('text-xs font-medium', strength === 3 ? 'text-emerald-600' : strength === 2 ? 'text-amber-600' : 'text-red-600')}>
            {labels[strength - 1]}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Form Field ───────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField = ({ label, required, error, hint, children }: FormFieldProps) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground flex items-center gap-1">
      {label}
      {required && <span className="text-brand-teal">*</span>}
    </Label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-600 animate-in fade-in slide-in-from-top-1">
        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        {error}
      </p>
    )}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// ─── Section Divider ──────────────────────────────────────────────────────────

export const SectionDivider = ({ title, icon: Icon }: { title: string; icon?: React.ElementType }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {title}
    </div>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  </div>
);

// ─── Step Indicator ───────────────────────────────────────────────────────────

export const StepIndicator = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="flex items-center gap-0 mb-6">
    {steps.map((step, i) => (
      <div key={step} className="flex items-center flex-1 last:flex-none">
        <div className="flex flex-col items-center gap-1.5">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
            i < current  ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/30' :
            i === current ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/30 ring-4 ring-brand-navy/20' :
                            'bg-muted text-muted-foreground'
          )}>
            {i < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span className={cn('text-xs font-medium hidden sm:block', i === current ? 'text-brand-navy' : 'text-muted-foreground')}>
            {step}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={cn('flex-1 h-0.5 mx-2 transition-all duration-500', i < current ? 'bg-brand-teal' : 'bg-border')} />
        )}
      </div>
    ))}
  </div>
);

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ElementType;
  subtitle?: string;
  large?: boolean;
}

export const MetricCard = ({ title, value, change, changeType, icon: Icon, subtitle, large = false }: MetricCardProps) => (
  <div className={cn('card-elevated p-6 hover:shadow-xl transition-all', large && 'lg:col-span-2')}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn('font-bold font-display', large ? 'text-4xl' : 'text-3xl')}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        <div className="flex items-center gap-2">
          {changeType === 'positive'
            ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            : <ArrowDownRight className="w-4 h-4 text-red-500" />}
          <span className={cn('text-sm font-medium', changeType === 'positive' ? 'text-emerald-600' : 'text-red-600')}>{change}</span>
          <span className="text-xs text-muted-foreground">in period</span>
        </div>
      </div>
      <div className={cn('rounded-2xl flex items-center justify-center', large ? 'w-16 h-16 bg-gradient-to-br from-brand-navy to-brand-teal' : 'w-12 h-12 bg-brand-navy')}>
        <Icon className={cn('text-white', large ? 'w-8 h-8' : 'w-5 h-5')} />
      </div>
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

export const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
  </div>
);

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  loading?: boolean;
}

export const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, description, loading }: DeleteConfirmProps) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[400px]">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">Cancel</Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);