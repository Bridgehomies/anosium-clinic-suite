import { useState } from 'react';
import { Download, FileText, Calendar, DollarSign, Users, Stethoscope, Building2, Printer, BarChart3, TrendingUp, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';

// Consolidated report data
const revenueByClinic = [
  { clinic: 'Downtown', jan: 152000, feb: 161000, mar: 158000, apr: 175000, may: 182000, jun: 198000 },
  { clinic: 'Westside', jan: 118000, feb: 125000, mar: 122000, apr: 132000, may: 138000, jun: 145000 },
  { clinic: 'Northpark', jan: 92000, feb: 98000, mar: 95000, apr: 101000, may: 108000, jun: 113000 },
  { clinic: 'Eastview', jan: 71000, feb: 75000, mar: 78000, apr: 82000, may: 85000, jun: 90000 },
];

const consolidatedSummary = {
  totalRevenue: 546020,
  totalExpenses: 312400,
  netProfit: 233620,
  profitMargin: 42.8,
  totalPatients: 3300,
  newPatients: 420,
  totalAppointments: 8500,
  completionRate: 91.2,
  avgRevenuePerPatient: 165.5,
  collectionRate: 87.4,
  outstandingAmount: 68900,
  topService: 'Consultations',
};

const monthlyConsolidated = [
  { month: 'Jan', revenue: 433000, expenses: 248000, profit: 185000 },
  { month: 'Feb', revenue: 459000, expenses: 255000, profit: 204000 },
  { month: 'Mar', revenue: 453000, expenses: 252000, profit: 201000 },
  { month: 'Apr', revenue: 490000, expenses: 268000, profit: 222000 },
  { month: 'May', revenue: 513000, expenses: 278000, profit: 235000 },
  { month: 'Jun', revenue: 546000, expenses: 312000, profit: 234000 },
];

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'financial' | 'clinical' | 'operational';
}

const reportTemplates: ReportTemplate[] = [
  { id: 'revenue', title: 'Revenue Report', description: 'Comprehensive revenue analysis by clinic, service, and period', icon: DollarSign, category: 'financial' },
  { id: 'expenses', title: 'Expense Report', description: 'Detailed breakdown of operational expenses across clinics', icon: TrendingUp, category: 'financial' },
  { id: 'collection', title: 'Collection Report', description: 'Payment collection rates, outstanding amounts, and aging', icon: BarChart3, category: 'financial' },
  { id: 'patient', title: 'Patient Report', description: 'Patient demographics, growth trends, and retention rates', icon: Users, category: 'clinical' },
  { id: 'appointment', title: 'Appointment Report', description: 'Appointment volumes, completion rates, and scheduling', icon: Calendar, category: 'clinical' },
  { id: 'doctor', title: 'Doctor Performance', description: 'Doctor productivity, patient ratings, and revenue generated', icon: Stethoscope, category: 'operational' },
  { id: 'clinic', title: 'Clinic Comparison', description: 'Side-by-side clinic performance with key metrics', icon: Building2, category: 'operational' },
];

