-- =====================================================
-- BELLYBOX - ADD JOB TRACKING TABLES
-- Migration: 031_add_job_tracking.sql
-- Description: Create job tracking tables for background job monitoring and logging
-- =====================================================

-- Create jobs table
CREATE TABLE IF NOT EXISTS bb_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payload JSONB,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bb_jobs_job_type_check 
        CHECK (job_type IN (
            'renewal_weekly', 'renewal_monthly', 'payment_retry', 
            'credit_expiry', 'trial_completion', 'order_generation', 
            'pause_auto_cancel', 'holiday_adjustment'
        )),
    CONSTRAINT bb_jobs_status_check 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT bb_jobs_retry_count_check 
        CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bb_jobs_status_scheduled 
ON bb_jobs(status, scheduled_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bb_jobs_type_status 
ON bb_jobs(job_type, status);

CREATE INDEX IF NOT EXISTS idx_bb_jobs_created_at 
ON bb_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bb_jobs_completed_at 
ON bb_jobs(completed_at DESC) 
WHERE completed_at IS NOT NULL;

-- Create job logs table
CREATE TABLE IF NOT EXISTS bb_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES bb_jobs(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bb_job_logs_level_check 
        CHECK (level IN ('info', 'warning', 'error', 'debug'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bb_job_logs_job_id 
ON bb_job_logs(job_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bb_job_logs_level 
ON bb_job_logs(level, created_at) 
WHERE level IN ('error', 'warning');

CREATE INDEX IF NOT EXISTS idx_bb_job_logs_created_at 
ON bb_job_logs(created_at DESC);

-- Create updated_at trigger for jobs table
CREATE OR REPLACE FUNCTION update_bb_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bb_jobs_updated_at_trigger ON bb_jobs;
CREATE TRIGGER update_bb_jobs_updated_at_trigger
    BEFORE UPDATE ON bb_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_bb_jobs_updated_at();

-- Enable RLS
ALTER TABLE bb_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_job_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Only admins can view jobs
CREATE POLICY "bb_jobs_select_admin" ON bb_jobs
    FOR SELECT
    USING (is_admin());

-- Only system can insert jobs
CREATE POLICY "bb_jobs_insert_system" ON bb_jobs
    FOR INSERT
    WITH CHECK (true);

-- Only system can update jobs
CREATE POLICY "bb_jobs_update_system" ON bb_jobs
    FOR UPDATE
    USING (true);

-- Only admins can view job logs
CREATE POLICY "bb_job_logs_select_admin" ON bb_job_logs
    FOR SELECT
    USING (is_admin());

-- Only system can insert job logs
CREATE POLICY "bb_job_logs_insert_system" ON bb_job_logs
    FOR INSERT
    WITH CHECK (true);

-- Add comments
COMMENT ON TABLE bb_jobs IS 'Background job tracking for renewals, payments, credits, etc.';
COMMENT ON COLUMN bb_jobs.job_type IS 'Type of job: renewal_weekly, renewal_monthly, payment_retry, credit_expiry, trial_completion, order_generation, pause_auto_cancel';
COMMENT ON COLUMN bb_jobs.status IS 'Job status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN bb_jobs.payload IS 'Job-specific input data (JSONB)';
COMMENT ON COLUMN bb_jobs.result IS 'Job execution result data (JSONB)';
COMMENT ON COLUMN bb_jobs.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN bb_jobs.max_retries IS 'Maximum number of retries allowed';

COMMENT ON TABLE bb_job_logs IS 'Detailed logs for background jobs';
COMMENT ON COLUMN bb_job_logs.level IS 'Log level: info, warning, error, debug';
COMMENT ON COLUMN bb_job_logs.message IS 'Log message';
COMMENT ON COLUMN bb_job_logs.metadata IS 'Additional log context (JSONB)';

