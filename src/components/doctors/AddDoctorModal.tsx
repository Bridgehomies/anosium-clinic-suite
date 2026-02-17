import { useState } from 'react';
import { User, Mail, Phone, Briefcase, GraduationCap } from 'lucide-react';
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

// ─── Phone Helpers (mirrors backend pattern: ^\+?[1-9]\d{1,14}$) ─────────────

/**
 * Sanitize raw phone input → E.164-compatible string or null if unrecoverable.
 * Logic:
 *  1. Strip everything except digits + leading `+`
 *  2. Replace leading `00` with `+`
 *  3. Remove leading zeros on the numeric portion
 *  4. Prepend `+1` (US default) when no country code detected
 *  5. Return null if the result still doesn't match the backend regex
 */
function sanitizePhone(raw: string): string | null {
  if (!raw?.trim()) return null;
  let s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('+')) {
    s = '+' + s.slice(1).replace(/^0+/, '');
  } else {
    s = s.replace(/^0+/, '');
  }
  if (!s.startsWith('+') && s.length > 0) s = '+1' + s;
  const digits = s.slice(1);
  if (digits.length < 1 || digits.length > 15) return null;
  return /^\+?[1-9]\d{1,14}$/.test(s) ? s : null;
}

function phoneError(raw: string): string | null {
  if (!raw.trim()) return 'Phone number is required';
  if (!sanitizePhone(raw)) {
    return 'Use international format: +1 555 123 4567 or at least 7 digits';
  }
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (doctor: DoctorFormData) => void;
}

export interface DoctorFormData {
  name: string;
  email: string;
  phone: string;          // raw value from the input
  sanitizedPhone: string; // E.164-safe value for the API
  specialization: string;
  department: string;
  experience: string;     // raw string e.g. "10 years"
  experienceYears: number | undefined; // parsed integer 0–70 for the API
  bio: string;
  availability: string;
}

type FormErrors = Partial<Record<keyof Omit<DoctorFormData, 'sanitizedPhone'>, string>>;

// ─── Constants ───────────────────────────────────────────────────────────────

const departments = [
  'Cardiology', 'Dermatology', 'Orthopedics',
  'Pediatrics', 'Neurology', 'General Medicine',
];

const specializations = [
  'Cardiology', 'Dermatology', 'Orthopedics',
  'Pediatrics', 'Neurology', 'General Medicine',
  'Oncology', 'Gastroenterology', 'Psychiatry', 'Radiology',
];

const EMPTY_FORM = {
  name: '', email: '', phone: '',
  specialization: '', department: '',
  experience: '', bio: '', availability: 'Available',
};

// ─── Component ───────────────────────────────────────────────────────────────

const AddDoctorModal = ({ open, onOpenChange, onAdd }: AddDoctorModalProps) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Live phone hint shown below the input
  const liveSanitized = sanitizePhone(formData.phone);
  const showPhoneHint =
    phoneTouched && formData.phone.trim().length > 0 && !!liveSanitized &&
    liveSanitized !== formData.phone.replace(/\s/g, '');

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Invalid email format';
    }
    const pErr = phoneError(formData.phone);
    if (pErr) errs.phone = pErr;
    if (!formData.specialization) errs.specialization = 'Specialization is required';
    if (!formData.department) errs.department = 'Department is required';
    if (!formData.experience.trim()) {
      errs.experience = 'Experience is required';
    } else {
      const yrs = parseInt(formData.experience.replace(/[^\d]/g, ''), 10);
      if (isNaN(yrs) || yrs < 0 || yrs > 70) {
        errs.experience = 'Enter years of experience between 0 and 70 (e.g. "10" or "10 years")';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);

    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the highlighted fields.',
        variant: 'destructive',
      });
      return;
    }

    const sanitizedPhone = sanitizePhone(formData.phone)!;
    const rawYears = parseInt(formData.experience.replace(/[^\d]/g, ''), 10);
    const experienceYears: number | undefined =
      !isNaN(rawYears) && rawYears >= 0 && rawYears <= 70 ? rawYears : undefined;
    onAdd?.({ ...formData, sanitizedPhone, experienceYears });

    // Reset
    setFormData(EMPTY_FORM);
    setErrors({});
    setPhoneTouched(false);
    onOpenChange(false);
  };

  const handleChange = (field: keyof typeof EMPTY_FORM, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'phone') setPhoneTouched(true);
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-display">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={18} />
            </div>
            Add New Doctor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-2">
          <div className="flex-1 overflow-y-auto space-y-5 px-1 py-2">

            {/* Personal Information */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Dr. John Smith"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`text-sm ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email Address *</Label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@clinic.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`pl-9 text-sm ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    className={`pl-9 text-sm ${errors.phone ? 'border-destructive' : ''}`}
                  />
                </div>
                {/* Error */}
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
                {/* Friendly hint: show what we'll actually send */}
                {!errors.phone && showPhoneHint && (
                  <p className="text-xs text-muted-foreground">
                    Will be sent as: <span className="font-mono font-medium text-foreground">{liveSanitized}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  Examples: +1 555 123 4567 · +44 7911 123456 · 5551234567
                </p>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Briefcase size={14} className="text-muted-foreground" />
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Specialization */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Specialization *</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(v) => handleChange('specialization', v)}
                  >
                    <SelectTrigger className={`text-sm ${errors.specialization ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      {specializations.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.specialization && <p className="text-xs text-destructive">{errors.specialization}</p>}
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v) => handleChange('department', v)}
                  >
                    <SelectTrigger className={`text-sm ${errors.department ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Experience */}
                <div className="space-y-1.5">
                  <Label htmlFor="experience" className="text-sm">Years of Experience *</Label>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="experience"
                      placeholder="10 or 10 years (max 70)"
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      className={`pl-9 text-sm ${errors.experience ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
                  {!errors.experience && formData.experience && (() => {
                    const y = parseInt(formData.experience.replace(/[^\d]/g, ''), 10);
                    return !isNaN(y) && y >= 0 && y <= 70 ? (
                      <p className="text-xs text-muted-foreground/70">Will send: {y} year{y !== 1 ? 's' : ''}</p>
                    ) : null;
                  })()}
                </div>

                {/* Availability */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Availability Status</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(v) => handleChange('availability', v)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-sm">Bio / About</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief description about the doctor's background..."
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex gap-2 md:gap-3 pt-4 mt-2 border-t border-border bg-background">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-ghost flex-1 text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-accent flex-1 text-sm">
              Add Doctor
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDoctorModal;