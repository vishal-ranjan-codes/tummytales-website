/**
 * Razorpay Client Library
 * Server-side Razorpay integration for payment processing
 */

import Razorpay from 'razorpay'
import crypto from 'crypto'
import type {
  RazorpayOrderResponse,
  RazorpayPaymentResponse,
} from '@/types/subscription'

/**
 * Get Razorpay configuration from environment variables
 * Uses test keys in development, live keys in production
 */
export function getRazorpayConfig(): { keyId: string; keySecret: string } {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // In development, prefer test keys if available
  if (!isProduction) {
    const testKeyId = process.env.RAZORPAY_TEST_KEY_ID
    const testKeySecret = process.env.RAZORPAY_TEST_KEY_SECRET
    
    if (testKeyId && testKeySecret) {
      return {
        keyId: testKeyId,
        keySecret: testKeySecret,
      }
    }
  }
  
  // Use live keys (or fallback to test if live not available)
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET
  
  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET or RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET in environment variables.'
    )
  }
  
  return { keyId, keySecret }
}

/**
 * Get public Razorpay key ID for client-side usage
 */
export function getPublicRazorpayKeyId(): string {
  // Check for public key first (for client-side)
  if (typeof window !== 'undefined') {
    // Client-side: return from public env var
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    if (publicKeyId) {
      return publicKeyId
    }
  }
  
  // Server-side or fallback
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  
  if (!publicKeyId) {
    // Fallback to test or live key ID (without secret)
    const isProduction = process.env.NODE_ENV === 'production'
    const keyId = isProduction
      ? process.env.RAZORPAY_KEY_ID
      : process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID
    
    if (!keyId) {
      console.warn(
        'Public Razorpay key ID not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in environment variables.'
      )
      return 'rzp_test_placeholder' // Placeholder for development
    }
    
    return keyId
  }
  
  return publicKeyId
}

/**
 * Initialize Razorpay instance
 */
export function initializeRazorpay(): Razorpay {
  const { keyId, keySecret } = getRazorpayConfig()
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

/**
 * Create a Razorpay order
 * @param amount Amount in rupees (will be converted to paise)
 * @param currency Currency code (default: 'INR')
 * @param receipt Receipt identifier
 * @param notes Additional notes/metadata
 * @returns Razorpay order response
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>
): Promise<RazorpayOrderResponse> {
  const razorpay = initializeRazorpay()
  
  // Convert rupees to paise
  const amountInPaise = Math.round(amount * 100)
  
  try {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes: notes || {},
    })
    
    return order as unknown as RazorpayOrderResponse
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error)
    throw new Error(
      `Failed to create Razorpay order: ${(error as { error?: { description?: string }; message?: string }).error?.description || (error as Error).message || 'Unknown error'}`
    )
  }
}

/**
 * Verify Razorpay payment signature
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay payment signature
 * @returns true if signature is valid
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const { keySecret } = getRazorpayConfig()
  
  // Create signature payload: orderId + '|' + paymentId
  const payload = `${orderId}|${paymentId}`
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex')
  
  // Compare signatures (use secure comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )
}

/**
 * Verify Razorpay webhook signature
 * @param payload Raw webhook payload (JSON string)
 * @param signature Webhook signature from X-Razorpay-Signature header
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not configured, skipping webhook signature verification')
    return true // Allow in development if secret not set
  }
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')
  
  // Compare signatures (use secure comparison)
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )
}

/**
 * Get payment details from Razorpay
 * @param paymentId Razorpay payment ID
 * @returns Payment details
 */
export async function getPaymentDetails(
  paymentId: string
): Promise<RazorpayPaymentResponse> {
  const razorpay = initializeRazorpay()
  
  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return payment as unknown as RazorpayPaymentResponse
  } catch (error: unknown) {
    console.error('Error fetching payment details:', error)
    throw new Error(
      `Failed to fetch payment details: ${(error as { error?: { description?: string }; message?: string }).error?.description || (error as Error).message || 'Unknown error'}`
    )
  }
}

/**
 * Create a refund for a payment
 * @param paymentId Razorpay payment ID
 * @param amount Refund amount in rupees (optional, defaults to full refund)
 * @param notes Refund notes/reason
 * @returns Refund details
 */
export async function createRefund(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<unknown> {
  const razorpay = initializeRazorpay()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refundParams: any = {
    notes: notes || {},
  }
  
  // If amount specified, convert to paise
  if (amount !== undefined) {
    refundParams.amount = Math.round(amount * 100)
  }
  
  try {
    const refund = await razorpay.payments.refund(paymentId, refundParams)
    return refund
  } catch (error: unknown) {
    console.error('Error creating refund:', error)
    throw new Error(
      `Failed to create refund: ${(error as { error?: { description?: string }; message?: string }).error?.description || (error as Error).message || 'Unknown error'}`
    )
  }
}

/**
 * Get refund details
 * @param refundId Razorpay refund ID
 * @returns Refund details
 */
export async function getRefundDetails(refundId: string): Promise<unknown> {
  const razorpay = initializeRazorpay()
  
  try {
    const refund = await razorpay.refunds.fetch(refundId)
    return refund
  } catch (error: unknown) {
    console.error('Error fetching refund details:', error)
    throw new Error(
      `Failed to fetch refund details: ${(error as { error?: { description?: string }; message?: string }).error?.description || (error as Error).message || 'Unknown error'}`
    )
  }
}

