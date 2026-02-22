import { useState } from 'react';
import { Building2, Shield, Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, SectionDivider, PasswordStrength } from '../components/SharedUI';
import { validatePassword } from '../utils/superAdmin.utils';
import { NewClinicForm } from '../types/superAdmin.types';

const EMPTY_CLINIC: NewClinicForm = {
  name: '', slug: '', email: '', phone: '', address: '', city: '', state: '',
  admin_first_name: '', admin_last_name: '', password: '',
};

interface AddClinicModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (clinic: NewClinicForm, onSuccess: () => void) => void;
}

export const AddClinicModal = ({ open, loading, onClose, onSubmit }: AddClinicModalProps) => {
  const [form, setForm]               = useState<NewClinicForm>(EMPTY_CLINIC);
  const [showPassword, setShowPassword] = useState(false);

  const set = (patch: Partial<NewClinicForm>) => setForm(prev => ({ ...prev, ...patch }));

  const handleClose = () => { setForm(EMPTY_CLINIC); setShowPassword(false); onClose(); };
  const handleSubmit = () => onSubmit(form, handleClose);

  const isValid =
    !!form.name && !!form.email && !!form.slug &&
    !!form.admin_first_name && !!form.admin_last_name &&
    validatePassword(form.password).valid;

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy/90 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white m-0">Add New Clinic</DialogTitle>
              <DialogDescription className="text-white/70 text-sm m-0 mt-0.5">
                Set up a new clinic location and its administrator
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 max-h-[65vh] overflow-y-auto space-y-6">
          {/* Clinic info */}
          <div className="space-y-4">
            <SectionDivider title="Clinic Information" icon={Building2} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Clinic Name" required>
                <Input placeholder="Downtown Medical Center" value={form.name} onChange={e => set({ name: e.target.value })} className="h-10" />
              </FormField>
              <FormField label="URL Slug" required hint="Used in the clinic's web address">
                <Input
                  placeholder="downtown-medical"
                  value={form.slug}
                  onChange={e => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  className="h-10 font-mono text-sm"
                />
              </FormField>
            </div>

            <FormField label="Email Address" required>
              <Input type="email" placeholder="clinic@example.com" value={form.email} onChange={e => set({ email: e.target.value })} className="h-10" />
            </FormField>

            <FormField label="Phone Number" hint="Include country code e.g. +1 234-567-8900">
              <Input placeholder="+1 234-567-8900" value={form.phone} onChange={e => set({ phone: e.target.value })} className="h-10" />
            </FormField>

            <FormField label="Street Address">
              <Input placeholder="123 Main Street" value={form.address} onChange={e => set({ address: e.target.value })} className="h-10" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="City">
                <Input placeholder="New York" value={form.city} onChange={e => set({ city: e.target.value })} className="h-10" />
              </FormField>
              <FormField label="State / Province">
                <Input placeholder="NY" value={form.state} onChange={e => set({ state: e.target.value })} className="h-10" />
              </FormField>
            </div>
          </div>

          {/* Admin account */}
          <div className="space-y-4">
            <SectionDivider title="Administrator Account" icon={Shield} />
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                An admin account will be created to manage this clinic. They can invite additional staff after setup.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" required>
                <Input placeholder="Jane" value={form.admin_first_name} onChange={e => set({ admin_first_name: e.target.value })} className="h-10" />
              </FormField>
              <FormField label="Last Name" required>
                <Input placeholder="Smith" value={form.admin_last_name} onChange={e => set({ admin_last_name: e.target.value })} className="h-10" />
              </FormField>
            </div>

            <FormField label="Admin Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters with 1 uppercase"
                  value={form.password}
                  onChange={e => set({ password: e.target.value })}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-muted/20 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="px-5">Cancel</Button>
          <Button
            onClick={handleSubmit}
            className="bg-brand-navy hover:bg-brand-navy/90 px-6 shadow-md shadow-brand-navy/20"
            disabled={loading || !isValid}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Building2 className="w-4 h-4 mr-2" />}
            Create Clinic
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};