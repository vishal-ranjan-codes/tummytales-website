/**
 * Admin Jobs Page
 * Monitor and manage background jobs
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsClient from './JobsClient'
import { getJobs, getJobStatistics } from '@/lib/admin/job-actions'

export const metadata = {
  title: 'Jobs | Admin Dashboard',
  description: 'Monitor and manage background jobs',
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ jobType?: string; status?: string; page?: string }>
}) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('admin')) {
    redirect('/customer/subscriptions')
  }

  const params = await searchParams
  const jobType = params.jobType as string | undefined
  const status = params.status as string | undefined
  const page = parseInt(params.page || '1', 10)
  const limit = 50
  const offset = (page - 1) * limit

  // Fetch jobs
  const jobsResult = await getJobs(
    jobType as any,
    status as any,
    limit,
    offset
  )

  // Fetch statistics
  const statsResult = await getJobStatistics()

  return (
    <JobsClient
      initialJobs={jobsResult.data || []}
      initialStatistics={statsResult.data}
      initialFilters={{
        jobType: jobType || 'all',
        status: status || 'all',
        page,
      }}
    />
  )
}

