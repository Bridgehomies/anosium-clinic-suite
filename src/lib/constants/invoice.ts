export const STATUS_CONFIG = {
  DRAFT:          { label: 'Draft',      className: 'bg-gray-100 text-gray-600 border-gray-200',         dotColor: 'bg-gray-400' },
  PENDING:        { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border-amber-200',        dotColor: 'bg-amber-400' },
  PARTIALLY_PAID: { label: 'Partial',    className: 'bg-blue-50 text-blue-700 border-blue-200',           dotColor: 'bg-blue-400' },
  PAID:           { label: 'Paid',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dotColor: 'bg-emerald-400' },
  OVERDUE:        { label: 'Overdue',    className: 'bg-red-50 text-red-700 border-red-200',              dotColor: 'bg-red-400' },
  CANCELLED:      { label: 'Cancelled',  className: 'bg-gray-100 text-gray-500 border-gray-200',          dotColor: 'bg-gray-300' },
} as const;

export type InvoiceStatus = keyof typeof STATUS_CONFIG;