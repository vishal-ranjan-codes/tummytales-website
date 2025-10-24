# Supabase SMS OTP Setup Guide

## Current Issue
OTP SMS messages are not being received on the phone.

## Required Setup in Supabase Dashboard

### 1. Enable Phone Auth Provider

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
2. Navigate to **Authentication** > **Providers**
3. Find **Phone** in the providers list
4. Click on **Phone** to configure it
5. **Enable** the Phone provider (toggle should be ON)

### 2. Configure Twilio Integration

#### Get Twilio Credentials
1. Log in to your Twilio account: https://www.twilio.com/console
2. Find your **Account SID** and **Auth Token** from the Twilio Console Dashboard
3. Get a **Twilio Phone Number** (or Messaging Service SID)

#### Configure in Supabase
1. In Supabase Dashboard > **Authentication** > **Providers** > **Phone**
2. Scroll down to **SMS Provider** section
3. Select **Twilio** as the provider
4. Enter your Twilio credentials:
   - **Twilio Account SID**
   - **Twilio Auth Token**
   - **Twilio Message Service SID** (or Twilio Phone Number)
5. Click **Save**

### 3. Configure SMS Template (Optional)
In the Phone provider settings, you can customize the SMS template:
```
Your Tummy Tales verification code is: {{ .Code }}
```

### 4. Test OTP Configuration

#### Option 1: Use Test Phone Number (Development)
1. In Supabase Dashboard > **Authentication** > **Providers** > **Phone**
2. Scroll to **Test Phone Numbers** section
3. Add a test phone number with a fixed OTP code (e.g., `+919999999999` → `123456`)
4. This allows testing without consuming Twilio credits

#### Option 2: Test with Real Phone Number
1. Open browser console (F12)
2. Try to sign up/log in
3. Check console logs for detailed error messages:
   - `📱 Attempting to send OTP to: +91XXXXXXXXXX`
   - `🔴 OTP send error details:` (if there's an error)
   - `✅ OTP sent successfully` (if successful)

## Common Issues & Solutions

### Issue 1: "Phone provider not configured"
**Solution:**
- Verify Phone Auth is enabled in Supabase Dashboard
- Ensure Twilio credentials are correctly entered
- Check that Twilio account is active and has credits

### Issue 2: "Invalid phone number"
**Solution:**
- Ensure phone number is in E.164 format: `+91XXXXXXXXXX`
- Indian mobile numbers must:
  - Start with 6, 7, 8, or 9
  - Be exactly 10 digits long
  - Example: `+919876543210`

### Issue 3: Rate Limiting
**Solution:**
- Supabase has rate limits on OTP sending
- Default: 30 SMS per hour
- Wait a few minutes between attempts
- Use test phone numbers for development

### Issue 4: Twilio Account Issues
**Solution:**
- Verify Twilio account has sufficient credits
- Check Twilio phone number or Messaging Service is active
- Verify Twilio phone number can send SMS to Indian numbers
- Check Twilio Console > Monitor > Logs for failed message attempts

### Issue 5: Phone Number Not Receiving SMS
**Solution:**
- Check if the phone number is registered with DND (Do Not Disturb) in India
- Verify the SIM card is active and can receive SMS
- Try with a different phone number
- Check Twilio logs to see if message was sent successfully

## Environment Variables Check

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=your-project-ref
```

## Testing Procedure

1. **Open Browser Console** (F12) to see detailed logs
2. **Navigate to** `/signup/customer` or `/login`
3. **Enter a valid Indian mobile number** (format: +91XXXXXXXXXX or just XXXXXXXXXX)
4. **Click "Send OTP Code"**
5. **Check console for**:
   - Phone number format after validation
   - Supabase API request details
   - Any error messages with details

## Debug Commands

You can add this to any page to test OTP configuration:

```typescript
import { testOTPSend, debugOTPSetup } from '@/lib/auth/otp-debug'

// Test OTP configuration
const debug = await debugOTPSetup()
console.log('OTP Debug Info:', debug)

// Test sending OTP
const result = await testOTPSend('+919876543210')
console.log('OTP Test Result:', result)
```

## Twilio-Specific Setup for India

### Enable India Geo Permissions
1. Go to Twilio Console > **Settings** > **Geo Permissions**
2. Ensure **India (IN)** is **enabled** for SMS
3. Click **Save**

### Verify Twilio Number Capabilities
1. Go to Twilio Console > **Phone Numbers** > **Manage** > **Active Numbers**
2. Click on your Twilio number
3. Ensure **SMS** capability is enabled under **Messaging**
4. Check **Messaging Geographic Permissions** includes India

### Twilio Messaging Service (Recommended)
Instead of using a single Twilio phone number, create a Messaging Service:
1. Go to Twilio Console > **Messaging** > **Services**
2. Create a new Messaging Service
3. Add your Twilio phone numbers to the service
4. Use the **Messaging Service SID** in Supabase (instead of phone number)

## Next Steps

1. ✅ Verify Supabase Phone Auth is enabled
2. ✅ Verify Twilio credentials are correct in Supabase
3. ✅ Check Twilio account has credits and can send to India
4. ✅ Test with browser console open to see detailed error messages
5. ✅ Try with a test phone number first
6. ✅ Check Twilio logs for message delivery status

## Support

If the issue persists:
1. Check Supabase Auth logs: Dashboard > **Authentication** > **Logs**
2. Check Twilio logs: Console > **Monitor** > **Logs** > **Messaging**
3. Look for the specific error message in browser console
4. Contact Supabase support if it's a configuration issue
5. Contact Twilio support if messages are not being delivered

