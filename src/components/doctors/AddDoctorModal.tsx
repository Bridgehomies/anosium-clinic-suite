import { useState } from 'react';
import { X, User, Mail, Phone, Briefcase, GraduationCap, Building } from 'lucide-react';
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

interface AddDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (doctor: DoctorFormData) => void;
}

export interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  experience: string;
  bio: string;
  availability: string;
}

const departments = [
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'General Medicine',
];

const specializations = [
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'General Medicine',
  'Oncology',
  'Gastroenterology',
  'Psychiatry',
  'Radiology',
];

const AddDoctorModal = ({ open, onOpenChange, onAdd }: AddDoctorModalProps) => {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    department: '',
    experience: '',
    bio: '',
    availability: 'Available',
  });

  const [errors, setErrors] = useState<Partial<DoctorFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<DoctorFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.experience.trim()) newErrors.experience = 'Experience is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    onAdd?.(formData);
    toast({
      title: 'Doctor Added',
      description: `${formData.name} has been added successfully.`,
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialization: '',
      department: '',
      experience: '',
      bio: '',
      availability: 'Available',
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleChange = (field: keyof DoctorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto space-y-5 px-1 py-2">
            {/* Personal Information */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm">Email Address *</Label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@anosium.ai"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`pl-9 text-sm ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
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

            {/* Professional Information */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <Briefcase size={14} className="text-muted-foreground" />
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Specialization *</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value) => handleChange('specialization', value)}
                  >
                    <SelectTrigger className={`text-sm ${errors.specialization ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      {specializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.specialization && <p className="text-xs text-destructive">{errors.specialization}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange('department', value)}
                  >
                    <SelectTrigger className={`text-sm ${errors.department ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-popover">
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="experience" className="text-sm">Years of Experience *</Label>
                  <div className="relative">
                    <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="experience"
                      placeholder="10 years"
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      className={`pl-9 text-sm ${errors.experience ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Availability Status</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => handleChange('availability', value)}
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

          {/* Fixed action buttons at bottom */}
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
