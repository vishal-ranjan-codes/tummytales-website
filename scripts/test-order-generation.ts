/**
 * Test Order Generation Script
 * Run this to test the order generation endpoint locally
 */

async function testOrderGeneration() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  console.log('🧪 Testing Order Generation Endpoint\n')
  console.log(`Base URL: ${baseUrl}\n`)
  
  // Test 1: Generate orders for tomorrow (default)
  console.log('📅 Test 1: Generate orders for tomorrow (default)')
  try {
    const response1 = await fetch(`${baseUrl}/api/cron/generate-orders`, {
      method: 'GET',
    })
    const result1 = await response1.json()
    console.log('✅ Response:', JSON.stringify(result1, null, 2))
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 2: Generate orders for specific date
  const testDate = new Date()
  testDate.setDate(testDate.getDate() + 2) // 2 days from now
  const dateString = testDate.toISOString().split('T')[0]
  
  console.log(`📅 Test 2: Generate orders for specific date (${dateString})`)
  try {
    const response2 = await fetch(`${baseUrl}/api/cron/generate-orders?date=${dateString}`, {
      method: 'GET',
    })
    const result2 = await response2.json()
    console.log('✅ Response:', JSON.stringify(result2, null, 2))
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 3: POST request
  console.log('📅 Test 3: Generate orders using POST method')
  try {
    const response3 = await fetch(`${baseUrl}/api/cron/generate-orders`, {
      method: 'POST',
    })
    const result3 = await response3.json()
    console.log('✅ Response:', JSON.stringify(result3, null, 2))
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
  
  console.log('\n✨ Testing complete!\n')
}

// Run the test
testOrderGeneration().catch(console.error)

