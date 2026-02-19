import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, DollarSign, Clock, Tag, Edit, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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

// ─── Types matching the backend Service schema ───────────────────────────────

export interface Service {
  id: number;
  code: string;
  name: string;
  description: string | null;
  service_type: string;       // 'consultation' | 'procedure' | 'lab_test' | 'imaging' | 'surgery' | 'therapy' | 'package'
  base_price: number;
  tax_percentage: number;
  final_price: number;
  estimated_duration_minutes: number | null;
  department_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  // UI-only flag (not from backend, derived for display)
  popular?: boolean;
}

interface PaginatedResponse {
  items: Service[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
  };
}

async function fetchServices(search?: string): Promise<Service[]> {
  const params = new URLSearchParams({ page_size: '100', is_active: 'true' });
  const res = await fetch(`${API_BASE}/services?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load services (${res.status})`);
  const data: PaginatedResponse = await res.json();
  return data.items;
}

async function deleteServiceById(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/services/${id}?soft_delete=true`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete service (${res.status})`);
}

// ─── Category label derived from service_type ────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  procedure: 'Procedure',
  lab_test: 'Laboratory',
  imaging: 'Radiology',
  surgery: 'Surgery',
  therapy: 'Therapy',
  package: 'Package',
};

function categoryLabel(type: string): string {
  return SERVICE_TYPE_LABELS[type] ?? type;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Load services from API ─────────────────────────────────────────────────
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchServices();
      setServices(items);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // ── Derived filters ────────────────────────────────────────────────────────
  const uniqueCategories = [
    'All',
    ...Array.from(new Set(services.map((s) => categoryLabel(s.service_type)))),
  ];

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || categoryLabel(s.service_type) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Called by AddServiceModal after a successful POST – re-fetch to stay in sync */
  const handleServiceAdded = () => {
    loadServices();
  };

  const confirmDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;
    setDeletingId(selectedService.id);
    try {
      await deleteServiceById(selectedService.id);
      setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
      toast({
        title: 'Service Deleted',
        description: `${selectedService.name} has been removed.`,
      });
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message ?? 'Could not delete service.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSelectedService(null);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Loading services…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-destructive">
          <AlertCircle size={32} />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={loadServices}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all text-sm"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      );
    }

    if (filteredServices.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {services.length === 0
              ? 'No services yet. Click "Add Service" to create one.'
              : 'No services match your search criteria.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
        {filteredServices.map((service) => (
          <div key={service.id} className="card-elevated p-4 md:p-6 group relative">
            {/* Popular badge – kept for future use, hidden by default since backend has no flag */}
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
                {categoryLabel(service.service_type)}
              </span>
            </div>

            <h3 className="font-display font-semibold text-base md:text-lg text-foreground mb-1 md:mb-2 pr-4">
              {service.name}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">
              {service.description ?? '—'}
            </p>

            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-500 flex-shrink-0" />
                <span className="text-lg md:text-xl font-bold font-display text-foreground">
                  ${service.final_price ?? service.base_price}
                </span>
              </div>
              {service.estimated_duration_minutes != null && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={12} className="flex-shrink-0" />
                  <span className="text-xs md:text-sm">{service.estimated_duration_minutes} min</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity pt-2 border-t border-border/50">
              <button
                onClick={() => confirmDelete(service)}
                disabled={deletingId === service.id}
                className="flex items-center justify-center p-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all flex-shrink-0 disabled:opacity-50"
              >
                {deletingId === service.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Stats (computed from live data) ────────────────────────────────────────
  const avgPrice =
    services.length > 0
      ? Math.round(services.reduce((acc, s) => acc + (s.final_price ?? s.base_price), 0) / services.length)
      : 0;

  const categoryCount = new Set(services.map((s) => s.service_type)).size;

  return (
    <DashboardLayout title="Services" subtitle="Manage clinic services and pricing">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadServices}
              disabled={loading}
              title="Refresh"
              className="btn-ghost px-3"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn-accent w-full sm:w-auto" onClick={() => setAddModalOpen(true)}>
              <Plus size={18} />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        {!loading && !error && (
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
        )}
      </div>

      {/* Services Grid */}
      {renderContent()}

      {/* Summary Stats */}
      {!loading && !error && (
        <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div className="metric-card">
            <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Total Services</p>
            <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{services.length}</p>
          </div>
          <div className="metric-card">
            <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Avg. Price</p>
            <p className="text-2xl md:text-3xl font-bold font-display text-foreground">${avgPrice}</p>
          </div>
          <div className="metric-card col-span-2 md:col-span-1">
            <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">Service Types</p>
            <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{categoryCount}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddServiceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={handleServiceAdded}
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