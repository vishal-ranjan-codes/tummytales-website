import { NextResponse } from 'next/server'
import { r2Client, r2Buckets } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Body = {
  key: string
  expiresIn?: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    if (!body?.key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.roles?.includes('admin') || false

    // Allow access if:
    // 1. Key starts with user.id (own documents)
    // 2. User is admin and key is vendor-docs/ (admin can view vendor docs)
    // 3. User is admin and key is rider-docs/ (admin can view rider docs)
    const isOwnDocument = body.key.startsWith(`${user.id}/`)
    const isVendorDoc = body.key.startsWith('vendor-docs/')
    const isRiderDoc = body.key.startsWith('rider-docs/')
    
    if (!isOwnDocument && !(isAdmin && (isVendorDoc || isRiderDoc))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const command = new GetObjectCommand({
      Bucket: r2Buckets.private,
      Key: body.key,
      ResponseCacheControl: 'private, max-age=60',
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn: Math.min(Math.max(body.expiresIn ?? 60, 10), 600) })

    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
  }
}


