/**
 * Server-First Auth Types
 * Shared type definitions for server-rendered authentication state
 */

/**
 * Minimal authentication state fetched on the server for initial render
 * Used to eliminate hydration mismatches and improve performance
 */
export type InitialAuth =
  | { isAuthenticated: false }
  | {
    isAuthenticated: true
    user: { id: string | null; email: string | null; user_metadata?: Record<string, unknown> }
    profile: {
      id: string
      full_name: string
      photo_url: string | null
      roles: string[]
      role?: string | null
      is_super_admin?: boolean
      currentRole: string | null
    } | null
  }

