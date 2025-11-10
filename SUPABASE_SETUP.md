# Supabase Integration Setup

This document explains how the Supabase integration is configured in the BellyBox project.

## ✅ What's Already Set Up

The project has been fully integrated with Supabase and includes:

### 1. **Installed Packages**
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Server-side rendering support for Next.js
- `supabase` (dev) - Supabase CLI for database management

### 2. **Client Configurations**
Located in `lib/supabase/`:
- `client.ts` - Browser/client-side Supabase client
- `server.ts` - Server-side Supabase client (for API routes and Server Components)
- `middleware.ts` - Middleware helper for authentication

### 3. **Type Definitions**
- `types/supabase.ts` - TypeScript types (placeholder, will be auto-generated)

### 4. **Environment Variables**
Already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)
- `SUPABASE_PROJECT_REF` - Project reference ID

### 5. **NPM Scripts**
Available commands in `package.json`:

```bash
# Authentication & Linking
npm run supabase:login        # Login to Supabase CLI
npm run supabase:link          # Link to your Supabase project

# Local Development
npm run supabase:start         # Start local Supabase instance
npm run supabase:stop          # Stop local Supabase
npm run supabase:status        # Check Supabase status

# Database Management
npm run supabase:types         # Generate TypeScript types from database
npm run supabase:migration:new # Create new migration
npm run supabase:db:reset      # Reset database
npm run supabase:db:push       # Push migrations to remote

# Verification
npm run verify:supabase        # Verify Supabase connection
```

### 6. **Middleware Integration**
The Next.js middleware (`middleware.ts`) has been updated to use Supabase for session management.

## 🚀 Next Steps

### 1. Login to Supabase CLI

```bash
npm run supabase:login
```

This will open a browser window to authenticate with Supabase.

### 2. Link to Your Project

```bash
npm run supabase:link
```

This connects your local project to your Supabase project in the cloud.

### 3. Verify Connection

```bash
npm run verify:supabase
```

This runs a verification script to ensure everything is connected properly.

## 📚 Usage Examples

### Client-Side Usage (React Components)

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const supabase = createClient()
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('your_table')
        .select('*')
      setData(data)
    }
    fetchData()
  }, [])

  return <div>{/* Your component */}</div>
}
```

### Server-Side Usage (Server Components)

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerPage() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('your_table')
    .select('*')

  return <div>{/* Your component */}</div>
}
```

### API Routes

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

## 🔐 Authentication Example

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function AuthComponent() {
  const supabase = createClient()

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return <div>{/* Your auth UI */}</div>
}
```

## 🗃️ Database Migrations

### Create a New Migration

```bash
npm run supabase:migration:new migration_name
```

This creates a new SQL migration file in `supabase/migrations/`.

### Example Migration

```sql
-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policy
create policy "Users can view their own data"
  on public.users
  for select
  using (auth.uid() = id);
```

### Generate TypeScript Types

After creating tables, generate types:

```bash
npm run supabase:types
```

This updates `types/supabase.ts` with your database schema.

## 🔒 Row Level Security (RLS)

Always enable RLS on your tables for security:

```sql
alter table your_table enable row level security;

create policy "Policy name"
  on your_table
  for select
  using (auth.uid() = user_id);
```

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)

## 🛠️ Troubleshooting

### Environment Variables Not Loading

Make sure your `.env.local` file exists and contains all required variables. Run:

```bash
npm run verify:supabase
```

### Connection Issues

1. Check that your Supabase project URL and keys are correct
2. Verify your project is active in the Supabase dashboard
3. Check network connectivity

### Type Generation Fails

Make sure you're linked to your project:

```bash
npm run supabase:link
```

Then try generating types again:

```bash
npm run supabase:types
```

## 🎯 For BellyBox

Now you can start building:
- User authentication (consumers, vendors, riders)
- Database tables for meals, orders, deliveries
- Real-time order tracking
- Reviews and ratings system
- Subscription management
- And more!

