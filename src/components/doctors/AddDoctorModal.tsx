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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            Add New Doctor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User size={16} className="text-muted-foreground" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Dr. John Smith"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@anosium.ai"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
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

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={16} className="text-muted-foreground" />
              Professional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => handleChange('specialization', value)}
                >
                  <SelectTrigger className={errors.specialization ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialization && <p className="text-xs text-destructive">{errors.specialization}</p>}
              </div>

              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleChange('department', value)}
                >
                  <SelectTrigger className={errors.department ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="experience"
                    placeholder="10 years"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    className={`pl-10 ${errors.experience ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.experience && <p className="text-xs text-destructive">{errors.experience}</p>}
              </div>

              <div className="space-y-2">
                <Label>Availability Status</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) => handleChange('availability', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Busy">Busy</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About</Label>
              <Textarea
                id="bio"
                placeholder="Brief description about the doctor's background and expertise..."
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-accent flex-1">
              Add Doctor
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDoctorModal;
