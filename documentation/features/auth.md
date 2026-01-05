---
title: "Authentication System"
type: "feature-spec"
status: "complete"
owner: "@security-team"
priority: "critical"
progress: 100
---

# Authentication System

## Supported Methods
- **Phone OTP**: Primary method for Indian users.
- **Google OAuth**: Supported for quick login.
- **Email OTP**: Fallback method.

## Implementation Details
Uses Supabase Auth with custom middleware for role-based redirects.
