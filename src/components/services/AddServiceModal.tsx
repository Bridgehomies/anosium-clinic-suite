import { useState } from 'react';
import { Tag, DollarSign, Clock, FileText } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (service: ServiceFormData) => void;
}

export interface ServiceFormData {
  name: string;
  category: string;
  price: string;
  duration: string;
  description: string;
  popular: boolean;
}

const categories = [
  'General',
  'Laboratory',
  'Radiology',
  'Cardiology',
  'Rehabilitation',
  'Dermatology',
  'Pediatrics',
  'Neurology',
  'Orthopedics',
];

const durations = [
  '15 min',
  '20 min',
  '30 min',
  '45 min',
  '60 min',
  '90 min',
  '120 min',
];

const AddServiceModal = ({ open, onOpenChange, onAdd }: AddServiceModalProps) => {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    popular: false,
  });

  const [errors, setErrors] = useState<Partial<ServiceFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<ServiceFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Service name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

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
      title: 'Service Added',
      description: `${formData.name} has been added successfully.`,
    });
    
    // Reset form
    setFormData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
      popular: false,
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleChange = (field: keyof ServiceFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g., General Consultation"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`text-sm ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className={`text-sm ${errors.category ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm">Price ($) *</Label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    placeholder="75"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    className={`pl-9 text-sm ${errors.price ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Duration *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => handleChange('duration', value)}
                >
                  <SelectTrigger className={`text-sm ${errors.duration ? 'border-destructive' : ''}`}>
                    <Clock size={14} className="mr-2 text-muted-foreground flex-shrink-0" />
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-popover">
                    {durations.map((dur) => (
                      <SelectItem key={dur} value={dur}>
                        {dur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description *</Label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <Textarea
                  id="description"
                  placeholder="Describe the service..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`pl-9 min-h-[70px] text-sm ${errors.description ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="popular" className="font-medium text-sm">Mark as Popular</Label>
                <p className="text-xs text-muted-foreground">
                  Display a "Popular" badge
                </p>
              </div>
              <Switch
                id="popular"
                checked={formData.popular}
                onCheckedChange={(checked) => handleChange('popular', checked)}
              />
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
              Add Service
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
