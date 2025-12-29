-- =====================================================
-- IMPLEMENTATION VERIFICATION SCRIPT
-- Run this to verify all Phase 1-4 implementations
-- =====================================================

-- =====================================================
-- 1. CHECK MIGRATIONS APPLIED
-- =====================================================

SELECT 
    'Migrations Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✓ PASS'
        ELSE '✗ FAIL - Missing migrations'
    END as status
FROM supabase_migrations.schema_migrations
WHERE name LIKE '%bb_%' 
   OR name LIKE '%041%' 
   OR name LIKE '%042%'
   OR name LIKE '%035%'
   OR name LIKE '%036%'
   OR name LIKE '%037%'
   OR name LIKE '%038%'
   OR name LIKE '%039%';

-- =====================================================
-- 2. CHECK PHASE 1: CRITICAL FIXES
-- =====================================================

-- Check cycle boundaries function exists
SELECT 
    'Phase 1: Cycle Boundaries Function' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'bb_get_cycle_boundaries'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check skip function exists
SELECT 
    'Phase 1: Skip Function' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'bb_apply_skip'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- =====================================================
-- 3. CHECK PHASE 2: CORE FEATURES
-- =====================================================

-- Check pause RPC exists
SELECT 
    'Phase 2: Pause RPC' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'bb_pause_subscription_group'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check resume RPC exists
SELECT 
    'Phase 2: Resume RPC' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'bb_resume_subscription_group'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check cancel RPC exists
SELECT 
    'Phase 2: Cancel RPC' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'bb_cancel_subscription_group'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check auto-cancel RPC exists
SELECT 
    'Phase 2: Auto-Cancel RPC' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'bb_auto_cancel_paused_group'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check pause/cancel columns exist
SELECT 
    'Phase 2: Pause/Cancel Columns' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bb_subscription_groups' 
            AND column_name IN ('paused_at', 'cancelled_at', 'resume_date')
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check platform settings columns exist
SELECT 
    'Phase 2: Platform Settings Columns' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bb_platform_settings' 
            AND column_name IN ('pause_notice_hours', 'max_pause_days', 'cancel_notice_hours')
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check global credits table exists
SELECT 
    'Phase 2: Global Credits Table' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'bb_global_credits'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- =====================================================
-- 4. CHECK PHASE 3: BACKGROUND JOBS
-- =====================================================

-- Check job tables exist
SELECT 
    'Phase 3: Job Tables' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name IN ('bb_jobs', 'bb_job_logs')
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check job RPCs exist
SELECT 
    'Phase 3: Job RPCs' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name IN (
                'bb_create_job', 
                'bb_update_job_status', 
                'bb_log_job',
                'bb_get_pending_jobs'
            )
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- =====================================================
-- 5. CHECK PHASE 4: RAZORPAY INTEGRATION
-- =====================================================

-- Check payment method columns exist
SELECT 
    'Phase 4: Payment Method Columns' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bb_subscription_groups' 
            AND column_name IN (
                'payment_method', 
                'razorpay_customer_id', 
                'razorpay_mandate_id',
                'mandate_status',
                'mandate_expires_at'
            )
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check refund columns exist
SELECT 
    'Phase 4: Refund Columns' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bb_invoices' 
            AND column_name IN (
                'refund_id', 
                'refund_status', 
                'refund_amount',
                'refunded_at'
            )
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- Check checkout function accepts payment_method
SELECT 
    'Phase 4: Checkout Function Parameter' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.parameters 
            WHERE specific_name LIKE 'bb_create_subscription_checkout%'
            AND parameter_name = 'p_payment_method'
        ) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as status;

-- =====================================================
-- 6. SUMMARY REPORT
-- =====================================================

SELECT 
    '=== IMPLEMENTATION VERIFICATION SUMMARY ===' as summary;

-- Count all bb_* functions
SELECT 
    'Total bb_* Functions' as metric,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'bb_%';

-- Count all bb_* tables
SELECT 
    'Total bb_* Tables' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'bb_%';

-- List all critical functions
SELECT 
    'Critical Functions' as category,
    routine_name as function_name,
    CASE 
        WHEN routine_name IN (
            'bb_pause_subscription_group',
            'bb_resume_subscription_group',
            'bb_cancel_subscription_group',
            'bb_auto_cancel_paused_group',
            'bb_create_subscription_checkout',
            'bb_create_job',
            'bb_finalize_invoice_paid'
        ) THEN '✓'
        ELSE '?'
    END as verified
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'bb_%'
ORDER BY routine_name;

