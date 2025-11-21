/**
 * Payment Utility Functions
 * Currency conversions and payment calculations
 */

/**
 * Convert rupees to paise (multiply by 100)
 * Razorpay requires amounts in paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees (divide by 100)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format currency amount in paise for display (converts to rupees first)
 */
export function formatCurrencyFromPaise(paise: number, currency: string = 'INR'): string {
  return formatCurrency(paiseToRupees(paise), currency)
}

/**
 * Calculate total amount from multiple items
 */
export function calculateTotal(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

/**
 * Validate payment amount (must be positive)
 */
export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && !isNaN(amount) && isFinite(amount)
}

