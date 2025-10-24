import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in browser/client-side components
 * This client is safe to use in React components and client-side code
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

