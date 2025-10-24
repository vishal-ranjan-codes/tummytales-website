/**
 * Role Selector Page
 * Page for multi-role users to select which role dashboard to access
 */

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/role-guard'
import { getUserProfile } from '@/lib/auth/role-utils'
import RoleSelector from '@/app/components/auth/RoleSelector'

export default async function RoleSelectorPage() {
  const userId = await requireAuth()
  const profile = await getUserProfile(userId)

  if (!profile) {
    redirect('/login')
  }

  // If user has only one role, redirect to appropriate page
  if (profile.roles.length === 1) {
    const role = profile.roles[0]
    if (role === 'customer') {
      redirect('/homechefs')
    } else {
      redirect(`/${role}`)
    }
  }

  // If user has no roles, redirect to customer signup
  if (profile.roles.length === 0) {
    redirect('/signup/customer')
  }

  return (
    <div className="space-y-8">
      <RoleSelector roles={profile.roles} />
    </div>
  )
}

