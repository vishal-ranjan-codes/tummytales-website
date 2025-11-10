# Getting Started with Tummy Tales

## 🎯 Quick Start Guide

Phase 0 implementation is complete! Follow these steps to get your platform up and running.

---

## Prerequisites

✅ Supabase project created and linked
✅ Phone Auth enabled in Supabase Dashboard
✅ Twilio integrated with Phone Auth
✅ `.env.local` file with all credentials

---

## Step 1: Generate TypeScript Types

Run this command to generate TypeScript types from your database schema:

```bash
npm run supabase:types
```

This will update `types/supabase.ts` with all your database types.

---

## Step 2: Start the Development Server

```bash
npm run dev
```

Your app will be available at: http://localhost:3000

---

## Step 3: Test Authentication Flows

### Sign Up as Customer
1. Go to http://localhost:3000/signup/customer
2. Enter a valid +91 phone number (10 digits)
3. Receive and enter the 6-digit OTP from Twilio
4. Enter your name and select a zone
5. Complete signup → Redirects to Customer Dashboard

### Sign Up as Vendor
1. Go to http://localhost:3000/signup/vendor
2. Enter phone + OTP
3. Enter your name, kitchen name, and zone
4. Complete signup → Redirects to Vendor Dashboard
5. See "Under Review" status banner

### Sign Up as Rider
1. Go to http://localhost:3000/signup/rider
2. Enter phone + OTP
3. Enter your name, vehicle type, and zone
4. Complete signup → Redirects to Rider Dashboard
5. See "Account Pending" status banner

### Unified Login
1. Go to http://localhost:3000/login
2. Enter phone + OTP
3. Automatically routes to:
   - Single role → That role's dashboard
   - Multiple roles → Last used role's dashboard (with role switcher available)

---

## Step 4: Create Your First Admin User

1. **Sign up as a customer first** via the UI (to create the profile)

2. **Go to Supabase Dashboard:**
   - Navigate to: SQL Editor
   - Run this query (replace with your phone):

```sql
UPDATE profiles 
SET roles = array_append(roles, 'admin'::app_role)
WHERE phone = '+919876543210'; -- Replace with your actual phone number
```

3. **Login again** and you'll see the role switcher with "Admin" option

4. **Access Admin Dashboard:**
   - http://localhost:3000/dashboard/admin
   - See platform statistics and management options

---

## Step 5: Test Multi-Role Account

1. **Sign up as customer first**
2. **Visit account page:** http://localhost:3000/dashboard/account
3. **Click "Join as Vendor"** → Go through vendor signup
4. **After signup, notice the Role Switcher** in the header
5. **Click Role Switcher** → Switch between Customer and Vendor roles
6. **Test role-based routing:**
   - Each role sees different sidebar navigation
   - Dashboard content changes based on active role

---

## Step 6: Verify SEO Setup

### Sitemap
Visit: http://localhost:3000/sitemap.xml

Should see XML with all public routes.

### Robots.txt
Visit: http://localhost:3000/robots.txt

Should see:
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /_next/

