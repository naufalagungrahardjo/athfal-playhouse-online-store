export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export function getPaymentStatus(amountPaid: number | null | undefined, totalAmount: number): PaymentStatus {
  const paid = Math.max(0, amountPaid || 0);
  if (totalAmount <= 0) return 'paid';
  if (paid <= 0) return 'unpaid';
  if (paid >= totalAmount) return 'paid';
  return 'partial';
}

export function getPayable(amountPaid: number | null | undefined, totalAmount: number): number {
  return Math.max(0, totalAmount - Math.max(0, amountPaid || 0));
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'paid': return 'PAID';
    case 'partial': return 'PARTIAL';
    case 'unpaid': return 'UNPAID';
  }
}

/**
 * Ratio of cash actually received vs order total. Used to scale
 * revenue figures so analytics reflect cash actually collected.
 * Cancelled / refund orders should be excluded BEFORE calling this.
 */
export function getPaidRatio(amountPaid: number | null | undefined, totalAmount: number): number {
  if (!totalAmount || totalAmount <= 0) return 0;
  const paid = Math.max(0, amountPaid || 0);
  return Math.min(1, paid / totalAmount);
}