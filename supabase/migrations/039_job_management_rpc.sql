-- =====================================================
-- BELLYBOX - JOB MANAGEMENT RPC FUNCTIONS
-- Migration: 039_job_management_rpc.sql
-- Description: RPC functions for job lifecycle management
-- =====================================================

-- =====================================================
-- RPC: Create Job
-- =====================================================

CREATE OR REPLACE FUNCTION bb_create_job(
    p_job_type TEXT,
    p_payload JSONB DEFAULT NULL,
    p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
    p_max_retries INTEGER DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    job_type TEXT,
    status TEXT,
    payload JSONB,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER,
    max_retries INTEGER,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Validate job type
    IF p_job_type NOT IN (
        'renewal_weekly', 'renewal_monthly', 'payment_retry', 
        'credit_expiry', 'trial_completion', 'order_generation', 
        'pause_auto_cancel', 'holiday_adjustment'
    ) THEN
        RAISE EXCEPTION 'Invalid job type: %', p_job_type;
    END IF;

    -- Validate max retries
    IF p_max_retries < 0 OR p_max_retries > 10 THEN
        RAISE EXCEPTION 'max_retries must be between 0 and 10';
    END IF;

    -- Insert job
    INSERT INTO bb_jobs (
        job_type,
        status,
        payload,
        max_retries,
        scheduled_at
    )
    VALUES (
        p_job_type,
        'pending',
        p_payload,
        p_max_retries,
        p_scheduled_at
    )
    RETURNING bb_jobs.id INTO v_job_id;

    -- Return created job
    RETURN QUERY
    SELECT 
        j.id,
        j.job_type,
        j.status,
        j.payload,
        j.result,
        j.error_message,
        j.retry_count,
        j.max_retries,
        j.scheduled_at,
        j.started_at,
        j.completed_at,
        j.created_at,
        j.updated_at
    FROM bb_jobs j
    WHERE j.id = v_job_id;
END;
$$;

-- =====================================================
-- RPC: Update Job Status
-- =====================================================

CREATE OR REPLACE FUNCTION bb_update_job_status(
    p_job_id UUID,
    p_status TEXT,
    p_result JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    job_type TEXT,
    status TEXT,
    payload JSONB,
    result JSONB,
    error_message TEXT,
    retry_count INTEGER,
    max_retries INTEGER,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    -- Validate status
    IF p_status NOT IN ('pending', 'processing', 'completed', 'failed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status: %', p_status;
    END IF;

    -- Get current status
    SELECT status INTO v_current_status
    FROM bb_jobs
    WHERE id = p_job_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found: %', p_job_id;
    END IF;

    -- Update job with appropriate timestamps
    UPDATE bb_jobs
    SET
        status = p_status,
        result = COALESCE(p_result, result),
        error_message = COALESCE(p_error_message, error_message),
        started_at = CASE 
            WHEN p_status = 'processing' AND started_at IS NULL THEN NOW()
            ELSE started_at
        END,
        completed_at = CASE 
            WHEN p_status IN ('completed', 'failed', 'cancelled') AND completed_at IS NULL THEN NOW()
            ELSE completed_at
        END,
        retry_count = CASE
            WHEN p_status = 'failed' THEN retry_count + 1
            ELSE retry_count
        END
    WHERE id = p_job_id;

    -- Return updated job
    RETURN QUERY
    SELECT 
        j.id,
        j.job_type,
        j.status,
        j.payload,
        j.result,
        j.error_message,
        j.retry_count,
        j.max_retries,
        j.scheduled_at,
        j.started_at,
        j.completed_at,
        j.created_at,
        j.updated_at
    FROM bb_jobs j
    WHERE j.id = p_job_id;
END;
$$;

-- =====================================================
-- RPC: Log Job Activity
-- =====================================================

CREATE OR REPLACE FUNCTION bb_log_job(
    p_job_id UUID,
    p_level TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- Validate level
    IF p_level NOT IN ('info', 'warning', 'error', 'debug') THEN
        RAISE EXCEPTION 'Invalid log level: %', p_level;
    END IF;

    -- Verify job exists
    IF NOT EXISTS (SELECT 1 FROM bb_jobs WHERE id = p_job_id) THEN
        RAISE EXCEPTION 'Job not found: %', p_job_id;
    END IF;

    -- Insert log
    INSERT INTO bb_job_logs (
        job_id,
        level,
        message,
        metadata
    )
    VALUES (
        p_job_id,
        p_level,
        p_message,
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- =====================================================
-- RPC: Get Pending Jobs (for continuation)
-- =====================================================

CREATE OR REPLACE FUNCTION bb_get_pending_jobs(
    p_job_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    job_type TEXT,
    status TEXT,
    payload JSONB,
    scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate limit
    IF p_limit < 1 OR p_limit > 100 THEN
        RAISE EXCEPTION 'Limit must be between 1 and 100';
    END IF;

    -- Return pending jobs (using SKIP LOCKED for concurrent safety)
    RETURN QUERY
    SELECT 
        j.id,
        j.job_type,
        j.status,
        j.payload,
        j.scheduled_at,
        j.created_at
    FROM bb_jobs j
    WHERE j.status = 'pending'
      AND (p_job_type IS NULL OR j.job_type = p_job_type)
      AND (j.scheduled_at IS NULL OR j.scheduled_at <= NOW())
    ORDER BY j.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED;
END;
$$;

-- =====================================================
-- RPC: Mark Job Complete (helper)
-- =====================================================

CREATE OR REPLACE FUNCTION bb_mark_job_complete(
    p_job_id UUID,
    p_result JSONB DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.status,
        j.completed_at
    FROM bb_update_job_status(p_job_id, 'completed', p_result, NULL) j;
END;
$$;

-- =====================================================
-- RPC: Mark Job Failed (helper)
-- =====================================================

CREATE OR REPLACE FUNCTION bb_mark_job_failed(
    p_job_id UUID,
    p_error_message TEXT
)
RETURNS TABLE (
    id UUID,
    status TEXT,
    error_message TEXT,
    retry_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.status,
        j.error_message,
        j.retry_count
    FROM bb_update_job_status(p_job_id, 'failed', NULL, p_error_message) j;
END;
$$;

-- Add comments
COMMENT ON FUNCTION bb_create_job IS 'Create a new job record';
COMMENT ON FUNCTION bb_update_job_status IS 'Update job status with automatic timestamp management';
COMMENT ON FUNCTION bb_log_job IS 'Log job activity';
COMMENT ON FUNCTION bb_get_pending_jobs IS 'Get pending jobs for continuation (uses SKIP LOCKED for concurrency)';
COMMENT ON FUNCTION bb_mark_job_complete IS 'Helper function to mark job as completed';
COMMENT ON FUNCTION bb_mark_job_failed IS 'Helper function to mark job as failed';

