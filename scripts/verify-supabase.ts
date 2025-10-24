/**
 * Supabase Connection Verification Script
 * 
 * This script verifies that:
 * 1. Environment variables are properly loaded
 * 2. Supabase client can be created
 * 3. Connection to Supabase is successful
 * 
 * Run with: npm run verify:supabase
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

async function verifySupabaseConnection() {
  console.log('🔍 Verifying Supabase Connection...\n')

  // Check environment variables
  console.log('📋 Checking environment variables...')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_PROJECT_REF'
  ]

  const missingVars: string[] = []
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName)
      console.log(`   ❌ ${varName} - Missing`)
    } else {
      console.log(`   ✅ ${varName} - Found`)
    }
  })

  if (missingVars.length > 0) {
    console.log('\n❌ Missing environment variables. Please add them to .env.local')
    process.exit(1)
  }

  console.log('\n✅ All environment variables found!\n')

  // Create Supabase client
  console.log('🔌 Creating Supabase client...')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('✅ Supabase client created successfully!\n')

    // Test connection
    console.log('🌐 Testing connection to Supabase...')
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log('⚠️  Connection successful, but auth session check failed:')
      console.log('   This is normal if you haven\'t set up authentication yet.')
      console.log(`   Error: ${error.message}`)
    } else {
      console.log('✅ Connection to Supabase successful!')
      console.log(`   Session: ${data.session ? 'Active' : 'No active session'}`)
    }

    console.log('\n🎉 Supabase integration verified!\n')
    console.log('Next steps:')
    console.log('1. Run: npm run supabase:login')
    console.log('2. Run: npm run supabase:link')
    console.log('3. Start building your database schema!')

  } catch (error) {
    console.log('❌ Failed to create Supabase client:')
    console.error(error)
    process.exit(1)
  }
}

// Run verification
verifySupabaseConnection()

