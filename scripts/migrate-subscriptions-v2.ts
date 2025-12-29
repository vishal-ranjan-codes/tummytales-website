/**
 * Migration Script: Legacy Subscriptions to BB System V2
 * Optional script to migrate existing subscriptions to the new bb_* schema
 * 
 * Usage: npx tsx scripts/migrate-subscriptions-v2.ts
 * 
 * WARNING: This is a one-way migration. Review carefully before running.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface LegacySubscription {
  id: string
  consumer_id: string
  vendor_id: string
  plan_id: string
  status: string
  price: number
  starts_on: string
  renews_on: string | null
  delivery_address_id: string
  subscription_prefs: Array<{
    slot: string
    weekdays: number[]
    special_instructions?: string
  }>
  plans: {
    period: string
  }
}

/**
 * Map legacy period to bb_plan_period_type
 */
function mapPeriod(period: string): 'weekly' | 'monthly' {
  if (period === 'weekly' || period === 'biweekly') {
    return 'weekly' // Biweekly becomes weekly in v2
  }
  return 'monthly'
}

/**
 * Find or create matching bb_plan
 */
async function findOrCreateBBPlan(legacyPlan: { period: string; name: string }): Promise<string | null> {
  const periodType = mapPeriod(legacyPlan.period)
  
  // Try to find existing plan
  const { data: existingPlan } = await supabase
    .from('bb_plans')
    .select('id')
    .eq('period_type', periodType)
    .eq('active', true)
    .limit(1)
    .single()
  
  if (existingPlan) {
    return existingPlan.id
  }
  
  // Create a default plan if none exists
  const { data: newPlan, error } = await supabase
    .from('bb_plans')
    .insert({
      name: `${legacyPlan.name} (Migrated)`,
      period_type: periodType,
      allowed_slots: ['breakfast', 'lunch', 'dinner'],
      skip_limits: { breakfast: 1, lunch: 1, dinner: 1 },
      active: true,
    })
    .select('id')
    .single()
  
  if (error || !newPlan) {
    console.error('Error creating bb_plan:', error)
    return null
  }
  
  return newPlan.id
}

/**
 * Migrate a single subscription
 */
async function migrateSubscription(legacySub: LegacySubscription): Promise<boolean> {
  try {
    // Find or create bb_plan
    const bbPlanId = await findOrCreateBBPlan({
      period: legacySub.plans.period,
      name: 'Migrated Plan',
    })
    
    if (!bbPlanId) {
      console.error(`Failed to find/create plan for subscription ${legacySub.id}`)
      return false
    }
    
    // Calculate cycle boundaries
    const startDate = new Date(legacySub.starts_on)
    const periodType = mapPeriod(legacySub.plans.period)
    
    // Get cycle boundaries
    const { data: cycleBoundaries } = await supabase.rpc('bb_get_cycle_boundaries', {
      p_period_type: periodType,
      p_start_date: legacySub.starts_on,
    })
    
    if (!cycleBoundaries || cycleBoundaries.length === 0) {
      console.error(`Failed to get cycle boundaries for subscription ${legacySub.id}`)
      return false
    }
    
    const { cycle_start, cycle_end, renewal_date } = cycleBoundaries[0]
    
    // Create subscription group
    const { data: group, error: groupError } = await supabase
      .from('bb_subscription_groups')
      .insert({
        consumer_id: legacySub.consumer_id,
        vendor_id: legacySub.vendor_id,
        plan_id: bbPlanId,
        status: legacySub.status === 'active' ? 'active' : 'cancelled',
        start_date: legacySub.starts_on,
        renewal_date: renewal_date,
        delivery_address_id: legacySub.delivery_address_id,
      })
      .select('id')
      .single()
    
    if (groupError || !group) {
      console.error(`Error creating group for subscription ${legacySub.id}:`, groupError)
      return false
    }
    
    // Create subscriptions for each slot preference
    for (const pref of legacySub.subscription_prefs || []) {
      const { error: subError } = await supabase.from('bb_subscriptions').insert({
        group_id: group.id,
        consumer_id: legacySub.consumer_id,
        vendor_id: legacySub.vendor_id,
        plan_id: bbPlanId,
        slot: pref.slot,
        weekdays: pref.weekdays || [],
        status: legacySub.status === 'active' ? 'active' : 'cancelled',
      })
      
      if (subError) {
        console.error(`Error creating subscription for slot ${pref.slot}:`, subError)
        return false
      }
    }
    
    console.log(`✓ Migrated subscription ${legacySub.id} to group ${group.id}`)
    return true
  } catch (error) {
    console.error(`Error migrating subscription ${legacySub.id}:`, error)
    return false
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('Starting subscription migration...')
  console.log('WARNING: This is a one-way migration. Ensure you have backups.')
  
  // Get all active subscriptions
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plans(period, name),
      subscription_prefs(*)
    `)
    .in('status', ['active', 'trial'])
  
  if (error) {
    console.error('Error fetching subscriptions:', error)
    process.exit(1)
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    console.log('No subscriptions to migrate')
    return
  }
  
  console.log(`Found ${subscriptions.length} subscriptions to migrate`)
  
  let successCount = 0
  let failCount = 0
  
  for (const sub of subscriptions as LegacySubscription[]) {
    const success = await migrateSubscription(sub)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }
  
  console.log('\nMigration complete:')
  console.log(`  Success: ${successCount}`)
  console.log(`  Failed: ${failCount}`)
}

// Run migration
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { migrateSubscription, main }

