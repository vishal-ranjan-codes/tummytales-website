# Email Authentication Integration with Feature Flags

## Overview

Add email authentication to the existing multi-role auth system, making it easy to test different auth combinations (OAuth only, email only, phone only, or any combination) via environment variables.

## Current State (Verified from Codebase)

### ✅ Already Implemented

- Phone OTP authentication with Twilio (fully working in `lib/auth/otp.ts`)
- Login page (`app/(auth)/login/page.tsx`) with phone OTP flow
- Signup pages for all roles (`/signup/customer`, `/signup/vendor`, `/signup/rider`)
- Role-based routing (`lib/auth/role-router.ts`, `lib/auth/role-guard.ts`)
- Complete database schema (profiles, vendors, riders, zones in `supabase/migrations/001_initial_schema.sql`)
- Multi-role support in profiles table with roles array
- Dashboard pages (`/customer`, `/vendor`, `/rider`, `/admin`, `/account`)
- Auth components (PhoneInput, OTPInput, ResendOTPButton, AuthError, RoleSelector)
- Phone validation utilities (`lib/auth/phone-validator.ts`)
- Role management utilities (`lib/auth/role-utils.ts`, `lib/auth/role-types.ts`)

### ❌ NOT Implemented (To Be Built)

- **Google OAuth** - Enabled in Supabase Dashboard but NO code implementation
- **Email Auth** - Enabled in Supabase Dashboard but NO code implementation
- **Auth config system** with environment-based feature flags
- **Email/OAuth components** (EmailInput, GoogleButton, OAuthDivider, PhoneVerificationStep)
- **Account linking** by email (merge duplicate accounts)
- **Onboarding pages** (`/onboarding/customer`, `/onboarding/vendor`, `/onboarding/rider`)
- **/homechefs** vendor browsing page
- **Vendor components** (VendorCard, VendorGrid, VendorFilters)
- **Middleware updates** for onboarding routes and smart redirects
- **Dashboard redirect rules** (customer → /homechefs, others → dashboards)
- **Auto-redirect** logged-in users from login/signup pages

## Goals

1. Implement Google OAuth authentication from scratch
2. Implement email authentication with OTP verification
3. Create flexible feature flag system to enable/disable any auth method
4. Support account linking by email (merge accounts with same email)
5. Build role-specific onboarding flows (customer/vendor/rider)
6. Create /homechefs vendor browsing page
7. Implement smart login redirects (customer → /homechefs, others → dashboards)
8. Add dashboard access guards with proper redirects
9. Make it trivial to switch between auth flows for testing via environment variables

---

## Implementation Plan

### 1. Environment Configuration System

**File: `lib/auth/config.ts`**

Create centralized auth configuration that reads from environment variables:

```typescript
export const authConfig = {
  // Feature flags
  enableOAuth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true',
  enableEmail: process.env.NEXT_PUBLIC_ENABLE_EMAIL === 'true',
  enablePhone: process.env.NEXT_PUBLIC_ENABLE_PHONE === 'true',
  
  // Display order (comma-separated: 'oauth,email,phone')
  displayOrder: process.env.NEXT_PUBLIC_AUTH_DISPLAY_ORDER?.split(',') || ['oauth', 'email', 'phone'],
  
  // Verification requirements
  requirePhoneVerification: process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true',
  emailRequireOTP: process.env.NEXT_PUBLIC_EMAIL_REQUIRE_OTP !== 'false', // default true
  
  // Testing flags
  skipPhoneOTPInDev: process.env.NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV === 'true',
  authTestMode: process.env.NEXT_PUBLIC_AUTH_TEST_MODE === 'true',
}

// Helper to get enabled methods in display order
export function getEnabledAuthMethods() {
  const enabled = [];
  if (authConfig.enableOAuth) enabled.push('oauth');
  if (authConfig.enableEmail) enabled.push('email');
  if (authConfig.enablePhone) enabled.push('phone');
  
  // Sort by display order
  return enabled.sort((a, b) => {
    const aIndex = authConfig.displayOrder.indexOf(a);
    const bIndex = authConfig.displayOrder.indexOf(b);
    return aIndex - bIndex;
  });
}
```

**Environment variables to add:**

