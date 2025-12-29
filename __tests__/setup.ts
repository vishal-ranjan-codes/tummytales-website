/**
 * Test Setup
 * Configure test environment
 */

// Mock Supabase client for unit tests
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}))

// Set test environment variables
process.env.NEXT_PUBLIC_SUBSCRIPTIONS_V2_ENABLED = 'true'
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test_key'
process.env.RAZORPAY_KEY_SECRET = 'test_secret'

