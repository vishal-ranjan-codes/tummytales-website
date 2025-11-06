/*
  Migration script: Copy objects from Supabase Storage to Cloudflare R2

  Usage (dev):
    - Ensure .env.local contains Supabase and R2 credentials
    - Run with ts-node or a node runner that supports TS

  Buckets mapping (editable below):
    - profile-photos (public)   → R2 tt-public (key unchanged)
    - vendor-media   (public)   → R2 tt-public (prefix vendor-media/)
    - vendor-docs    (private)  → R2 tt-private (prefix vendor-docs/)
    - rider-docs     (private)  → R2 tt-private (prefix rider-docs/)
*/

import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'
// Load .env.local first if present, then .env fallback
dotenvConfig({ path: resolve(process.cwd(), '.env.local') })
dotenvConfig()
import { createClient as createSbClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { lookup as mimeLookup } from 'mime-types'

type Mapping = {
  supabaseBucket: string
  r2Bucket: string
  keyTransform: (name: string) => string
}

const REQUIRED_ENVS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PUBLIC_BUCKET',
  'R2_PRIVATE_BUCKET',
]

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

for (const k of REQUIRED_ENVS) {
  if (!process.env[k]) {
    console.error(`Missing required env: ${k}`)
    process.exit(1)
  }
}

const supabase = createSbClient(SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const mappings: Mapping[] = [
  {
    supabaseBucket: 'profile-photos',
    r2Bucket: process.env.R2_PUBLIC_BUCKET!,
    keyTransform: (name) => name, // keep same path
  },
  {
    supabaseBucket: 'vendor-media',
    r2Bucket: process.env.R2_PUBLIC_BUCKET!,
    keyTransform: (name) => `vendor-media/${name}`,
  },
  {
    supabaseBucket: 'vendor-docs',
    r2Bucket: process.env.R2_PRIVATE_BUCKET!,
    keyTransform: (name) => `vendor-docs/${name}`,
  },
  {
    supabaseBucket: 'rider-docs',
    r2Bucket: process.env.R2_PRIVATE_BUCKET!,
    keyTransform: (name) => `rider-docs/${name}`,
  },
]

async function listAllObjects(bucket: string, prefix = ''): Promise<string[]> {
  const names: string[] = []
  // Supabase Storage list is directory-based; iterate depth-first
  async function walk(path: string) {
    const limit = 1000
    let offset = 0
    while (true) {
      const { data, error } = await supabase.storage.from(bucket).list(path || '', {
        limit,
        offset,
      })
      if (error) throw error
      const entries = data || []
      if (entries.length === 0) break

      for (const entry of entries) {
        const fullPath = path ? `${path}/${entry.name}` : entry.name
        // Heuristic: if entry has an id or metadata, treat as file; else folder
        const isFile = (entry as any).id || (entry as any).metadata
        if (isFile) {
          names.push(fullPath)
        } else {
          await walk(fullPath)
        }
      }

      if (entries.length < limit) break
      offset += limit
    }
  }
  await walk(prefix)
  return names
}

async function migrateBucket(map: Mapping) {
  console.log(`\nMigrating bucket: ${map.supabaseBucket} → ${map.r2Bucket}`)
  const objects = await listAllObjects(map.supabaseBucket)
  console.log(`Found ${objects.length} objects`)

  let success = 0
  let failed = 0
  for (const name of objects) {
    try {
      const { data, error } = await supabase.storage.from(map.supabaseBucket).download(name)
      if (error) throw error

      const arrayBuffer = await data.arrayBuffer()
      const key = map.keyTransform(name)
      const contentType = mimeLookup(name) || 'application/octet-stream'

      await r2.send(
        new PutObjectCommand({
          Bucket: map.r2Bucket,
          Key: key,
          Body: Buffer.from(arrayBuffer),
          ContentType: String(contentType),
        })
      )
      success++
      if (success % 50 === 0) console.log(`  Migrated ${success}/${objects.length}...`)
    } catch (e) {
      failed++
      console.error(`  Failed: ${name}`, e)
    }
  }
  console.log(`Done: ${success} migrated, ${failed} failed`)
}

async function main() {
  console.log('Starting migration to R2...')
  for (const map of mappings) {
    await migrateBucket(map)
  }
  console.log('\nAll migrations finished.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


