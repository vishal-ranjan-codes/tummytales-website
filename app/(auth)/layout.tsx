/**
 * Auth Layout
 * Layout for authentication pages
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - BellyBox',
  description: 'Sign in or sign up to BellyBox',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
