/**
 * Order Generation Cron Job Endpoint
 * Generates daily orders from active subscriptions
 * Called nightly (e.g., at 2 AM) to generate orders for next day
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateOrdersForDate } from '@/lib/orders/order-generator'

export async function GET(request: NextRequest) {
  return handleRequest(request)
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
  try {
    // Optional: Protect endpoint with secret (if using custom cron)
    // const authHeader = request.headers.get('authorization')
    // const expectedSecret = process.env.CRON_SECRET
    // if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Get target date from query params (defaults to tomorrow)
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    
    let targetDate: Date
    
    if (dateParam) {
      // Parse provided date (format: YYYY-MM-DD)
      targetDate = new Date(dateParam)
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        )
      }
    } else {
      // Default to tomorrow
      targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 1)
    }
    
    // Reset time to midnight
    targetDate.setHours(0, 0, 0, 0)
    
    console.log(`Generating orders for ${targetDate.toISOString().split('T')[0]}`)
    
    // Generate orders
    const result = await generateOrdersForDate(targetDate)
    
    console.log(`Order generation complete:`, {
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    })
    
    return NextResponse.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      result,
    })
  } catch (error: unknown) {
    console.error('Error in order generation cron:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}

