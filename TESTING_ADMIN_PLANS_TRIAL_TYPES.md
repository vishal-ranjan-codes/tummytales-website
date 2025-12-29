# Testing Guide: Admin Plans & Trial Types Pages

## Overview
This document outlines the testing checklist for the Admin Plans and Trial Types pages in the BellyBox V2 subscription system.

## Test Environment Setup
1. Ensure you have admin role access
2. Navigate to `/admin/plans` and `/admin/trial-types`
3. Verify database tables `bb_plans` and `bb_trial_types` exist

---

## 1. Plans Page (`/admin/plans`)

### 1.1 View Plans List
**Test Cases:**
- [ ] Page loads without errors
- [ ] All plans are displayed in a table
- [ ] Plan details shown: Name, Period Type, Allowed Slots, Skip Limits, Status
- [ ] Empty state shows when no plans exist
- [ ] Plans are sorted by creation date (newest first)

**Expected Results:**
- Table displays all columns correctly
- Status badges show "Active" or "Inactive"
- Period types are capitalized (Weekly, Monthly)
- Slots are capitalized (Breakfast, Lunch, Dinner)

### 1.2 Search Functionality
**Test Cases:**
- [ ] Search by plan name
- [ ] Search by description
- [ ] Case-insensitive search
- [ ] Empty search shows all plans
- [ ] Search updates results in real-time

**Expected Results:**
- Results filter correctly
- Search highlights matching text (if implemented)
- No errors on empty search

### 1.3 Filter by Status
**Test Cases:**
- [ ] Filter "All Plans" shows all plans
- [ ] Filter "Active Only" shows only active plans
- [ ] Filter "Inactive Only" shows only inactive plans
- [ ] Filter works with search simultaneously

**Expected Results:**
- Filter dropdown works correctly
- Results update immediately
- Combined with search works properly

### 1.4 Create Plan
**Test Cases:**
- [ ] Click "Create Plan" opens dialog
- [ ] Form fields are empty initially
- [ ] Enter plan name (required)
- [ ] Select period type (weekly/monthly)
- [ ] Select allowed slots (at least one required)
- [ ] Set skip limits for allowed slots only
- [ ] Enter description (optional)
- [ ] Toggle active status
- [ ] Submit creates plan successfully
- [ ] Success toast appears
- [ ] Plan appears in list after creation
- [ ] Dialog closes after successful creation

**Validation Tests:**
- [ ] Empty name shows error
- [ ] No slots selected shows error
- [ ] Skip limit set for non-allowed slot is prevented
- [ ] Skip limits reset to 0 when slot is deselected

**Expected Results:**
- Plan created in database
- All fields saved correctly
- Skip limits JSONB structure: `{ "breakfast": 1, "lunch": 2, "dinner": 1 }`
- Created plan appears in list

### 1.5 Edit Plan
**Test Cases:**
- [ ] Click "Edit" on existing plan
- [ ] Form pre-populates with plan data
- [ ] Modify plan name
- [ ] Change period type
- [ ] Add/remove allowed slots
- [ ] Update skip limits
- [ ] Modify description
- [ ] Toggle active status
- [ ] Submit updates plan successfully
- [ ] Changes reflect in list

**Validation Tests:**
- [ ] Cannot set skip limit for non-allowed slot
- [ ] Removing slot resets its skip limit to 0
- [ ] All validations from create apply

**Expected Results:**
- Plan updated in database
- `updated_at` timestamp changes
- Changes visible immediately in list

### 1.6 Delete Plan (Soft Delete)
**Test Cases:**
- [ ] Click "Delete" on plan
- [ ] Confirmation dialog appears
- [ ] Cancel closes dialog without changes
- [ ] Confirm deletes plan
- [ ] Plan status changes to inactive
- [ ] Plan still visible in list but marked inactive
- [ ] Success toast appears

**Expected Results:**
- Plan `active` field set to `false`
- Plan not deleted from database
- Plan still appears in list with "Inactive" badge
- Can be reactivated by editing

