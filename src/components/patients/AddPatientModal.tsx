import { useState } from 'react';
import { User, Mail, Phone, MapPin, Droplet, AlertCircle, Shield, Calendar } from 'lucide-react';
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

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (patient: PatientFormData) => void;
}

export interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
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

const AddPatientModal = ({ open, onOpenChange, onAdd }: AddPatientModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: '',
    insuranceProvider: '',
    insuranceId: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<PatientFormData>>({});

  const validateStep1 = () => {
    const newErrors: Partial<PatientFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.dob) newErrors.dob = 'Date of birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<PatientFormData> = {};
    
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Emergency contact name is required';
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Emergency contact phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd?.(formData);
    toast({
      title: 'Patient Added',
      description: `${formData.name} has been registered successfully.`,
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      dob: '',
      bloodType: '',
      allergies: '',
      emergencyContact: '',
      emergencyPhone: '',
      insuranceProvider: '',
      insuranceId: '',
      notes: '',
    });
    setErrors({});
    setStep(1);
    onOpenChange(false);
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            Add New Patient
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s <= step
                    ? 'bg-brand-navy text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded ${
                    s < step ? 'bg-brand-navy' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>Personal Info</span>
          <span>Medical & Emergency</span>
          <span>Insurance</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <User size={16} className="text-muted-foreground" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleChange('dob', e.target.value)}
                      className={`pl-10 ${errors.dob ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder="123 Main St, City, State, ZIP"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="pl-10 min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medical & Emergency */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-up">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <AlertCircle size={16} className="text-muted-foreground" />
                Medical Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(value) => handleChange('bloodType', value)}
                  >
                    <SelectTrigger>
                      <Droplet size={16} className="mr-2 text-red-500" />
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    placeholder="Penicillin, Peanuts, etc."
                    value={formData.allergies}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                  />
                </div>
              </div>

              <h3 className="font-semibold text-foreground flex items-center gap-2 pt-4">
                <Phone size={16} className="text-muted-foreground" />
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contact Name *</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Jane Smith"
                    value={formData.emergencyContact}
                    onChange={(e) => handleChange('emergencyContact', e.target.value)}
                    className={errors.emergencyContact ? 'border-destructive' : ''}
                  />
                  {errors.emergencyContact && <p className="text-xs text-destructive">{errors.emergencyContact}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    placeholder="+1 (555) 987-6543"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                    className={errors.emergencyPhone ? 'border-destructive' : ''}
                  />
                  {errors.emergencyPhone && <p className="text-xs text-destructive">{errors.emergencyPhone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Insurance */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-up">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Shield size={16} className="text-muted-foreground" />
                Insurance Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Select
                    value={formData.insuranceProvider}
                    onValueChange={(value) => handleChange('insuranceProvider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceProviders.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceId">Insurance ID</Label>
                  <Input
                    id="insuranceId"
                    placeholder="XX-12345678"
                    value={formData.insuranceId}
                    onChange={(e) => handleChange('insuranceId', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="btn-ghost flex-1">
                Back
              </button>
            ) : (
              <button type="button" onClick={() => onOpenChange(false)} className="btn-ghost flex-1">
                Cancel
              </button>
            )}
            
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-accent flex-1">
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-accent flex-1">
                Add Patient
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPatientModal;
