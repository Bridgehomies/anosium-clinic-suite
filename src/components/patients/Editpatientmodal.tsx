/**
 * EditPatientModal
 * Pre-populates all fields from an existing ApiPatient and PUTs the changes.
 * Mirrors the UX of AddPatientModal: 3-step form, inline validation, async submit.
 */

import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Droplet,
  AlertCircle, Shield, Calendar, Users, Loader2,
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
import { ApiPatient } from '@/pages/Patients';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EditPatientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  alternate_phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  referred_by: string;
  notes: string;
}

interface EditPatientModalProps {
  patient: ApiPatient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves on success, throws Error with message on failure */
  onSave: (patientId: number, data: EditPatientFormData) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const GENDER_OPTIONS: { label: string; value: EditPatientFormData['gender'] }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other / Prefer not to say', value: 'other' },
];

const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

const STEP_LABELS = ['Personal Info', 'Medical & Emergency', 'Location & Notes'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function patientToForm(p: ApiPatient): EditPatientFormData {
  return {
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email ?? '',
    phone: p.phone,
    alternate_phone: p.alternate_phone ?? '',
    address: p.address ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
    postal_code: p.postal_code ?? '',
    date_of_birth: p.date_of_birth,
    gender: p.gender,
    blood_group: p.blood_group ?? '',
    allergies: p.allergies ?? '',
    chronic_conditions: p.chronic_conditions ?? '',
    emergency_contact_name: p.emergency_contact_name ?? '',
    emergency_contact_phone: p.emergency_contact_phone ?? '',
    referred_by: p.referred_by ?? '',
    notes: p.notes ?? '',
  };
}

type FieldErrors = Partial<Record<keyof EditPatientFormData, string>>;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const EditPatientModal = ({ patient, open, onOpenChange, onSave }: EditPatientModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EditPatientFormData | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Populate form whenever a new patient is passed in
  useEffect(() => {
    if (patient) {
      setFormData(patientToForm(patient));
      setErrors({});
      setSubmitError(null);
      setStep(1);
    }
  }, [patient]);

  if (!formData || !patient) return null;

  // ── Field helper ────────────────────────────────────────────────────────────

  const handleChange = (field: keyof EditPatientFormData, value: string) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : prev);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (submitError) setSubmitError(null);
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const e: FieldErrors = {};
    if (!formData.first_name.trim()) e.first_name = 'First name is required';
    if (!formData.last_name.trim()) e.last_name = 'Last name is required';
    if (!formData.date_of_birth) e.date_of_birth = 'Date of birth is required';

    if (!formData.email.trim()) {
      e.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      e.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      e.phone = 'Phone is required';
    } else if (!PHONE_REGEX.test(formData.phone)) {
      e.phone = 'Enter a valid phone number (e.g. +1 555 123 4567)';
    }

    if (formData.alternate_phone && !PHONE_REGEX.test(formData.alternate_phone)) {
      e.alternate_phone = 'Enter a valid alternate phone number';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: FieldErrors = {};

    if (!formData.emergency_contact_name.trim())
      e.emergency_contact_name = 'Emergency contact name is required';

    if (!formData.emergency_contact_phone.trim()) {
      e.emergency_contact_phone = 'Emergency contact phone is required';
    } else if (!PHONE_REGEX.test(formData.emergency_contact_phone)) {
      e.emergency_contact_phone = 'Enter a valid phone number';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
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
      await onSave(patient.id, formData);
      onOpenChange(false);
    } catch (err: any) {
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

  // ── Render ──────────────────────────────────────────────────────────────────

  const inputClass = (field: keyof EditPatientFormData) =>
    `text-sm ${errors[field] ? 'border-destructive' : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-display">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate">Edit Patient</p>
              <p className="text-xs font-normal text-muted-foreground truncate">
                {patient.full_name} · #{patient.patient_code}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* ── Progress Steps ── */}
        <div className="mt-3 flex-shrink-0 px-1">
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
                      className={`flex-1 h-0.5 md:h-1 rounded mx-1 transition-colors ${
                        s < step ? 'bg-brand-navy' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
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
          <div className="flex-1 overflow-y-auto px-1 py-2">

            {/* ── Step 1: Personal Info ── */}
            {step === 1 && (
              <div className="space-y-3 md:space-y-4 animate-fade-up">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <User size={14} className="text-muted-foreground" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name" className="text-sm">First Name *</Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      className={inputClass('first_name')}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-destructive">{errors.first_name}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="last_name" className="text-sm">Last Name *</Label>
                    <Input
                      id="last_name"
                      placeholder="Smith"
                      value={formData.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      className={inputClass('last_name')}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-destructive">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-sm">Date of Birth *</Label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                        className={`pl-9 text-sm ${errors.date_of_birth ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {errors.date_of_birth && (
                      <p className="text-xs text-destructive">{errors.date_of_birth}</p>
                    )}
                  </div>

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
                        className={`pl-9 ${inputClass('email')}`}
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
                        className={`pl-9 ${inputClass('phone')}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alternate_phone" className="text-sm">Alternate Phone</Label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="alternate_phone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.alternate_phone}
                      onChange={(e) => handleChange('alternate_phone', e.target.value)}
                      className={`pl-9 ${inputClass('alternate_phone')}`}
                    />
                  </div>
                  {errors.alternate_phone && (
                    <p className="text-xs text-destructive">{errors.alternate_phone}</p>
                  )}
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
                      value={formData.blood_group}
                      onValueChange={(v) => handleChange('blood_group', v)}
                    >
                      <SelectTrigger className="text-sm">
                        <Droplet size={14} className="mr-2 text-red-500 flex-shrink-0" />
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent className="z-[100] bg-popover">
                        {BLOOD_TYPES.map((type) => (
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

                <div className="space-y-1.5">
                  <Label htmlFor="chronic_conditions" className="text-sm">Chronic Conditions</Label>
                  <Input
                    id="chronic_conditions"
                    placeholder="Diabetes, Hypertension, etc."
                    value={formData.chronic_conditions}
                    onChange={(e) => handleChange('chronic_conditions', e.target.value)}
                    className="text-sm"
                  />
                </div>

                <h3 className="font-semibold text-foreground flex items-center gap-2 pt-3 text-sm">
                  <Phone size={14} className="text-muted-foreground" />
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emergency_contact_name" className="text-sm">
                      Contact Name *
                    </Label>
                    <Input
                      id="emergency_contact_name"
                      placeholder="Jane Smith"
                      value={formData.emergency_contact_name}
                      onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                      className={inputClass('emergency_contact_name')}
                    />
                    {errors.emergency_contact_name && (
                      <p className="text-xs text-destructive">{errors.emergency_contact_name}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergency_contact_phone" className="text-sm">
                      Contact Phone *
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      placeholder="+1 (555) 987-6543"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                      className={inputClass('emergency_contact_phone')}
                    />
                    {errors.emergency_contact_phone && (
                      <p className="text-xs text-destructive">{errors.emergency_contact_phone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="referred_by" className="text-sm">Referred By</Label>
                  <Input
                    id="referred_by"
                    placeholder="Dr. Name or clinic"
                    value={formData.referred_by}
                    onChange={(e) => handleChange('referred_by', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            {/* ── Step 3: Location & Notes ── */}
            {step === 3 && (
              <div className="space-y-3 md:space-y-4 animate-fade-up">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-muted-foreground" />
                  Location
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-sm">Street Address</Label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="123 Main St"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="pl-9 min-h-[50px] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-sm">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-sm">State</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code" className="text-sm">ZIP / Postal Code</Label>
                    <Input
                      id="postal_code"
                      placeholder="10001"
                      value={formData.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <h3 className="font-semibold text-foreground flex items-center gap-2 pt-3 text-sm">
                  <Shield size={14} className="text-muted-foreground" />
                  Additional Notes
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-sm">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                {/* API-level error shown on final step */}
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
                onClick={() => onOpenChange(false)}
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
                  'Save Changes'
                )}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPatientModal;