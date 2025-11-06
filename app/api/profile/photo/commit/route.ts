import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { r2PublicBaseUrl } from '@/lib/r2'

export const runtime = 'nodejs'

type Body = {
  key: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = (await request.json()) as Body
    if (!body?.key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

  // Only allow updating own key under profile-photos/{userId}/
  if (!body.key.startsWith(`profile-photos/${user.id}/`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const publicUrl = r2PublicBaseUrl ? `${r2PublicBaseUrl}/${body.key}` : ''

    const { error } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: 'Failed to update profile photo' }, { status: 500 })

    return NextResponse.json({ success: true, photo_url: publicUrl })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


