import { DollarSign, TrendingUp, BarChart3, Users, Clock, Building2 } from 'lucide-react';
import { Shield, Stethoscope } from 'lucide-react';
import { UserRole, ReportTemplate } from '../types/superAdmin.types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const CHART_COLORS = ['#36406D', '#59C4C1', '#6B7CB4', '#7DD3D0', '#9BA5CC'];

export const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'revenue',     title: 'Revenue Report',      description: 'Comprehensive revenue analysis by clinic, service, and period',   icon: DollarSign, category: 'financial' },
  { id: 'expenses',    title: 'Expense Report',       description: 'Detailed breakdown of operational expenses across clinics',        icon: TrendingUp,  category: 'financial' },
  { id: 'collection',  title: 'Collection Report',    description: 'Payment collection rates, outstanding amounts, and aging',         icon: BarChart3,   category: 'financial' },
  { id: 'patient',     title: 'Patient Report',       description: 'Patient demographics, growth trends, and retention rates',         icon: Users,       category: 'clinical' },
  { id: 'appointment', title: 'Appointment Report',   description: 'Appointment volumes, completion rates, and scheduling',            icon: Clock,       category: 'clinical' },
  { id: 'clinic',      title: 'Clinic Comparison',    description: 'Side-by-side clinic performance with key metrics',                 icon: Building2,   category: 'operational' },
];

// ─── Formatters ───────────────────────────────────────────────────────────────

export const centsToDisplay = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

export const centsToK = (amount: number) =>
  `$${(amount / 1000).toFixed(1)}K`;

// ─── Validators ───────────────────────────────────────────────────────────────

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+') && cleaned.length > 0) cleaned = cleaned.replace(/^0+/, '');
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return true;
  return /^\+?[1-9]\d{1,14}$/.test(phone);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password)            return { valid: false, error: 'Password is required' };
  if (password.length < 8)  return { valid: false, error: 'Password must be at least 8 characters' };
  if (password.length > 72) return { valid: false, error: 'Password must be 72 characters or less' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain at least one uppercase letter' };
  return { valid: true };
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const getDateRange = (range: string): { from: string; to: string } => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sub  = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days);          return d.toISOString().split('T')[0]; };
  const subM = (m: number)    => { const d = new Date(now); d.setMonth(d.getMonth() - m);            return d.toISOString().split('T')[0]; };
  const subY = (y: number)    => { const d = new Date(now); d.setFullYear(d.getFullYear() - y);      return d.toISOString().split('T')[0]; };
  const map: Record<string, { from: string; to: string }> = {
    '30days':  { from: sub(30),  to: today },
    '3months': { from: subM(3),  to: today },
    '6months': { from: subM(6),  to: today },
    '1year':   { from: subY(1),  to: today },
  };
  return map[range] ?? map['6months'];
};

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const getRoleBadgeColor = (role: UserRole): string => {
  switch (role?.toLowerCase()) {
    case 'super_admin':   return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'clinic_admin':  return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'doctor':        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'receptionist':  return 'bg-amber-100 text-amber-700 border-amber-200';
    default:              return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getRoleIcon = (role: UserRole) => {
  switch (role?.toLowerCase()) {
    case 'super_admin':  return Shield;
    case 'clinic_admin': return Building2;
    case 'doctor':       return Stethoscope;
    default:             return Users;
  }
};