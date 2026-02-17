import { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, GraduationCap, Save, DollarSign, Edit } from 'lucide-react';
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
  if (!raw.trim()) return null; // phone optional on edit
  if (!sanitizePhone(raw)) return 'Use international format: +1 555 123 4567 or at least 7 digits';
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the backend PATCH /doctors/{id} body */
export interface DoctorEditPayload {
  specialization?: string;
  qualification?: string;
  license_number?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
  is_available?: boolean;
  // user fields (sent separately via PATCH /users/{user_id})
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface EditableDoctorData {
  id: number;          // doctor profile ID
  userId: number;      // linked user ID (for PATCH /users/{id})
  name: string;        // full display name
  email: string;
  phone: string;
  specialization: string;
  department: string;
  experience: string;  // "N years"
  bio: string;
  isAvailable: boolean;
  consultationFee?: number;
  licenseNumber?: string;
  qualification?: string;
}

interface EditDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: EditableDoctorData | null;
  onSave?: (id: number, payload: DoctorEditPayload) => Promise<void>; // parent calls PUT /doctors/{id}
}

type FormErrors = Partial<Record<
  'name' | 'phone' | 'specialization' | 'experience' | 'consultationFee' | 'licenseNumber',
  string
>>;

// ─── Constants ───────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics',
  'Neurology', 'General Medicine', 'Oncology', 'Gastroenterology',
  'Psychiatry', 'Radiology',
];

// ─── Component ───────────────────────────────────────────────────────────────

