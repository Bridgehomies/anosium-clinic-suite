import { useState } from 'react';
import { Building2, UserPlus, Mail, Key, Users, Shield, Copy, Sparkles, CheckCircle2, RefreshCw, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FormField, SectionDivider, StepIndicator, PasswordStrength } from '../components/SharedUI';
import { formatPhoneNumber, validatePhoneNumber, validatePassword } from '../utils/superAdmin.utils';
import { ClinicStats, NewUserForm, InviteMethod, CreateUserRole } from '../types/superAdmin.types';
import { useToast } from '@/components/ui/use-toast';

const EMPTY_USER: NewUserForm = {
  email: '', first_name: '', last_name: '', phone: '', role: 'staff', tenant_id: 0, password: '',
};

interface AddUserModalProps {
  open: boolean;
  loading: boolean;
  clinics: ClinicStats[];
  onClose: () => void;
  onSubmit: (user: NewUserForm, inviteMethod: InviteMethod, generatedCode: string, onSuccess: () => void) => void;
}

export const AddUserModal = ({ open, loading, clinics, onClose, onSubmit }: AddUserModalProps) => {
  const { toast } = useToast();
  const [step,            setStep]            = useState<'clinic-select' | 'user-form'>(clinics.length === 1 ? 'user-form' : 'clinic-select');
  const [selectedClinic,  setSelectedClinic]  = useState<ClinicStats | null>(clinics.length === 1 ? clinics[0] : null);
  const [form,            setForm]            = useState<NewUserForm>({ ...EMPTY_USER, tenant_id: clinics.length === 1 ? clinics[0].id : 0 });
  const [inviteMethod,    setInviteMethod]    = useState<InviteMethod>('email');
  const [generatedCode,   setGeneratedCode]   = useState('');
  const [showPassword,    setShowPassword]    = useState(false);

  const set = (patch: Partial<NewUserForm>) => setForm(prev => ({ ...prev, ...patch }));

  const handleClose = () => {
    setForm(EMPTY_USER);
    setGeneratedCode('');
    setSelectedClinic(clinics.length === 1 ? clinics[0] : null);
    setStep(clinics.length === 1 ? 'user-form' : 'clinic-select');
    setShowPassword(false);
    onClose();
  };

  const handleClinicSelect = (clinic: ClinicStats) => {
    setSelectedClinic(clinic);
    set({ tenant_id: clinic.id });
    setStep('user-form');
  };

  const generateCode = () => {
    const code = `CODE${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setGeneratedCode(code);
  };

  const isFormValid =
    !!form.first_name && !!form.last_name && !!form.email && !!form.tenant_id &&
    (!form.phone || validatePhoneNumber(form.phone)) &&
    (inviteMethod !== 'direct' || validatePassword(form.password).valid) &&
    (inviteMethod !== 'code' || !!generatedCode);

  const headerGradient = step === 'clinic-select'
    ? 'bg-gradient-to-r from-brand-navy to-[#4a5580]'
    : 'bg-gradient-to-r from-brand-teal to-[#3da8a6]';

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className={cn('px-8 py-6 text-white', headerGradient)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              {step === 'clinic-select' ? <Building2 className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white m-0">
                {step === 'clinic-select' ? 'Choose a Clinic' : 'Add Team Member'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-sm m-0 mt-0.5">
                {step === 'clinic-select'
                  ? 'Select which clinic this user will be assigned to'
                  : selectedClinic
                    ? `Adding user to ${selectedClinic.name}`
                    : 'Invite or create a new team member account'}
              </DialogDescription>
            </div>
          </div>
          {clinics.length > 1 && (
            <div className="mt-5">
              <StepIndicator steps={['Select Clinic', 'User Details']} current={step === 'clinic-select' ? 0 : 1} />
            </div>
          )}
        </div>

        {/* Step 1: Clinic selection */}
        {step === 'clinic-select' && (
          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto space-y-3">
            {clinics.map(clinic => (
              <button
                key={clinic.id}
                onClick={() => handleClinicSelect(clinic)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                  'border-border bg-background hover:border-brand-teal hover:bg-brand-teal/5 hover:shadow-md group'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-navy/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-navy/20 transition-colors">
                  <Building2 className="w-6 h-6 text-brand-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground leading-tight">{clinic.name}</p>
                  <p className="text-sm text-muted-foreground">{clinic.email}</p>
                  <div className="flex gap-4 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{clinic.total_patients ?? 0} patients</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="w-3 h-3" />{clinic.active_users ?? 0} staff</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', clinic.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200')}>
                    {clinic.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-teal group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: User form */}
        {step === 'user-form' && (
          <>
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto space-y-5">
              {/* Selected clinic badge */}
              {clinics.length > 1 && selectedClinic && (
                <div className="flex items-center gap-3 px-4 py-3 bg-brand-navy/5 rounded-xl border border-brand-navy/15">
                  <div className="w-8 h-8 rounded-lg bg-brand-navy/15 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-navy leading-tight">{selectedClinic.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedClinic.email}</p>
                  </div>
                  <button className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2" onClick={() => setStep('clinic-select')}>
                    Change
                  </button>
                </div>
              )}

              {/* Invite method */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Onboarding Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'email',  icon: Mail,     label: 'Email Invite',  desc: 'Send secure link' },
                    { value: 'code',   icon: Key,      label: 'Access Code',   desc: 'Share a code' },
                    { value: 'direct', icon: UserPlus, label: 'Set Password',  desc: 'Create directly' },
                  ] as const).map(m => (
                    <button
                      key={m.value}
                      onClick={() => setInviteMethod(m.value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all',
                        inviteMethod === m.value
                          ? 'border-brand-teal bg-brand-teal/8 text-brand-teal'
                          : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <m.icon className="w-4 h-4" />
                      <span className="text-xs font-semibold leading-tight">{m.label}</span>
                      <span className="text-[10px] leading-tight opacity-70">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <SectionDivider title="Personal Details" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" required>
                  <Input value={form.first_name} onChange={e => set({ first_name: e.target.value })} className="h-10" placeholder="Jane" />
                </FormField>
                <FormField label="Last Name" required>
                  <Input value={form.last_name} onChange={e => set({ last_name: e.target.value })} className="h-10" placeholder="Smith" />
                </FormField>
              </div>

              <FormField label="Email Address" required>
                <Input type="email" value={form.email} onChange={e => set({ email: e.target.value })} className="h-10" placeholder="jane@clinic.com" />
              </FormField>

              <FormField
                label="Phone Number"
                hint="Format: +923001234567 or 923001234567"
                error={form.phone && !validatePhoneNumber(form.phone) ? 'Invalid format. Must start with + or digit 1-9' : undefined}
              >
                <Input
                  placeholder="+1 234-567-8900"
                  value={form.phone}
                  onChange={e => set({ phone: formatPhoneNumber(e.target.value) })}
                  className={cn('h-10', form.phone && !validatePhoneNumber(form.phone) && 'border-red-400 focus-visible:ring-red-300')}
                />
              </FormField>

              <FormField label="Role" required>
                <Select value={form.role} onValueChange={v => set({ role: v as CreateUserRole })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[
                      { value: 'clinic_admin', label: 'Clinic Admin', icon: '🏥' },
                      { value: 'doctor',       label: 'Doctor',       icon: '👨‍⚕️' },
                      { value: 'receptionist', label: 'Receptionist', icon: '💁' },
                      { value: 'staff',        label: 'Staff',        icon: '👤' },
                      { value: 'accountant',   label: 'Accountant',   icon: '💼' },
                    ].map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="flex items-center gap-2">{r.icon} {r.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Method-specific UI */}
              {inviteMethod === 'email' && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-0.5">Email Invitation</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      A secure magic link will be sent to the user's email. They'll be prompted to set their own password on first login.
                    </p>
                  </div>
                </div>
              )}

              {inviteMethod === 'code' && (
                <div className="space-y-3">
                  {!generatedCode ? (
                    <button
                      onClick={generateCode}
                      type="button"
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-brand-teal hover:bg-brand-teal/5 transition-all text-sm font-medium text-muted-foreground hover:text-brand-teal"
                    >
                      <Sparkles className="w-4 h-4" /> Generate Access Code
                    </button>
                  ) : (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-900">Access Code Generated</p>
                        </div>
                        <Button
                          size="sm" variant="ghost" type="button"
                          className="h-7 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => { navigator.clipboard.writeText(generatedCode); toast({ title: 'Copied to clipboard!' }); }}
                        >
                          <Copy className="w-3 h-3 mr-1.5" />Copy
                        </Button>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-3 font-mono text-2xl text-center tracking-[0.3em] font-bold text-brand-navy border-2 border-emerald-300 shadow-inner">
                        {generatedCode}
                      </div>
                      <p className="text-xs text-emerald-700 text-center mt-2.5">Share this code securely. It acts as the user's temporary password.</p>
                    </div>
                  )}
                </div>
              )}

              {inviteMethod === 'direct' && (
                <FormField
                  label="Password" required
                  error={form.password && !validatePassword(form.password).valid ? validatePassword(form.password).error : undefined}
                >
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters with 1 uppercase"
                      value={form.password}
                      onChange={e => set({ password: e.target.value })}
                      className={cn('h-10 pr-10', form.password && !validatePassword(form.password).valid && 'border-red-400')}
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
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t bg-muted/20 flex items-center gap-3">
              {clinics.length > 1 && (
                <Button variant="outline" onClick={() => setStep('clinic-select')} disabled={loading} className="mr-auto">
                  ← Back
                </Button>
              )}
              <Button variant="outline" onClick={handleClose} disabled={loading} className={clinics.length <= 1 ? 'mr-auto' : ''}>
                Cancel
              </Button>
              <Button
                onClick={() => onSubmit(form, inviteMethod, generatedCode, handleClose)}
                className="bg-brand-teal hover:bg-brand-teal/90 px-6 shadow-md shadow-brand-teal/20"
                disabled={loading || !isFormValid}
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                {inviteMethod === 'email'
                  ? <><Mail className="w-4 h-4 mr-2" />Send Invite</>
                  : <><UserPlus className="w-4 h-4 mr-2" />Create User</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};