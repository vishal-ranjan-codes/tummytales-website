export type Visibility = 'public' | 'private'

export type PresignPutRequest = {
  key?: string
  filename?: string
  contentType: string
  visibility: Visibility
  cacheControl?: string
  category?: 'profile-photos' | 'vendor-media' | 'menu-photos' | 'vendor-docs' | 'rider-docs' | 'order-proofs'
  vendorId?: string // For vendor-media and menu-photos categories
}

export type PresignPutResponse = {
  url: string
  key: string
  bucket: string
  publicUrl?: string
}

export type PresignGetRequest = {
  key: string
  expiresIn?: number
}

export type PresignGetResponse = {
  url: string
}

/**
 * R2 provider via Next.js API routes (client/browser friendly)
 */
export const r2Provider = {
  async presignPut(input: PresignPutRequest): Promise<PresignPutResponse> {
    const res = await fetch('/api/storage/r2/presign-put', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to presign PUT')
    return res.json()
  },

  async presignGet(input: PresignGetRequest): Promise<PresignGetResponse> {
    const res = await fetch('/api/storage/r2/presign-get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to presign GET')
    return res.json()
  },
}

/**
 * Placeholder Supabase provider (optional fallback). Intentionally minimal; we will
 * route to R2 by default and only use Supabase when explicitly requested later.
 */
export const supabaseProvider = {
  // Future: implement supabase upload or presigned flow if needed
}

export const storage = {
  r2: r2Provider,
  supabase: supabaseProvider,
}


