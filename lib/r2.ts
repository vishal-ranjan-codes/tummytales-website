import { S3Client } from '@aws-sdk/client-s3'

/**
 * Singleton R2 (S3-compatible) client configured from environment variables.
 *
 * Required env vars:
 * - R2_ENDPOINT: https://<account-id>.r2.cloudflarestorage.com
 * - R2_REGION: auto
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 */
export const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export const r2Buckets = {
  public: process.env.R2_PUBLIC_BUCKET || 'tt-public',
  private: process.env.R2_PRIVATE_BUCKET || 'tt-private',
}

export const r2PublicBaseUrl =
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || ''


