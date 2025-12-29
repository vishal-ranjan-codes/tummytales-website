# Manual Migration History Repair Guide

Since you can't use the Supabase CLI, here's how to repair migration history manually through the Supabase Dashboard.

## Method 1: Delete Migration Records (Recommended)

This completely removes the test migration records from the migration history table.

### Steps:

1. **Open Supabase Dashboard**
   - Go to your project → SQL Editor

2. **Run this SQL**:
   ```sql
   -- Delete migration records for 021-028
   DELETE FROM supabase_migrations.schema_migrations
   WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');
   
   -- Verify they're gone
   SELECT version, name 
   FROM supabase_migrations.schema_migrations 
   WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');
   ```

3. **Expected Result**: The SELECT query should return 0 rows (no records found)

4. **Verify all migrations**:
   ```sql
   SELECT version, name 
   FROM supabase_migrations.schema_migrations 
   ORDER BY version;
   ```
   
   You should see migrations 001-020, but NOT 021-028.

---

## Method 2: Mark as Reverted (Alternative)

If you want to keep the records but mark them as reverted (for audit purposes):

### Steps:

1. **Open Supabase Dashboard**
   - Go to your project → SQL Editor

2. **Run this SQL**:
   ```sql
   -- Mark migrations as reverted
   UPDATE supabase_migrations.schema_migrations
   SET name = name || ' (REVERTED)'
   WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');
   
   -- Verify the changes
   SELECT version, name 
   FROM supabase_migrations.schema_migrations 
   WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028')
   ORDER BY version;
   ```

3. **Expected Result**: The SELECT query should show records with "(REVERTED)" appended to their names

---

## Which Method to Use?

- **Method 1 (Delete)**: Recommended if you want a clean migration history. The test migrations are gone, so there's no need to keep their records.

- **Method 2 (Mark as Reverted)**: Use if you want to keep an audit trail of what was reverted.

---

## After Repairing

Once you've repaired the migration history:

1. **Verify your local migrations**:
   ```bash
   npx supabase migration list
   ```
   
   This should show migrations 001-020, and 021-028 should be gone or marked as reverted.

2. **Push your new migrations**:
   ```bash
   npx supabase db push
   ```
   
   This will push migrations 016-020 (your new bb_* system migrations).

---

## Troubleshooting

### If you get "relation does not exist" error:

The `supabase_migrations` schema might not be accessible. Try:

```sql
-- Check if the schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'supabase_migrations';

-- If it doesn't exist, migrations might be tracked differently
-- Check for migration tracking in public schema
SELECT * FROM information_schema.tables 
WHERE table_name LIKE '%migration%';
```

### If migrations still show up:

1. Make sure you're connected to the correct database
2. Check if there are multiple migration tracking tables
3. Try refreshing the Supabase Dashboard

---

## Quick Reference

**File**: `scripts/step4-repair-migration-history-manual.sql`

Copy and paste the contents into Supabase SQL Editor and run it.