```bash
# Feature flags
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone

# Verification requirements
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true

# Testing flags
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

---

### 2. Database Schema Updates

**Migration: `supabase/migrations/005_email_auth.sql`**

Update `profiles` table to support email auth:

```sql
-- Add email auth fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'phone' CHECK (auth_provider IN ('phone', 'email', 'google', 'facebook', 'apple')),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Update handle_new_user trigger to set auth_provider
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, auth_provider)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.phone,
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
      WHEN NEW.app_metadata->>'provider' = 'email' THEN 'email'
      WHEN NEW.phone IS NOT NULL THEN 'phone'
      ELSE 'email'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 3. Email Authentication Service

**File: `lib/auth/email.ts`**

```typescript
import { createClient } from '@/lib/supabase/client';

export async function sendEmailOTP(email: string) {
  const supabase = createClient();
  
  // Check if test mode
  if (authConfig.authTestMode) {
    console.log('[TEST MODE] Skipping email OTP send for:', email);
    return { success: true, testMode: true };
  }
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    }
  });
  
  if (error) {
    console.error('Email OTP error:', error);
    throw new Error(error.message);
  }
  
  return { success: true, data };
}

export async function verifyEmailOTP(email: string, token: string) {
  const supabase = createClient();
  
  // Check if test mode
  if (authConfig.authTestMode) {
    console.log('[TEST MODE] Auto-verifying email:', email);
    // In test mode, create session without OTP
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'test-mode-bypass'
    });
    
    if (error) {
      // Create user if doesn't exist
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: 'test-mode-bypass',
      });
      if (signUpError) throw signUpError;
    }
    
    return { success: true, testMode: true };
  }
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });
  
  if (error) {
    console.error('Email OTP verification error:', error);
    throw new Error(error.message);
  }
  
  return { success: true, data };
}
```

**File: `lib/auth/validators.ts`**

Add email validation:

```typescript
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}
```

---

### 4. Account Linking Logic

**File: `lib/auth/account-linking.ts`**

```typescript
import { createClient } from '@/lib/supabase/server';

export async function linkAccountByEmail(email: string, userId: string) {
  const supabase = await createClient();
  
  // Check if another profile exists with this email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .neq('id', userId)
    .single();
  
  if (existingProfile) {
    // Merge accounts: combine roles, keep older account
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (currentProfile) {
      // Merge roles (union of both)
      const mergedRoles = Array.from(new Set([
        ...(existingProfile.roles || []),
        ...(currentProfile.roles || [])
      ]));
      
      // Update existing profile with merged data
      await supabase
        .from('profiles')
        .update({
          roles: mergedRoles,
          // Keep newer auth provider
          auth_provider: currentProfile.auth_provider,
          phone: currentProfile.phone || existingProfile.phone,
          phone_verified: currentProfile.phone_verified || existingProfile.phone_verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id);
      
      // Delete duplicate profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      return { merged: true, targetProfileId: existingProfile.id };
    }
  }
  
  return { merged: false };
}
```

---

### 5. Update Login Page with Dynamic Auth Methods

**File: `app/(auth)/login/page.tsx`**

Update to show auth methods based on feature flags:

```typescript
'use client';

import { authConfig, getEnabledAuthMethods } from '@/lib/auth/config';
import GoogleButton from '@/app/components/auth/GoogleButton';
import PhoneInput from '@/app/components/auth/PhoneInput';
import EmailInput from '@/app/components/auth/EmailInput';
import OAuthDivider from '@/app/components/auth/OAuthDivider';

export default function LoginPage() {
  const enabledMethods = getEnabledAuthMethods();
  const showOAuth = enabledMethods.includes('oauth');
  const showEmail = enabledMethods.includes('email');
  const showPhone = enabledMethods.includes('phone');
  
  return (
    <div className="login-container">
      <h1>Welcome to Tummy Tales</h1>
      
      {/* OAuth Buttons */}
      {showOAuth && (
        <div className="oauth-section">
          <GoogleButton />
          {/* Facebook/Apple buttons when enabled */}
        </div>
      )}
      
      {/* Divider if multiple methods */}
      {showOAuth && (showEmail || showPhone) && <OAuthDivider />}
      
      {/* Email Login */}
      {showEmail && (
        <EmailLoginForm />
      )}
      
      {/* Divider between email and phone */}
      {showEmail && showPhone && <OAuthDivider text="or" />}
      
      {/* Phone Login */}
      {showPhone && (
        <PhoneLoginForm />
      )}
      
      {/* Signup Links */}
      <div className="signup-links">
        <p>Don't have an account?</p>
        <a href="/signup">Sign up as Customer</a>
      </div>
    </div>
  );
}
```