### 1.7 Skip Limits Validation
**Test Cases:**
- [ ] Only allowed slots can have skip limits > 0
- [ ] Deselecting slot resets its skip limit
- [ ] Skip limit inputs disabled for non-allowed slots
- [ ] Visual indication (opacity) for disabled inputs
- [ ] Validation error on submit if invalid skip limits

**Expected Results:**
- UI prevents invalid skip limit configuration
- Clear visual feedback for disabled fields
- Error messages are helpful

---

## 2. Trial Types Page (`/admin/trial-types`)

### 2.1 View Trial Types List
**Test Cases:**
- [ ] Page loads without errors
- [ ] All trial types displayed in table
- [ ] Columns: Name, Duration, Max Meals, Pricing, Cooldown, Status, Actions
- [ ] Empty state shows when no trial types exist
- [ ] Trial types sorted by creation date (newest first)

**Expected Results:**
- Table displays correctly
- Pricing shows discount % or fixed price appropriately
- Slots shown under name

### 2.2 Search Functionality
**Test Cases:**
- [ ] Search by trial type name
- [ ] Case-insensitive search
- [ ] Empty search shows all types
- [ ] Real-time filtering

**Expected Results:**
- Search works correctly
- Results update immediately

### 2.3 Filter by Status
**Test Cases:**
- [ ] Filter "All Types" shows all
- [ ] Filter "Active Only" shows active only
- [ ] Filter "Inactive Only" shows inactive only
- [ ] Combined with search works

**Expected Results:**
- Filtering works correctly
- Combined filters work properly

### 2.4 Create Trial Type
**Test Cases:**
- [ ] Click "Create Trial Type" opens dialog
- [ ] Form fields empty initially
- [ ] Enter name (required)
- [ ] Set duration days (required, > 0)
- [ ] Set max meals (required, > 0)
- [ ] Select allowed slots (at least one required)
- [ ] Select pricing mode (per_meal or fixed)
- [ ] If per_meal: Enter discount percentage (0-100%)
- [ ] If fixed: Enter fixed price (>= 0)
- [ ] Set cooldown days (default 30)
- [ ] Toggle active status
- [ ] Submit creates trial type successfully

**Pricing Mode Tests:**
- [ ] Switching to "per_meal" shows discount % field
- [ ] Switching to "fixed" shows fixed price field
- [ ] Switching modes clears the other field
- [ ] Per-meal requires discount % (0-100%)
- [ ] Fixed requires fixed price (>= 0)

**Validation Tests:**
- [ ] Empty name shows error
- [ ] Duration <= 0 shows error
- [ ] Max meals <= 0 shows error
- [ ] No slots selected shows error
- [ ] Per-meal without discount % shows error
- [ ] Fixed without fixed price shows error

**Expected Results:**
- Trial type created in database
- Pricing mode constraints enforced
- Discount % stored as decimal (0.1 for 10%)
- All fields saved correctly

### 2.5 Edit Trial Type
**Test Cases:**
- [ ] Click "Edit" on existing trial type
- [ ] Form pre-populates correctly
- [ ] Modify all fields
- [ ] Change pricing mode
- [ ] Submit updates successfully
- [ ] Changes reflect in list

**Pricing Mode Switch Tests:**
- [ ] Switching from per_meal to fixed clears discount_pct
- [ ] Switching from fixed to per_meal clears fixed_price
- [ ] Validation enforces correct fields

**Expected Results:**
- Trial type updated in database
- `updated_at` timestamp changes
- Changes visible immediately

### 2.6 Delete Trial Type (Soft Delete)
**Test Cases:**
- [ ] Click "Delete" opens confirmation
- [ ] Cancel does nothing
- [ ] Confirm sets active=false
- [ ] Trial type marked inactive in list
- [ ] Success toast appears

**Expected Results:**
- Soft delete (active=false)
- Still visible in list
- Can be reactivated

---

## 3. Data Refresh & State Management

