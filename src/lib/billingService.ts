/**
 * Billing Service
 * Handles all billing, invoice, and payment-related API calls
 */

import apiClient from './client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Invoice {
  id: number;
  tenant_id: number;
  patient_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  balance: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  created_at: string;
  updated_at?: string;

  // Populated fields
  patient?: any;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  service_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
  created_at: string;

  // Populated fields
  service?: any;
}

export interface Payment {
  id: number;
  tenant_id: number;
  invoice_id: number;
  patient_id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance' | 'wallet';
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;

  // Populated fields
  invoice?: Invoice;
  patient?: any;
}

export interface InvoiceCreate {
  patient_id: number;
  invoice_date: string;
  due_date?: string;
  items: InvoiceItemCreate[];
  discount_amount?: number;
  tax_amount?: number;
  notes?: string;
}

export interface InvoiceItemCreate {
  service_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface PaymentCreate {
  invoice_id: number;
  patient_id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance' | 'wallet';
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface InvoiceListParams {
  skip?: number;
  limit?: number;
  patient_id?: number;
  status?: Invoice['status'];
  start_date?: string;
  end_date?: string;
}

export interface RevenueReport {
  period: string;
  total_revenue: number;
  total_invoices: number;
  paid_invoices: number;
  pending_invoices: number;
  overdue_invoices: number;
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  revenue_by_service?: Array<{
    service_name: string;
    revenue: number;
    count: number;
  }>;
  revenue_by_payment_method?: Array<{
    payment_method: string;
    amount: number;
    count: number;
  }>;
}

// ============================================================================
// STATUS NORMALIZATION
// Backend uses lowercase enum values and different names (e.g. 'partial')
// Frontend uses uppercase with full names (e.g. 'PARTIALLY_PAID')
// ============================================================================

/**
 * Maps backend payment_status values → frontend Invoice['status'] values.
 * Handles both already-uppercased values (idempotent) and raw backend strings.
 */
const STATUS_NORMALIZE_MAP: Record<string, Invoice['status']> = {
  // Backend lowercase → Frontend
  'pending':       'PENDING',
  'partial':       'PARTIALLY_PAID',
  'paid':          'PAID',
  'cancelled':     'CANCELLED',
  'canceled':      'CANCELLED', // handle both spellings
  'draft':         'DRAFT',
  'overdue':       'OVERDUE',
  'refunded':      'CANCELLED', // map refunded to cancelled for display

  // Frontend uppercase → Frontend (idempotent passthrough)
  'PENDING':       'PENDING',
  'PARTIALLY_PAID':'PARTIALLY_PAID',
  'PAID':          'PAID',
  'CANCELLED':     'CANCELLED',
  'DRAFT':         'DRAFT',
  'OVERDUE':       'OVERDUE',
};

/**
 * Normalize a raw status string from the API into a typed frontend status.
 * Falls back to 'PENDING' if the value is unrecognized.
 */
function normalizeStatus(raw: string | null | undefined): Invoice['status'] {
  if (!raw) return 'PENDING';
  return STATUS_NORMALIZE_MAP[raw] ?? STATUS_NORMALIZE_MAP[raw.toLowerCase()] ?? 'PENDING';
}

/**
 * Normalize a raw invoice object from the API.
 * The backend returns `payment_status` (not `status`), so we map it here
 * so the rest of the frontend only ever sees `status`.
 */
function normalizeInvoice(raw: any): Invoice {
  return {
    ...raw,
    // Prefer payment_status (backend field), fall back to status if already mapped
    status: normalizeStatus(raw.payment_status ?? raw.status),
    // Normalize nested payments if present
    payments: raw.payments?.map(normalizePayment) ?? raw.payments,
    // Normalize items — ensure `total` field exists (backend may call it total_amount)
    items: raw.items?.map(normalizeInvoiceItem) ?? raw.invoice_items?.map(normalizeInvoiceItem) ?? raw.items,
  };
}

function normalizeInvoiceItem(raw: any): InvoiceItem {
  return {
    ...raw,
    // Backend may use total_amount; frontend expects total
    total: raw.total ?? raw.total_amount ?? 0,
    unit_price: raw.unit_price ?? 0,
  };
}

function normalizePayment(raw: any): Payment {
  return {
    ...raw,
    payment_method: raw.payment_method?.toUpperCase() ?? 'OTHER',
  };
}

// ============================================================================
// BILLING SERVICE CLASS
// ============================================================================

class BillingService {
  /**
   * Get paginated list of invoices
   * Backend: GET /billing/invoices
   */
  async getInvoices(params?: InvoiceListParams): Promise<PaginatedResponse<Invoice>> {
    // Map frontend status (e.g. 'PARTIALLY_PAID') to backend status (e.g. 'partial')
    // so the filter query param is understood by the backend
    const backendStatus = params?.status ? toBackendStatus(params.status) : undefined;

    const response = await apiClient.get<any>('/billing/invoices', {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 10,
        patient_id: params?.patient_id,
        status: backendStatus,
        start_date: params?.start_date,
        end_date: params?.end_date,
      },
    });

    const data = response.data;
    return {
      ...data,
      items: (data.items ?? []).map(normalizeInvoice),
    };
  }

  /**
   * Get single invoice by ID
   * Backend: GET /billing/invoices/{id}
   */
  async getInvoice(id: number): Promise<Invoice> {
    const response = await apiClient.get<any>(`/billing/invoices/${id}`);
    return normalizeInvoice(response.data);
  }

  /**
   * Create new invoice
   * Backend: POST /billing/invoices
   */
  async createInvoice(data: InvoiceCreate): Promise<Invoice> {
    const response = await apiClient.post<any>('/billing/invoices', data);
    return normalizeInvoice(response.data);
  }

  /**
   * Update existing invoice
   * Backend: PUT /billing/invoices/{id}
   */
  async updateInvoice(
    id: number,
    data: Partial<InvoiceCreate> & { status?: Invoice['status'] }
  ): Promise<Invoice> {
    const payload: Record<string, any> = { ...data };

    if (data.status) {
      // Map frontend enum → backend enum, send as payment_status
      payload.payment_status = toBackendStatus(data.status);
      delete payload.status;
    }

    const response = await apiClient.put<any>(`/billing/invoices/${id}`, payload);
    return normalizeInvoice(response.data);
  }

  /**
   * Delete invoice
   * Backend: DELETE /billing/invoices/{id}
   */
  async deleteInvoice(id: number): Promise<void> {
    await apiClient.delete(`/billing/invoices/${id}`);
  }

  /**
   * Create payment for an invoice
   * Backend: POST /billing/payments
   */
  async createPayment(data: PaymentCreate): Promise<Payment> {
    const response = await apiClient.post<any>('/billing/payments', data);
    return normalizePayment(response.data);
  }

  /**
   * Get payment history for an invoice
   * Backend: GET /billing/invoices/{id}/payments
   */
  async getInvoicePayments(invoiceId: number): Promise<Payment[]> {
    const response = await apiClient.get<any[]>(`/billing/invoices/${invoiceId}/payments`);
    return (response.data ?? []).map(normalizePayment);
  }

  /**
   * Get revenue report
   * Backend: GET /billing/summary
   */
  async getRevenueReport(startDate?: string, endDate?: string): Promise<RevenueReport> {
    const response = await apiClient.get<RevenueReport>('/billing/summary', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices(patientId?: number): Promise<Invoice[]> {
    const response = await this.getInvoices({
      status: 'PENDING',
      patient_id: patientId,
      limit: 100,
    });
    return response.items;
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    const response = await this.getInvoices({
      status: 'OVERDUE',
      limit: 100,
    });
    return response.items;
  }

  /**
   * Mark invoice as fully paid by recording a payment for the full balance.
   */
  async markInvoiceAsPaid(
    invoiceId: number,
    paymentMethod: PaymentCreate['payment_method'],
    referenceNumber?: string
  ): Promise<Payment> {
    const invoice = await this.getInvoice(invoiceId);

    return this.createPayment({
      invoice_id: invoiceId,
      patient_id: invoice.patient_id,
      amount: invoice.balance_amount > 0 ? invoice.balance_amount : invoice.balance,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString(),
      reference_number: referenceNumber,
    });
  }

  /**
   * Calculate invoice totals locally (useful for form previews).
   */
  calculateInvoiceTotals(
    items: InvoiceItemCreate[],
    discountAmount = 0,
    taxAmount = 0
  ) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = item.discount ?? 0;
      return sum + (itemTotal - itemDiscount);
    }, 0);

    const total = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: total,
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Maps frontend Invoice['status'] → backend payment_status string.
 * Used when sending status as a query param or request body field.
 */
function toBackendStatus(status: Invoice['status']): string {
  const map: Record<Invoice['status'], string> = {
    DRAFT:          'pending',   // backend has no draft concept
    PENDING:        'pending',
    PARTIALLY_PAID: 'partial',   // critical: different name
    PAID:           'paid',
    OVERDUE:        'pending',   // overdue is UI-only
    CANCELLED:      'cancelled',
  };
  return map[status] ?? 'pending';
}

export default new BillingService();