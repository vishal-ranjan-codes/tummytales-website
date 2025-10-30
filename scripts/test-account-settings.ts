/**
 * Test Script for Account Settings Migration
 * Run this to verify the migration worked and account settings are functional
 */

import { createClient } from '@/lib/supabase/server'

async function testAccountSettingsMigration() {
  console.log('🧪 Testing Account Settings Migration...\n')

  try {
    const supabase = await createClient()
    
    // Test 1: Check if new columns exist in profiles table
    console.log('1️⃣ Checking if new profile columns exist...')
    const { data: columns, error: columnsError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('❌ Error fetching profiles:', columnsError)
      return
    }

    if (columns && columns.length > 0) {
      const profile = columns[0]
      const newFields = [
        'date_of_birth',
        'gender', 
        'emergency_contact',
        'notification_preferences',
        'account_status',
        'deleted_at'
      ]

      console.log('✅ Profile columns check:')
      newFields.forEach(field => {
        const exists = field in profile
        console.log(`   ${exists ? '✅' : '❌'} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`)
      })
    }

    // Test 2: Check if we can create a test profile with new fields
    console.log('\n2️⃣ Testing profile update with new fields...')
    
    // Get current user (if any)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log(`   Testing with user: ${user.email}`)
      
      // Test updating profile with new fields
      const testData = {
        date_of_birth: '1990-01-01',
        gender: 'male',
        emergency_contact: { name: 'Test Contact', phone: '+1234567890' },
        notification_preferences: { email: true, sms: false, push: true },
        account_status: 'active'
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(testData)
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Error updating profile:', updateError)
      } else {
        console.log('✅ Profile update with new fields successful!')
      }
    } else {
      console.log('   ⚠️  No authenticated user found. Please log in to test profile updates.')
    }

    // Test 3: Check address functionality
    console.log('\n3️⃣ Testing address functionality...')
    
    if (user) {
      const { data: addresses, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)

      if (addressError) {
        console.error('❌ Error fetching addresses:', addressError)
      } else {
        console.log(`✅ Address functionality working! Found ${addresses?.length || 0} addresses.`)
      }
    }

    // Test 4: Check if account settings page components work
    console.log('\n4️⃣ Testing account settings components...')
    
    // Test profile actions
    try {
      const { updateProfile } = await import('@/lib/actions/profile-actions')
      console.log('✅ Profile actions imported successfully')
    } catch (error) {
      console.error('❌ Error importing profile actions:', error)
    }

    // Test address actions
    try {
      const { getUserAddresses } = await import('@/lib/actions/address-actions')
      console.log('✅ Address actions imported successfully')
    } catch (error) {
      console.error('❌ Error importing address actions:', error)
    }

    // Test account actions
    try {
      const { getAccountStats } = await import('@/lib/actions/account-actions')
      console.log('✅ Account actions imported successfully')
    } catch (error) {
      console.error('❌ Error importing account actions:', error)
    }

    console.log('\n🎉 Account Settings Migration Test Complete!')
    console.log('\n📋 Next Steps:')
    console.log('1. Visit http://localhost:3000/account to test the UI')
    console.log('2. Try updating your profile information')
    console.log('3. Test adding/editing addresses')
    console.log('4. Check role switching functionality')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAccountSettingsMigration()
