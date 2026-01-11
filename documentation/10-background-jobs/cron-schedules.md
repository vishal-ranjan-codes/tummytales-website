# Cron Schedules

This document describes job schedules and timing, including when each job runs, schedule configuration, and timezone considerations.

## Overview

The BellyBox system uses 3 scheduled cron jobs to manage background tasks:

1. **Renew Subscriptions** - Daily at 00:01 UTC
2. **Payment Retry** - Every 6 hours
3. **Daily Maintenance** - Daily at 02:00 UTC (consolidates 4 maintenance tasks)

## Scheduled Jobs

### 1. Renew Subscriptions

**Path:** `/api/cron/renew-subscriptions`  
**Schedule:** `1 0 * * *` (Daily at 00:01 UTC)

**Purpose:** Creates renewal invoices for subscriptions due for renewal

**Execution:**
- Runs daily at 00:01 UTC
- Checks day of week/month internally:
  - Weekly renewals: Processes on Mondays (day 1)
  - Monthly renewals: Processes on 1st of month
- Creates cycles and invoices for due subscriptions
- Attempts auto-charge for UPI Autopay subscriptions
- Creates manual payment orders if auto-charge fails

**Notes:**
- Job runs every day but only processes subscriptions due that specific day
- Idempotent: Won't create duplicate cycles or invoices
- Uses batching: Processes 100 groups at a time
- Supports continuation jobs if timeout occurs

### 2. Payment Retry

**Path:** `/api/cron/payment-retry`  
**Schedule:** `0 */6 * * *` (Every 6 hours)

**Purpose:** Retries failed payments for pending invoices

**Execution:**
- Runs every 6 hours
- Finds invoices with `pending_payment` status
- Retries based on schedule:
  - +6h after renewal_date
  - +24h after renewal_date
  - +48h after renewal_date
- After 72h: Pauses subscription and marks invoice as `failed`
- Creates Razorpay orders for retry attempts

**Notes:**
- Processes 50 invoices per batch
- Avoids duplicate retries (checks last_retry_at)
- Sends notifications to customers on retry (TODO)

### 3. Daily Maintenance

**Path:** `/api/cron/daily-maintenance`  
**Schedule:** `0 2 * * *` (Daily at 02:00 UTC)

**Purpose:** Runs all daily maintenance tasks in a single consolidated job

**Execution:**
Runs the following tasks sequentially:

1. **Order Generation** (backup job)
   - Generates orders for cycles with paid invoices that don't have orders yet
   - Processes 50 cycles per batch
   - Idempotent: Checks for existing orders before generating

2. **Credit Expiry**
   - Marks credits as expired after expiry date
   - Processes 1000 credits per batch
   - Tracks expiry by slot and reason

3. **Trial Completion**
   - Marks trials as completed after end_date
   - Processes 100 trials per batch
   - Tracks completion by vendor

4. **Auto-Cancel Paused**
   - Cancels subscriptions paused longer than max_pause_days
   - Converts pause credits to global credits
   - Processes 50 groups per batch

**Consolidation Rationale:**
- Vercel free tier allows maximum 5 cron jobs
- Consolidating 4 daily jobs into 1 reduces from 6 to 3 total cron jobs
- All tasks are daily maintenance tasks that can run together
- Each sub-task still creates its own job record in `bb_jobs` for tracking
- Error isolation: One task failure doesn't stop others

**Notes:**
- All tasks run sequentially in order listed above
- Each task has independent error handling
- maxDuration set to 900 seconds (15 minutes) to accommodate all tasks
- Individual endpoints still exist for manual testing/debugging:
  - `/api/cron/generate-orders`
  - `/api/cron/expire-credits`
  - `/api/cron/complete-trials`
  - `/api/cron/auto-cancel-paused`

## Timezone Considerations

- All schedules are in UTC
- Server timezone: UTC (Vercel default)
- Application timezone: Asia/Kolkata (configured in `bb_platform_settings`)
- Date comparisons use application timezone for business logic

## Vercel Configuration

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/renew-subscriptions",
      "schedule": "1 0 * * *"
    },
    {
      "path": "/api/cron/payment-retry",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/daily-maintenance",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Manual Testing

All cron endpoints can be manually triggered for testing:

```bash
# Renew subscriptions
curl -X POST https://your-domain.com/api/cron/renew-subscriptions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Payment retry
curl -X POST https://your-domain.com/api/cron/payment-retry \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Daily maintenance (runs all 4 tasks)
curl -X POST https://your-domain.com/api/cron/daily-maintenance \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Individual maintenance tasks (for debugging)
curl -X POST https://your-domain.com/api/cron/generate-orders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST https://your-domain.com/api/cron/expire-credits \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST https://your-domain.com/api/cron/complete-trials \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST https://your-domain.com/api/cron/auto-cancel-paused \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

- Job execution tracked in `bb_jobs` table
- Detailed logs in `bb_job_logs` table
- Admin dashboard: `/admin/jobs` to view jobs and logs
- Vercel Dashboard → Functions → Cron for execution logs
