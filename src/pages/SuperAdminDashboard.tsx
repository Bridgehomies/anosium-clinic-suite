import { useState, useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Hook
import { useSuperAdminDashboard } from '@/hooks/useSuperAdminDashboard';

// Tabs
import { OverviewTab }  from '@/tabs/OverviewTab';
import { ClinicsTab }   from '@/tabs/ClinicsTab';
import { UsersTab }     from '@/tabs/UsersTab';
import { FinancialTab } from '@/tabs/FinancialTab';

// Modals
import { AddClinicModal }      from '@/modals/AddClinicModal';
import { AddUserModal }        from '@/modals/AddUserModal';
import { DeleteConfirmDialog } from '@/components/SharedUI';

// Types & utils
import { ClinicStats, User, ReportTemplate } from '@/types/superAdmin.types';
import { centsToDisplay, REPORT_TEMPLATES } from '@/utils/superAdmin.utils';

const SuperAdminDashboard = () => {
  const {
    currentUser, accessDenied, loading, financialLoading,
    dashboardStats, clinics, users, revenueData,
    revenueReport, appointmentReport,
    consolidatedSummary, monthlyConsolidated, revenueByClinic, serviceDistributionData,
    loadFinancialData, loadDashboardData,
    handleAddClinic, handleDeleteClinic, handleToggleClinicStatus,
    handleAddUser, handleDeleteUser, handleToggleUserStatus, handleResendInvite,
  } = useSuperAdminDashboard();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');

  // ── Search / filter state ──────────────────────────────────────────────────
  const [clinicSearchQuery, setClinicSearchQuery] = useState('');
  const [userSearchQuery,   setUserSearchQuery]   = useState('');
  const [roleFilter,        setRoleFilter]        = useState<any>('all');

  // ── Financial state ────────────────────────────────────────────────────────
  const [financialDateRange,    setFinancialDateRange]    = useState('6months');
  const [financialReportFilter, setFinancialReportFilter] = useState('all');
  const [reportStartDate,       setReportStartDate]       = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split('T')[0]; });
  const [reportEndDate,         setReportEndDate]         = useState(() => new Date().toISOString().split('T')[0]);

  // ── Modal open state ───────────────────────────────────────────────────────
  const [addClinicModalOpen, setAddClinicModalOpen] = useState(false);
  const [addUserModalOpen,   setAddUserModalOpen]   = useState(false);

  // ── Delete confirmation targets ────────────────────────────────────────────
  const [deleteClinicTarget, setDeleteClinicTarget] = useState<ClinicStats | null>(null);
  const [deleteUserTarget,   setDeleteUserTarget]   = useState<User | null>(null);

  // Re-fetch financial data when the date range selector changes
  useEffect(() => {
    if (!loading.page) loadFinancialData(financialDateRange);
  }, [financialDateRange]);

  // ── Report helpers ─────────────────────────────────────────────────────────

  const handleExportReport = (template: ReportTemplate) => {
    let csv = '';
    switch (template.id) {
      case 'revenue':
        csv = 'Date,Revenue\n' + (revenueReport?.daily_breakdown ?? []).map((r: any) => `${r.date},$${r.revenue.toFixed(2)}`).join('\n');
        break;
      case 'expenses':
        csv = 'Month,Revenue,Expenses,Profit\n' + monthlyConsolidated.map(m => `${m.month},$${m.revenue},$${m.expenses},$${m.profit}`).join('\n');
        break;
      case 'collection':
        csv = `Collection Report\nTotal Invoiced,${centsToDisplay(consolidatedSummary.totalRevenue)}\nTotal Collected,${centsToDisplay(consolidatedSummary.totalCollected)}\nCollection Rate,${consolidatedSummary.collectionRate.toFixed(1)}%\nOutstanding,${centsToDisplay(consolidatedSummary.outstandingAmount)}`;
        break;
      case 'patient':
        csv = `Patient Report\nTotal Patients,${consolidatedSummary.totalPatients}\nNew Patients,${consolidatedSummary.newPatients}`;
        break;
      case 'appointment':
        csv = `Appointment Report\nTotal Scheduled,${consolidatedSummary.totalAppointments}\nCompleted,${appointmentReport?.completed ?? 0}\nCancelled,${appointmentReport?.cancelled ?? 0}\nCompletion Rate,${consolidatedSummary.completionRate.toFixed(1)}%`;
        break;
      case 'clinic':
        csv = 'Clinic,Monthly Revenue,Active Users,Patients,Doctors\n' + clinics.map(c => `${c.name},${centsToDisplay(c.monthly_revenue ?? 0)},${c.active_users ?? 0},${c.total_patients ?? 0},${c.total_doctors ?? 0}`).join('\n');
        break;
      default:
        csv = 'Report data not available';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${template.id}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = (template: ReportTemplate) => {
    setTimeout(() => handleExportReport(template), 800);
  };

  const handlePrintConsolidatedReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Consolidated Network Report</title>
      <style>body{font-family:system-ui;max-width:960px;margin:40px auto;padding:0 20px}
      table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}
      th{background:#f5f5f5;font-size:12px;text-transform:uppercase}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0}
      .card{padding:20px;border:1px solid #eee;border-radius:8px}h1{color:#36406D}h2{color:#59C4C1;margin-top:30px}</style></head>
      <body>
      <h1>Network Consolidated Report</h1>
      <p>Period: ${reportStartDate} to ${reportEndDate} | Generated: ${new Date().toLocaleDateString()}</p>
      <h2>Network Financial Summary</h2>
      <div class="grid">
        <div class="card"><p style="color:#666;font-size:14px">Total Revenue</p><p style="font-size:24px;font-weight:bold">${centsToDisplay(consolidatedSummary.totalRevenue)}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Total Collected</p><p style="font-size:24px;font-weight:bold">${centsToDisplay(consolidatedSummary.totalCollected)}</p></div>
        <div class="card"><p style="color:#666;font-size:14px">Collection Rate</p><p style="font-size:24px;font-weight:bold">${consolidatedSummary.collectionRate.toFixed(1)}%</p></div>
      </div>
      <h2>Active Clinics</h2>
      <table><thead><tr><th>Clinic</th><th>Status</th><th>Monthly Revenue</th><th>Patients</th><th>Staff</th></tr></thead><tbody>
      ${clinics.map(c => `<tr><td>${c.name}</td><td>${c.is_active ? 'Active' : 'Inactive'}</td><td>${centsToDisplay(c.monthly_revenue ?? 0)}</td><td>${c.total_patients ?? 0}</td><td>${c.active_users ?? 0}</td></tr>`).join('')}
      </tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (accessDenied) return (
    <DashboardLayout title="Access Denied" subtitle="Insufficient permissions">
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You need Super Admin privileges to access this dashboard.
            {currentUser && <span className="block mt-2 text-sm">Current role: <span className="font-semibold">{currentUser.role}</span></span>}
          </p>
        </div>
        <Button onClick={() => (window.location.href = '/')} className="mt-4">Go to Home</Button>
      </div>
    </DashboardLayout>
  );

  if (loading.page && !dashboardStats) return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Loading...">
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-navy" />
      </div>
    </DashboardLayout>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Healthcare network oversight and management">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinics">Clinics ({clinics.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            dashboardStats={dashboardStats}
            consolidatedSummary={consolidatedSummary}
            clinics={clinics}
            users={users}
            revenueData={revenueData}
            serviceDistributionData={serviceDistributionData}
          />
        </TabsContent>

        <TabsContent value="clinics">
          <ClinicsTab
            clinics={clinics}
            loading={loading}
            searchQuery={clinicSearchQuery}
            onSearchChange={setClinicSearchQuery}
            onAddClinic={() => setAddClinicModalOpen(true)}
            onToggleStatus={handleToggleClinicStatus}
            onDeleteClick={setDeleteClinicTarget}
          />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab
            users={users}
            clinics={clinics}
            loading={loading}
            searchQuery={userSearchQuery}
            roleFilter={roleFilter}
            onSearchChange={setUserSearchQuery}
            onRoleFilterChange={setRoleFilter}
            onAddUser={() => setAddUserModalOpen(true)}
            onToggleStatus={handleToggleUserStatus}
            onDeleteClick={setDeleteUserTarget}
            onResendInvite={handleResendInvite}
          />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialTab
            consolidatedSummary={consolidatedSummary}
            clinics={clinics}
            monthlyConsolidated={monthlyConsolidated}
            revenueByClinic={revenueByClinic}
            financialLoading={financialLoading}
            financialDateRange={financialDateRange}
            financialReportFilter={financialReportFilter}
            reportStartDate={reportStartDate}
            reportEndDate={reportEndDate}
            onDateRangeChange={setFinancialDateRange}
            onReportFilterChange={setFinancialReportFilter}
            onStartDateChange={setReportStartDate}
            onEndDateChange={setReportEndDate}
            onGenerateReport={handleGenerateReport}
            onPrintReport={handlePrintConsolidatedReport}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddClinicModal
        open={addClinicModalOpen}
        loading={loading.modalSubmit}
        onClose={() => setAddClinicModalOpen(false)}
        onSubmit={handleAddClinic}
      />

      <AddUserModal
        open={addUserModalOpen}
        loading={loading.modalSubmit}
        clinics={clinics}
        onClose={() => setAddUserModalOpen(false)}
        onSubmit={handleAddUser}
      />

      {/* Delete confirmations */}
      <DeleteConfirmDialog
        open={!!deleteClinicTarget}
        onClose={() => setDeleteClinicTarget(null)}
        onConfirm={() => deleteClinicTarget && handleDeleteClinic(deleteClinicTarget)}
        loading={loading.clinicAction === deleteClinicTarget?.id}
        title="Delete Clinic"
        description={`Are you sure you want to permanently delete "${deleteClinicTarget?.name}"? This will remove all associated data and cannot be undone.`}
      />
      <DeleteConfirmDialog
        open={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        onConfirm={() => deleteUserTarget && handleDeleteUser(deleteUserTarget)}
        loading={loading.userAction === deleteUserTarget?.id}
        title="Delete User"
        description={`Are you sure you want to permanently delete "${deleteUserTarget?.full_name}"? They will lose all access immediately.`}
      />
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;