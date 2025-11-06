/**
 * @deprecated Use `getAuth()` from `@/lib/auth/server` instead.
 * This function is kept for backwards compatibility only.
 * 
 * Re-export getAuth as getInitialAuthForHeader for backwards compatibility
 */
import { getAuth } from './server'
import type { InitialAuth } from './types'

export type { InitialAuth }

/**
 * @deprecated Use `getAuth()` from `@/lib/auth/server` instead
 */
export async function getInitialAuthForHeader(): Promise<InitialAuth> {
  return getAuth()
}


