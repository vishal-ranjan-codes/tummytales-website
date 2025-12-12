-- =====================================================
-- BELLYBOX - JOBS TABLE
-- Migration: 025_jobs_table.sql
-- Description: Create jobs and job_logs tables for background job tracking
-- =====================================================

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'renewal', 'order_generation', 'payment_retry', 'trial_expiry', 'credit_expiry', 'holiday_adjust'
    status job_status NOT NULL DEFAULT 'pending',
    payload JSONB,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT jobs_attempts_non_negative CHECK (attempts >= 0)
);

-- Create job_logs table (optional, for detailed tracking)
CREATE TABLE job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    status job_status NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for jobs
CREATE INDEX idx_jobs_type_status ON jobs(job_type, status);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_jobs_run_at ON jobs(run_at) WHERE status = 'pending';

-- Create indexes for job_logs
CREATE INDEX idx_job_logs_job ON job_logs(job_id);

-- Create trigger for updated_at on jobs
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE jobs IS 'Background jobs for renewals, order generation, payment retries, etc.';
COMMENT ON TABLE job_logs IS 'Detailed logs for each job execution (optional)';

