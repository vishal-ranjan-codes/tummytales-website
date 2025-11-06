import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { r2Client, r2Buckets, r2PublicBaseUrl } from '@/lib/r2'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate size and type
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 })
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }, { status: 400 })
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const key = `profile-photos/${user.id}/profile.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    await r2Client.send(new PutObjectCommand({
      Bucket: r2Buckets.public,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      CacheControl: process.env.R2_DEFAULT_PUBLIC_CACHE_CONTROL || 'public, max-age=3600, s-maxage=3600',
    }))

    const publicUrl = r2PublicBaseUrl ? `${r2PublicBaseUrl}/${key}` : ''

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile photo' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo_url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get current photo URL to derive storage path
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('photo_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (profile?.photo_url) {
      try {
        if (r2PublicBaseUrl && profile.photo_url.startsWith(r2PublicBaseUrl)) {
          const url = new URL(profile.photo_url)
          // Pathname like: /profile-photos/{userId}/profile.ext
          const keyToDelete = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
          await r2Client.send(new DeleteObjectCommand({ Bucket: r2Buckets.public, Key: keyToDelete }))
        } else {
          // legacy supabase cleanup best-effort
          const url = new URL(profile.photo_url)
          const pathParts = url.pathname.split('/')
          const fileName = pathParts[pathParts.length - 1]
          const objectPath = `${user.id}/${fileName}`
          await supabase.storage.from('profile-photos').remove([objectPath])
        }
      } catch {}
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


