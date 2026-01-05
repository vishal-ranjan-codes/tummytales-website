# BellyBox RBAC System Architecture
*Finalized & Implemented Architecture*

## 🏗️ Core Architecture
The BellyBox RBAC system uses a **Multi-Role Additive Pattern**. 

1. **Storage**: User roles are stored in `profiles.roles` (TEXT ARRAY).
2. **Primary Role**: The `profiles.role` column stores the highest-tier role for UI convenience.
3. **wildcard Access**: The `profiles.is_super_admin` (BOOLEAN) flag provides universal bypass (Wildcard Permission `*`).
4. **Permission Aggregation**: Permissions are fetched for all roles in the array and merged into a single set.

---

## 🎯 Role Hierarchy & Dev Hub Rules

### 1. **Super Admin** (Owner)
- **Wildcard Permission**: Full unrestricted access.
- **Sole Approver**: The **only** role capable of approving Dev Hub proposals and writing to the filesystem.

---

### 2. **Admin** (Manager)
- **Dev Hub**: Can browse, comment, and **Propose** changes.
- **Restriction**: Cannot approve proposals.
- **User Management**: Can manage all roles except Super Admin.

---

### 3. **Product Manager**
- **Dev Hub**: Can browse, comment, and **Propose** changes.
- **Restriction**: Cannot approve proposals.
- **User Management**: Can manage `Developer` and `Operations` roles only.

---

### 4. **Developer**
- **Dev Hub**: Can browse, comment, and **Propose** changes.
- **Restriction**: Cannot approve proposals.
- **Analytics**: Access to technical metrics.

---

### 5. **Operations/Support**
- **Dev Hub**: Can browse, comment, and **Propose** changes. (Restored access for contextual knowledge).
- **Restriction**: Cannot approve proposals.
- **Orders**: Full management.

---

## 🔐 Implemented Permissions
| Resource | Permission | Roles (Proposers) | Sole Approver |
| :--- | :--- | :--- | :--- |
| **Dev Hub** | `devhub:propose` | Admin, PM, Dev, Ops | N/A |
| **Dev Hub** | `devhub:approve` | N/A | **Super Admin** |
| **Users** | `user:manage:all` | Admin | Super Admin |
| **Users** | `user:manage:tech` | PM | Super Admin, Admin |
| **Audit Log** | `audit:view` | N/A | Super Admin |

---

### Platform User Roles

#### 6. **Customer**
**Purpose:** End users ordering food

**Access:**
- ✅ Browse restaurants & menu
- ✅ Place orders
- ✅ Track delivery
- ✅ Review & rate
- ✅ Manage payment methods
- ✅ View order history

---

#### 7. **Vendor/Restaurant**
**Purpose:** Business providing food

**Access:**
- ✅ Vendor dashboard
- ✅ Menu management
- ✅ Order management (accept/reject)
- ✅ Analytics (own store)
- ✅ Payout reports
- ✅ Store settings

---

#### 8. **Rider/Driver**
**Purpose:** Delivery personnel

**Access:**
- ✅ Rider app
- ✅ Accept/complete deliveries
- ✅ Earnings dashboard
- ✅ Route navigation
- ✅ Customer communication

---

## 🔐 Permission-Based System (Recommended)

Instead of hardcoding role checks everywhere, implement a **granular permission system**:

### Permission Categories

```typescript
enum PermissionCategory {
  // User Management
  USER_MANAGE_SUPER_ADMIN = 'user:manage:super_admin',
  USER_MANAGE_ADMIN = 'user:manage:admin',
  USER_MANAGE_PM = 'user:manage:product_manager',
  USER_MANAGE_DEV = 'user:manage:developer',
  USER_MANAGE_OPS = 'user:manage:operations',
  USER_MANAGE_CUSTOMER = 'user:manage:customer',
  USER_MANAGE_VENDOR = 'user:manage:vendor',
  USER_MANAGE_RIDER = 'user:manage:rider',
  USER_VIEW_ALL = 'user:view:all',
  
  // Dev Hub
  DEVHUB_VIEW = 'devhub:view',
  DEVHUB_PROPOSE = 'devhub:propose',
  DEVHUB_APPROVE = 'devhub:approve',
  DEVHUB_EDIT = 'devhub:edit',
  
  // Platform Settings
  PLATFORM_SETTINGS_CRITICAL = 'platform:settings:critical',
  PLATFORM_SETTINGS_GENERAL = 'platform:settings:general',
  
  // Financial
  FINANCIAL_VIEW_ALL = 'financial:view:all',
  FINANCIAL_REFUND = 'financial:refund',
  FINANCIAL_PAYOUT = 'financial:payout',
  
  // Operations
  OPERATIONS_ORDERS_MANAGE = 'operations:orders:manage',
  OPERATIONS_SUPPORT = 'operations:support',
  
  // Analytics
  ANALYTICS_BUSINESS = 'analytics:business',
  ANALYTICS_TECHNICAL = 'analytics:technical',
  ANALYTICS_FINANCIAL = 'analytics:financial',
}
```