const EditDoctorModal = ({ open, onOpenChange, doctor, onSave }: EditDoctorModalProps) => {
  const [saving, setSaving] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state — initialised from doctor prop
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [consultationFee, setConsultationFee] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualification, setQualification] = useState('');

  // Seed form when doctor changes
  useEffect(() => {
    if (doctor) {
      setName(doctor.name.replace(/^Dr\.\s*/i, '').trim());
      setPhone(doctor.phone === 'N/A' ? '' : doctor.phone);
      setSpecialization(doctor.specialization);
      setExperience(doctor.experience === 'N/A' ? '' : doctor.experience);
      setBio(doctor.bio ?? '');
      setIsAvailable(doctor.isAvailable);
      setConsultationFee(doctor.consultationFee != null ? String(doctor.consultationFee) : '');
      setLicenseNumber(doctor.licenseNumber ?? '');
      setQualification(doctor.qualification ?? '');
      setErrors({});
      setPhoneTouched(false);
    }
  }, [doctor]);

  const liveSanitized = sanitizePhone(phone);
  const showPhoneHint =
    phoneTouched && phone.trim().length > 0 && !!liveSanitized &&
    liveSanitized !== phone.replace(/\s/g, '');

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = 'Name is required';
    const pErr = phoneError(phone);
    if (pErr) errs.phone = pErr;
    if (!specialization) errs.specialization = 'Specialization is required';
    if (experience.trim()) {
      const yrs = parseInt(experience.replace(/[^\d]/g, ''), 10);
      if (isNaN(yrs) || yrs < 0 || yrs > 70) {
        errs.experience = 'Enter years between 0 and 70';
      }
    }
    if (consultationFee.trim()) {
      const fee = parseFloat(consultationFee);
      if (isNaN(fee) || fee < 0) errs.consultationFee = 'Enter a valid positive amount';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (!validate() || !doctor) return;

    setSaving(true);
    try {
      // Parse optional numeric fields
      const rawYears = parseInt(experience.replace(/[^\d]/g, ''), 10);
      const experienceYears =
        !isNaN(rawYears) && rawYears >= 0 && rawYears <= 70 ? rawYears : undefined;
      const fee = parseFloat(consultationFee);

      // Compose name parts
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload: DoctorEditPayload = {
        specialization,
        is_available: isAvailable,
        // Only include optional fields when provided
        ...(experienceYears !== undefined && { experience_years: experienceYears }),
        ...(experience.trim() && { qualification: qualification || experience.trim() }),
        ...(qualification.trim() && { qualification: qualification.trim() }),
        ...(bio.trim() && { bio: bio.trim() }),
        ...(!isNaN(fee) && fee >= 0 && { consultation_fee: fee }),
        ...(licenseNumber.trim() && { license_number: licenseNumber.trim() }),
        // user-level fields
        ...(firstName && { first_name: firstName }),
        ...(lastName && { last_name: lastName }),
        ...(phone.trim() && { phone: liveSanitized ?? undefined }),
      };

      await onSave?.(doctor.id, payload);
      toast({
        title: 'Doctor Updated',
        description: `Dr. ${name} has been updated successfully.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error Saving Changes',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldErr = (field: keyof FormErrors) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1">{errors[field]}</p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-display">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
              <Edit size={18} className="text-white" />
            </div>
            Edit Doctor
            {doctor && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                — {doctor.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden mt-2">
          <div className="flex-1 overflow-y-auto space-y-5 px-1 py-2">

            {/* ── Personal Info ── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-sm">Full Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                    className={`text-sm ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {fieldErr('name')}
                </div>

                {/* Email (read-only — changing email is an account-level action) */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-sm">
                    Email Address
                    <span className="ml-1 text-xs text-muted-foreground">(read-only)</span>
                  </Label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="edit-email"
                      type="email"
                      value={doctor?.email ?? ''}
                      readOnly
                      className="pl-9 text-sm bg-muted/40 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-sm">Phone Number</Label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
                    onBlur={() => setPhoneTouched(true)}
                    className={`pl-9 text-sm ${errors.phone ? 'border-destructive' : ''}`}
                  />
                </div>
                {fieldErr('phone')}
                {!errors.phone && showPhoneHint && (
                  <p className="text-xs text-muted-foreground">
                    Will send as: <span className="font-mono font-medium text-foreground">{liveSanitized}</span>
                  </p>
                )}
              </div>
            </section>

            {/* ── Professional Info ── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Briefcase size={14} className="text-muted-foreground" />
                Professional Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Specialization */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Specialization *</Label>
                  <Select value={specialization} onValueChange={(v) => { setSpecialization(v); setErrors(p => ({ ...p, specialization: undefined })); }}>
                    <SelectTrigger className={`text-sm ${errors.specialization ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      {SPECIALIZATIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErr('specialization')}
                </div>

                {/* Availability */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Availability Status</Label>
                  <Select
                    value={isAvailable ? 'available' : 'unavailable'}
                    onValueChange={(v) => setIsAvailable(v === 'available')}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Experience */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-experience" className="text-sm">Years of Experience</Label>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="edit-experience"
                      placeholder="10 or 10 years (max 70)"
                      value={experience}
                      onChange={(e) => { setExperience(e.target.value); setErrors(p => ({ ...p, experience: undefined })); }}
                      className={`pl-9 text-sm ${errors.experience ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {fieldErr('experience')}
                  {!errors.experience && experience.trim() && (() => {
                    const y = parseInt(experience.replace(/[^\d]/g, ''), 10);
                    return !isNaN(y) && y >= 0 && y <= 70 ? (
                      <p className="text-xs text-muted-foreground/70">Will send: {y} year{y !== 1 ? 's' : ''}</p>
                    ) : null;
                  })()}
                </div>

                {/* Consultation Fee */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-fee" className="text-sm">Consultation Fee</Label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="edit-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="75.00"
                      value={consultationFee}
                      onChange={(e) => { setConsultationFee(e.target.value); setErrors(p => ({ ...p, consultationFee: undefined })); }}
                      className={`pl-9 text-sm ${errors.consultationFee ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {fieldErr('consultationFee')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* License Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-license" className="text-sm">License Number</Label>
                  <Input
                    id="edit-license"
                    placeholder="MED-123456"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Qualification */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-qualification" className="text-sm">Qualification</Label>
                  <Input
                    id="edit-qualification"
                    placeholder="MBBS, MD, etc."
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-bio" className="text-sm">Bio / About</Label>
                <Textarea
                  id="edit-bio"
                  placeholder="Brief description about the doctor..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex gap-2 md:gap-3 pt-4 mt-2 border-t border-border bg-background">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="btn-ghost flex-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-accent flex-1 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default EditDoctorModal;