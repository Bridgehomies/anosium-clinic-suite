import { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Download, Send, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  patient: string;
  patientEmail: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string;
}

const initialInvoices: Invoice[] = [
  {
    id: 1, invoiceNumber: 'INV-2024-001', patient: 'Sarah Johnson', patientEmail: 'sarah@email.com',
    invoiceDate: '2024-01-15', dueDate: '2024-02-15', 
    items: [{ description: 'General Consultation', quantity: 1, unitPrice: 150, discount: 0, total: 150 }, { description: 'Blood Test', quantity: 1, unitPrice: 80, discount: 0, total: 80 }],
    subtotal: 230, taxAmount: 23, discountAmount: 0, totalAmount: 253, paidAmount: 253, balance: 0, status: 'PAID', notes: '',
  },
  {
    id: 2, invoiceNumber: 'INV-2024-002', patient: 'Robert Williams', patientEmail: 'robert@email.com',
    invoiceDate: '2024-01-18', dueDate: '2024-02-18',
    items: [{ description: 'Specialist Visit', quantity: 1, unitPrice: 300, discount: 0, total: 300 }],
    subtotal: 300, taxAmount: 30, discountAmount: 0, totalAmount: 330, paidAmount: 100, balance: 230, status: 'PARTIALLY_PAID', notes: 'Patient requested payment plan',
  },
  {
    id: 3, invoiceNumber: 'INV-2024-003', patient: 'Maria Garcia', patientEmail: 'maria@email.com',
    invoiceDate: '2024-01-20', dueDate: '2024-01-30',
    items: [{ description: 'X-Ray', quantity: 2, unitPrice: 120, discount: 10, total: 230 }, { description: 'Consultation', quantity: 1, unitPrice: 150, discount: 0, total: 150 }],
    subtotal: 380, taxAmount: 38, discountAmount: 10, totalAmount: 408, paidAmount: 0, balance: 408, status: 'OVERDUE', notes: '',
  },
  {
    id: 4, invoiceNumber: 'INV-2024-004', patient: 'David Brown', patientEmail: 'david@email.com',
    invoiceDate: '2024-01-22', dueDate: '2024-02-22',
    items: [{ description: 'Surgery Prep', quantity: 1, unitPrice: 500, discount: 0, total: 500 }],
    subtotal: 500, taxAmount: 50, discountAmount: 0, totalAmount: 550, paidAmount: 0, balance: 550, status: 'PENDING', notes: 'Insurance pre-approval pending',
  },
  {
    id: 5, invoiceNumber: 'INV-2024-005', patient: 'Emily Chen', patientEmail: 'emily@email.com',
    invoiceDate: '2024-01-25', dueDate: '2024-02-25',
    items: [{ description: 'Lab Results Review', quantity: 1, unitPrice: 75, discount: 0, total: 75 }],
    subtotal: 75, taxAmount: 7.5, discountAmount: 0, totalAmount: 82.5, paidAmount: 0, balance: 82.5, status: 'DRAFT', notes: '',
  },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PARTIALLY_PAID: { label: 'Partial', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  OVERDUE: { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Create/Edit form state
  const [form, setForm] = useState({
    patient: '', patientEmail: '', dueDate: '', notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }] as InvoiceItem[],
    taxRate: 10,
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.patient.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || inv.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices.filter(i => ['PENDING', 'PARTIALLY_PAID'].includes(i.status)).reduce((s, i) => s + i.balance, 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.balance, 0);

  const resetForm = () => {
    setForm({ patient: '', patientEmail: '', dueDate: '', notes: '', items: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }], taxRate: 10 });
    setIsEditing(false);
  };

  const updateItemTotal = (index: number, items: InvoiceItem[]) => {
    const item = items[index];
    item.total = (item.quantity * item.unitPrice) - item.discount;
    return [...items];
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }] });
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const calcSubtotal = () => form.items.reduce((s, i) => s + i.total, 0);
  const calcTax = () => calcSubtotal() * (form.taxRate / 100);
  const calcTotal = () => calcSubtotal() + calcTax();

  const handleCreate = () => {
    const subtotal = calcSubtotal();
    const tax = calcTax();
    const total = calcTotal();
    const newInvoice: Invoice = {
      id: Date.now(), invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      patient: form.patient, patientEmail: form.patientEmail,
      invoiceDate: new Date().toISOString().split('T')[0], dueDate: form.dueDate,
      items: form.items, subtotal, taxAmount: tax, discountAmount: form.items.reduce((s, i) => s + i.discount, 0),
      totalAmount: total, paidAmount: 0, balance: total, status: 'DRAFT', notes: form.notes,
    };
    setInvoices([newInvoice, ...invoices]);
    setCreateModalOpen(false);
    resetForm();
    toast.success('Invoice created successfully');
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setForm({
      patient: invoice.patient, patientEmail: invoice.patientEmail, dueDate: invoice.dueDate,
      notes: invoice.notes, items: invoice.items, taxRate: 10,
    });
    setIsEditing(true);
    setCreateModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedInvoice) return;
    const subtotal = calcSubtotal();
    const tax = calcTax();
    const total = calcTotal();
    setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? {
      ...inv, patient: form.patient, patientEmail: form.patientEmail, dueDate: form.dueDate,
      items: form.items, subtotal, taxAmount: tax, discountAmount: form.items.reduce((s, i) => s + i.discount, 0),
      totalAmount: total, balance: total - inv.paidAmount, notes: form.notes,
    } : inv));
    setCreateModalOpen(false);
    resetForm();
    toast.success('Invoice updated successfully');
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    setInvoices(invoices.filter(i => i.id !== selectedInvoice.id));
    setDeleteDialogOpen(false);
    toast.success('Invoice deleted');
  };

  const handleSendInvoice = (invoice: Invoice) => {
    setInvoices(invoices.map(inv => inv.id === invoice.id ? { ...inv, status: 'PENDING' as const } : inv));
    toast.success(`Invoice sent to ${invoice.patientEmail}`);
  };

  const handleMarkPaid = (invoice: Invoice) => {
    setInvoices(invoices.map(inv => inv.id === invoice.id ? { ...inv, status: 'PAID' as const, paidAmount: inv.totalAmount, balance: 0 } : inv));
    toast.success('Invoice marked as paid');
  };

  const handlePrint = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${invoice.invoiceNumber}</title>
      <style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}th{background:#f5f5f5}
      .header{display:flex;justify-content:space-between;margin-bottom:30px}.total{text-align:right;font-size:24px;font-weight:bold;margin-top:20px}</style></head><body>
      <div class="header"><div><h1>AnosiumAI Clinic</h1><p>Invoice: ${invoice.invoiceNumber}</p></div><div style="text-align:right"><p>Date: ${invoice.invoiceDate}</p><p>Due: ${invoice.dueDate}</p></div></div>
      <p><strong>Patient:</strong> ${invoice.patient}</p>
      <table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr></thead><tbody>
      ${invoice.items.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>$${i.unitPrice.toFixed(2)}</td><td>$${i.discount.toFixed(2)}</td><td>$${i.total.toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <div style="text-align:right"><p>Subtotal: $${invoice.subtotal.toFixed(2)}</p><p>Tax: $${invoice.taxAmount.toFixed(2)}</p><p>Discount: -$${invoice.discountAmount.toFixed(2)}</p>
      <div class="total">Total: $${invoice.totalAmount.toFixed(2)}</div><p>Paid: $${invoice.paidAmount.toFixed(2)}</p><p style="color:${invoice.balance > 0 ? 'red' : 'green'}"><strong>Balance: $${invoice.balance.toFixed(2)}</strong></p></div>
      ${invoice.notes ? `<p style="margin-top:20px;color:#666"><em>Notes: ${invoice.notes}</em></p>` : ''}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <DashboardLayout title="Invoices" subtitle="Create and manage patient invoices">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger-children">
        <div className="card-elevated p-4 md:p-5">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold font-display text-emerald-600">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card-elevated p-4 md:p-5">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold font-display text-amber-600">${totalPending.toLocaleString()}</p>
        </div>
        <div className="card-elevated p-4 md:p-5">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold font-display text-red-600">${totalOverdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-modern pl-11 w-full" />
          </div>
          <div className="flex gap-2">
            <button className={`btn-ghost flex-1 sm:flex-none ${showFilters ? 'bg-muted' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={18} /><span className="hidden sm:inline">Filters</span>
            </button>
            <button className="btn-accent flex-1 sm:flex-none" onClick={() => { resetForm(); setCreateModalOpen(true); }}>
              <Plus size={18} /><span>New Invoice</span>
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {['All', 'DRAFT', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterStatus === status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {status === 'All' ? 'All' : statusConfig[status]?.label || status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><span className="font-medium text-sm">{invoice.invoiceNumber}</span></td>
                  <td><span className="text-sm">{invoice.patient}</span></td>
                  <td><span className="text-sm text-muted-foreground">{invoice.invoiceDate}</span></td>
                  <td><span className="text-sm text-muted-foreground">{invoice.dueDate}</span></td>
                  <td><span className="font-semibold text-sm">${invoice.totalAmount.toFixed(2)}</span></td>
                  <td><span className="text-sm text-emerald-600">${invoice.paidAmount.toFixed(2)}</span></td>
                  <td><span className={`font-semibold text-sm ${invoice.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>${invoice.balance.toFixed(2)}</span></td>
                  <td><span className={`status-badge border ${statusConfig[invoice.status]?.className}`}>{statusConfig[invoice.status]?.label}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedInvoice(invoice); setViewModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="View">
                        <Eye size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => handleEdit(invoice)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Edit">
                        <Edit size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => handlePrint(invoice)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Print">
                        <Download size={14} className="text-muted-foreground" />
                      </button>
                      {invoice.status === 'DRAFT' && (
                        <button onClick={() => handleSendInvoice(invoice)} className="p-1.5 rounded-lg hover:bg-secondary/10 transition-colors" title="Send">
                          <Send size={14} className="text-secondary" />
                        </button>
                      )}
                      {['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(invoice.status) && (
                        <button onClick={() => handleMarkPaid(invoice)} className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="Mark Paid">
                          <DollarSign size={14} className="text-emerald-600" />
                        </button>
                      )}
                      <button onClick={() => { setSelectedInvoice(invoice); setDeleteDialogOpen(true); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No invoices found</p>
        </div>
      )}

      {/* Create/Edit Invoice Modal */}
      <Dialog open={createModalOpen} onOpenChange={(open) => { setCreateModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogDescription>{isEditing ? 'Update invoice details' : 'Add items and generate a new invoice'}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} placeholder="Patient name" />
              </div>
              <div className="space-y-2">
                <Label>Patient Email</Label>
                <Input type="email" value={form.patientEmail} onChange={(e) => setForm({ ...form, patientEmail: e.target.value })} placeholder="patient@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Line Items</Label>
                <button onClick={addItem} className="text-sm text-secondary hover:text-secondary/80 font-medium">+ Add Item</button>
              </div>
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_60px_80px_70px_80px_30px] gap-2 items-end">
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs">Description</Label>}
                      <Input value={item.description} onChange={(e) => { const items = [...form.items]; items[index].description = e.target.value; setForm({ ...form, items }); }} placeholder="Service" />
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs">Qty</Label>}
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => { const items = [...form.items]; items[index].quantity = parseInt(e.target.value) || 1; setForm({ ...form, items: updateItemTotal(index, items) }); }} />
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs">Price</Label>}
                      <Input type="number" min={0} value={item.unitPrice} onChange={(e) => { const items = [...form.items]; items[index].unitPrice = parseFloat(e.target.value) || 0; setForm({ ...form, items: updateItemTotal(index, items) }); }} />
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs">Disc.</Label>}
                      <Input type="number" min={0} value={item.discount} onChange={(e) => { const items = [...form.items]; items[index].discount = parseFloat(e.target.value) || 0; setForm({ ...form, items: updateItemTotal(index, items) }); }} />
                    </div>
                    <div className="space-y-1">
                      {index === 0 && <Label className="text-xs">Total</Label>}
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">${item.total.toFixed(2)}</div>
                    </div>
                    <button onClick={() => removeItem(index)} className="h-10 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md" disabled={form.items.length <= 1}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${calcSubtotal().toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({form.taxRate}%)</span><span className="font-medium">${calcTax().toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span>Total</span><span>${calcTotal().toFixed(2)}</span></div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-border">
            <button onClick={() => { setCreateModalOpen(false); resetForm(); }} className="btn-ghost">Cancel</button>
            <button onClick={isEditing ? handleUpdate : handleCreate} className="btn-accent" disabled={!form.patient || form.items.every(i => !i.description)}>
              {isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>Invoice details and line items</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{selectedInvoice.patient}</p>
                  <p className="text-sm text-muted-foreground">{selectedInvoice.patientEmail}</p>
                </div>
                <Badge className={`${statusConfig[selectedInvoice.status]?.className} border`}>{statusConfig[selectedInvoice.status]?.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Invoice Date</p><p className="font-medium">{selectedInvoice.invoiceDate}</p></div>
                <div><p className="text-muted-foreground">Due Date</p><p className="font-medium">{selectedInvoice.dueDate}</p></div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/30"><th className="p-3 text-left text-xs font-semibold">Item</th><th className="p-3 text-right text-xs font-semibold">Qty</th><th className="p-3 text-right text-xs font-semibold">Price</th><th className="p-3 text-right text-xs font-semibold">Total</th></tr></thead>
                  <tbody>
                    {selectedInvoice.items.map((item, i) => (
                      <tr key={i} className="border-t border-border"><td className="p-3">{item.description}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td><td className="p-3 text-right font-medium">${item.total.toFixed(2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${selectedInvoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${selectedInvoice.taxAmount.toFixed(2)}</span></div>
                {selectedInvoice.discountAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-emerald-600">-${selectedInvoice.discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t border-border pt-2"><span>Total</span><span>${selectedInvoice.totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>Paid</span><span>${selectedInvoice.paidAmount.toFixed(2)}</span></div>
                <div className={`flex justify-between font-bold ${selectedInvoice.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}><span>Balance</span><span>${selectedInvoice.balance.toFixed(2)}</span></div>
              </div>
              {selectedInvoice.notes && <div className="p-3 bg-muted/30 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{selectedInvoice.notes}</p></div>}
            </div>
          )}
          <DialogFooter className="flex-shrink-0 gap-2 pt-4 border-t border-border">
            <button onClick={() => selectedInvoice && handlePrint(selectedInvoice)} className="btn-ghost"><Download size={16} /> Print</button>
            {selectedInvoice && ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(selectedInvoice.status) && (
              <button onClick={() => { if (selectedInvoice) handleMarkPaid(selectedInvoice); setViewModalOpen(false); }} className="btn-accent"><DollarSign size={16} /> Mark Paid</button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Invoices;
