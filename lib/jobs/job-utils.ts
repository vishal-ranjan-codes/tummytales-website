'use server'

/**
 * Job Management Utilities
 * Core functions for managing background job lifecycle
 */

import { createClient } from '@/lib/supabase/server'

// =====================================================
// TYPES
// =====================================================

export type BBJobType =
  | 'renewal_weekly'
  | 'renewal_monthly'
  | 'payment_retry'
  | 'credit_expiry'
  | 'trial_completion'
  | 'order_generation'
  | 'pause_auto_cancel'
  | 'holiday_adjustment'

export type BBJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type BBJobLogLevel = 'info' | 'warning' | 'error' | 'debug'

export interface BBJob {
  id: string
  job_type: BBJobType
  status: BBJobStatus
  payload: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error_message: string | null
  retry_count: number
  max_retries: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface BBJobLog {
  id: string
  job_id: string
  level: BBJobLogLevel
  message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CreateJobInput {
  jobType: BBJobType
  payload?: Record<string, unknown>
  scheduledAt?: Date
  maxRetries?: number
}

export interface UpdateJobStatusInput {
  jobId: string
  status: BBJobStatus
  result?: Record<string, unknown>
  error?: string
}

export interface LogJobInput {
  jobId: string
  level: BBJobLogLevel
  message: string
  metadata?: Record<string, unknown>
}

export interface JobResult {
  success: boolean
  data?: BBJob
  error?: string
}

export interface JobLogsResult {
  success: boolean
  data?: BBJobLog[]
  error?: string
}

// =====================================================
// JOB MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Create a new job record
 */
export async function createJob(
  input: CreateJobInput
): Promise<JobResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('bb_create_job', {
      p_job_type: input.jobType,
      p_payload: input.payload || null,
      p_scheduled_at: input.scheduledAt?.toISOString() || null,
      p_max_retries: input.maxRetries || 3,
    })

    if (error) {
      console.error('[Job Utils] Error creating job:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as BBJob }
  } catch (error) {
    console.error('[Job Utils] Exception creating job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  input: UpdateJobStatusInput
): Promise<JobResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('bb_update_job_status', {
      p_job_id: input.jobId,
      p_status: input.status,
      p_result: input.result || null,
      p_error_message: input.error || null,
    })

    if (error) {
      console.error('[Job Utils] Error updating job status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as BBJob }
  } catch (error) {
    console.error('[Job Utils] Exception updating job status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Log job activity
 */
export async function logJob(input: LogJobInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.rpc('bb_log_job', {
      p_job_id: input.jobId,
      p_level: input.level,
      p_message: input.message,
      p_metadata: input.metadata || null,
    })

    if (error) {
      console.error('[Job Utils] Error logging job:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('[Job Utils] Exception logging job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get job details
 */
export async function getJob(jobId: string): Promise<JobResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('bb_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      console.error('[Job Utils] Error getting job:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as BBJob }
  } catch (error) {
    console.error('[Job Utils] Exception getting job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get job logs
 */
export async function getJobLogs(
  jobId: string,
  limit: number = 1000
): Promise<JobLogsResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('bb_job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Job Utils] Error getting job logs:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: (data || []) as BBJobLog[] }
  } catch (error) {
    console.error('[Job Utils] Exception getting job logs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Retry a failed job
 * Creates a new job with the same type and payload
 */
export async function retryJob(jobId: string): Promise<JobResult> {
  try {
    // Get the original job
    const jobResult = await getJob(jobId)
    if (!jobResult.success || !jobResult.data) {
      return { success: false, error: 'Job not found' }
    }

    const originalJob = jobResult.data

    // Only retry failed jobs
    if (originalJob.status !== 'failed') {
      return { success: false, error: 'Can only retry failed jobs' }
    }

    // Check retry limit
    if (originalJob.retry_count >= originalJob.max_retries) {
      return { success: false, error: 'Maximum retries exceeded' }
    }

    // Create new job with same payload
    const createResult = await createJob({
      jobType: originalJob.job_type,
      payload: originalJob.payload as Record<string, unknown> | undefined,
      maxRetries: originalJob.max_retries,
    })

    if (!createResult.success) {
      return createResult
    }

    // Log retry action
    await logJob({
      jobId: originalJob.id,
      level: 'info',
      message: `Job retry initiated. New job ID: ${createResult.data?.id}`,
      metadata: { retried_job_id: jobId, new_job_id: createResult.data?.id },
    })

    return createResult
  } catch (error) {
    console.error('[Job Utils] Exception retrying job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cancel a pending or processing job
 */
export async function cancelJob(jobId: string): Promise<JobResult> {
  try {
    // Get the job
    const jobResult = await getJob(jobId)
    if (!jobResult.success || !jobResult.data) {
      return { success: false, error: 'Job not found' }
    }

    const job = jobResult.data

    // Only cancel pending or processing jobs
    if (job.status !== 'pending' && job.status !== 'processing') {
      return { success: false, error: 'Can only cancel pending or processing jobs' }
    }

    // Update status to cancelled
    const updateResult = await updateJobStatus({
      jobId,
      status: 'cancelled',
    })

    if (!updateResult.success) {
      return updateResult
    }

    // Log cancellation
    await logJob({
      jobId,
      level: 'info',
      message: 'Job cancelled by admin',
    })

    return updateResult
  } catch (error) {
    console.error('[Job Utils] Exception cancelling job:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Mark job as started (helper function)
 */
export async function startJob(jobId: string): Promise<JobResult> {
  return updateJobStatus({
    jobId,
    status: 'processing',
  })
}

/**
 * Mark job as completed (helper function)
 */
export async function completeJob(
  jobId: string,
  result?: Record<string, unknown>
): Promise<JobResult> {
  return updateJobStatus({
    jobId,
    status: 'completed',
    result,
  })
}

/**
 * Mark job as failed (helper function)
 */
export async function failJob(jobId: string, error: string): Promise<JobResult> {
  return updateJobStatus({
    jobId,
    status: 'failed',
    error,
  })
}

/**
 * Create a continuation job (for batching)
 */
export async function createContinuationJob(
  jobType: BBJobType,
  batchNumber: number,
  payload?: Record<string, unknown>
): Promise<JobResult> {
  const continuationPayload = {
    ...payload,
    batchNumber,
    isContinuation: true,
  }

  return createJob({
    jobType,
    payload: continuationPayload,
  })
}

