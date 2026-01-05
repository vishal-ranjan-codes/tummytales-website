# Account Linking

This document describes how accounts with the same email address are automatically linked and merged, consolidating user profiles across authentication methods.

## Overview

Account linking allows BellyBox to merge accounts that use the same email address but different authentication methods. For example, if a user signs up with Google OAuth and later signs up with Email OTP using the same email, their accounts should be merged into a single profile.

## Current Status

**Status**: ⚠️ **Function Exists, Not Yet Integrated**

The account linking functionality exists in `lib/auth/account-linking.ts` but is **not currently being called** in the OAuth callback or authentication flows. This is documented as a future enhancement.

## How Account Linking Should Work

### Use Case

**Scenario:**
1. User signs up with Google OAuth (email: `user@example.com`)
2. Profile created with `id = user1`, `email = user@example.com`, `roles = ['customer']`
3. Later, user signs up with Email OTP (same email: `user@example.com`)
4. New auth user created with `id = user2`, `email = user@example.com`
5. Account linking should detect duplicate email and merge accounts

### Linking Process

1. **Detection**: Check if profile exists with same email
2. **Merge Roles**: Combine roles from both accounts
3. **Preserve Data**: Keep data from both accounts (merge where possible)
4. **Update Profile**: Update existing profile with merged data
5. **Cleanup**: Handle duplicate auth.users entry (Supabase manages)

## Implementation

### Account Linking Function

**File**: `lib/auth/account-linking.ts`

```typescript
export async function linkAccountByEmail(
  email: string,
  userId: string
): Promise<AccountLinkingResult> {
  // 1. Check if profile exists with same email
  const existingProfile = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .neq('id', userId)
    .single()

  if (existingProfile) {
    // 2. Merge roles (union of both)
    const mergedRoles = Array.from(new Set([
      ...(existingProfile.roles || ['customer']),
      ...(currentProfile.roles || ['customer'])
    ]))

    // 3. Update existing profile with merged data
    await supabase
      .from('profiles')
      .update({
        roles: mergedRoles,
        auth_provider: currentProfile.auth_provider,
        phone: currentProfile.phone || existingProfile.phone,
        phone_verified: currentProfile.phone_verified || existingProfile.phone_verified,
        email: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProfile.id)

    return { merged: true, targetProfileId: existingProfile.id }
  }

  return { merged: false }
}
```

### Merging Logic

**Roles**: Union of both role arrays (no duplicates)

**Phone**: Use phone from current profile if available, otherwise use existing

**Phone Verified**: Use `OR` logic (verified if either was verified)

**Email**: Keep the email (both should be the same)

**Auth Provider**: Use current profile's provider (most recent)

**Other Fields**: Keep existing values, update only if current has better data

## Integration Points

### Where Account Linking Should Be Called

#### 1. OAuth Callback

```typescript
// app/auth/callback/route.ts
const { data: { user } } = await supabase.auth.getUser()

if (user?.email) {
  const linkingResult = await linkAccountByEmail(user.email, user.id)
  
  if (linkingResult.merged) {
    // Account was merged
    // Handle redirect to existing profile
  }
}
```

#### 2. Email OTP Signup

```typescript
// After email OTP verification
const { data: { user } } = await supabase.auth.getUser()

if (user?.email) {
  const linkingResult = await linkAccountByEmail(user.email, user.id)
  
  if (linkingResult.merged) {
    // Account was merged
  }
}
```

#### 3. Phone OTP Signup (Future)

If phone numbers are made unique identifiers, account linking by phone could be added.

## Challenges and Considerations

### Challenge 1: Multiple Auth Users

When accounts are linked, there may be multiple `auth.users` entries with the same email. Supabase manages this, but we need to:
- Use the correct user ID for the merged profile
- Handle session switching if needed
- Ensure proper cleanup

### Challenge 2: Data Conflicts

When merging accounts, there may be conflicts:
- Different phone numbers
- Different names
- Different roles

**Solution**: Prefer most recent data, merge roles, keep all unique values where possible.

### Challenge 3: Session Management

After merging, user's session may need to be updated:
- Session might be tied to new auth.users entry
- Need to ensure session works with merged profile
- May need to re-authenticate user

**Solution**: Redirect to login or update session after merge.

### Challenge 4: Vendor/Rider Records

If accounts are merged and both have vendor/rider records:
- Which vendor record to keep?
- How to handle duplicate vendor/rider IDs?

**Solution**: This is a complex edge case that needs careful handling. Likely scenario:
- Keep vendor/rider record from original account
- Mark duplicate as inactive or delete
- Merge any important data

## Security Considerations

### Email Verification

Account linking should only occur if:
- Email is verified on both accounts
- Or email verification status is preserved correctly

### User Consent

**Question**: Should users be notified when accounts are merged?

**Recommendation**: 
- Show notification after merge
- Explain what happened
- Allow user to review merged data

### Audit Logging

Account linking should be logged:
- When merge occurred
- Which accounts were merged
- What data was merged
- Who initiated (user or system)

## Future Implementation

### Phase 1: Basic Linking

1. Integrate `linkAccountByEmail()` in OAuth callback
2. Integrate in Email OTP signup
3. Test with simple cases (same email, different auth methods)

### Phase 2: Enhanced Merging

1. Handle vendor/rider record conflicts
2. Add user notification
3. Add audit logging

### Phase 3: Phone Linking (Optional)

1. Account linking by phone number (if phone is unique identifier)
2. Handle phone number conflicts

## Related Documentation

- [Auth Methods](auth-methods.md) - Different authentication methods
- [Overview](overview.md) - Authentication system overview
- [Multi-Role System](multi-role-system.md) - How roles are merged

## Notes

**Current Limitation**: Account linking is implemented but not integrated. Users may end up with duplicate profiles if they use different authentication methods with the same email. This should be integrated as a priority enhancement.

**Workaround**: Users should use the same authentication method consistently, or admins can manually merge accounts if needed.
