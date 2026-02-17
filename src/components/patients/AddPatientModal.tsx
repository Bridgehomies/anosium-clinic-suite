import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Droplet,
  AlertCircle, Shield, Calendar, Users,
} from 'lucide-react';
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
import { Loader2 } from 'lucide-react';

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (patient: PatientFormData) => Promise<void>;
}

export interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  bloodType: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  insuranceProvider: string;
  insuranceId: string;
  notes: string;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const insuranceProviders = [
  'BlueCross BlueShield',
  'Aetna',
  'UnitedHealthcare',
  'Cigna',
  'Kaiser Permanente',
  'Humana',
  'Anthem',
  'Other',
];

const GENDER_OPTIONS: { label: string; value: PatientFormData['gender'] }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other / Prefer not to say', value: 'other' },
];

// E.164-ish: optional +, then 7–15 digits (spaces/dashes stripped by parent)
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

const STEP_LABELS = ['Personal Info', 'Medical & Emergency', 'Insurance'] as const;

const EMPTY_FORM: PatientFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  dob: '',
  gender: 'other',
  bloodType: '',
  allergies: '',
  emergencyContact: '',
  emergencyPhone: '',
  insuranceProvider: '',
  insuranceId: '',
  notes: '',
};

const AddPatientModal = ({ open, onOpenChange, onAdd }: AddPatientModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'Enter a valid phone number (e.g. +1 555 123 4567)';
    }

    if (!formData.dob) newErrors.dob = 'Date of birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};

    if (!formData.emergencyContact.trim())
      newErrors.emergencyContact = 'Emergency contact name is required';

    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact phone is required';
    } else if (!PHONE_REGEX.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onAdd?.(formData);
      // Only reset + close on success
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      // onAdd is expected to throw with a human-readable message or an Error
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    setStep(1);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  // ── Field helpers ───────────────────────────────────────────────────────────

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (submitError) setSubmitError(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-display">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={18} />
            </div>
            Add New Patient
          </DialogTitle>
        </DialogHeader>

        {/* ── Progress Steps ── */}
        <div className="mt-3 flex-shrink-0 px-1">
          {/* Bar + circles */}
          <div className="flex items-center gap-0">
            {STEP_LABELS.map((_, idx) => {
              const s = idx + 1;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-colors flex-shrink-0 ${
                      s <= step ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s}
                  </div>
                  {s < STEP_LABELS.length && (
                    <div
                      className={`flex-1 h-0.5 md:h-1 rounded mx-1 ${
                        s < step ? 'bg-brand-navy' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Labels — pinned under each circle */}
          <div className="flex mt-1.5">
            {STEP_LABELS.map((label, idx) => {
              const s = idx + 1;
              const isLast = s === STEP_LABELS.length;
              return (
                <div
                  key={s}
                  className={`text-xs text-muted-foreground ${
                    isLast ? 'text-right ml-auto' : s === 1 ? '' : 'flex-1 text-center'
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-2">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-1 py-2">

            {/* ── Step 1: Personal ── */}
            {step === 1 && (
              <div className="space-y-3 md:space-y-4 animate-fade-up">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <User size={14} className="text-muted-foreground" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`text-sm ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-sm">Date of Birth *</Label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleChange('dob', e.target.value)}
                        className={`pl-9 text-sm ${errors.dob ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email Address *</Label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="patient@email.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={`pl-9 text-sm ${errors.email ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className={`pl-9 text-sm ${errors.phone ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                {/* Gender — now collected in the form */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Gender *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => handleChange('gender', v)}
                  >
                    <SelectTrigger className="text-sm">
                      <Users size={14} className="mr-2 text-muted-foreground flex-shrink-0" />
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-sm">Address</Label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="123 Main St, City, State, ZIP"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="pl-9 min-h-[50px] text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Medical & Emergency ── */}
            {step === 2 && (
              <div className="space-y-3 md:space-y-4 animate-fade-up">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <AlertCircle size={14} className="text-muted-foreground" />
                  Medical Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Blood Type</Label>
                    <Select
                      value={formData.bloodType}
                      onValueChange={(v) => handleChange('bloodType', v)}
                    >
                      <SelectTrigger className="text-sm">
                        <Droplet size={14} className="mr-2 text-red-500 flex-shrink-0" />
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover">
                        {bloodTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="allergies" className="text-sm">Known Allergies</Label>
                    <Input
                      id="allergies"
                      placeholder="Penicillin, Peanuts, etc."
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-foreground flex items-center gap-2 pt-3 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContact" className="text-sm">Contact Name *</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Jane Smith"
                      value={formData.emergencyContact}
                      onChange={(e) => handleChange('emergencyContact', e.target.value)}
                      className={`text-sm ${errors.emergencyContact ? 'border-destructive' : ''}`}
                    />
                    {errors.emergencyContact && (
                      <p className="text-xs text-destructive">{errors.emergencyContact}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyPhone" className="text-sm">Contact Phone *</Label>
                    <Input
                      id="emergencyPhone"
                      placeholder="+1 (555) 987-6543"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                      className={`text-sm ${errors.emergencyPhone ? 'border-destructive' : ''}`}
                    />
                    {errors.emergencyPhone && (
                      <p className="text-xs text-destructive">{errors.emergencyPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Insurance ── */}
            {step === 3 && (
              <div className="space-y-3 md:space-y-4 animate-fade-up">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <Shield size={14} className="text-muted-foreground" />
                  Insurance Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Insurance Provider</Label>
                    <Select
                      value={formData.insuranceProvider}
                      onValueChange={(v) => handleChange('insuranceProvider', v)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover">
                        {insuranceProviders.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="insuranceId" className="text-sm">Insurance ID</Label>
                    <Input
                      id="insuranceId"
                      placeholder="XX-12345678"
                      value={formData.insuranceId}
                      onChange={(e) => handleChange('insuranceId', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-sm">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* API-level submit error shown on the final step */}
                {submitError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>{submitError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Fixed action buttons ── */}
          <div className="flex-shrink-0 flex gap-2 md:gap-3 pt-4 mt-2 border-t border-border bg-background">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="btn-ghost flex-1 text-sm"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
                className="btn-ghost flex-1 text-sm"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-accent flex-1 text-sm">
                Continue
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="btn-accent flex-1 text-sm">
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Add Patient'
                )}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientModal;