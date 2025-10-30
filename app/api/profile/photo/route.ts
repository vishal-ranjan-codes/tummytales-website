import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const objectPath = `${user.id}/profile.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(objectPath, file, { upsert: true, cacheControl: '3600' })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-photos').getPublicUrl(objectPath)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile photo' }, { status: 500 })
    }

    return NextResponse.json({ success: true, photo_url: publicUrl })
  } catch (e) {
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
        const url = new URL(profile.photo_url)
        // Public URL format contains '/object/public/<bucket>/<path>'
        const parts = url.pathname.split('/object/public/')
        let objectPath: string | null = null
        if (parts.length === 2) {
          const after = parts[1]
          const idx = after.indexOf('/')
          if (idx !== -1) {
            // bucket = after.slice(0, idx)
            objectPath = after.slice(idx + 1)
          }
        }
        if (objectPath) {
          await supabase.storage.from('profile-photos').remove([objectPath])
        }
      } catch {
        // ignore parse failures
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ photo_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


