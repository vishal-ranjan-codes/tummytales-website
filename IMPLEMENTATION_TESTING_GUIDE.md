# Implementation Testing Guide
**Date:** January 2025  
**Purpose:** Comprehensive testing guide for verifying Phase 1-4 implementation

---

## Quick Start

### 1. Run File Verification
```bash
node scripts/verify-files.js
```

### 2. Run Database Verification
```sql
-- Connect to Supabase and run:
\i scripts/verify-implementation.sql
```

### 3. Manual Testing Checklist
See `TESTING_CHECKLIST.md` for detailed test scenarios.

---

## Testing Approach

### Phase 1: Critical Fixes ✅
**Status:** Implemented  
**Focus:** Verify fixes work correctly

**Key Tests:**
1. Cycle boundaries calculation
2. Skip cutoff calculation
3. Order generation after payment
4. Invoice date display
5. Skip limits display
6. Credits display

### Phase 2: Core Features ✅
**Status:** Implemented  
**Focus:** Verify pause/cancel functionality

**Key Tests:**
1. Pause subscription flow
2. Resume subscription flow
3. Cancel subscription flow
4. Refund processing
5. Management actions UI

### Phase 3: Background Jobs ✅
**Status:** Implemented  
**Focus:** Verify job execution and tracking

**Key Tests:**
1. Job creation and tracking
2. Renewal job execution
3. Payment retry job
4. Credit expiry job
5. Job monitoring UI

### Phase 4: Dashboard & Razorpay ✅
**Status:** Implemented (Tasks 4.1 & 4.2)  
**Focus:** Verify payment methods and customer dashboard

**Key Tests:**
1. Payment method selection
2. UPI Autopay setup
3. Auto-charge on renewal
4. Customer dashboard enhancements
5. Payments page

---

## Critical Test Scenarios

### Scenario 1: Complete Subscription Lifecycle
```
1. Create subscription → 2. Pay → 3. View orders → 
4. Skip order → 5. View credits → 6. Pause → 
7. Resume → 8. Cancel with refund
```

### Scenario 2: UPI Autopay Flow
```
1. Create subscription with UPI Autopay → 
2. Authorize mandate → 3. Wait for renewal → 
4. Verify auto-charge → 5. View payment history
```

### Scenario 3: Background Jobs
```
1. Trigger renewal job → 2. Check job created → 
3. View job logs → 4. Verify invoices created → 
5. Verify auto-charge attempted
```

---

## Database Verification

### Check Critical Functions
```sql
-- Pause/Resume/Cancel functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN (
  'bb_pause_subscription_group',
  'bb_resume_subscription_group',
  'bb_cancel_subscription_group',
  'bb_auto_cancel_paused_group'
);

-- Job management functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'bb_%job%';

-- Checkout function with payment_method
SELECT p.parameter_name, p.data_type
FROM information_schema.parameters p
JOIN information_schema.routines r ON p.specific_name = r.specific_name
WHERE r.routine_name = 'bb_create_subscription_checkout'
AND p.parameter_name = 'p_payment_method';
```

### Check Critical Tables
```sql
-- Job tracking tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('bb_jobs', 'bb_job_logs');

-- Global credits table
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'bb_global_credits';

-- Check columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bb_subscription_groups' 
AND column_name IN (
  'payment_method', 'razorpay_customer_id', 
  'razorpay_mandate_id', 'paused_at', 'cancelled_at'
);
```

---

## API Endpoint Testing

### Test Renewal Job
```bash
curl -X POST https://your-domain.com/api/cron/renew-subscriptions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Payment Retry Job
```bash
curl -X POST https://your-domain.com/api/cron/payment-retry \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Daily Maintenance Job (Consolidated)
```bash
curl -X POST https://your-domain.com/api/cron/daily-maintenance \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** The daily maintenance job runs 4 tasks sequentially:
1. Order generation (backup)
2. Credit expiry
3. Trial completion
4. Auto-cancel paused subscriptions

Individual endpoints still exist for manual testing/debugging:
```bash
# Test individual tasks (for debugging only)
curl -X POST https://your-domain.com/api/cron/generate-orders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST https://your-domain.com/api/cron/expire-credits \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST https://your-domain.com/api/cron/complete-trials \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

curl -X POST https://your-domain.com/api/cron/auto-cancel-paused \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## UI Testing Checklist

### Customer Dashboard
- [ ] Subscriptions list shows skip remaining
- [ ] Subscriptions list shows credits
- [ ] Quick actions (Pause/Cancel) work
- [ ] Orders page filters work
- [ ] Orders page export works
- [ ] Payments page displays correctly
- [ ] Payments page filters work

### Subscription Details
- [ ] Pause button visible (for active)
- [ ] Resume button visible (for paused)
- [ ] Cancel button visible
- [ ] Skip remaining displayed
- [ ] Credits displayed correctly
- [ ] Management actions work

### Checkout Flow
- [ ] Payment method selector visible
- [ ] Can select Manual Payment
- [ ] Can select UPI Autopay
- [ ] Payment method stored correctly

### Admin Dashboard
- [ ] Jobs page accessible
- [ ] Jobs list displays correctly
- [ ] Can view job details
- [ ] Can view job logs
- [ ] Can retry failed jobs

---

## Known Limitations

### Not Implemented (Phase 4)
- **Task 4.3:** Vendor Dashboard Enhancements
- **Task 4.4:** Admin Dashboard Enhancements (partial - jobs page exists)
- **Task 4.5:** Design Consistency Fixes

### TODOs Present
- Notification system (multiple files)
- Some Razorpay API integration details may need adjustment

---

## Next Steps

1. **Run File Verification**
   ```bash
   node scripts/verify-files.js
   ```

2. **Run Database Verification**
   - Connect to Supabase
   - Run `scripts/verify-implementation.sql`

3. **Manual Testing**
   - Follow `TESTING_CHECKLIST.md`
   - Test critical scenarios
   - Test with Razorpay sandbox

4. **Performance Testing**
   - Test renewal job with large dataset
   - Test payment retry job
   - Monitor job execution times

5. **Security Testing**
   - Verify RLS policies
   - Test webhook signature verification
   - Test payment method validation

---

## Success Criteria

✅ **Phase 1 Complete:** All critical fixes verified  
✅ **Phase 2 Complete:** Pause/cancel features working  
✅ **Phase 3 Complete:** Background jobs running correctly  
✅ **Phase 4 Complete:** Tasks 4.1 & 4.2 implemented and tested  

**Ready for:** Production deployment (after comprehensive testing)

---

**Last Updated:** January 2025

