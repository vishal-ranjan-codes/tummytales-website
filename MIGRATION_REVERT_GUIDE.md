# Guide to Revert Test Migrations 021-028

This guide will help you properly revert the database changes made by test migrations 021-028.

## Step 1: Detect What Was Created

1. **Open Supabase Dashboard** → Go to your project → SQL Editor

2. **Run the detection script**: Copy and paste the contents of `scripts/detect-and-revert-test-migrations.sql` into the SQL Editor and run it.

3. **Review the results** to see:
   - What tables were created
   - What functions were created
   - What types/enums were created
   - What columns were added to existing tables
   - What indexes were created

## Step 2: Create Reverse Migration Script

Based on the detection results, update `scripts/revert-test-migrations.sql` with the actual objects that need to be dropped.

### Common Patterns:

**If test tables were created:**
```sql
DROP TABLE IF EXISTS test_table_name CASCADE;
```

**If test functions were created:**
```sql
DROP FUNCTION IF EXISTS test_function_name CASCADE;
```

**If columns were added to existing tables:**
```sql
ALTER TABLE table_name DROP COLUMN IF EXISTS test_column_name;
```

**If test types/enums were created:**
```sql
DROP TYPE IF EXISTS test_type_name CASCADE;
```

**If test indexes were created:**
```sql
DROP INDEX IF EXISTS test_index_name;
```

**If test RLS policies were created:**
```sql
DROP POLICY IF EXISTS test_policy_name ON table_name;
```

## Step 3: Run the Revert Script

1. **Backup first!** (Important)
   - In Supabase Dashboard → Database → Backups
   - Create a manual backup before proceeding

2. **Run the revert script**: Copy your updated `scripts/revert-test-migrations.sql` into Supabase SQL Editor and run it.

3. **Verify the changes were reverted**:
   ```sql
   -- Check that tables are gone
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   
   -- Check that functions are gone
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   ORDER BY routine_name;
   ```

## Step 4: Repair Migration History

After reverting the database changes, repair the migration history:

### Option A: Using Supabase CLI (Recommended)

```bash
npx supabase migration repair --status reverted 021 022 023 024 025 026 027 028
```

### Option B: Manual SQL (If CLI doesn't work)

Run this in Supabase SQL Editor:

```sql
-- Mark migrations as reverted
UPDATE supabase_migrations.schema_migrations
SET inserted_at = NULL
WHERE version IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Verify
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
WHERE version IN ('021', '022', '023', '024', '025', '026', '027', '028')
ORDER BY version;
```

## Step 5: Push New Migrations

After repairing the migration history, you can now push your new migrations:

```bash
npx supabase db push
```

## Alternative: Manual Supabase Dashboard Method

If you prefer to do everything manually through the Supabase Dashboard:

### 1. Inspect Database Schema

1. Go to **Table Editor** → Check for any tables that look like test tables
2. Go to **Database** → **Functions** → Check for test functions
3. Go to **Database** → **Types** → Check for test types/enums

### 2. Drop Objects Manually

For each test object found:

**Tables:**
- Table Editor → Find table → Click "..." menu → Delete table → Confirm

**Functions:**
- Database → Functions → Find function → Click "..." menu → Delete function → Confirm

**Types/Enums:**
- Database → Types → Find type → Click "..." menu → Delete type → Confirm

**Columns:**
- Table Editor → Find table → Click column → Delete column → Confirm

### 3. Repair Migration History

Run this SQL in SQL Editor:

```sql
UPDATE supabase_migrations.schema_migrations
SET inserted_at = NULL
WHERE version IN ('021', '022', '023', '024', '025', '026', '027', '028');
```

### 4. Verify

```sql
SELECT version, name, inserted_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version;
```

## Troubleshooting

### If you get foreign key constraint errors:

You may need to drop objects in the correct order (drop dependent objects first):

```sql
-- Example: Drop tables with foreign keys first
DROP TABLE IF EXISTS child_table CASCADE;  -- CASCADE drops dependencies
DROP TABLE IF EXISTS parent_table CASCADE;
```

### If migration repair fails:

Try repairing one at a time:

```bash
npx supabase migration repair --status reverted 021
npx supabase migration repair --status reverted 022
# ... etc
```

### If you're unsure what to drop:

1. Run the detection script first
2. Share the results and we can help identify what's safe to drop
3. Always backup before making changes

## Safety Checklist

- [ ] Created database backup
- [ ] Ran detection script and reviewed results
- [ ] Updated revert script with actual objects to drop
- [ ] Tested revert script on a staging/dev database first (if available)
- [ ] Ran revert script
- [ ] Verified objects were removed
- [ ] Repaired migration history
- [ ] Verified migration history is correct
- [ ] Pushed new migrations successfully

## Need Help?

If you're unsure about what to drop, share the output of the detection script and we can help identify what's safe to revert.

