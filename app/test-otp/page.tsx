'use client'

/**
 * OTP Test Page
 * Use this page to test and debug OTP functionality
 * Access at: /test-otp
 */

import { useState } from 'react'
import { sendOTP } from '@/lib/auth/otp'
import { validatePhoneNumber } from '@/lib/auth/phone-validator'
import { debugOTPSetup, testOTPSend } from '@/lib/auth/otp-debug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TestOTPPage() {
  const [phone, setPhone] = useState('')
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const runDiagnostics = async () => {
    setTestResults([])
    addResult('🔍 Running OTP diagnostics...')

    // Check environment
    addResult(`✓ Supabase URL configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    addResult(`✓ Supabase Anon Key configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)

    // Run debug setup
    const debugInfo = await debugOTPSetup()
    addResult(`✓ Config status: ${JSON.stringify(debugInfo.configStatus)}`)
    addResult(`✓ Phone auth status: ${debugInfo.phoneAuthStatus}`)
    if (debugInfo.lastError) {
      addResult(`⚠️ Last error: ${debugInfo.lastError}`)
    }

    addResult('✅ Diagnostics complete')
  }

  const testPhoneValidation = () => {
    setTestResults([])
    addResult('🔍 Testing phone validation...')

    if (!phone) {
      addResult('⚠️ Please enter a phone number')
      return
    }

    const validation = validatePhoneNumber(phone)
    addResult(`✓ Phone input: ${phone}`)
    addResult(`✓ Is valid: ${validation.isValid}`)
    
    if (validation.isValid) {
      addResult(`✓ Formatted: ${validation.formatted}`)
    } else {
      addResult(`⚠️ Error: ${validation.error}`)
    }
  }

  const testSendOTP = async () => {
    setTestResults([])
    addResult('📱 Testing OTP send...')
    setIsLoading(true)

    if (!phone) {
      addResult('⚠️ Please enter a phone number')
      setIsLoading(false)
      return
    }

    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      addResult(`⚠️ Invalid phone: ${validation.error}`)
      setIsLoading(false)
      return
    }

    addResult(`✓ Phone validated: ${validation.formatted}`)

    try {
      const result = await testOTPSend(validation.formatted!)
      
      result.details.forEach(detail => addResult(detail))
      
      if (result.success) {
        addResult('✅ OTP sent successfully!')
        addResult('📲 Check your phone for the OTP message')
      } else {
        addResult(`❌ Failed to send OTP: ${result.error}`)
        addResult('💡 Check the detailed logs above for more information')
      }
    } catch (error) {
      addResult(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testWithActualAPI = async () => {
    setTestResults([])
    addResult('🚀 Testing with actual sendOTP function...')
    setIsLoading(true)

    if (!phone) {
      addResult('⚠️ Please enter a phone number')
      setIsLoading(false)
      return
    }

    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      addResult(`⚠️ Invalid phone: ${validation.error}`)
      setIsLoading(false)
      return
    }

    addResult(`✓ Phone validated: ${validation.formatted}`)
    addResult('📡 Calling sendOTP...')

    try {
      const result = await sendOTP(validation.formatted!)
      
      if (result.success) {
        addResult('✅ OTP sent successfully!')
        addResult('📲 Check your phone for the OTP message')
        addResult('💡 Also check browser console for detailed logs')
      } else {
        addResult(`❌ Failed to send OTP`)
        addResult(`Error: ${result.error}`)
        addResult('💡 Check browser console for detailed error information')
      }
    } catch (error) {
      addResult(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen theme-bg-color p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">
            OTP Debug & Test Page
          </h1>
          <p className="theme-fc-light">
            Use this page to diagnose OTP SMS issues. Open browser console (F12) for detailed logs.
          </p>
        </div>

        <div className="space-y-6">
          {/* Phone Input */}
          <div className="box p-6">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              Enter Phone Number
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium theme-fc-heading mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210 or 9876543210"
                  className="w-full max-w-md"
                />
                <p className="text-sm theme-fc-light mt-2">
                  Enter with or without +91 prefix
                </p>
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="box p-6">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              Run Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={runDiagnostics}
                variant="outline"
                size="lg"
                disabled={isLoading}
              >
                1. Run Diagnostics
              </Button>
              
              <Button
                onClick={testPhoneValidation}
                variant="outline"
                size="lg"
                disabled={isLoading || !phone}
              >
                2. Validate Phone
              </Button>
              
              <Button
                onClick={testSendOTP}
                variant="outline"
                size="lg"
                disabled={isLoading || !phone}
              >
                3. Test OTP Send (Debug)
              </Button>
              
              <Button
                onClick={testWithActualAPI}
                variant="primary-dark-white"
                size="lg"
                disabled={isLoading || !phone}
              >
                4. Send Real OTP
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="box p-6">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              Test Results
            </h2>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-400">No tests run yet. Click a button above to start testing.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="box p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              📋 Instructions
            </h2>
            <ol className="space-y-2 theme-fc-base">
              <li><strong>1. Run Diagnostics</strong> - Checks if Supabase is configured correctly</li>
              <li><strong>2. Validate Phone</strong> - Tests phone number format validation</li>
              <li><strong>3. Test OTP Send (Debug)</strong> - Tests OTP with detailed logging</li>
              <li><strong>4. Send Real OTP</strong> - Actually sends OTP using the real API</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-sm font-semibold theme-fc-heading">⚠️ Important:</p>
              <p className="text-sm theme-fc-base mt-1">
                Open Browser Console (F12) to see detailed logs with emojis and error details.
                The console will show exactly what&apos;s happening with each API call.
              </p>
            </div>
          </div>

          {/* Setup Guide Link */}
          <div className="box p-6">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              📚 Setup Guide
            </h2>
            <p className="theme-fc-base mb-4">
              If OTP is not working, check the setup guide for detailed configuration instructions:
            </p>
            <a
              href="/SUPABASE_SMS_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-100 hover:underline font-medium"
            >
              View Supabase SMS Setup Guide →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

