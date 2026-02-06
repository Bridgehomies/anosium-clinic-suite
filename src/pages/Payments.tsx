import { useState } from 'react';
import { Search, Filter, Download, DollarSign, CreditCard, Banknote, Smartphone, MoreHorizontal, Eye, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PaymentCollectionModal from '@/components/payments/PaymentCollectionModal';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Payment {
  id: number;
  payment_number: string;
  invoice_number: string;
  patient_name: string;
  amount: number;
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'ONLINE' | 'OTHER';
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_by: string;
}

const mockPayments: Payment[] = [
  {
    id: 1,
    payment_number: 'PAY-2024-001',
    invoice_number: 'INV-2024-001',
    patient_name: 'Sarah Johnson',
    amount: 495,
    payment_method: 'CARD',
    payment_date: '2024-01-15',
    reference_number: 'TXN123456',
    created_by: 'Admin User',
  },
  {
    id: 2,
    payment_number: 'PAY-2024-002',
    invoice_number: 'INV-2024-002',
    patient_name: 'Robert Williams',
    amount: 500,
    payment_method: 'CASH',
    payment_date: '2024-01-16',
    created_by: 'Receptionist',
  },
  {
    id: 3,
    payment_number: 'PAY-2024-003',
    invoice_number: 'INV-2024-004',
    patient_name: 'Emily Chen',
    amount: 1000,
    payment_method: 'BANK_TRANSFER',
    payment_date: '2024-01-18',
    reference_number: 'REF987654',
    created_by: 'Admin User',
  },
  {
    id: 4,
    payment_number: 'PAY-2024-004',
    invoice_number: 'INV-2024-005',
    patient_name: 'David Brown',
    amount: 750,
    payment_method: 'INSURANCE',
    payment_date: '2024-01-20',
    reference_number: 'INS456789',
    notes: 'Partially covered by insurance',
    created_by: 'Admin User',
  },
];

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMethod === 'All' || payment.payment_method === filterMethod;
    return matchesSearch && matchesFilter;
  });

  const getPaymentMethodIcon = (method: Payment['payment_method']) => {
    switch (method) {
      case 'CASH':
        return <Banknote size={16} className="text-emerald-600" />;
      case 'CARD':
        return <CreditCard size={16} className="text-blue-600" />;
      case 'BANK_TRANSFER':
        return <DollarSign size={16} className="text-purple-600" />;
      case 'INSURANCE':
        return <FileText size={16} className="text-amber-600" />;
      case 'ONLINE':
        return <Smartphone size={16} className="text-teal-600" />;
      default:
        return <DollarSign size={16} className="text-slate-600" />;
    }
  };

  const getPaymentMethodColor = (method: Payment['payment_method']) => {
    switch (method) {
      case 'CASH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CARD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BANK_TRANSFER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INSURANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ONLINE':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <DashboardLayout title="Payments" subtitle="Track and manage payment transactions">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 stagger-children">
        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold font-display text-foreground">
                ${totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 font-medium">+12.5% vs last month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
              <DollarSign size={22} className="text-white" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
              <p className="text-3xl font-bold font-display text-foreground">
                {filteredPayments.length}
              </p>
              <p className="text-xs text-blue-600 font-medium">This month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <CreditCard size={22} className="text-white" />
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average Payment</p>
              <p className="text-3xl font-bold font-display text-foreground">
                ${Math.round(totalRevenue / (filteredPayments.length || 1)).toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 font-medium">Per transaction</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <Banknote size={22} className="text-white" />
            </div>
          </div>
        </div>
      </div>

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
              placeholder="Search payments..."
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
            <button className="btn-accent flex-1 sm:flex-none">
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-up">
            {['All', 'CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'ONLINE'].map((method) => (
              <button
                key={method}
                onClick={() => setFilterMethod(method)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  filterMethod === method
                    ? 'bg-brand-navy text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {method === 'All' ? 'All' : method.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-emerald-600 flex-shrink-0" />
                      <span className="font-medium text-sm">{payment.payment_number}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-brand-teal font-medium hover:underline cursor-pointer">
                      {payment.invoice_number}
                    </span>
                  </td>
                  <td className="font-medium text-sm">{payment.patient_name}</td>
                  <td className="font-bold text-sm text-emerald-600">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td>
                    <span className={`status-badge border ${getPaymentMethodColor(payment.payment_method)} flex items-center gap-1.5`}>
                      {getPaymentMethodIcon(payment.payment_method)}
                      {payment.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="text-sm text-muted-foreground font-mono">
                    {payment.reference_number || '-'}
                  </td>
                  <td className="text-sm text-muted-foreground">{payment.created_by}</td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors">
                          <MoreHorizontal size={16} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50 bg-popover">
                        <DropdownMenuItem>
                          <Eye size={14} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download size={14} className="mr-2" />
                          Download Receipt
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

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No payments found matching your criteria.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Payments;