/**
 * Error Handler Utility
 * Centralized error handling with user-friendly messages
 */

export interface ErrorContext {
  action?: string
  entity?: string
  field?: string
  value?: unknown
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  // Handle Error instances
  if (error instanceof Error) {
    return error.message
  }
  
  // Handle Supabase PostgrestError (has message property)
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }
  
  // Handle objects with details property (Supabase errors)
  if (error && typeof error === 'object' && 'details' in error) {
    const details = (error as { details: unknown }).details
    if (typeof details === 'string' && details) {
      return details
    }
  }
  
  // Handle objects with hint property (Supabase errors)
  if (error && typeof error === 'object' && 'hint' in error) {
    const hint = (error as { hint: unknown }).hint
    if (typeof hint === 'string' && hint) {
      return hint
    }
  }
  
  // Fallback to string conversion
  return String(error)
}

/**
 * Get user-friendly error message from various error types
 */
export function getUserFriendlyError(
  error: unknown,
  context?: ErrorContext
): string {
  const errorMessage = extractErrorMessage(error)

  // Database constraint errors
  if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
    return `${context?.entity || 'Item'} already exists. Please try a different ${context?.field || 'value'}.`
  }

  if (errorMessage.includes('foreign key constraint')) {
    return `Invalid ${context?.field || 'reference'}. Please check your selection and try again.`
  }

  if (errorMessage.includes('not null constraint')) {
    return `${context?.field || 'Field'} is required. Please fill in all required fields.`
  }

  if (errorMessage.includes('check constraint')) {
    return `Invalid ${context?.field || 'value'}. Please check your input and try again.`
  }

  // Authentication errors
  if (errorMessage.includes('Not authenticated') || errorMessage.includes('Unauthorized')) {
    return 'Please sign in to continue.'
  }

  if (errorMessage.includes('permission denied') || errorMessage.includes('access denied')) {
    return 'You do not have permission to perform this action.'
  }

  // Business logic errors (from RPCs)
  if (errorMessage.includes('Vendor not found') || errorMessage.includes('inactive')) {
    return 'This vendor is not available. Please try another vendor.'
  }

  if (errorMessage.includes('not opted into')) {
    return 'This vendor has not enabled this feature yet.'
  }

  if (errorMessage.includes('capacity')) {
    return 'This vendor is at full capacity. Please try again later or choose another vendor.'
  }

  if (errorMessage.includes('cutoff')) {
    return 'The deadline for this action has passed. Please try again next time.'
  }

  if (errorMessage.includes('skip limit') || errorMessage.includes('maximum')) {
    return 'You have reached the maximum limit. Please try again in the next cycle.'
  }

  if (errorMessage.includes('credit') && errorMessage.includes('expired')) {
    return 'This credit has expired and cannot be used.'
  }

  if (errorMessage.includes('payment') || errorMessage.includes('razorpay')) {
    return 'Payment processing failed. Please check your payment method and try again.'
  }

  if (errorMessage.includes('invoice') && errorMessage.includes('paid')) {
    return 'This invoice has already been paid.'
  }

  // Network/timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
    return 'Connection timeout. Please check your internet connection and try again.'
  }

  // Generic fallbacks
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
    return 'Unable to connect to the server. Please try again in a moment.'
  }

  if (errorMessage.includes('Unexpected error') || errorMessage.includes('Internal server error')) {
    return 'Something went wrong. Our team has been notified. Please try again later.'
  }

  // Return original message if it's already user-friendly
  if (
    errorMessage.length < 100 &&
    !errorMessage.includes('ERROR') &&
    !errorMessage.includes('SQLSTATE')
  ) {
    return errorMessage
  }

  // Default fallback
  return `Unable to ${context?.action || 'complete this action'}. Please try again or contact support if the problem persists.`
}

/**
 * Log error with context for debugging
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const errorMessage = extractErrorMessage(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // Extract additional error properties for better debugging
  const errorDetails: Record<string, unknown> = {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  }
  
  // Add Supabase-specific error properties if available
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>
    if ('code' in errorObj) errorDetails.code = errorObj.code
    if ('details' in errorObj) errorDetails.details = errorObj.details
    if ('hint' in errorObj) errorDetails.hint = errorObj.hint
  }

  console.error('Error occurred:', errorDetails)

  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Handle error and return user-friendly message
 */
export function handleError(error: unknown, context?: ErrorContext): string {
  logError(error, context)
  return getUserFriendlyError(error, context)
}

