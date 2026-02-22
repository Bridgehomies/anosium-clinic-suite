import { TrendingUp, Building2, Download, Printer, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EmptyState } from '../components/SharedUI';
import { centsToK, centsToDisplay, CHART_COLORS, REPORT_TEMPLATES } from '../utils/superAdmin.utils';
import { ClinicStats, ConsolidatedSummary, ReportTemplate } from '../types/superAdmin.types';

interface FinancialTabProps {
  consolidatedSummary: ConsolidatedSummary;
  clinics: ClinicStats[];
  monthlyConsolidated: any[];
  revenueByClinic: { clinic: string; revenue: number }[];
  financialLoading: boolean;
  financialDateRange: string;
  financialReportFilter: string;
  reportStartDate: string;
  reportEndDate: string;
  onDateRangeChange: (range: string) => void;
  onReportFilterChange: (filter: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onGenerateReport: (template: ReportTemplate) => void;
  onPrintReport: () => void;
}

const axisProps = {
  axisLine: false as const,
  tickLine: false as const,
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
};
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
  },
};

const SUMMARY_METRICS = (s: ConsolidatedSummary) => [
  { label: 'Total Revenue',   value: centsToK(s.totalRevenue),              color: 'text-emerald-600' },
  { label: 'Total Collected', value: centsToK(s.totalCollected),            color: 'text-emerald-600' },
  { label: 'Outstanding',     value: centsToK(s.outstandingAmount),         color: 'text-amber-600' },
  { label: 'Profit Margin',   value: `${s.profitMargin.toFixed(1)}%`,       color: 'text-brand-teal' },
  { label: 'Total Patients',  value: s.totalPatients.toLocaleString(),      color: 'text-brand-navy' },
  { label: 'Collection Rate', value: `${s.collectionRate.toFixed(1)}%`,     color: 'text-brand-teal' },
];

export const FinancialTab = ({
  consolidatedSummary,
  clinics,
  monthlyConsolidated,
  revenueByClinic,
  financialLoading,
  financialDateRange,
  financialReportFilter,
  reportStartDate,
  reportEndDate,
  onDateRangeChange,
  onReportFilterChange,
  onStartDateChange,
  onEndDateChange,
  onGenerateReport,
  onPrintReport,
}: FinancialTabProps) => {
  const filteredTemplates = REPORT_TEMPLATES.filter(
    t => financialReportFilter === 'all' || t.category === financialReportFilter
  );

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={financialDateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last Quarter</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input type="date" value={reportStartDate} onChange={e => onStartDateChange(e.target.value)} className="w-40" />
          <Input type="date" value={reportEndDate}   onChange={e => onEndDateChange(e.target.value)}   className="w-40" />
        </div>
        <button
          onClick={onPrintReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors ml-auto"
        >
          <Printer size={16} /> Print Network Report
        </button>
      </div>

      {/* KPI cards */}
      {financialLoading ? (
        <div className="flex items-center justify-center h-16">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SUMMARY_METRICS(consolidatedSummary).map(m => (
            <div key={m.label} className="card-elevated p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className={cn('text-xl font-bold font-display', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & profit trend */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Revenue &amp; Profit Trend</h3>
          <p className="text-sm text-muted-foreground mb-4">Consolidated monthly performance</p>
          <div className="h-64">
            {monthlyConsolidated.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No Trend Data" description="Monthly trend data will appear once transactions are recorded." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyConsolidated}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                  <Line type="monotone" dataKey="revenue"  stroke="#36406D" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Est. Expenses" />
                  <Line type="monotone" dataKey="profit"   stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Est. Profit" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Revenue by clinic */}
        <div className="card-elevated p-6">
          <h3 className="font-display font-semibold text-lg mb-1">Revenue by Clinic</h3>
          <p className="text-sm text-muted-foreground mb-4">Current month revenue per active clinic</p>
          <div className="h-64">
            {revenueByClinic.length === 0 ? (
              <EmptyState icon={Building2} title="No Clinic Data" description="Clinic revenue data will appear here once available." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByClinic} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="clinic" type="category" {...axisProps} width={100} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#36406D" radius={[0, 6, 6, 0]} maxBarSize={32} name="Monthly Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Clinic performance table */}
      <ClinicPerformanceTable clinics={clinics} />

      {/* Export reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">Export Reports</h3>
          <div className="flex gap-2">
            {['all', 'financial', 'clinical', 'operational'].map(cat => (
              <button
                key={cat}
                onClick={() => onReportFilterChange(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize',
                  financialReportFilter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <ReportCard key={template.id} template={template} onGenerate={onGenerateReport} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Clinic Performance Table ─────────────────────────────────────────────────

const ClinicPerformanceTable = ({ clinics }: { clinics: ClinicStats[] }) => (
  <div className="card-elevated p-6">
    <h3 className="font-display font-semibold text-lg mb-4">Clinic Performance Overview</h3>
    {clinics.length === 0 ? (
      <EmptyState icon={Building2} title="No Clinic Data" description="Clinic data will appear here once clinics are registered." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Clinic', 'Status', 'Patients', 'Doctors', 'Users', 'Monthly Revenue'].map(h => (
                <th key={h} className={cn('py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide', h === 'Clinic' ? 'text-left' : 'text-right')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clinics.map((row, i) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="font-medium">{row.name}</span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600')}>
                    {row.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 text-right text-muted-foreground">{(row.total_patients ?? 0).toLocaleString()}</td>
                <td className="py-3 text-right text-muted-foreground">{row.total_doctors ?? 0}</td>
                <td className="py-3 text-right text-muted-foreground">{row.active_users ?? 0}</td>
                <td className="py-3 text-right font-semibold text-primary">{centsToDisplay(row.monthly_revenue ?? 0)}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-muted/30 font-semibold">
              <td className="py-3 text-sm">Network Total</td>
              <td className="py-3 text-right text-sm">{clinics.filter(c => c.is_active).length} Active</td>
              <td className="py-3 text-right text-sm">{clinics.reduce((s, c) => s + (c.total_patients ?? 0), 0).toLocaleString()}</td>
              <td className="py-3 text-right text-sm">{clinics.reduce((s, c) => s + (c.total_doctors ?? 0), 0)}</td>
              <td className="py-3 text-right text-sm">{clinics.reduce((s, c) => s + (c.active_users ?? 0), 0)}</td>
              <td className="py-3 text-right text-sm text-emerald-600">{centsToDisplay(clinics.reduce((s, c) => s + (c.monthly_revenue ?? 0), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ─── Report Card ──────────────────────────────────────────────────────────────

const ReportCard = ({ template, onGenerate }: { template: ReportTemplate; onGenerate: (t: ReportTemplate) => void }) => (
  <div className="card-elevated p-5 group hover:shadow-lg transition-shadow">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
        <template.icon size={20} className="text-primary group-hover:text-secondary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{template.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
        <span className={cn(
          'inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
          template.category === 'financial'   ? 'bg-emerald-50 text-emerald-700' :
          template.category === 'clinical'    ? 'bg-blue-50 text-blue-700' :
                                                'bg-purple-50 text-purple-700'
        )}>
          {template.category}
        </span>
      </div>
    </div>
    <button
      onClick={() => onGenerate(template)}
      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
    >
      <Download size={14} /> Export CSV
    </button>
  </div>
);