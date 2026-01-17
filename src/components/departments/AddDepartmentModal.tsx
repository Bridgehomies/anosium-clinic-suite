import { useState } from 'react';
import { Building, User, FileText, Palette } from 'lucide-react';
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

interface AddDepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (department: DepartmentFormData) => void;
}

export interface DepartmentFormData {
  name: string;
  head: string;
  description: string;
  color: string;
}

const departmentHeads = [
  'Dr. Michael Chen',
  'Dr. Emily Parker',
  'Dr. James Wilson',
  'Dr. Sarah Lee',
  'Dr. Robert Martinez',
  'Dr. Amanda Ross',
  'Dr. David Kim',
];

const colorOptions = [
  { label: 'Rose', value: 'from-rose-500 to-red-500' },
  { label: 'Amber', value: 'from-amber-500 to-orange-500' },
  { label: 'Emerald', value: 'from-emerald-500 to-green-500' },
  { label: 'Sky', value: 'from-sky-500 to-blue-500' },
  { label: 'Violet', value: 'from-violet-500 to-purple-500' },
  { label: 'Teal', value: 'from-brand-navy to-brand-teal' },
  { label: 'Pink', value: 'from-pink-500 to-rose-500' },
  { label: 'Indigo', value: 'from-indigo-500 to-blue-500' },
];

const AddDepartmentModal = ({ open, onOpenChange, onAdd }: AddDepartmentModalProps) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    head: '',
    description: '',
    color: 'from-brand-navy to-brand-teal',
  });

  const [errors, setErrors] = useState<Partial<DepartmentFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<DepartmentFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Department name is required';
    if (!formData.head) newErrors.head = 'Department head is required';
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
      title: 'Department Added',
      description: `${formData.name} department has been created successfully.`,
    });
    
    // Reset form
    setFormData({
      name: '',
      head: '',
      description: '',
      color: 'from-brand-navy to-brand-teal',
    });
    setErrors({});
    onOpenChange(false);
  };

  const handleChange = (field: keyof DepartmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl font-display">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
              <Building className="text-white" size={18} />
            </div>
            Add New Department
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-2">
          {/* Scrollable form content */}
          <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Department Name *</Label>
              <div className="relative">
                <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="e.g., Cardiology"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`pl-9 text-sm ${errors.name ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Department Head *</Label>
              <Select
                value={formData.head}
                onValueChange={(value) => handleChange('head', value)}
              >
                <SelectTrigger className={`text-sm ${errors.head ? 'border-destructive' : ''}`}>
                  <User size={14} className="mr-2 text-muted-foreground flex-shrink-0" />
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent className="z-[100] bg-popover">
                  {departmentHeads.map((head) => (
                    <SelectItem key={head} value={head}>
                      {head}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.head && <p className="text-xs text-destructive">{errors.head}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Description *</Label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-3 text-muted-foreground" />
                <Textarea
                  id="description"
                  placeholder="Brief description of the department..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`pl-9 min-h-[60px] text-sm ${errors.description ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                <Palette size={14} className="text-muted-foreground" />
                Department Color
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('color', color.value)}
                    className={`p-2 md:p-3 rounded-lg md:rounded-xl border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-brand-navy ring-2 ring-brand-navy/20'
                        : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <div className={`h-4 md:h-6 rounded-md md:rounded-lg bg-gradient-to-r ${color.value}`} />
                    <p className="text-xs text-muted-foreground mt-1 hidden md:block">{color.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1.5">Preview</p>
              <div className="bg-background rounded-lg overflow-hidden border">
                <div className={`h-1.5 md:h-2 bg-gradient-to-r ${formData.color}`} />
                <div className="p-2 md:p-3">
                  <p className="font-semibold text-sm">{formData.name || 'Department Name'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formData.description || 'Department description...'}
                  </p>
                </div>
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
              Add Department
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDepartmentModal;
