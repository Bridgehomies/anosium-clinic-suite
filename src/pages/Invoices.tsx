import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, FileText,
  Download, Send, DollarSign, Loader2, RefreshCw, Percent, Hash, ChevronDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import StatusPill from '@/components/invoice/StatusPill';

import billingService, {
  type Invoice,
  type InvoiceItemCreate,
  type Payment,
  type RevenueReport,
} from '@/lib/billingService';
import PatientSelect from '@/components/visits/PatientSelect';
import { STATUS_CONFIG, type InvoiceStatus } from '@/lib/constants/invoice';  // adjust path

// ─── Status config ────────────────────────────────────────────────────────────


const PAYMENT_METHODS: Payment['payment_method'][] = [
  'cash', 'card', 'upi', 'bank_transfer', 'insurance', 'wallet',
];

const allowedStatusesForCreate: Invoice['status'][] = ['DRAFT', 'PENDING'];
const allowedStatusesForEdit: Invoice['status'][]  = ['PENDING', 'PARTIALLY_PAID', 'CANCELLED'];

const BILLABLE_STATUSES: Invoice['status'][] = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'];

// ─── Service type ─────────────────────────────────────────────────────────────

interface ServiceOption {
  id: number;
  name: string;
  code: string;
  base_price: number;
  final_price: number;
  description?: string | null;
  service_type: string;
  is_active: boolean;
}

// ─── Local form types ─────────────────────────────────────────────────────────

