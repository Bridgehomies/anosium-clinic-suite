import { useState } from 'react';
import { Plus, Search, Filter, Download, FileText, Clock, CheckCircle, XCircle, MoreHorizontal, Eye, Edit, Trash2, Send } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateInvoiceModal from '@/components/billing/CreateInvoiceModal';
import InvoiceDetailsModal from '@/components/billing/InvoiceDetailsModal';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  patient_name: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  items: any[];
  payments: any[];
}

const mockInvoices: Invoice[] = [
  {
    id: 1,
    invoice_number: 'INV-2024-001',
    patient_id: 1,
    patient_name: 'Sarah Johnson',
    invoice_date: '2024-01-15',
    due_date: '2024-02-15',
    subtotal: 450,
    discount_amount: 0,
    tax_amount: 45,
    total_amount: 495,
    paid_amount: 495,
    balance: 0,
    status: 'PAID',
    items: [],
    payments: [],
  },
  {
    id: 2,
    invoice_number: 'INV-2024-002',
    patient_id: 2,
    patient_name: 'Robert Williams',
    invoice_date: '2024-01-16',
    due_date: '2024-02-16',
    subtotal: 850,
    discount_amount: 50,
    tax_amount: 80,
    total_amount: 880,
    paid_amount: 500,
    balance: 380,
    status: 'PARTIALLY_PAID',
    items: [],
    payments: [],
  },
  {
    id: 3,
    invoice_number: 'INV-2024-003',
    patient_id: 3,
    patient_name: 'Maria Garcia',
    invoice_date: '2024-01-10',
    due_date: '2024-01-25',
    subtotal: 320,
    discount_amount: 0,
    tax_amount: 32,
    total_amount: 352,
    paid_amount: 0,
    balance: 352,
    status: 'OVERDUE',
    items: [],
    payments: [],
  },
  {
    id: 4,
    invoice_number: 'INV-2024-004',
    patient_id: 4,
    patient_name: 'David Brown',
    invoice_date: '2024-01-18',
    due_date: '2024-02-18',
    subtotal: 1200,
    discount_amount: 100,
    tax_amount: 110,
    total_amount: 1210,
    paid_amount: 0,
    balance: 1210,
    status: 'PENDING',
    items: [],
    payments: [],
  },
];

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleCreateInvoice = (invoiceData: any) => {
    const newInvoice: Invoice = {
      id: invoices.length + 1,
      invoice_number: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      patient_id: invoiceData.patient_id,
      patient_name: invoiceData.patient_name,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      subtotal: invoiceData.subtotal,
      discount_amount: invoiceData.discount_amount || 0,
      tax_amount: invoiceData.tax_amount || 0,
      total_amount: invoiceData.total_amount,
      paid_amount: 0,
      balance: invoiceData.total_amount,
      status: 'PENDING',
      items: invoiceData.items || [],
      payments: [],
    };
    setInvoices([...invoices, newInvoice]);
    toast({
      title: 'Invoice Created',
      description: `Invoice ${newInvoice.invoice_number} has been created successfully.`,
    });
  };

  const handleDeleteInvoice = () => {
    if (selectedInvoice) {
      setInvoices(invoices.filter((inv) => inv.id !== selectedInvoice.id));
      toast({
        title: 'Invoice Deleted',
        description: `Invoice ${selectedInvoice.invoice_number} has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    }
  };

  const confirmDelete = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteDialogOpen(true);
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle size={16} className="text-emerald-600" />;
      case 'PARTIALLY_PAID':
        return <Clock size={16} className="text-amber-600" />;
      case 'OVERDUE':
        return <XCircle size={16} className="text-red-600" />;
      case 'PENDING':
        return <Clock size={16} className="text-blue-600" />;
      case 'DRAFT':
        return <FileText size={16} className="text-slate-600" />;
      default:
        return <XCircle size={16} className="text-slate-600" />;
    }
  };

  const getStatusClass = (status: Invoice['status']) => {
    switch (status) {
      case 'PAID':
        return 'status-active';
      case 'PARTIALLY_PAID':
        return 'status-pending';
      case 'OVERDUE':
        return 'status-cancelled';
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'DRAFT':
        return 'status-inactive';
      default:
        return 'status-inactive';
    }
  };

  return (
    <DashboardLayout title="Invoices" subtitle="Manage patient invoices and billing">
      {/* Actions Bar */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-11 w-full"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              className={`btn-ghost flex-1 sm:flex-none ${showFilters ? 'bg-muted' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <button className="btn-accent flex-1 sm:flex-none" onClick={() => setCreateModalOpen(true)}>
              <Plus size={18} />
              <span>New Invoice</span>
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {['All', 'PAID', 'PARTIALLY_PAID', 'PENDING', 'OVERDUE', 'DRAFT'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-brand-navy text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {status === 'All' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Invoices Table */}
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
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-brand-teal flex-shrink-0" />
                      <span className="font-medium text-sm">{invoice.invoice_number}</span>
                    </div>
                  </td>
                  <td className="font-medium text-sm">{invoice.patient_name}</td>
                  <td className="text-sm text-muted-foreground">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </td>
                  <td className="font-semibold text-sm">${invoice.total_amount.toLocaleString()}</td>
                  <td className="text-sm text-emerald-600 font-medium">
                    ${invoice.paid_amount.toLocaleString()}
                  </td>
                  <td className="font-semibold text-sm">
                    <span className={invoice.balance > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                      ${invoice.balance.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(invoice.status)} flex items-center gap-1.5`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
                          <MoreHorizontal size={16} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50 bg-popover">
                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                          <Eye size={14} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download size={14} className="mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send size={14} className="mr-2" />
                          Send to Patient
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit size={14} className="mr-2" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => confirmDelete(invoice)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No invoices found matching your criteria.</p>
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreate={handleCreateInvoice}
      />

      <InvoiceDetailsModal
        invoice={selectedInvoice}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {selectedInvoice?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
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

export default Invoices;