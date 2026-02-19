import { useState } from 'react';
import { Tag, DollarSign, Clock, FileText, Code, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a service is successfully created on the backend */
  onAdd?: () => void;
}

// ─── Backend enums (must match ServiceCreate schema) ─────────────────────────

const SERVICE_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'procedure',    label: 'Procedure' },
  { value: 'lab_test',     label: 'Laboratory' },
  { value: 'imaging',      label: 'Radiology / Imaging' },
  { value: 'surgery',      label: 'Surgery' },
  { value: 'therapy',      label: 'Therapy / Rehabilitation' },
  { value: 'package',      label: 'Package' },
] as const;

type ServiceTypeValue = (typeof SERVICE_TYPES)[number]['value'];

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  code: string;
  service_type: ServiceTypeValue | '';
  base_price: string;
  estimated_duration_minutes: string;
  description: string;
  tax_percentage: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

// ─── API helper ───────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function getAuthHeaders(): HeadersInit {
  const token    = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  return {
    'Content-Type': 'application/json',
    ...(token    ? { Authorization: `Bearer ${token}` }  : {}),
    ...(tenantId ? { 'X-Tenant-ID': tenantId }           : {}),
  };
}

/** Auto-generate an uppercase code from the service name */
function nameToCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

// ─── Component ────────────────────────────────────────────────────────────────

const AddServiceModal = ({ open, onOpenChange, onAdd }: AddServiceModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    name:                        '',
    code:                        '',
    service_type:                '',
    base_price:                  '',
    estimated_duration_minutes:  '',
    description:                 '',
    tax_percentage:              '0',
  });

  const [errors,   setErrors]   = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!formData.name.trim())
      e.name = 'Service name is required';

    if (!formData.code.trim())
      e.code = 'Service code is required';
    else if (!/^[A-Z0-9_]+$/.test(formData.code))
      e.code = 'Code must be uppercase letters, numbers, or underscores';

    if (!formData.service_type)
      e.service_type = 'Service type is required';

    if (!formData.base_price.trim())
      e.base_price = 'Price is required';
    else if (isNaN(Number(formData.base_price)) || Number(formData.base_price) < 0)
      e.base_price = 'Enter a valid price';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Field change handler ────────────────────────────────────────────────────

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate code when name changes, unless user has manually edited it
      if (field === 'name' && !prev.code) {
        next.code = nameToCode(value);
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name:         formData.name.trim(),
        code:         formData.code.trim(),
        service_type: formData.service_type,
        base_price:   Math.round(Number(formData.base_price)),
        tax_percentage: Number(formData.tax_percentage) || 0,
        description:  formData.description.trim() || null,
        estimated_duration_minutes:
          formData.estimated_duration_minutes
            ? Number(formData.estimated_duration_minutes)
            : null,
      };

      const res = await fetch(`${API_BASE}/services`, {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail?.[0]?.msg ?? body?.detail ?? `Error ${res.status}`;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }

      toast({ title: 'Service Added', description: `${formData.name} has been created.` });
      onAdd?.();
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Failed to Add Service', description: err.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', code: '', service_type: '', base_price: '',
      estimated_duration_minutes: '', description: '', tax_percentage: '0',
    });
    setErrors({});
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-display">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
              <Tag className="text-white" size={18} />
            </div>
            Add New Service
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-2">
          <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">

            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g., General Consultation"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`text-sm ${errors.name ? 'border-destructive' : ''}`}
                disabled={submitting}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm">
                Service Code *{' '}
                <span className="text-muted-foreground font-normal">(uppercase, auto-generated)</span>
              </Label>
              <div className="relative">
                <Code size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="code"
                  placeholder="GENERAL_CONSULT"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  className={`pl-9 text-sm font-mono ${errors.code ? 'border-destructive' : ''}`}
                  disabled={submitting}
                />
              </div>
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label className="text-sm">Service Type *</Label>
              <Select
                value={formData.service_type}
                onValueChange={(v) => handleChange('service_type', v)}
                disabled={submitting}
              >
                <SelectTrigger className={`text-sm ${errors.service_type ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_type && <p className="text-xs text-destructive">{errors.service_type}</p>}
            </div>

            {/* Price + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="base_price" className="text-sm">Base Price ($) *</Label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    placeholder="75"
                    value={formData.base_price}
                    onChange={(e) => handleChange('base_price', e.target.value)}
                    className={`pl-9 text-sm ${errors.base_price ? 'border-destructive' : ''}`}
                    disabled={submitting}
                  />
                </div>
                {errors.base_price && <p className="text-xs text-destructive">{errors.base_price}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Duration</Label>
                <Select
                  value={formData.estimated_duration_minutes}
                  onValueChange={(v) => handleChange('estimated_duration_minutes', v)}
                  disabled={submitting}
                >
                  <SelectTrigger className="text-sm">
                    <Clock size={14} className="mr-2 text-muted-foreground flex-shrink-0" />
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-popover">
                    {DURATION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tax % */}
            <div className="space-y-2">
              <Label htmlFor="tax_percentage" className="text-sm">Tax Percentage (%)</Label>
              <Input
                id="tax_percentage"
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={formData.tax_percentage}
                onChange={(e) => handleChange('tax_percentage', e.target.value)}
                className="text-sm"
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <Textarea
                  id="description"
                  placeholder="Describe the service…"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="pl-9 min-h-[70px] text-sm"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0 flex gap-2 md:gap-3 pt-4 mt-2 border-t border-border bg-background">
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={submitting}
              className="btn-ghost flex-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-accent flex-1 text-sm flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Saving…' : 'Add Service'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;