---

### 6. Email Signup Flow

**File: `app/(auth)/signup/customer/page.tsx`**

Update customer signup to support email:

```typescript
const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'oauth'>('email');
const [email, setEmail] = useState('');
const [emailOTP, setEmailOTP] = useState('');
const [emailVerified, setEmailVerified] = useState(false);
const [phone, setPhone] = useState('');
const [phoneOTP, setPhoneOTP] = useState('');
const [phoneVerified, setPhoneVerified] = useState(false);

// Step 1: Email verification (if email auth)
if (!emailVerified && authMethod === 'email') {
  return <EmailVerificationStep />;
}

// Step 2: Phone collection (always after email)
if (emailVerified && !phoneVerified && authConfig.requirePhoneVerification) {
  return <PhoneVerificationStep />;
}

// Step 3: Profile completion
return <ProfileCompletionStep />;
```

**Server Action: `lib/actions/auth-actions.ts`**

Update signup actions:

```typescript
export async function createCustomerAccount(data: {
  fullName: string;
  email?: string;
  phone?: string;
  zoneId: string;
  authProvider: 'email' | 'phone' | 'google';
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Check for account linking by email
  if (data.email) {
    const linkResult = await linkAccountByEmail(data.email, user.id);
    if (linkResult.merged) {
      redirect(`/customer-dashboard`);
      return;
    }
  }
  
  // Create/update profile
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      zone_id: data.zoneId,
      roles: ['customer'],
      default_role: 'customer',
      auth_provider: data.authProvider,
      email_verified: data.authProvider === 'email' || data.authProvider === 'google',
      phone_verified: data.authProvider === 'phone' || !authConfig.requirePhoneVerification,
    });
  
  if (error) throw error;
  
  revalidatePath('/customer-dashboard');
  redirect('/customer-dashboard');
}
```

---

### 7. Phone Verification After Email Signup

**Component: `app/components/auth/PhoneVerificationStep.tsx`**

```typescript
'use client';

import { useState } from 'react';
import PhoneInput from './PhoneInput';
import OTPInput from './OTPInput';
import { sendPhoneOTP, verifyPhoneOTP } from '@/lib/auth/otp';
import { authConfig } from '@/lib/auth/config';

export default function PhoneVerificationStep({ onComplete }: { onComplete: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const handleSendOTP = async () => {
    // If skip OTP in dev mode, auto-verify
    if (authConfig.skipPhoneOTPInDev || authConfig.authTestMode) {
      console.log('[DEV MODE] Skipping phone OTP for:', phone);
      onComplete(phone);
      return;
    }
    
    await sendPhoneOTP(phone);
    setOtpSent(true);
  };
  
  const handleVerifyOTP = async () => {
    await verifyPhoneOTP(phone, otp);
    onComplete(phone);
  };
  
  return (
    <div>
      <h2>Verify Your Phone Number</h2>
      <p>We'll use this to notify you about orders</p>
      
      {!otpSent ? (
        <>
          <PhoneInput value={phone} onChange={setPhone} />
          <button onClick={handleSendOTP}>
            {authConfig.skipPhoneOTPInDev ? 'Continue' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <OTPInput value={otp} onChange={setOtp} />
          <button onClick={handleVerifyOTP}>Verify</button>
        </>
      )}
    </div>
  );
}
```

---

### 8. Email Components

**Component: `app/components/auth/EmailInput.tsx`**

```typescript
'use client';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function EmailInput({ value, onChange, error, disabled }: EmailInputProps) {
  return (
    <div className="email-input-container">
      <label htmlFor="email">Email Address</label>
      <input
        id="email"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "email-error" : undefined}
        className={error ? 'input-error' : ''}
      />
      {error && (
        <span id="email-error" className="error-message">{error}</span>
      )}
    </div>
  );
}
```

**Component: `app/components/auth/OAuthDivider.tsx`**

```typescript
export default function OAuthDivider({ text = 'OR' }: { text?: string }) {
  return (
    <div className="oauth-divider">
      <div className="line" />
      <span className="text">{text}</span>
      <div className="line" />
    </div>
  );
}
```

---