Sitemap: http://localhost:3000/sitemap.xml
```

### Structured Data
1. Visit homepage: http://localhost:3000
2. View page source (Ctrl+U or Cmd+Option+U)
3. Search for `application/ld+json`
4. Should see Organization and Website schemas

---

## Step 7: Test Role-Based Access Control

### Test 1: Access Denial
1. Login as customer (no vendor role)
2. Try to visit: http://localhost:3000/dashboard/vendor
3. Should be redirected to customer dashboard

### Test 2: Multi-Role Access
1. Login with an account that has multiple roles
2. Visit dashboards for each of your roles
3. Each should load successfully
4. Try accessing a dashboard for a role you don't have
5. Should be denied/redirected

### Test 3: Unauthenticated Access
1. Logout
2. Try to visit any dashboard URL directly
3. Should redirect to `/login?redirect=/dashboard/...`
4. After login, should redirect back to original URL

---

## Step 8: Verify Database & RLS Policies

### Check Tables
Go to Supabase Dashboard → Table Editor:
- ✅ profiles
- ✅ zones (should have 25 Delhi NCR zones)
- ✅ addresses
- ✅ vendors
- ✅ vendor_media
- ✅ vendor_docs
- ✅ meals
- ✅ ratings
- ✅ riders
- ✅ rider_docs
- ✅ audit_log

### Check Storage Buckets
Go to Supabase Dashboard → Storage:
- ✅ vendor-media (public)
- ✅ vendor-docs (private)
- ✅ rider-docs (private)
- ✅ profile-photos (public)

### Test RLS Policies
1. **As Customer:**
   - Can read own profile
   - Cannot read other profiles
   - Can read all active vendors (public)
   - Cannot read vendor documents

2. **As Vendor:**
   - Can read/update own vendor row
   - Can upload to vendor-media and vendor-docs
   - Cannot access other vendor's documents

3. **As Admin:**
   - Can read all profiles
   - Can read all vendors
   - Can read all documents
   - Can manage zones

---

## Common Issues & Solutions

### Issue: OTP Not Receiving
**Cause:** Twilio not configured or test credentials exhausted
**Solution:**
- Check Twilio dashboard for SMS logs
- Verify phone number format (+91XXXXXXXXXX)
- Check Supabase logs for errors

### Issue: Database Error on Signup
**Cause:** RLS policies or triggers not applied
**Solution:**
```bash
# Re-apply migrations
npx supabase db push
```

### Issue: Type Errors
**Cause:** TypeScript types out of sync with database
**Solution:**
```bash
# Regenerate types
npm run supabase:types
```

### Issue: Role Switcher Not Showing
**Cause:** User only has one role
**Solution:**
- Role switcher only shows for multi-role accounts
- Join as vendor/rider from account page to add more roles

### Issue: Access Denied to Dashboard
**Cause:** User doesn't have required role
**Solution:**
- Check user's roles in profiles table
- Ensure role is properly assigned during signup
- For admin, manually update via SQL

---

## Development Workflow

### Adding New Features
1. Create database migrations in `supabase/migrations/`
2. Run `npx supabase db push` to apply
3. Run `npm run supabase:types` to update types
4. Build UI components
5. Test RLS policies thoroughly

### Recommended Order for Phase 1
1. Vendor onboarding wizard
2. Vendor profile & media management
3. Menu management
4. Public vendor pages
5. Admin approval system

---

## Environment Variables Reference

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_REF=xxx

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Key URLs

### User-Facing
- Homepage: http://localhost:3000
- Login: http://localhost:3000/login
- Signup Customer: http://localhost:3000/signup/customer
- Signup Vendor: http://localhost:3000/signup/vendor
- Signup Rider: http://localhost:3000/signup/rider

### Dashboards
- Customer: http://localhost:3000/dashboard/customer
- Vendor: http://localhost:3000/dashboard/vendor
- Rider: http://localhost:3000/dashboard/rider
- Admin: http://localhost:3000/dashboard/admin
- Account: http://localhost:3000/dashboard/account

### SEO
- Sitemap: http://localhost:3000/sitemap.xml
- Robots: http://localhost:3000/robots.txt

---

## Next Steps

Once you've verified everything works:

1. ✅ **Test all authentication flows**
2. ✅ **Create admin user and test admin dashboard**
3. ✅ **Verify RLS policies by attempting unauthorized access**
4. ✅ **Test mobile responsiveness**
5. ✅ **Check SEO elements**
6. 🚀 **Ready for Phase 1!**

---

## Need Help?

- Check `PHASE_0_COMPLETE.md` for implementation details
- Review `prd/tummy-tales-dev.plan.md` for the full plan
- Check Supabase logs for backend errors
- Check browser console for frontend errors

---

## Success Criteria

✅ Can sign up as customer, vendor, and rider
✅ Can login with OTP
✅ Multi-role accounts work with role switcher
✅ Each dashboard loads correctly with role-based content
✅ Middleware blocks unauthorized access
✅ RLS policies prevent data leaks
✅ SEO elements (sitemap, robots, structured data) are working
✅ Mobile responsive design works
✅ Dark mode works

**If all above are ✅, Phase 0 is successfully complete!** 🎉

