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
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'ONLINE' | 'OTHER';
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
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'ONLINE' | 'OTHER';
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
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
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
// BILLING SERVICE CLASS
// ============================================================================

class BillingService {
  /**
   * Get paginated list of invoices
   * Backend: GET /billing/invoices
   */
  async getInvoices(params?: InvoiceListParams): Promise<PaginatedResponse<Invoice>> {
    const response = await apiClient.get<PaginatedResponse<Invoice>>('/billing/invoices', {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        patient_id: params?.patient_id,
        status: params?.status,
        start_date: params?.start_date,
        end_date: params?.end_date,
      },
    });
    return response.data;
  }

  /**
   * Get single invoice by ID
   * Backend: GET /billing/invoices/{id}
   */
  async getInvoice(id: number): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/billing/invoices/${id}`);
    return response.data;
  }

  /**
   * Create new invoice
   * Backend: POST /billing/invoices
   */
  async createInvoice(data: InvoiceCreate): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/billing/invoices', data);
    return response.data;
  }

  /**
   * Update existing invoice
   * Backend: PUT /billing/invoices/{id}
   */
  async updateInvoice(id: number, data: Partial<InvoiceCreate>): Promise<Invoice> {
    const response = await apiClient.put<Invoice>(`/billing/invoices/${id}`, data);
    return response.data;
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
    const response = await apiClient.post<Payment>('/billing/payments', data);
    return response.data;
  }

  /**
   * Get payment history for an invoice
   * Backend: GET /billing/invoices/{id}/payments
   */
  async getInvoicePayments(invoiceId: number): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(`/billing/invoices/${invoiceId}/payments`);
    return response.data;
  }

  /**
   * Get revenue report
   * Backend: GET /billing/revenue
   */
  async getRevenueReport(startDate?: string, endDate?: string): Promise<RevenueReport> {
    const response = await apiClient.get<RevenueReport>('/billing/revenue', {
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
   * Mark invoice as paid
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
      amount: invoice.balance,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString(),
      reference_number: referenceNumber,
    });
  }

  /**
   * Calculate invoice totals
   */
  calculateInvoiceTotals(items: InvoiceItemCreate[], discountAmount = 0, taxAmount = 0) {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = item.discount || 0;
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

export default new BillingService();