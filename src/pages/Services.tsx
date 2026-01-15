import { useState } from 'react';
import { Plus, Search, DollarSign, Clock, Tag, Edit, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const services = [
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout title="Services" subtitle="Manage clinic services and pricing">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11"
            />
          </div>
          <button className="btn-accent">
            <Plus size={18} />
            Add Service
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {filteredServices.map((service) => (
          <div key={service.id} className="card-elevated p-6 group relative">
            {service.popular && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                  Popular
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <Tag size={16} className="text-secondary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {service.category}
              </span>
            </div>

            <h3 className="font-display font-semibold text-lg text-foreground mb-2">
              {service.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {service.description}
            </p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="text-xl font-bold font-display text-foreground">
                  ${service.price}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={14} />
                <span className="text-sm">{service.duration}</span>
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="btn-outline flex-1 text-sm py-2">
                <Edit size={14} />
                Edit
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Services;