### 9. Update Supabase Email Templates

In Supabase Dashboard → Authentication → Email Templates:

**Confirm Signup Template:**

```
<h2>Welcome to Tummy Tales!</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; letter-spacing: 8px;">{{ .Token }}</h1>
<p>Enter this code to complete your signup.</p>
<p>This code expires in 60 minutes.</p>
```

**Magic Link Template:**

```
<h2>Sign in to Tummy Tales</h2>
<p>Click the link below to sign in:</p>
<a href="{{ .ConfirmationURL }}">Sign in to Tummy Tales</a>
<p>Or enter this code manually:</p>
<h1 style="font-size: 32px; letter-spacing: 8px;">{{ .Token }}</h1>
```

---

### 10. Testing Configuration Presets

Create example `.env` files for different scenarios:

**`.env.example.production`**

```bash
# All methods enabled, full verification
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

**`.env.example.dev-oauth-only`**

```bash
# OAuth only, skip phone OTP to save costs
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,phone
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # Save money
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

**`.env.example.test-email`**

```bash
# Email only, test mode (no OTPs sent)
NEXT_PUBLIC_ENABLE_OAUTH=false
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=email,phone
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_AUTH_TEST_MODE=true  # Skip all OTPs
```

---

## Files to Create/Update

### New Files

1. `lib/auth/config.ts` - Centralized auth configuration
2. `lib/auth/email.ts` - Email OTP service
3. `lib/auth/validators.ts` - Email/phone validation
4. `lib/auth/account-linking.ts` - Account merging logic
5. `app/components/auth/EmailInput.tsx` - Email input component
6. `app/components/auth/OAuthDivider.tsx` - Divider component
7. `app/components/auth/PhoneVerificationStep.tsx` - Phone verification after email
8. `supabase/migrations/005_email_auth.sql` - Email auth schema
9. `.env.example.production` - Production config
10. `.env.example.dev-oauth-only` - Dev config
11. `.env.example.test-email` - Testing config

### Updated Files

1. `app/(auth)/login/page.tsx` - Dynamic auth method display
2. `app/(auth)/signup/customer/page.tsx` - Email signup support
3. `app/(auth)/signup/vendor/page.tsx` - Email signup support
4. `app/(auth)/signup/rider/page.tsx` - Email signup support
5. `lib/actions/auth-actions.ts` - Account linking in signup
6. `lib/auth/otp.ts` - Add test mode support
7. `prd/PRD.md` - Update authentication section
8. `prd/tummy-tales-dev.plan.md` - Update Phase 0 auth plan

---

## User Journey Examples

### Journey 1: Email Signup with Phone Verification (Production)

```
1. User enters email → Send OTP
2. User verifies email OTP
3. Ask for phone number → Send OTP
4. User verifies phone OTP
5. Complete profile (name, zone)
6. Redirect to /customer-dashboard
```

### Journey 2: OAuth with Phone (Dev Mode, Skip OTP)

```
1. Click "Sign in with Google" → OAuth
2. Ask for phone number
3. Click "Continue" (no OTP sent, auto-verified)
4. Redirect to /customer-dashboard
```

### Journey 3: Email Only Testing (Test Mode)

```
1. User enters email
2. Click "Continue" (no OTP sent, auto-verified)
3. Ask for phone
4. Click "Continue" (no OTP sent, auto-verified)
5. Complete profile
6. Redirect to /customer-dashboard
```

---

---

### 11. Role-Based Onboarding Flows

After authentication, users are guided through role-specific onboarding before accessing their dashboard.

**Database Updates:**

Add onboarding status tracking to profiles and role tables:

```sql
-- Add to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add to vendors table
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started' 
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed'));

-- Add to riders table
ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed'));
```

#### Customer Onboarding (Minimal)

**Page: `app/(auth)/onboarding/customer/page.tsx`**

Simple single-step form:

- Collect full name
- Select zone (dropdown)
- Click "Start Browsing"
- Mark `onboarding_completed = true`
- Redirect to `/homechefs`
```typescript
export default function CustomerOnboarding() {
  const [fullName, setFullName] = useState('');
  const [zoneId, setZoneId] = useState('');
  
  const handleComplete = async () => {
    await createCustomerProfile({ fullName, zoneId });
    router.push('/homechefs'); // Browse vendors page
  };
  
  return (
    <div className="onboarding-container">
      <h1>Welcome to Tummy Tales!</h1>
      <p>Let's get you started</p>
      <input placeholder="Your Name" value={fullName} onChange={...} />
      <select value={zoneId} onChange={...}>
        <option>Select your zone</option>
        {/* Zones from DB */}
      </select>
      <button onClick={handleComplete}>Start Browsing</button>
    </div>
  );
}
```


