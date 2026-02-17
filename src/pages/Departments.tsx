import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Users, Stethoscope, Receipt, ChevronRight,
  Edit, Trash2, Loader2, AlertCircle, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AddDepartmentModal from '@/components/departments/AddDepartmentModal';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── API ──────────────────────────────────────────────────────────────────────

const API_BASE: string = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const b = (await res.json()) as Record<string, string>; msg = b?.detail ?? b?.message ?? msg; } catch { /* ok */ }
    throw new Error(msg);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiDepartment {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  head_doctor?: { user?: { full_name?: string } | null } | null;
  is_active: boolean;
  created_at: string;
}

interface PaginatedDepts { items: ApiDepartment[]; total: number; page: number; page_size: number; total_pages: number; }

interface UIDepartment {
  id: number; name: string; code: string; head: string;
  doctors: number; services: number; patients: number;
  color: string; description: string;
}

const COLORS = [
  'from-rose-500 to-red-500', 'from-amber-500 to-orange-500',
  'from-emerald-500 to-green-500', 'from-sky-500 to-blue-500',
  'from-violet-500 to-purple-500', 'from-brand-navy to-brand-teal',
  'from-fuchsia-500 to-pink-500', 'from-cyan-500 to-teal-500',
];

function toUI(api: ApiDepartment, i: number): UIDepartment {
  return {
    id: api.id, name: api.name, code: api.code,
    head: api.head_doctor?.user?.full_name ?? '—',
    doctors: 0, services: 0, patients: 0,
    color: COLORS[i % COLORS.length],
    description: api.description ?? '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Departments() {
  const { accessToken } = useAuth();
  const [depts, setDepts] = useState<UIDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UIDepartment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<PaginatedDepts>(
        '/departments?page=1&page_size=50&is_active=true', accessToken
      );
      setDepts(data.items.map(toUI));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load departments';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (form: { name: string; code?: string; description?: string; color: string; head_doctor_id?: number | null }) => {
    setCreating(true);
    try {
      const code = (form.code ?? form.name).toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
      const created = await apiFetch<ApiDepartment>('/departments', accessToken, {
        method: 'POST',
        body: JSON.stringify({ name: form.name, code, description: form.description ?? null, head_doctor_id: form.head_doctor_id ?? null }),
      });
      const ui = toUI(created, depts.length);
      ui.color = form.color || ui.color;
      setDepts(prev => [...prev, ui]);
      setAddOpen(false);
      toast({ title: 'Department Created', description: `${created.name} has been added.` });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to create', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await apiFetch(`/departments/${selected.id}?soft_delete=true`, accessToken, { method: 'DELETE' });
      setDepts(prev => prev.filter(d => d.id !== selected.id));
      toast({ title: 'Department Deleted', description: `${selected.name} has been removed.` });
      setDeleteOpen(false); setDetailOpen(false); setSelected(null);
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' });
    } finally { setDeleting(false); }
  };

  const totalDoctors = depts.reduce((a, d) => a + d.doctors, 0);
  const totalServices = depts.reduce((a, d) => a + d.services, 0);
  const totalPatients = depts.reduce((a, d) => a + d.patients, 0);

  return (
    <DashboardLayout title="Departments" subtitle="Overview of all clinic departments">
      {/* Header action */}
      <div className="flex justify-end mb-4 md:mb-6 animate-fade-up">
        <button className="btn-accent w-full sm:w-auto" onClick={() => setAddOpen(true)} disabled={creating}>
          {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          <span>Add Department</span>
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={40} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertCircle size={48} className="text-destructive" />
          <p className="text-lg font-semibold">Failed to load departments</p>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-all text-sm">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {!loading && !error && depts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Stethoscope size={32} className="text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold">No departments yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Department" to create your first one.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && depts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
          {depts.map(dept => (
            <div key={dept.id} className="card-elevated overflow-hidden group cursor-pointer" onClick={() => { setSelected(dept); setDetailOpen(true); }}>
              <div className={`h-2 md:h-3 bg-gradient-to-r ${dept.color}`} />
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-lg md:text-xl text-foreground truncate">{dept.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {dept.description || <span className="italic">No description</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={e => e.stopPropagation()} className="p-1.5 md:p-2 hover:bg-muted rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100">
                      <Edit size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSelected(dept); setDeleteOpen(true); }} className="p-1.5 md:p-2 hover:bg-destructive/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all hidden md:block" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 md:mb-5 text-xs md:text-sm">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={14} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">Department Head</p>
                    <p className="font-medium text-foreground truncate">{dept.head}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-border">
                  {([['Stethoscope', dept.doctors, 'Doctors'], ['Receipt', dept.services, 'Services'], ['Users', dept.patients, 'Patients']] as const).map(([, value, label]) => (
                    <div key={label} className="text-center">
                      <p className="text-base md:text-lg font-bold font-display text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && !error && (
        <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[
            ['Total Departments', depts.length],
            ['Total Doctors', totalDoctors],
            ['Total Services', totalServices],
            ['Total Patients', totalPatients.toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} className="metric-card">
              <p className="text-xs md:text-sm text-muted-foreground mb-1 md:mb-2">{label}</p>
              <p className="text-2xl md:text-3xl font-bold font-display text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <AddDepartmentModal open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />

      {/* Detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-4 h-10 rounded bg-gradient-to-b ${selected?.color}`} />
              <div>
                <h2 className="text-xl font-display font-bold">{selected?.name}</h2>
                <p className="text-sm text-muted-foreground font-normal">{selected?.description || 'No description'}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center">
                  <Stethoscope className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department Head</p>
                  <p className="font-semibold text-foreground">{selected.head}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Stethoscope size={24} className="mx-auto text-brand-navy mb-2" />
                  <p className="text-2xl font-bold font-display">{selected.doctors}</p>
                  <p className="text-sm text-muted-foreground">Doctors</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Receipt size={24} className="mx-auto text-brand-teal mb-2" />
                  <p className="text-2xl font-bold font-display">{selected.services}</p>
                  <p className="text-sm text-muted-foreground">Services</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-xl">
                  <Users size={24} className="mx-auto text-secondary mb-2" />
                  <p className="text-2xl font-bold font-display">{selected.patients}</p>
                  <p className="text-sm text-muted-foreground">Patients</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border">
                <button className="btn-outline flex-1"><Edit size={16} /> Edit Department</button>
                <button
                  onClick={() => { setDetailOpen(false); setDeleteOpen(true); }}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selected?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
              {deleting ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Deleting…</span> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}