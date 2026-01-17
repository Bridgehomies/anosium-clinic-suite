import { useState } from 'react';
import { Plus, Search, DollarSign, Clock, Tag, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddServiceModal from '@/components/services/AddServiceModal';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: string;
  description: string;
  popular: boolean;
}

const initialServices: Service[] = [
  {
    id: 1,
    name: 'General Consultation',
    category: 'General',
    price: 75,
    duration: '30 min',
    description: 'Standard doctor consultation for general health concerns',
    popular: true,
  },
  {
    id: 2,
    name: 'Complete Blood Panel',
    category: 'Laboratory',
    price: 150,
    duration: '45 min',
    description: 'Comprehensive blood work including CBC, metabolic panel, and lipid profile',
    popular: true,
  },
  {
    id: 3,
    name: 'X-Ray Imaging',
    category: 'Radiology',
    price: 200,
    duration: '20 min',
    description: 'Standard X-ray imaging service for bones and chest',
    popular: false,
  },
  {
    id: 4,
    name: 'Cardiac Stress Test',
    category: 'Cardiology',
    price: 450,
    duration: '60 min',
    description: 'Exercise stress test with ECG monitoring',
    popular: false,
  },
  {
    id: 5,
    name: 'Physical Therapy Session',
    category: 'Rehabilitation',
    price: 120,
    duration: '45 min',
    description: 'One-on-one physical therapy session with a certified therapist',
    popular: true,
  },
  {
    id: 6,
    name: 'Dermatology Consultation',
    category: 'Dermatology',
    price: 125,
    duration: '30 min',
    description: 'Specialized skin care consultation and treatment recommendations',
    popular: false,
  },
];

const categories = ['All', 'General', 'Laboratory', 'Radiology', 'Cardiology', 'Rehabilitation', 'Dermatology'];

const Services = () => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editMode, setEditMode] = useState(false);

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddService = (serviceData: any) => {
    const newService: Service = {
      id: services.length + 1,
      name: serviceData.name,
      category: serviceData.category,
      price: Number(serviceData.price),
      duration: serviceData.duration,
      description: serviceData.description,
      popular: serviceData.popular,
    };
    setServices([...services, newService]);
  };

  const handleDeleteService = () => {
    if (selectedService) {
      setServices(services.filter((s) => s.id !== selectedService.id));
      toast({
        title: 'Service Deleted',
        description: `${selectedService.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setSelectedService(null);
    }
  };

  const confirmDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const togglePopular = (service: Service) => {
    setServices(services.map(s => 
      s.id === service.id ? { ...s, popular: !s.popular } : s
    ));
    toast({
      title: service.popular ? 'Removed from Popular' : 'Marked as Popular',
      description: `${service.name} has been updated.`,
    });
  };

  // Get unique categories from services for dynamic category list
  const uniqueCategories = ['All', ...new Set(services.map(s => s.category))];

  return (
    <DashboardLayout title="Services" subtitle="Manage clinic services and pricing">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11 w-full"
            />
          </div>
          <button className="btn-accent w-full sm:w-auto" onClick={() => setAddModalOpen(true)}>
            <Plus size={18} />
            <span>Add Service</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {uniqueCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeCategory === category
                  ? 'bg-brand-navy text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
        {filteredServices.map((service) => (
          <div key={service.id} className="card-elevated p-4 md:p-6 group relative">
            {service.popular && (
              <div className="absolute top-3 md:top-4 right-3 md:right-4">
                <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                  Popular
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Tag size={14} className="text-secondary flex-shrink-0" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                {service.category}
              </span>
            </div>

            <h3 className="font-display font-semibold text-base md:text-lg text-foreground mb-1 md:mb-2 pr-16">
              {service.name}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="text-lg md:text-xl font-bold font-display text-foreground">
                  ${service.price}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={12} className="flex-shrink-0" />
                <span className="text-xs md:text-sm">{service.duration}</span>
              </div>
            </div>

            {/* Actions - Always visible on mobile, hover on desktop */}
            <div className="flex flex-wrap gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity pt-2 border-t border-border/50">
              <button 
                className="flex-1 min-w-0 text-xs md:text-sm py-2 px-2 md:px-3 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all truncate"
                onClick={() => togglePopular(service)}
              >
                {service.popular ? 'Unmark' : 'Popular'}
              </button>
              <button className="flex items-center justify-center p-2 rounded-lg border-2 border-muted hover:bg-muted transition-all flex-shrink-0">
                <Edit size={14} className="text-muted-foreground" />
              </button>
              <button 
                onClick={() => confirmDelete(service)}
                className="flex items-center justify-center p-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No services found matching your criteria.</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Total Services</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {services.length}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Popular Services</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {services.filter(s => s.popular).length}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Avg. Price</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            ${Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length)}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Categories</p>
          <p className="text-2xl md:text-3xl font-bold font-display text-foreground">
            {new Set(services.map(s => s.category)).size}
          </p>
        </div>
      </div>

      {/* Modals */}
      <AddServiceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleAddService}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Services;
