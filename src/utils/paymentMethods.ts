// Payment methods available in the system
export const PAYMENT_METHODS = [
  'card',
  'upi',
  'wallet',
  'netbanking',
  'cod',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

