# Phase 2 Setup Complete ✅

This document summarizes what has been completed and what needs to be done.

## ✅ Completed Automatically

### 1. Cron Job Configuration
- ✅ Created `vercel.json` with Vercel cron configuration
- ✅ Cron job scheduled to run daily at 2 AM UTC
- ✅ Endpoint: `/api/cron/generate-orders`

**Configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-orders",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 2. Cron Endpoint
- ✅ Endpoint already exists at `app/api/cron/generate-orders/route.ts`
- ✅ Supports both GET and POST
- ✅ Accepts optional `date` query parameter (defaults to tomorrow)
- ✅ Generates orders for active subscriptions

## ⚠️ Needs Manual Action

### 1. TypeScript Types Generation
The `npm run supabase:types` command is hanging due to the same Supabase CLI linking issue.

**Options:**

**Option A: Generate types via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/cattdmoqqevxzeljkuut/settings/api
2. Scroll to "TypeScript Types" section
3. Copy the generated types
4. Replace contents of `types/supabase.ts` with the generated types

**Option B: Try types generation again later**
- The CLI linking issue may resolve itself
- Run: `npm run supabase:types`
- If it works, it will update `types/supabase.ts` automatically

### 2. Testing Setup

**Test 7a: Subscription Flow**
1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:3000/homechefs
3. Click on a vendor
4. Click "Subscribe Now"
5. Complete the 6-step subscription wizard:
   - Choose Plan
   - Customize (preferences)
   - Delivery Address
   - Payment (Razorpay test mode)
   - Confirmation
6. Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

**Test 7b: Webhook (requires public URL)**
- Webhooks won't work with `localhost`
- For testing, use ngrok or deploy to staging:
  ```bash
  # Install ngrok
  ngrok http 3000
  
  # Use ngrok URL in Razorpay webhook settings
  # Example: https://abc123.ngrok.io/api/payments/razorpay/webhook
  ```
- After setting up webhook:
  1. Complete a test subscription
  2. Check Razorpay Dashboard → Webhooks → Logs
  3. Verify payment record in Supabase `payments` table
  4. Verify subscription status updated to 'active'

**Test 7c: Order Generation (Local)**
```bash
# Test for tomorrow (default)
curl http://localhost:3000/api/cron/generate-orders

# Test for specific date
curl "http://localhost:3000/api/cron/generate-orders?date=2024-12-20"

# With POST (if needed)
curl -X POST http://localhost:3000/api/cron/generate-orders
```

**Test 7c: Order Generation (Production)**
Once deployed, Vercel will automatically trigger the cron job daily at 2 AM UTC.

You can also manually trigger it:
```bash
curl https://yourdomain.com/api/cron/generate-orders
```

## 📋 Checklist

- [x] Database migrations applied
- [x] Razorpay webhook configured (production URL needed)
- [x] Razorpay webhook events selected:
  - [x] payment.authorized
  - [x] payment.captured
  - [x] payment.failed
  - [x] refund.created
- [x] Sample plans inserted
- [x] Vercel cron configured
- [ ] TypeScript types regenerated (manual action needed)
- [ ] Subscription flow tested
- [ ] Webhook tested (requires public URL)
- [ ] Order generation tested

## 🔗 Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/cattdmoqqevxzeljkuut
- **Razorpay Dashboard:** https://dashboard.razorpay.com/
- **Vercel Dashboard:** (your project URL)

## 📝 Next Steps

1. **Regenerate TypeScript types** (see options above)
2. **Test subscription flow** locally
3. **Deploy to staging/production** for webhook testing
4. **Set up webhook** with production URL
5. **Monitor cron job** after deployment

## 🐛 Troubleshooting

**Cron job not running?**
- Check Vercel logs: Vercel Dashboard → Your Project → Functions → Cron
- Verify `vercel.json` is committed and deployed
- Check endpoint is accessible: `curl https://yourdomain.com/api/cron/generate-orders`

**Webhook not receiving events?**
- Verify webhook URL is publicly accessible
- Check Razorpay Dashboard → Webhooks → Logs for delivery status
- Verify webhook secret in environment variables
- Check server logs for incoming webhook requests

**Order generation issues?**
- Check server logs for errors
- Verify subscriptions exist and are active
- Verify subscription preferences are configured
- Check vendor capacity settings