#### Vendor Onboarding (Multi-Step Wizard)

**Page: `app/(auth)/onboarding/vendor/page.tsx`**

4-step wizard with progress indicator:

**Step 1: Basic Info**

- Homechef name (display name on platform)
- Kitchen name (your business name)

**Step 2: Location**

- Kitchen address (with Google Maps autocomplete)
- Auto-detect or manually select zone

**Step 3: Zone Confirmation**

- Confirm detected zone
- Select from dropdown if auto-detect failed

**Step 4: License (Optional)**

- FSSAI number (optional for now)
- Mark `onboarding_status = 'completed'`
- Redirect to `/vendor` with banner: "Complete your profile to go live"
```typescript
export default function VendorOnboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    homechefName: '',
    kitchenName: '',
    address: '',
    zoneId: '',
    fssaiNumber: ''
  });
  
  const handleComplete = async () => {
    await createVendorProfile(data);
    router.push('/vendor'); // Dashboard with completion banner
  };
  
  return (
    <WizardContainer currentStep={step} totalSteps={4}>
      {step === 1 && <BasicInfoStep />}
      {step === 2 && <LocationStep />}
      {step === 3 && <ZoneConfirmationStep />}
      {step === 4 && <LicenseStep />}
    </WizardContainer>
  );
}
```


#### Rider Onboarding (Multi-Step Wizard)

**Page: `app/(auth)/onboarding/rider/page.tsx`**

3-step wizard:

**Step 1: Vehicle Info**

- Vehicle type (Bike, EV Bike, EV Truck, Other)

**Step 2: Zone Selection**

- Select operational zone

**Step 3: Documents**

- Upload DL (Driving License)
- Upload Aadhaar/ID proof
- Mark `onboarding_status = 'completed'`
- Redirect to `/rider` dashboard
```typescript
export default function RiderOnboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    vehicleType: '',
    zoneId: '',
    dlDocument: null,
    idDocument: null
  });
  
  const handleComplete = async () => {
    await createRiderProfile(data);
    router.push('/rider'); // Dashboard
  };
  
  return (
    <WizardContainer currentStep={step} totalSteps={3}>
      {step === 1 && <VehicleTypeStep />}
      {step === 2 && <ZoneSelectionStep />}
      {step === 3 && <DocumentUploadStep />}
    </WizardContainer>
  );
}
```


---

### 12. Login Redirection Logic

**File: `lib/auth/role-router.ts`**

Update post-login routing with new rules:

```typescript
export function determinePostLoginRoute(userProfile: UserProfile): string {
  const { roles, default_role, onboarding_completed } = userProfile;
  
  // If onboarding not completed, redirect to onboarding
  if (!onboarding_completed && roles.length === 1) {
    return `/onboarding/${roles[0]}`; // /onboarding/customer, etc.
  }
  
  // If multiple roles, use default_role or last_used_role
  const activeRole = default_role || roles[0];
  
  // CUSTOMER SPECIAL CASE: redirect to /homechefs (vendor browsing)
  if (activeRole === 'customer') {
    return '/homechefs';
  }
  
  // All other roles go to their dashboard
  return `/${activeRole}`; // /vendor, /rider, /admin
}
```

**Update: `app/(auth)/login/page.tsx`**

Add redirect check for already logged-in users:

```typescript
export default function LoginPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user && userProfile) {
      // Already logged in, redirect to appropriate page
      const route = determinePostLoginRoute(userProfile);
      router.push(route);
    }
  }, [user, userProfile]);
  
  // ... rest of login UI
}
```

Same logic applies to all signup pages.

---

### 13. Dashboard Access Guards

**File: `lib/auth/role-guard.ts`**

Update to check role access and redirect:

```typescript
export async function requireRole(role: UserRole): Promise<UserProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const userProfile = await getUserProfile(user.id);
  
  if (!userProfile) {
    redirect('/login');
  }
  
  // Check if user has this role
  if (!userProfile.roles.includes(role)) {
    // User doesn't have this role, redirect to their actual dashboard
    const correctRoute = determinePostLoginRoute(userProfile);
    redirect(correctRoute);
  }
  
  return userProfile;
}
```

