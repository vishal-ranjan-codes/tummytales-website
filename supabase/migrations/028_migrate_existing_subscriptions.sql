-- =====================================================
-- BELLYBOX - MIGRATE EXISTING SUBSCRIPTIONS
-- Migration: 028_migrate_existing_subscriptions.sql
-- Description: Migrate existing subscriptions to slot-based subscriptions_v2
-- NOTE: This migration should be run carefully and tested thoroughly
-- =====================================================

-- This migration script migrates existing subscriptions to the new slot-based system
-- It should be run in batches and tested before full execution

-- Function to migrate a single subscription
CREATE OR REPLACE FUNCTION migrate_subscription_to_v2(subscription_uuid UUID)
RETURNS TABLE(
    subscription_id UUID,
    slot meal_slot,
    migrated BOOLEAN
) AS $$
DECLARE
    sub_record RECORD;
    pref_record RECORD;
    slot_name meal_slot;
    schedule_days_array TEXT[];
    renewal_date_val DATE;
    next_cycle_start_val DATE;
    next_cycle_end_val DATE;
    skip_limit_val INTEGER;
    new_sub_id UUID;
BEGIN
    -- Get subscription details
    SELECT s.*, p.period, p.breakfast_skip_limit, p.lunch_skip_limit, p.dinner_skip_limit
    INTO sub_record
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.id = subscription_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription % not found', subscription_uuid;
    END IF;
    
    -- Only migrate active or paused subscriptions
    IF sub_record.status NOT IN ('active', 'paused') THEN
        RETURN;
    END IF;
    
    -- Calculate renewal date based on period
    IF sub_record.period = 'weekly' THEN
        -- Next Monday after starts_on
        renewal_date_val := sub_record.starts_on + (8 - EXTRACT(DOW FROM sub_record.starts_on)::INTEGER) % 7;
        IF renewal_date_val <= sub_record.starts_on THEN
            renewal_date_val := renewal_date_val + INTERVAL '7 days';
        END IF;
    ELSIF sub_record.period = 'monthly' THEN
        -- Next 1st of month
        renewal_date_val := DATE_TRUNC('month', sub_record.starts_on) + INTERVAL '1 month';
    ELSE
        -- Skip biweekly for now (not in new system)
        RETURN;
    END IF;
    
    next_cycle_start_val := sub_record.starts_on;
    next_cycle_end_val := renewal_date_val - INTERVAL '1 day';
    
    -- Migrate each slot that has preferences
    FOR pref_record IN 
        SELECT * FROM subscription_prefs 
        WHERE subscription_id = subscription_uuid
    LOOP
        slot_name := pref_record.slot;
        
        -- Convert days_of_week integer array to text array
        -- 0=Sunday, 1=Monday, ..., 6=Saturday -> 'sun', 'mon', ..., 'sat'
        schedule_days_array := ARRAY(
            SELECT CASE 
                WHEN day = 0 THEN 'sun'
                WHEN day = 1 THEN 'mon'
                WHEN day = 2 THEN 'tue'
                WHEN day = 3 THEN 'wed'
                WHEN day = 4 THEN 'thu'
                WHEN day = 5 THEN 'fri'
                WHEN day = 6 THEN 'sat'
            END
            FROM unnest(pref_record.days_of_week) AS day
        );
        
        -- Get skip limit for this slot
        skip_limit_val := CASE slot_name
            WHEN 'breakfast' THEN sub_record.breakfast_skip_limit
            WHEN 'lunch' THEN sub_record.lunch_skip_limit
            WHEN 'dinner' THEN sub_record.dinner_skip_limit
            ELSE 0
        END;
        
        -- Check if subscription_v2 already exists (avoid duplicates)
        IF EXISTS (
            SELECT 1 FROM subscriptions_v2 
            WHERE consumer_id = sub_record.consumer_id 
            AND vendor_id = sub_record.vendor_id 
            AND slot = slot_name
            AND status IN ('active', 'paused')
        ) THEN
            CONTINUE;
        END IF;
        
        -- Create new subscription_v2
        INSERT INTO subscriptions_v2 (
            consumer_id,
            vendor_id,
            plan_id,
            slot,
            schedule_days,
            status,
            start_date,
            original_start_date,
            renewal_date,
            skip_limit,
            skips_used_current_cycle,
            next_cycle_start,
            next_cycle_end,
            delivery_address_id
        ) VALUES (
            sub_record.consumer_id,
            sub_record.vendor_id,
            sub_record.plan_id,
            slot_name,
            schedule_days_array,
            sub_record.status,
            sub_record.starts_on,
            sub_record.starts_on,
            renewal_date_val,
            skip_limit_val,
            0,
            next_cycle_start_val,
            next_cycle_end_val,
            sub_record.delivery_address_id
        ) RETURNING id INTO new_sub_id;
        
        -- Return result
        RETURN QUERY SELECT new_sub_id, slot_name, true;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Migration script (commented out - run manually in batches)
-- Example: Migrate subscriptions in batches of 100
/*
DO $$
DECLARE
    batch_size INTEGER := 100;
    offset_val INTEGER := 0;
    total_count INTEGER;
    batch_count INTEGER;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_count
    FROM subscriptions
    WHERE status IN ('active', 'paused');
    
    RAISE NOTICE 'Total subscriptions to migrate: %', total_count;
    
    -- Migrate in batches
    LOOP
        WITH batch AS (
            SELECT id FROM subscriptions
            WHERE status IN ('active', 'paused')
            ORDER BY created_at
            LIMIT batch_size OFFSET offset_val
        )
        SELECT COUNT(*) INTO batch_count FROM batch;
        
        EXIT WHEN batch_count = 0;
        
        -- Migrate batch
        PERFORM migrate_subscription_to_v2(id) FROM batch;
        
        RAISE NOTICE 'Migrated batch: % to %', offset_val, offset_val + batch_count;
        
        offset_val := offset_val + batch_size;
    END LOOP;
    
    RAISE NOTICE 'Migration complete!';
END $$;
*/

-- Add comment
COMMENT ON FUNCTION migrate_subscription_to_v2 IS 'Migrates a single subscription to slot-based subscriptions_v2. Run in batches for production.';

