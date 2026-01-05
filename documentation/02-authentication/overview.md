# Authentication System Overview

This document provides an overview of the BellyBox authentication system, including multi-method authentication, role management, and security features.

## Overview

BellyBox implements a **flexible, multi-method authentication system** that supports three authentication providers (Google OAuth, Email OTP, and Phone OTP) controlled by feature flags. The system enables users to sign up and sign in using any combination of these methods, with automatic profile creation and role-based routing.

## Key Features

### Multi-Method Authentication
- **Google OAuth**: Fast, one-click sign-in with Google account
- **Email OTP**: Email-based authentication with OTP verification
- **Phone OTP**: SMS-based authentication via Twilio (primary for Indian users)

### Feature Flag System
- All authentication methods can be enabled/disabled via environment variables
- Display order is configurable
- Ideal for testing different authentication flows without code changes

### Automatic Profile Creation
- Database triggers automatically create user profiles on signup
- Handles all auth methods (OAuth, Email, Phone) seamlessly
- Sets default roles and verification status

### Role-Based Routing
- Smart routing based on user roles after authentication
- Customers redirect to `/homechefs` (vendor browsing)
- Other roles redirect to their respective dashboards
- Multi-role users can switch between roles

### Phone Verification Workflow
- Configurable phone verification requirement after OAuth/Email signup
- Ensures all users have verified phone numbers for delivery coordination
- Test mode available to skip OTP costs during development

## Architecture

### Components

1. **Authentication Services** (`lib/auth/`)
   - `config.ts` - Feature flag configuration
   - `oauth.ts` - OAuth authentication (Google, Facebook, Apple)
   - `email.ts` - Email OTP authentication
   - `otp.ts` - Phone OTP authentication
   - `account-linking.ts` - Account merging logic (future enhancement)

2. **UI Components** (`app/components/auth/`)
   - `GoogleButton.tsx` - OAuth sign-in button
   - `EmailInput.tsx` - Email input with validation
   - `PhoneInput.tsx` - Phone input with formatting
   - `OTPInput.tsx` - 6-digit OTP input
   - `PhoneVerificationStep.tsx` - Post-OAuth/Email phone verification
   - `ResendOTPButton.tsx` - OTP resend functionality

3. **Pages**
   - `/login` - Unified login page with all enabled methods
   - `/signup/customer` - Customer signup
   - `/signup/vendor` - Vendor signup
   - `/signup/rider` - Rider signup
   - `/auth/callback` - OAuth callback handler

4. **Database Triggers**
   - `handle_new_user()` - Automatically creates profiles on auth signup
   - Handles all auth providers (OAuth, Email, Phone)
   - Sets default roles and verification status

5. **Middleware**
   - Session management and refresh
   - Protected route access control
   - Role-based routing logic
   - OAuth flow pass-through handling

## Authentication Flow

### High-Level Flow

```
User initiates signup/login
    ↓
Choose authentication method (OAuth/Email/Phone)
    ↓
Verify credentials (OAuth callback / OTP verification)
    ↓
Session created in Supabase Auth
    ↓
Database trigger creates/updates profile
    ↓
Check phone verification (if required)
    ↓
Check onboarding status
    ↓
Route to appropriate destination:
  - Customer → /homechefs
  - Vendor/Rider → /onboarding/{role} or /{role}
  - Admin → /admin
```

## Status and Implementation

**Current Status**: ✅ **Fully Implemented**

- ✅ Google OAuth authentication
- ✅ Email OTP authentication
- ✅ Phone OTP authentication
- ✅ Feature flag system
- ✅ Database triggers for profile creation
- ✅ Role-based routing
- ✅ Phone verification workflow
- ✅ Test mode for development

**Future Enhancements**:
- Account linking integration (function exists, not yet called in OAuth callback)
- Additional OAuth providers (Facebook, Apple)
- Social login with multiple providers

## Related Documentation

- [Auth Methods](auth-methods.md) - Detailed explanation of each authentication method
- [Feature Flags](feature-flags.md) - Configuration and feature flag system
- [Multi-Role System](multi-role-system.md) - How multi-role accounts work
- [Session Management](session-management.md) - Session handling and middleware
- [Security](security.md) - Security features and RLS policies
- [Phone Verification](phone-verification.md) - Phone verification workflow
- [Account Linking](account-linking.md) - Account merging logic (future)
