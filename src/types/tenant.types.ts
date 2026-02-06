/**
 * Tenant Type Definitions
 * Matches backend tenant schemas
 */

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export type SubscriptionStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'SUSPENDED' 
  | 'CANCELLED' 
  | 'TRIAL';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_start_date?: string;
  subscription_end_date?: string;
  enabled_features: EnabledFeatures;
  logo_url?: string;
  primary_color: string;
  settings: TenantSettings;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TenantCreate {
  name: string;
  email: string;
  slug: string;
  password: string;
  admin_first_name: string;
  admin_last_name: string;
  phone?: string;
  address?: string;
}

export interface TenantUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  logo_url?: string;
  primary_color?: string;
  settings?: Partial<TenantSettings>;
}

export interface SubscriptionUpdate {
  subscription_tier: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  enabled_features?: Partial<EnabledFeatures>;
}

export interface TenantWithStats extends Tenant {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  monthly_revenue: number;
  active_users: number;
}

export interface EnabledFeatures {
  // AI Features
  ai_chatbot: boolean;
  ai_appointment_booking: boolean;
  ai_lead_capture: boolean;
  
  // Billing Features
  advanced_billing: boolean;
  payment_gateway: boolean;
  invoicing: boolean;
  
  // Analytics Features
  analytics: boolean;
  advanced_reports: boolean;
  export_data: boolean;
  
  // Limits
  max_doctors: number;
  max_patients: number;
  max_appointments_per_month: number;
  
  // Communication
  sms_notifications: boolean;
  email_notifications: boolean;
  whatsapp_integration: boolean;
  
  // Advanced
  api_access: boolean;
  white_labeling: boolean;
  multi_location: boolean;
}

export interface TenantSettings {
  // Business Hours
  business_hours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  
  // Appointment Settings
  appointment_duration?: number; // in minutes
  appointment_buffer?: number; // buffer time between appointments
  allow_online_booking?: boolean;
  require_payment_for_booking?: boolean;
  
  // Notification Settings
  send_appointment_reminders?: boolean;
  reminder_hours_before?: number;
  send_followup_messages?: boolean;
  
  // Currency & Locale
  currency?: string;
  currency_symbol?: string;
  date_format?: string;
  time_format?: '12h' | '24h';
  timezone?: string;
  language?: string;
  
  // Custom Fields
  custom_patient_fields?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}

export interface TenantUsage {
  tenant_id: number;
  current_patients: number;
  current_doctors: number;
  appointments_this_month: number;
  storage_used_mb: number;
  api_calls_this_month: number;
  limits: {
    max_patients: number;
    max_doctors: number;
    max_appointments: number;
    max_storage_mb: number;
    max_api_calls: number;
  };
  usage_percentage: {
    patients: number;
    doctors: number;
    appointments: number;
    storage: number;
    api_calls: number;
  };
}

// Feature availability by tier
export const TIER_FEATURES: Record<SubscriptionTier, Partial<EnabledFeatures>> = {
  FREE: {
    ai_chatbot: false,
    ai_appointment_booking: false,
    advanced_billing: false,
    analytics: false,
    max_doctors: 2,
    max_patients: 50,
    max_appointments_per_month: 100,
    sms_notifications: false,
    email_notifications: true,
    api_access: false,
    white_labeling: false,
  },
  BASIC: {
    ai_chatbot: false,
    ai_appointment_booking: true,
    advanced_billing: true,
    analytics: true,
    max_doctors: 5,
    max_patients: 500,
    max_appointments_per_month: 1000,
    sms_notifications: true,
    email_notifications: true,
    api_access: false,
    white_labeling: false,
  },
  PREMIUM: {
    ai_chatbot: true,
    ai_appointment_booking: true,
    advanced_billing: true,
    analytics: true,
    advanced_reports: true,
    max_doctors: 20,
    max_patients: 5000,
    max_appointments_per_month: 10000,
    sms_notifications: true,
    email_notifications: true,
    whatsapp_integration: true,
    api_access: true,
    white_labeling: false,
  },
  ENTERPRISE: {
    ai_chatbot: true,
    ai_appointment_booking: true,
    ai_lead_capture: true,
    advanced_billing: true,
    analytics: true,
    advanced_reports: true,
    export_data: true,
    max_doctors: -1, // unlimited
    max_patients: -1, // unlimited
    max_appointments_per_month: -1, // unlimited
    sms_notifications: true,
    email_notifications: true,
    whatsapp_integration: true,
    api_access: true,
    white_labeling: true,
    multi_location: true,
  },
};