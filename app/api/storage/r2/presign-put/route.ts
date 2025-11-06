import { NextResponse } from 'next/server'
import { r2Client, r2Buckets, r2PublicBaseUrl } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type Body = {
  filename?: string
  key?: string
  contentType: string
  visibility: 'public' | 'private'
  cacheControl?: string
  category?: 'profile-photos' | 'vendor-media' | 'menu-photos' | 'vendor-docs' | 'rider-docs' | 'order-proofs'
  vendorId?: string // For vendor-media and menu-photos
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    if (!body?.contentType || !body?.visibility) {
      return NextResponse.json({ error: 'contentType and visibility are required' }, { status: 400 })
    }

    const bucket = body.visibility === 'public' ? r2Buckets.public : r2Buckets.private

    // Derive and validate key using category prefixes
    const category = body.category
    let key = body.key
    if (!key) {
      if (!body.filename) {
        return NextResponse.json({ error: 'filename or key is required' }, { status: 400 })
      }
      // Default categories by visibility
      const defaultCategory = body.visibility === 'public' ? 'profile-photos' : 'vendor-docs'
      const finalCategory = category || (defaultCategory as Body['category'])
      
      // For vendor-media and menu-photos, use vendorId if provided
      if ((finalCategory === 'vendor-media' || finalCategory === 'menu-photos') && body.vendorId) {
        // Verify vendor ownership
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('id', body.vendorId)
          .eq('user_id', user.id)
          .single()
        
        if (!vendor) {
          return NextResponse.json({ error: 'Vendor not found or access denied' }, { status: 403 })
        }
        
        key = `${finalCategory}/${body.vendorId}/${body.filename}`
      } else {
        // For other categories, use user.id
        key = `${finalCategory}/${user.id}/${body.filename}`
      }
    }

    const allowedPrefixes = body.visibility === 'public'
      ? ['profile-photos/', 'vendor-media/', 'menu-photos/']
      : ['vendor-docs/', 'rider-docs/', 'order-proofs/']
    if (!allowedPrefixes.some((p) => key!.startsWith(p))) {
      return NextResponse.json({ error: 'Invalid key prefix' }, { status: 400 })
    }
    // Enforce user ownership on categories that should be user/vendor specific
    const mustContainUserId = ['profile-photos/', 'vendor-docs/', 'rider-docs/']
    if (mustContainUserId.some((p) => key!.startsWith(p)) && !key!.includes(`/${user.id}/`)) {
      return NextResponse.json({ error: 'Invalid key (must include user ID segment)' }, { status: 400 })
    }

    const cacheControl = body.cacheControl
      ?? (bucket === r2Buckets.public
        ? (process.env.R2_DEFAULT_PUBLIC_CACHE_CONTROL || 'public, max-age=3600, s-maxage=3600')
        : 'private, max-age=60')

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
      CacheControl: cacheControl,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn: 60 * 5 })

    const publicUrl = bucket === r2Buckets.public && r2PublicBaseUrl
      ? `${r2PublicBaseUrl}/${key}`
      : undefined

    return NextResponse.json({ url, key, bucket, publicUrl })
  } catch {
    return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 })
  }
}


