/**
 * Admin Job Actions
 * Server actions for admin job management
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { retryJob, cancelJob, getJob, getJobLogs } from '@/lib/jobs/job-utils'
import { revalidatePath } from 'next/cache'
import type { BBJob, BBJobLog, BBJobType, BBJobStatus } from '@/lib/jobs/job-utils'

export interface GetJobsResult {
  success: boolean
  data?: BBJob[]
  error?: string
}

export interface GetJobResult {
  success: boolean
  data?: BBJob
  error?: string
}

export interface GetJobLogsResult {
  success: boolean
  data?: BBJobLog[]
  error?: string
}

export interface RetryJobResult {
  success: boolean
  data?: BBJob
  error?: string
}

export interface CancelJobResult {
  success: boolean
  data?: BBJob
  error?: string
}

/**
 * Check if user is admin
 */
async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  return profile?.roles?.includes('admin') || false
}

/**
 * Get jobs with filters
 */
export async function getJobs(
  jobType?: BBJobType,
  status?: BBJobStatus,
  limit: number = 50,
  offset: number = 0
): Promise<GetJobsResult> {
  try {
    if (!(await checkAdmin())) {
      return { success: false, error: 'Not authorized' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('bb_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (jobType) {
      query = query.eq('job_type', jobType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data || []) as BBJob[] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get job details
 */
export async function getJobDetails(jobId: string): Promise<GetJobResult> {
  try {
    if (!(await checkAdmin())) {
      return { success: false, error: 'Not authorized' }
    }

    const result = await getJob(jobId)
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get job logs
 */
export async function getJobLogsAction(
  jobId: string,
  limit: number = 1000
): Promise<GetJobLogsResult> {
  try {
    if (!(await checkAdmin())) {
      return { success: false, error: 'Not authorized' }
    }

    const result = await getJobLogs(jobId, limit)
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Retry failed job
 */
export async function retryJobAction(jobId: string): Promise<RetryJobResult> {
  try {
    if (!(await checkAdmin())) {
      return { success: false, error: 'Not authorized' }
    }

    const result = await retryJob(jobId)
    if (result.success) {
      revalidatePath('/admin/jobs')
    }
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cancel pending/processing job
 */
export async function cancelJobAction(jobId: string): Promise<CancelJobResult> {
  try {
    if (!(await checkAdmin())) {
      return { success: false, error: 'Not authorized' }
    }

    const result = await cancelJob(jobId)
    if (result.success) {
      revalidatePath('/admin/jobs')
    }
    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get job statistics
 */
export async function getJobStatistics(): Promise<{
  success: boolean
  data?: {
    jobsByType: Record<string, number>
    successRateByType: Record<string, number>
    averageDurationByType: Record<string, number>
    failedJobsCount: number
    pendingJobsCount: number
  }
  error?: string
}> {
  try {
    if (!(await checkAdmin())) {
      return { success: false, error: 'Not authorized' }
    }

    const supabase = await createClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Get jobs from last 7 days
    const { data: jobs, error } = await supabase
      .from('bb_jobs')
      .select('job_type, status, started_at, completed_at')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error) {
      return { success: false, error: error.message }
    }

    const jobsByType: Record<string, number> = {}
    const completedByType: Record<string, number> = {}
    const totalByType: Record<string, number> = {}
    const durationsByType: Record<string, number[]> = {}
    let failedJobsCount = 0
    let pendingJobsCount = 0

    for (const job of jobs || []) {
      // Count by type
      jobsByType[job.job_type] = (jobsByType[job.job_type] || 0) + 1
      totalByType[job.job_type] = (totalByType[job.job_type] || 0) + 1

      // Count completed
      if (job.status === 'completed') {
        completedByType[job.job_type] = (completedByType[job.job_type] || 0) + 1

        // Calculate duration
        if (job.started_at && job.completed_at) {
          const duration =
            new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()
          if (!durationsByType[job.job_type]) {
            durationsByType[job.job_type] = []
          }
          durationsByType[job.job_type].push(duration)
        }
      }

      // Count failed
      if (job.status === 'failed') {
        failedJobsCount++
      }

      // Count pending
      if (job.status === 'pending' || job.status === 'processing') {
        pendingJobsCount++
      }
    }

    // Calculate success rates
    const successRateByType: Record<string, number> = {}
    for (const [type, total] of Object.entries(totalByType)) {
      const completed = completedByType[type] || 0
      successRateByType[type] = total > 0 ? (completed / total) * 100 : 0
    }

    // Calculate average durations
    const averageDurationByType: Record<string, number> = {}
    for (const [type, durations] of Object.entries(durationsByType)) {
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length
        averageDurationByType[type] = avg / 1000 // Convert to seconds
      }
    }

    return {
      success: true,
      data: {
        jobsByType,
        successRateByType,
        averageDurationByType,
        failedJobsCount,
        pendingJobsCount,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