### 3.1 Plans Page
**Test Cases:**
- [ ] After create, list updates without page reload
- [ ] After update, list updates without page reload
- [ ] After delete, list updates without page reload
- [ ] No full page reloads (except fallback)

**Expected Results:**
- Smooth updates using state management
- No flickering or full page reloads

### 3.2 Trial Types Page
**Test Cases:**
- [ ] After create, list updates without page reload
- [ ] After update, list updates without page reload
- [ ] After delete, list updates without page reload

**Expected Results:**
- Smooth updates using state management

---

## 4. Error Handling

### 4.1 Network Errors
**Test Cases:**
- [ ] Handle network failures gracefully
- [ ] Show appropriate error messages
- [ ] Retry mechanism (if implemented)

### 4.2 Validation Errors
**Test Cases:**
- [ ] Client-side validation shows errors
- [ ] Server-side validation errors displayed
- [ ] Error messages are clear and actionable

### 4.3 Permission Errors
**Test Cases:**
- [ ] Non-admin users cannot access pages
- [ ] Unauthorized actions show error
- [ ] Proper redirect or error message

---

## 5. UI/UX Testing

### 5.1 Responsive Design
**Test Cases:**
- [ ] Mobile view works correctly
- [ ] Tablet view works correctly
- [ ] Desktop view works correctly
- [ ] Tables scroll horizontally on mobile
- [ ] Dialogs are responsive

### 5.2 Accessibility
**Test Cases:**
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (if applicable)
- [ ] Focus states visible
- [ ] Form labels properly associated

### 5.3 Loading States
**Test Cases:**
- [ ] Loading indicators during actions
- [ ] Buttons disabled during submission
- [ ] No double submissions

---

## 6. Database Integrity

### 6.1 Plans Table
**Test Cases:**
- [ ] All constraints enforced:
  - Name not empty
  - Allowed slots not empty array
  - Skip limits JSONB structure valid
- [ ] Timestamps updated correctly
- [ ] Soft delete works (active=false)

### 6.2 Trial Types Table
**Test Cases:**
- [ ] All constraints enforced:
  - Name not empty
  - Duration > 0
  - Max meals > 0
  - Allowed slots not empty
  - Pricing mode constraints (per_meal requires discount_pct, fixed requires fixed_price)
- [ ] Timestamps updated correctly
- [ ] Soft delete works (active=false)

---

## 7. Integration Testing

### 7.1 Plans Integration
**Test Cases:**
- [ ] Plans can be used in subscription creation flow
- [ ] Plans appear in vendor subscription pages
- [ ] Plan changes reflect in active subscriptions (if applicable)

### 7.2 Trial Types Integration
**Test Cases:**
- [ ] Trial types can be used in trial creation flow
- [ ] Trial types appear in vendor trial pages
- [ ] Trial type changes affect eligibility (if applicable)

---

## Known Issues & Improvements

### Fixed Issues:
1. ✅ Data refresh now uses state management instead of `window.location.reload()`
2. ✅ Skip limits validation: Only allowed slots can have skip limits
3. ✅ Skip limits reset when slot is deselected
4. ✅ Pricing mode switching clears opposite field
5. ✅ Better UX with helper text for pricing fields

### Potential Improvements:
- [ ] Add pagination for large lists
- [ ] Add bulk operations (activate/deactivate multiple)
- [ ] Add export functionality
- [ ] Add plan/trial type duplication
- [ ] Add usage statistics (how many subscriptions use each plan)

---

## Test Execution Checklist

- [ ] All Plans page tests passed
- [ ] All Trial Types page tests passed
- [ ] Error handling verified
- [ ] UI/UX verified
- [ ] Database integrity verified
- [ ] Integration tests passed
- [ ] Performance acceptable
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No linter errors

---

## Notes

- Both pages use soft delete (active=false) instead of hard delete
- Skip limits are stored as JSONB: `{ "breakfast": 1, "lunch": 2, "dinner": 1 }`
- Discount percentage is stored as decimal (0.1 = 10%)
- All timestamps are automatically managed by database
- RLS policies ensure only admins can modify these tables