interface FormItem {
  service_id: number | '';
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

type AmountMode = 'percent' | 'fixed';

interface InvoiceForm {
  patientId: string;
  invoiceDate: string;
  dueDate: string;
  status: Invoice['status'];
  taxValue: number;
  taxMode: AmountMode;
  discountValue: number;
  discountMode: AmountMode;
  notes: string;
  items: FormItem[];
}

const BLANK_ITEM: FormItem = { service_id: '', description: '', quantity: 1, unitPrice: 0, discount: 0 };

const DEFAULT_FORM: InvoiceForm = {
  patientId: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  status: 'PENDING',
  taxValue: 0,
  taxMode: 'percent',
  discountValue: 0,
  discountMode: 'percent',
  notes: '',
  items: [{ ...BLANK_ITEM }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n?: number | null) => `$${Number(n ?? 0).toFixed(2)}`;

function toApiItems(items: FormItem[]): InvoiceItemCreate[] {
  return items.filter(it => it.description.trim()).map(it => ({
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    discount: it.discount || undefined,
    service_id: it.service_id !== '' ? (it.service_id as number) : undefined,
  }));
}

function resolveAmount(value: number, mode: AmountMode, base: number): number {
  if (!value) return 0;
  return mode === 'percent' ? (base * value) / 100 : value;
}

function calcTotals(form: InvoiceForm) {
  const subtotal = form.items.reduce((s, it) => s + it.quantity * it.unitPrice - (it.discount || 0), 0);
  const discountAmt = resolveAmount(form.discountValue, form.discountMode, subtotal);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const taxAmt = resolveAmount(form.taxValue, form.taxMode, afterDiscount);
  return { subtotal, discountAmt, taxAmt, total: afterDiscount + taxAmt };
}

// ─── AmountInput ──────────────────────────────────────────────────────────────

function AmountInput({ label, value, mode, onValue, onMode, disabled }: {
  label: string; value: number; mode: AmountMode;
  onValue: (v: number) => void; onMode: (m: AmountMode) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex rounded-md overflow-hidden border border-input">
        <div className="flex border-r border-input bg-muted/50">
          <button type="button" onClick={() => onMode('percent')} disabled={disabled}
            className={`h-10 w-9 flex items-center justify-center text-xs font-medium transition-colors
              ${mode === 'percent' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} title="Percentage">
            <Percent size={13} />
          </button>
          <button type="button" onClick={() => onMode('fixed')} disabled={disabled}
            className={`h-10 w-9 flex items-center justify-center text-xs font-medium transition-colors border-l border-input/50
              ${mode === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`} title="Fixed amount">
            <Hash size={13} />
          </button>
        </div>
        <div className="relative flex-1">
          {mode === 'fixed' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>}
          <input type="number" min={0} max={mode === 'percent' ? 100 : undefined}
            step={mode === 'percent' ? 0.1 : 0.01} value={value}
            onChange={e => onValue(parseFloat(e.target.value) || 0)} disabled={disabled}
            className={`h-10 w-full bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-none pr-3 disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'fixed' ? 'pl-7' : 'pl-3'}`} />
          {mode === 'percent' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">%</span>}
        </div>
      </div>
    </div>
  );
}

// ─── StatusDropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ current, disabled, onChange }: {
  current: Invoice['status']; disabled: boolean; onChange: (s: Invoice['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const cfg = STATUS_CONFIG[current] ?? { 
    label: current ?? 'Unknown', 
    className: 'bg-gray-100 text-gray-600 border-gray-200', 
    dotColor: 'bg-gray-400' 
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
          hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${cfg.className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
        {cfg.label}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[150px] bg-popover border border-border rounded-lg shadow-lg py-1 overflow-hidden">
          {(Object.keys(STATUS_CONFIG) as Invoice['status'][]).map(s => {
            const c = STATUS_CONFIG[s];
            const isActive = s === current;
            return (
              <button 
                key={s} 
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-muted ${isActive ? 'bg-muted/60' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dotColor}`} />
                <span className="flex-1">{c.label}</span>
                {isActive && <span className="text-primary text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PartialPaymentModal ──────────────────────────────────────────────────────

function PartialPaymentModal({ open, invoice, saving, onClose, onConfirm }: {
  open: boolean; invoice: Invoice | null; saving: boolean;
  onClose: () => void; onConfirm: (amount: number, method: Payment['payment_method']) => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Payment['payment_method']>('cash');

  useEffect(() => { if (open) { setAmount(''); setMethod('cash'); } }, [open]);

  const max = invoice?.balance_amount ?? 0;
  const paid = parseFloat(amount) || 0;
  const remaining = Math.max(0, max - paid);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Partial Payment</DialogTitle>
          <DialogDescription>
            {invoice?.invoice_number} · Outstanding balance {invoice ? fmt(invoice.balance_amount) : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount Paid <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input type="number" min={0.01} max={max} step={0.01} value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00" className="pl-7" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <select value={method} onChange={e => setMethod(e.target.value as Payment['payment_method'])}
              className="input-modern w-full h-10">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {paid > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paying now</span>
                <span className="font-semibold text-emerald-600">{fmt(paid)}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-1.5">
                <span className="text-muted-foreground">Remaining balance</span>
                <span className={`font-semibold ${remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmt(remaining)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={() => onConfirm(paid, method)} className="btn-accent"
            disabled={saving || paid <= 0 || paid > max}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Record Payment'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<RevenueReport | null>(null);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialTarget, setPartialTarget] = useState<Invoice | null>(null);

  const [selected, setSelected] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(DEFAULT_FORM);

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<Payment['payment_method']>('cash');
  const [payRef, setPayRef] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billingService.getInvoices({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        status: filterStatus !== 'All' ? filterStatus : undefined,
      });
      setInvoices(data.items);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const fetchReport = useCallback(async () => {
    try { setReport(await billingService.getRevenueReport()); } catch { /* non-critical */ }
  }, []);

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
      const token = localStorage.getItem('access_token');
      const tenantId = localStorage.getItem('tenant_id');
      const res = await fetch(`${apiBase}/services?is_active=true&page_size=100`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to load services');
      const json = await res.json();
      setServices((json.items ?? json) as ServiceOption[]);
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchReport(); }, [fetchReport]);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const resetForm = () => { setForm(DEFAULT_FORM); setIsEditing(false); setSelected(null); };
  const setF = (patch: Partial<InvoiceForm>) => setForm(f => ({ ...f, ...patch }));

  const handleServiceSelect = (idx: number, serviceId: string) => {
    const svcId = serviceId === '' ? '' : parseInt(serviceId, 10);
    const svc = services.find(s => s.id === svcId);
    setForm(prev => ({
      ...prev,
      items: prev.items.map((it, i) => i !== idx ? it : {
        ...it, service_id: svcId,
        description: svc ? svc.name : it.description,
        unitPrice: svc ? svc.final_price : it.unitPrice,
      }),
    }));
  };

  const updateItem = (idx: number, field: keyof FormItem, val: string | number) =>
    setForm(prev => ({ ...prev, items: prev.items.map((it, i) => i !== idx ? it : { ...it, [field]: val }) }));

  const totals = calcTotals(form);

  // ── Status change ──────────────────────────────────────────────────────────

  const handleStatusChange = async (inv: Invoice, status: Invoice['status']) => {
    if (!STATUS_CONFIG[status]) { console.warn('Unknown target status:', status); return; }
    if (status === inv.status) return;

    // → PAID: MUST record a payment, cannot just update status
    if (status === 'PAID') {
      if (inv.balance_amount > 0) {
        setSaving(true);
        try {
          await billingService.createPayment({
            invoice_id: inv.id,
            patient_id: inv.patient_id,
            amount: inv.balance_amount, // Pay full remaining balance
            payment_method: 'cash', // Or let user choose
            payment_date: new Date().toISOString(),
          });
          toast.success('Invoice marked as Paid — full payment recorded');
          fetchInvoices(); 
          fetchReport();
        } catch (err: any) {
          toast.error(err?.message ?? 'Failed to record payment');
        } finally {
          setSaving(false);
        }
      }
      return; // Status will auto-update to PAID after payment
    }

    // → PARTIALLY_PAID: open partial payment modal (existing logic)
    if (status === 'PARTIALLY_PAID') {
      setPartialTarget(inv);
      setPartialOpen(true);
      return;
    }

    // → Other transitions (PENDING, CANCELLED, etc.)
    setSaving(true);
    try {
      await billingService.updateInvoice(inv.id, { status }); // Now properly mapped
      toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handlePartialConfirm = async (amount: number, method: Payment['payment_method']) => {
    if (!partialTarget) return;
    setSaving(true);
    try {
      await billingService.createPayment({
        invoice_id: partialTarget.id,
        patient_id: partialTarget.patient_id,
        amount,
        payment_method: method,
        payment_date: new Date().toISOString(),
      });
      await billingService.updateInvoice(partialTarget.id, { status: 'PARTIALLY_PAID' } as any);
      toast.success(`Partial payment of ${fmt(amount)} recorded`);
      setPartialOpen(false);
      setPartialTarget(null);
      fetchInvoices(); fetchReport();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to record partial payment');
    } finally {
      setSaving(false);
    }
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!parseInt(form.patientId)) { toast.error('Please select a patient'); return; }
    const items = toApiItems(form.items);
    if (!items.length) { toast.error('Add at least one service'); return; }
    setSaving(true);
    try {
      await billingService.createInvoice({
        patient_id: parseInt(form.patientId),
        invoice_date: form.invoiceDate,
        due_date: form.dueDate || undefined,
        status: form.status,
        discount_amount: totals.discountAmt || undefined,
        tax_amount: totals.taxAmt || undefined,
        notes: form.notes || undefined,
        items,
      } as any);
      toast.success('Invoice created');
      setFormOpen(false); resetForm(); fetchInvoices(); fetchReport();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await billingService.updateInvoice(selected.id, {
        due_date: form.dueDate || undefined,
        discount_amount: totals.discountAmt,
        tax_amount: totals.taxAmt,
        notes: form.notes || undefined,
      });
      toast.success('Invoice updated');
      setFormOpen(false); resetForm(); fetchInvoices();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await billingService.deleteInvoice(selected.id);
      toast.success('Invoice deleted');
      setDeleteOpen(false); setSelected(null); fetchInvoices(); fetchReport();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selected) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await billingService.createPayment({
        invoice_id: selected.id, patient_id: selected.patient_id, amount,
        payment_method: payMethod, payment_date: new Date().toISOString(),
        reference_number: payRef || undefined,
      });
      toast.success('Payment recorded');
      setPayOpen(false); setPayAmount(''); setPayRef(''); fetchInvoices(); fetchReport();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    setSaving(true);
    try {
      await billingService.markInvoiceAsPaid(inv.id, 'cash');
      toast.success('Marked as paid'); fetchInvoices(); fetchReport();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const openView = async (inv: Invoice) => {
    setSaving(true);
    try { setSelected(await billingService.getInvoice(inv.id)); setViewOpen(true); }
    catch (err: any) { toast.error(err?.message ?? 'Failed to load invoice'); }
    finally { setSaving(false); }
  };

  const openEdit = async (inv: Invoice) => {
    setSaving(true);
    try {
      const full = await billingService.getInvoice(inv.id);
      setSelected(full);
      setForm({
        patientId: String(full.patient_id), invoiceDate: full.invoice_date,
        dueDate: full.due_date ?? '', status: full.status,
        discountValue: full.discount_amount ?? 0, discountMode: 'fixed',
        taxValue: full.tax_amount ?? 0, taxMode: 'fixed',
        notes: full.notes ?? '',
        items: (full.items ?? []).map(it => ({
          service_id: it.service_id ?? '', description: it.description,
          quantity: it.quantity, unitPrice: it.unit_price, discount: it.discount ?? 0,
        })),
      });
      setIsEditing(true); setFormOpen(true);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load invoice');
    } finally {
      setSaving(false);
    }
  };

  const openPay = (inv: Invoice) => { setSelected(inv); setPayAmount(String(inv.balance_amount)); setPayOpen(true); };

  const handlePrint = (inv: Invoice) => {
    const w = window.open('', '_blank');
    if (!w) return;
    const name = inv.patient
      ? `${inv.patient.first_name ?? ''} ${inv.patient.last_name ?? ''}`.trim()
      : `Patient #${inv.patient_id}`;
    w.document.write(`<html><head><title>${inv.invoice_number}</title>
      <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}
      th{background:#f5f5f5;font-size:12px}.right{text-align:right}</style></head><body>
      <div style="display:flex;justify-content:space-between;margin-bottom:32px">
        <div><h2 style="margin:0">Invoice</h2><p style="color:#666">${inv.invoice_number}</p></div>
        <div style="text-align:right;color:#666"><p>Date: ${inv.invoice_date}</p><p>Due: ${inv.due_date ?? '—'}</p></div>
      </div>
      <p><strong>Patient:</strong> ${name}</p>
      ${inv.items?.length ? `<table><thead><tr><th>Service</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead>
      <tbody>${inv.items.map(it => `<tr><td>${it.description}</td><td class="right">${it.quantity}</td><td class="right">${fmt(it.unit_price)}</td><td class="right">${fmt(it.total)}</td></tr>`).join('')}</tbody></table>` : ''}
      <div style="text-align:right;margin-top:16px;line-height:2">
        <div>Subtotal: ${fmt(inv.subtotal)}</div>
        ${inv.discount_amount ? `<div>Discount: -${fmt(inv.discount_amount)}</div>` : ''}
        ${inv.tax_amount ? `<div>Tax: ${fmt(inv.tax_amount)}</div>` : ''}
        <div style="font-size:20px;font-weight:bold;border-top:2px solid #333;padding-top:8px">Total: ${fmt(inv.total_amount)}</div>
        <div style="color:green">Paid: ${fmt(inv.paid_amount)}</div>
        <div style="color:${inv.balance_amount > 0 ? 'red' : 'green'};font-weight:bold">Balance: ${fmt(inv.balance_amount)}</div>
      </div>
      ${inv.notes ? `<p style="margin-top:24px;color:#666"><em>${inv.notes}</em></p>` : ''}
      </body></html>`);
    w.document.close();
    w.print();
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const name = inv.patient ? `${inv.patient.first_name ?? ''} ${inv.patient.last_name ?? ''}`.toLowerCase() : '';
    return inv.invoice_number.toLowerCase().includes(term) || name.includes(term);
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const patientName = (inv: Invoice) =>
    inv.patient ? `${inv.patient.first_name ?? ''} ${inv.patient.last_name ?? ''}`.trim() : `Patient #${inv.patient_id}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Invoices" subtitle="Create and manage patient invoices">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger-children">
        {[
          { label: 'Total Revenue', value: report?.total_revenue, color: 'text-emerald-600' },
          { label: 'Collected',     value: report?.total_paid,    color: 'text-blue-600' },
          { label: 'Pending',       value: report?.total_pending, color: 'text-amber-600' },
          { label: 'Overdue',       value: report?.total_overdue, color: 'text-red-600' },
        ].map(card => (
          <div key={card.label} className="card-elevated p-4 md:p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold font-display ${card.color}`}>
              {card.value != null ? fmt(card.value) : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by invoice # or patient…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} className="input-modern pl-11 w-full" />
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { fetchInvoices(); fetchReport(); }} title="Refresh">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className={`btn-ghost ${showFilters ? 'bg-muted' : ''}`} onClick={() => setShowFilters(v => !v)}>
              <Filter size={18} /><span className="hidden sm:inline">Filters</span>
            </button>
            <button className="btn-accent" onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus size={18} /><span>New Invoice</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {(['All', ...Object.keys(STATUS_CONFIG)] as (Invoice['status'] | 'All')[]).map(s => (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                  ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {s === 'All' ? 'All' : STATUS_CONFIG[s as Invoice['status']].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" /> Loading invoices…
          </div>
        ) : (
          <div className="overflow-x-auto **overflow-visible**">
            <table className="data-table min-w-[1000px] w-full border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th>Invoice #</th><th>Patient</th><th>Date</th><th>Due Date</th>
                  <th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(inv => {
                  if (!STATUS_CONFIG[inv.status]) console.warn('Unknown invoice status from API:', inv.status, inv.id);
                  const cfg = STATUS_CONFIG[inv.status] ?? { label: inv.status ?? 'Unknown', className: 'bg-gray-100 text-gray-600 border-gray-200', dotColor: 'bg-gray-400' };
                  return (
                    <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                      <td><span className="font-medium text-sm">{inv.invoice_number}</span></td>
                      <td><span className="text-sm">{patientName(inv)}</span></td>
                      <td><span className="text-sm text-muted-foreground">{inv.invoice_date}</span></td>
                      <td><span className="text-sm text-muted-foreground">{inv.due_date ?? '—'}</span></td>
                      <td><span className="font-semibold text-sm">{fmt(inv.total_amount)}</span></td>
                      <td><span className="text-sm text-emerald-600">{fmt(inv.paid_amount)}</span></td>
                      <td>
                        <span className={`font-semibold text-sm ${inv.balance_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {fmt(inv.balance_amount)}
                        </span>
                      </td>

                      {/* ── Status badge (read-only display) ── */}
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                          {cfg.label}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openView(inv)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View">
                            <Eye size={14} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                            <Edit size={14} className="text-muted-foreground" />
                          </button>
                          <button onClick={() => handlePrint(inv)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Print">
                            <Download size={14} className="text-muted-foreground" />
                          </button>

                          {/* ── Pill status changer ── */}
                          <StatusPill status={inv.status} onChange={s => handleStatusChange(inv, s)} disabled={saving} />

                          {inv.status === 'DRAFT' && (
                            <button onClick={() => toast.info(`Invoice ${inv.invoice_number} sent`)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Send">
                              <Send size={14} className="text-secondary" />
                            </button>
                          )}
                          {BILLABLE_STATUSES.includes(inv.status) && (
                            <>
                              <button onClick={() => handleMarkPaid(inv)} disabled={saving}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Mark fully paid">
                                <DollarSign size={14} className="text-emerald-600" />
                              </button>
                              <button onClick={() => openPay(inv)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Record payment">
                                <FileText size={14} className="text-blue-600" />
                              </button>
                            </>
                          )}
                          <button onClick={() => { setSelected(inv); setDeleteOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                            <Trash2 size={14} className="text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No invoices found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* ════ CREATE / EDIT MODAL ════ */}
      <Dialog open={formOpen} onOpenChange={open => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[92vh] p-0 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
            <DialogTitle className="text-xl font-semibold">{isEditing ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              {isEditing ? 'Update metadata. Services are locked after creation.' : 'Select a patient, add services, and configure tax & discount.'}
            </DialogDescription>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Patient & Dates */}
            <div className="px-6 py-5 border-b border-border/60 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient & Dates</p>
              <div className="space-y-2">
                <Label>Patient <span className="text-destructive">*</span></Label>
                {isEditing ? (
                  <div className="h-10 flex items-center px-3 border border-input rounded-md bg-muted text-sm text-muted-foreground">
                    {selected?.patient ? `${selected.patient.first_name ?? ''} ${selected.patient.last_name ?? ''}`.trim() : `Patient #${selected?.patient_id}`}
                  </div>
                ) : (
                  <PatientSelect value={form.patientId} onChange={id => setF({ patientId: id })} placeholder="Search or select patient…" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input type="date" value={form.invoiceDate} onChange={e => setF({ invoiceDate: e.target.value })} disabled={isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="date" value={form.dueDate} onChange={e => setF({ dueDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={e => setF({ status: e.target.value as Invoice['status'] })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {(isEditing ? allowedStatusesForEdit : allowedStatusesForCreate).map(s => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Services (create only) */}
            {!isEditing && (
              <div className="px-6 py-5 border-b border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Services {servicesLoading && <Loader2 size={12} className="inline ml-2 animate-spin" />}
                  </p>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }))}
                    className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
                    <Plus size={14} /> Add Service
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_64px_88px_80px_32px] gap-2">
                  {['Service', 'Qty', 'Unit Price', 'Disc.', ''].map(h => (
                    <span key={h} className="text-xs text-muted-foreground font-medium px-1">{h}</span>
                  ))}
                </div>
                <div className="space-y-3">
                  {form.items.map((item, idx) => {
                    const rowTotal = Math.max(0, item.quantity * item.unitPrice - item.discount);
                    return (
                      <div key={idx}>
                        <div className="grid grid-cols-[1fr_64px_88px_80px_32px] gap-2 items-start">
                          <div className="space-y-1.5">
                            <select value={item.service_id === '' ? '' : String(item.service_id)}
                              onChange={e => handleServiceSelect(idx, e.target.value)}
                              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                              <option value="">— Select service —</option>
                              {services.map(svc => (
                                <option key={svc.id} value={String(svc.id)}>{svc.name}{svc.code ? ` (${svc.code})` : ''}</option>
                              ))}
                            </select>
                            <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                              placeholder="Custom description (optional)" className="text-xs h-8 text-muted-foreground" />
                          </div>
                          <Input type="number" min={1} value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="h-10" />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" min={0} step={0.01} value={item.unitPrice}
                              onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="pl-6 h-10" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" min={0} step={0.01} value={item.discount}
                              onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)} className="pl-6 h-10" />
                          </div>
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}
                            disabled={form.items.length <= 1}
                            className="h-10 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-20 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-right text-xs text-muted-foreground mt-0.5 pr-10">= {fmt(rowTotal)}</p>
                      </div>
                    );
                  })}
                </div>
                {!servicesLoading && services.length === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    No active services found. You can still enter a custom description and price manually.
                  </p>
                )}
              </div>
            )}

            {/* Tax & Discount */}
            <div className="px-6 py-5 border-b border-border/60 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax & Discount</p>
              <div className="grid grid-cols-2 gap-4">
                <AmountInput label="Discount" value={form.discountValue} mode={form.discountMode}
                  onValue={v => setF({ discountValue: v })} onMode={m => setF({ discountMode: m })} />
                <AmountInput label="Tax" value={form.taxValue} mode={form.taxMode}
                  onValue={v => setF({ taxValue: v })} onMode={m => setF({ taxMode: m })} disabled={isEditing} />
              </div>
            </div>

            {/* Summary (create only) */}
            {!isEditing && (
              <div className="px-6 py-5 border-b border-border/60">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Summary</p>
                <div className="bg-muted/30 rounded-xl overflow-hidden divide-y divide-border/50">
                  <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                    <span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmt(totals.subtotal)}</span>
                  </div>
                  {totals.discountAmt > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Discount {form.discountMode === 'percent' && form.discountValue > 0 && <span className="ml-1 text-xs opacity-70">({form.discountValue}%)</span>}</span>
                      <span className="text-emerald-600 font-medium">−{fmt(totals.discountAmt)}</span>
                    </div>
                  )}
                  {totals.taxAmt > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Tax {form.taxMode === 'percent' && form.taxValue > 0 && <span className="ml-1 text-xs opacity-70">({form.taxValue}%)</span>}</span>
                      <span className="font-medium">+{fmt(totals.taxAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-4 py-3 bg-muted/40">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-bold text-xl text-primary">{fmt(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="px-6 py-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
              <Textarea value={form.notes} onChange={e => setF({ notes: e.target.value })}
                placeholder="Any additional notes for this invoice…" rows={3} />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex-shrink-0 flex justify-end gap-3 bg-muted/20">
            <button onClick={() => { setFormOpen(false); resetForm(); }} className="btn-ghost">Cancel</button>
            <button onClick={isEditing ? handleUpdate : handleCreate} className="btn-accent" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : isEditing ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ VIEW MODAL ════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice {selected?.invoice_number}</DialogTitle>
            <DialogDescription>Full details and payment history</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex-1 overflow-y-auto space-y-5 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{patientName(selected)}</p>
                  <p className="text-sm text-muted-foreground">{selected.invoice_number}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                  ${(STATUS_CONFIG[selected.status] ?? { className: 'bg-gray-100 text-gray-600 border-gray-200' }).className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${(STATUS_CONFIG[selected.status] ?? { dotColor: 'bg-gray-400' }).dotColor}`} />
                  {(STATUS_CONFIG[selected.status] ?? { label: selected.status }).label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Invoice Date</p><p className="font-medium">{selected.invoice_date}</p></div>
                <div><p className="text-muted-foreground">Due Date</p><p className="font-medium">{selected.due_date ?? '—'}</p></div>
              </div>
              {selected.items && selected.items.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/30">
                      <th className="p-3 text-left text-xs font-semibold">Service</th>
                      <th className="p-3 text-right text-xs font-semibold">Qty</th>
                      <th className="p-3 text-right text-xs font-semibold">Price</th>
                      <th className="p-3 text-right text-xs font-semibold">Total</th>
                    </tr></thead>
                    <tbody>
                      {selected.items.map((it, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-3">{it.description}</td>
                          <td className="p-3 text-right">{it.quantity}</td>
                          <td className="p-3 text-right">{fmt(it.unit_price)}</td>
                          <td className="p-3 text-right font-medium">{fmt(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
                {(selected.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{fmt(selected.discount_amount!)}</span></div>
                )}
                {(selected.tax_amount ?? 0) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>+{fmt(selected.tax_amount!)}</span></div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-border pt-2"><span>Total</span><span>{fmt(selected.total_amount)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{fmt(selected.paid_amount)}</span></div>
                <div className={`flex justify-between font-bold ${selected.balance_amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  <span>Balance</span><span>{fmt(selected.balance_amount)}</span>
                </div>
              </div>
              {selected.payments && selected.payments.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Payment History</p>
                  <div className="space-y-2">
                    {selected.payments.map(pay => (
                      <div key={pay.id} className="flex justify-between items-center text-sm p-2.5 bg-muted/30 rounded-lg">
                        <div>
                          <span className="capitalize font-medium">{pay.payment_method.replace(/_/g, ' ').toLowerCase()}</span>
                          {pay.reference_number && <span className="text-muted-foreground ml-2">· {pay.reference_number}</span>}
                          <p className="text-xs text-muted-foreground">{new Date(pay.payment_date).toLocaleDateString()}</p>
                        </div>
                        <span className="font-semibold text-emerald-600">{fmt(pay.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selected.notes && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selected.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-border">
            <button onClick={() => selected && handlePrint(selected)} className="btn-ghost"><Download size={16} /> Print</button>
            {selected && BILLABLE_STATUSES.includes(selected.status) && (
              <button onClick={() => { setViewOpen(false); openPay(selected); }} className="btn-accent">
                <DollarSign size={16} /> Record Payment
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ RECORD PAYMENT MODAL ════ */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>{selected?.invoice_number} · Balance {selected ? fmt(selected.balance_amount) : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min={0.01} step={0.01} value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value as Payment['payment_method'])} className="input-modern w-full">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reference / Transaction ID <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="REF-12345" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setPayOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleRecordPayment} className="btn-accent" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Record Payment'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ PARTIAL PAYMENT MODAL ════ */}
      <PartialPaymentModal
        open={partialOpen}
        invoice={partialTarget}
        saving={saving}
        onClose={() => { setPartialOpen(false); setPartialTarget(null); }}
        onConfirm={handlePartialConfirm}
      />

      {/* ════ DELETE CONFIRM ════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{selected?.invoice_number}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={saving}>
              {saving ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
};

export default Invoices;