### Role-Permission Mapping

```typescript
const ROLE_PERMISSIONS = {
  super_admin: ['*'], // Wildcard - all permissions
  
  admin: [
    'user:manage:admin',
    'user:manage:*', // All user types except super_admin
    'devhub:*',
    'platform:settings:general',
    'financial:view:all',
    'operations:*',
    'analytics:*',
  ],
  
  product_manager: [
    'user:view:all',
    'user:manage:customer',
    'user:manage:vendor',
    'user:manage:rider',
    'devhub:view',
    'devhub:propose',
    'operations:orders:manage',
    'analytics:business',
  ],
  
  developer: [
    'devhub:*',
    'analytics:technical',
  ],
  
  operations: [
    'user:view:all',
    'operations:*',
    'financial:refund',
    'analytics:business',
  ],
};
```

---

## 🏗️ Database Schema

### Recommended Tables

#### `profiles` (Enhanced)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  -- NEW: For multi-role support in future
  roles TEXT[] DEFAULT ARRAY['customer'],
  is_super_admin BOOLEAN DEFAULT FALSE,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `role_permissions` (NEW)
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission)
);
```

#### `user_custom_permissions` (NEW - For exceptions)
```sql
CREATE TABLE user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission)
);
```

#### `audit_log` (NEW - Critical for Super Admin actions)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Security Best Practices

### 1. **Enforced 2FA for Privileged Roles**
- Super Admin: **Mandatory**
- Admin: **Mandatory**
- Product Manager: **Mandatory**
- Developer: Recommended

### 2. **Audit Logging**
- All Super Admin actions
- All Admin user management actions
- All role changes
- All critical setting changes

### 3. **Principle of Least Privilege**
- Start with minimal permissions, add as needed
- Regularly review and revoke unused permissions

### 4. **Multi-Layer Protection**
- Middleware checks (fast rejection)
- Database RLS policies (Supabase)
- UI-level checks (hide unavailable actions)
- Server action validation (final enforcement)

### 5. **Session Management**
- Short session timeout for privileged roles (30 min)
- Longer for regular users (7 days)
- Automatic logout on role change

---

## 📊 Comparison: Your Proposal vs. Recommended

| Aspect | Your Proposal | Recommended | Reason |
|--------|---------------|-------------|--------|
| Super Admin | ✅ Yes | ✅ Yes | Owner-level control needed |
| Admin | ✅ Yes | ✅ Yes (with refined permissions) | Platform management |
| Product Manager | ✅ Yes | ✅ Yes (with granular permissions) | Product ownership without security risk |
| Developer | ❓ Implied | ✅ Yes (explicit role) | Dev Hub access |
| Operations/Support | ❌ No | ✅ **Recommended** | Day-to-day operations & customer support |
| Permission System | ❌ Role-only | ✅ **Permission-based** | Future flexibility & granular control |
| Audit Logging | ❌ Not mentioned | ✅ **Critical** | Security & compliance |
| 2FA Enforcement | ❌ Not mentioned | ✅ **Mandatory for admins** | Security best practice |

---

## ✅ Final Recommendations

### Immediate (Phase 4.1)
1. ✅ Implement the 5 internal roles (Super Admin, Admin, PM, Developer, Operations)
2. ✅ Create permission system with middleware
3. ✅ Add `is_super_admin` flag and audit logging
4. ✅ Update Dev Hub to respect new roles

### Future (Phase 4.2)
1. Migrate to full permission-based system
2. Implement custom permissions per user
3. Add role templates for common scenarios
4. Build admin UI for permission management

### Security Checklist
- [ ] Enforce 2FA for Super Admin, Admin, PM
- [ ] Implement audit logging for privileged actions
- [ ] Add rate limiting on role changes
- [ ] Set up alerts for suspicious admin actions
- [ ] Regular permission audits (quarterly)

---

## 🚀 Next Steps

1. **Review & Approve** this design
2. **Prioritize** which roles to implement first
3. **Plan migration** for existing users
4. **Design UI** for role management
5. **Implement in phases** (start with Super Admin + permissions)