**Update all dashboard pages:**

```typescript
// app/(dashboard)/customer/page.tsx
export default async function CustomerDashboard() {
  const profile = await requireRole('customer');
  // ... dashboard content
}

// app/(dashboard)/vendor/page.tsx
export default async function VendorDashboard() {
  const profile = await requireRole('vendor');
  // ... dashboard content
}

// Similar for /rider and /admin
```

---

### 14. Create /homechefs Vendor Browsing Page

**Page: `app/(page)/homechefs/page.tsx`**

Public vendor discovery page (same as `/vendors` from PRD, but at `/homechefs` route):

```typescript
export default async function HomeChefsPage() {
  const supabase = await createClient();
  
  // Fetch active vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      *,
      profiles!inner(full_name, zone_id),
      vendor_media(url, media_type)
    `)
    .eq('status', 'active')
    .order('rating_avg', { ascending: false });
  
  return (
    <div className="homechefs-page">
      <h1>Discover Home Chefs Near You</h1>
      
      {/* Filters */}
      <VendorFilters />
      
      {/* Vendor Grid */}
      <VendorGrid vendors={vendors} />
    </div>
  );
}
```

**Components:**

- `app/components/vendor/VendorGrid.tsx` - Responsive grid of vendor cards
- `app/components/vendor/VendorCard.tsx` - Individual vendor card with image, name, rating, zone
- `app/components/vendor/VendorFilters.tsx` - Zone filter, veg-only toggle, rating sort

This page shows all active vendors, similar to the public `/vendors` page from the PRD, but positioned as the main customer landing page after login.

---

### 15. Middleware Updates for Route Protection

**File: `middleware.ts`**

Update to handle new onboarding routes and redirects:

```typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  
  const path = request.nextUrl.pathname;
  
  // Protected routes
  const protectedRoutes = ['/customer', '/vendor', '/rider', '/admin', '/homechefs', '/account'];
  const authRoutes = ['/login', '/signup'];
  const onboardingRoutes = ['/onboarding/customer', '/onboarding/vendor', '/onboarding/rider'];
  
  const isProtected = protectedRoutes.some(route => path.startsWith(route));
  const isAuth = authRoutes.some(route => path.startsWith(route));
  const isOnboarding = onboardingRoutes.some(route => path.startsWith(route));
  
  // If accessing protected route without auth, redirect to login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If logged in and accessing auth routes, redirect to appropriate page
  if (user && isAuth) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      const route = determinePostLoginRoute(profile);
      return NextResponse.redirect(new URL(route, request.url));
    }
  }
  
  // If accessing dashboard without onboarding complete, redirect to onboarding
  if (user && isProtected && !isOnboarding) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL(`/onboarding/${profile.roles[0]}`, request.url));
    }
  }
  
  return response;
}
```

---

## Success Criteria

- ✅ Can enable/disable any auth method via environment variables
- ✅ Login page dynamically shows only enabled methods
- ✅ Email OTP works like phone OTP
- ✅ Account linking merges profiles with same email
- ✅ Phone verification optional after email signup
- ✅ Test mode skips all OTP costs
- ✅ Easy to switch between configurations (just edit `.env.local`)
- ✅ All signup flows work with email, phone, or OAuth
- ✅ Customer login redirects to /homechefs (vendor browsing)
- ✅ Vendor/Rider/Admin login redirects to their dashboards
- ✅ Onboarding flows work for all roles
- ✅ Dashboard access guards prevent cross-role access
- ✅ Logged-in users visiting login/signup are auto-redirected
- ✅ PRD and development plan updated

---

## Next Steps After Implementation

1. Test all auth combinations:

   - OAuth only
   - Email only
   - Phone only
   - OAuth + Email
   - All three enabled

2. Test account linking (sign up with email, then OAuth with same email)
3. Test onboarding flows for all roles
4. Test login redirects (customer → /homechefs, others → dashboards)
5. Test dashboard guards (accessing wrong role redirects correctly)
6. Test logged-in user redirects from auth pages
7. Test in production with real OTPs
8. Test in dev with skip flags (verify no OTPs sent)
9. Document auth flow switching guide for team