const Reports = () => {
  const [dateRange, setDateRange] = useState('6months');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-06-30');
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCustomRange, setShowCustomRange] = useState(false);

  const filteredTemplates = reportTemplates.filter(t => filterCategory === 'all' || t.category === filterCategory);

  const handleGenerateReport = (template: ReportTemplate) => {
    toast.success(`Generating ${template.title}...`);
    setTimeout(() => {
      handleExportReport(template);
    }, 1000);
  };

  const handleExportReport = (template: ReportTemplate) => {
    let csv = '';

    switch (template.id) {
      case 'revenue':
        csv = 'Clinic,Jan,Feb,Mar,Apr,May,Jun\n' + revenueByClinic.map(r => `${r.clinic},$${r.jan},$${r.feb},$${r.mar},$${r.apr},$${r.may},$${r.jun}`).join('\n');
        break;
      case 'expenses':
        csv = 'Month,Revenue,Expenses,Profit\n' + monthlyConsolidated.map(m => `${m.month},$${m.revenue},$${m.expenses},$${m.profit}`).join('\n');
        break;
      case 'collection':
        csv = `Collection Report\nTotal Revenue,$${consolidatedSummary.totalRevenue}\nCollection Rate,${consolidatedSummary.collectionRate}%\nOutstanding,$${consolidatedSummary.outstandingAmount}`;
        break;
      case 'patient':
        csv = `Patient Report\nTotal Patients,${consolidatedSummary.totalPatients}\nNew Patients,${consolidatedSummary.newPatients}\nAvg Revenue Per Patient,$${consolidatedSummary.avgRevenuePerPatient}`;
        break;
      case 'appointment':
        csv = `Appointment Report\nTotal Appointments,${consolidatedSummary.totalAppointments}\nCompletion Rate,${consolidatedSummary.completionRate}%`;
        break;
      default:
        csv = 'Report data not available';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.id}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${template.title} exported successfully`);
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Consolidated Report - AnosiumAI</title>
      <style>body{font-family:system-ui;max-width:900px;margin:40px auto;padding:0 20px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}th{background:#f5f5f5;font-size:12px;text-transform:uppercase}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0}.card{padding:20px;border:1px solid #eee;border-radius:8px}h1{color:#36406D}h2{color:#59C4C1;margin-top:30px}</style></head><body>
      <h1>AnosiumAI - Consolidated Report</h1>
      <p>Period: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleDateString()}</p>
      <h2>Financial Summary</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Total Revenue</p><p style="font-size:24px;font-weight:bold">$${consolidatedSummary.totalRevenue.toLocaleString()}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Net Profit</p><p style="font-size:24px;font-weight:bold">$${consolidatedSummary.netProfit.toLocaleString()}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Profit Margin</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.profitMargin}%</p></div>
      </div>
      <h2>Revenue by Clinic</h2>
      <table><thead><tr><th>Clinic</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Jun</th></tr></thead><tbody>
      ${revenueByClinic.map(r => `<tr><td>${r.clinic}</td><td>$${(r.jan / 1000).toFixed(0)}K</td><td>$${(r.feb / 1000).toFixed(0)}K</td><td>$${(r.mar / 1000).toFixed(0)}K</td><td>$${(r.apr / 1000).toFixed(0)}K</td><td>$${(r.may / 1000).toFixed(0)}K</td><td>$${(r.jun / 1000).toFixed(0)}K</td></tr>`).join('')}
      </tbody></table>
      <h2>Operational Metrics</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Total Patients</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.totalPatients.toLocaleString()}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Appointments</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.totalAppointments.toLocaleString()}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Completion Rate</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.completionRate}%</p></div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <DashboardLayout title="Consolidated Reports" subtitle="Multi-clinic reporting and data export">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-up">
        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setShowCustomRange(v === 'custom'); }}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last Quarter</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedClinic} onValueChange={setSelectedClinic}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent className="z-[100] bg-popover">
            <SelectItem value="all">All Clinics</SelectItem>
            <SelectItem value="downtown">Downtown Clinic</SelectItem>
            <SelectItem value="westside">Westside Medical</SelectItem>
            <SelectItem value="northpark">Northpark Health</SelectItem>
            <SelectItem value="eastview">Eastview Center</SelectItem>
          </SelectContent>
        </Select>
        {showCustomRange && (
          <div className="flex gap-2">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        )}
        <button onClick={handlePrintReport} className="btn-primary ml-auto">
          <Printer size={18} /><span className="hidden sm:inline">Print Report</span>
        </button>
      </div>

      {/* Consolidated Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 stagger-children">
        {[
          { label: 'Revenue', value: `$${(consolidatedSummary.totalRevenue / 1000).toFixed(0)}K`, color: 'text-emerald-600' },
          { label: 'Expenses', value: `$${(consolidatedSummary.totalExpenses / 1000).toFixed(0)}K`, color: 'text-amber-600' },
          { label: 'Net Profit', value: `$${(consolidatedSummary.netProfit / 1000).toFixed(0)}K`, color: 'text-emerald-600' },
          { label: 'Margin', value: `${consolidatedSummary.profitMargin}%`, color: 'text-secondary' },
          { label: 'Patients', value: consolidatedSummary.totalPatients.toLocaleString(), color: 'text-primary' },
          { label: 'Collection', value: `${consolidatedSummary.collectionRate}%`, color: 'text-secondary' },
        ].map((metric) => (
          <div key={metric.label} className="card-elevated p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className={cn('text-xl font-bold font-display', metric.color)}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Revenue & Profit Trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Consolidated monthly performance</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyConsolidated}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="revenue" stroke="#36406D" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Profit" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Revenue by Clinic</h3>
          <p className="text-sm text-muted-foreground mb-4">June comparison</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByClinic} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <YAxis dataKey="clinic" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={85} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Bar dataKey="jun" fill="#36406D" radius={[0, 6, 6, 0]} maxBarSize={32} name="June Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">Report Templates</h3>
          <div className="flex gap-2">
            {['all', 'financial', 'clinical', 'operational'].map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize', filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="card-elevated p-5 group">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                  <template.icon size={20} className="text-primary group-hover:text-secondary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{template.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleGenerateReport(template)} className="flex-1 btn-accent py-2 text-xs">
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
