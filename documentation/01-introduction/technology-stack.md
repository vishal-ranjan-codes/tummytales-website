# Technology Stack

This document outlines the technologies used in BellyBox, including Next.js 14, Supabase, Razorpay, Cloudflare R2, and other key tools and services.

## Overview

BellyBox is built on a modern, scalable technology stack designed for rapid development, performance, and future growth. The stack emphasizes:

- **Developer Experience**: Modern frameworks and tools for fast iteration
- **Scalability**: Architecture ready for multi-city expansion
- **Security**: Built-in authentication, RLS policies, and secure storage
- **Performance**: Fast page loads, efficient queries, and optimized assets
- **Reliability**: Robust error handling, monitoring, and backup systems

## Frontend

### Next.js 16 (App Router)

**Version**: 16.1.1+

**Why Next.js:**
- **App Router**: Modern routing with Server Components and Server Actions
- **Server Components**: Reduce client-side JavaScript, improve performance
- **Server Actions**: Secure server-side mutations without API routes
- **Built-in Optimization**: Image optimization, code splitting, automatic prefetching
- **SEO**: Server-side rendering for better search engine visibility
- **Deployment**: Optimized for Vercel deployment

**Key Features Used:**
- App Router file-based routing
- Server Components for data fetching
- Server Actions for mutations
- Route handlers for API endpoints
- Middleware for authentication and redirects
- Image optimization
- Dynamic imports for code splitting

**Configuration:**
- TypeScript for type safety
- Turbopack for faster development builds
- Environment-based configuration

### React 19

**Version**: 19.2.3+

**Features:**
- Latest React features and optimizations
- Concurrent rendering
- Server Components support
- Improved hydration and error handling

### UI Framework: shadcn/ui + Radix UI

**Component Library**: shadcn/ui (built on Radix UI)

**Why shadcn/ui:**
- **Copy-paste components**: Own the code, customize freely
- **Accessible**: Built on Radix UI primitives
- **Stylable**: Tailwind CSS for consistent theming
- **Type-safe**: Full TypeScript support
- **Customizable**: Easy to modify and extend

**Key Components Used:**
- Forms (Input, Select, Checkbox, Radio, etc.)
- Dialogs and Modals
- Dropdowns and Menus
- Tables and Data Display
- Navigation components
- Toast notifications
- Avatar, Badge, Card, etc.

### Styling: Tailwind CSS v4

**Version**: 4.1.4+

**Why Tailwind:**
- **Utility-first**: Rapid UI development
- **Design System**: Consistent spacing, colors, typography
- **Performance**: Purges unused CSS in production
- **Responsive**: Mobile-first responsive design
- **Dark Mode**: Built-in dark mode support

**Custom Configuration:**
- BellyBox color palette (warm orange-brown theme)
- Custom spacing and typography scales
- Design tokens for consistency
- Dark mode configuration

### Form Management: React Hook Form + Zod

**React Hook Form**: 7.56.1+
- Performant form validation
- Minimal re-renders
- Easy integration with validation libraries

**Zod**: 3.24.3+
- TypeScript-first schema validation
- Type inference from schemas
- Runtime validation
- Form validation integration

**Usage:**
- All forms use React Hook Form
- Zod schemas for validation
- Type-safe form handling
- Server-side validation mirroring

## Backend

### Supabase

**Primary Backend Platform**

Supabase provides:
- **PostgreSQL Database**: Robust relational database
- **Authentication**: Built-in auth with multiple providers
- **Row Level Security (RLS)**: Fine-grained access control
- **Realtime**: Real-time subscriptions for live updates
- **Storage**: Object storage (used as secondary/fallback)
- **Edge Functions**: Serverless functions (future use)

#### Database: PostgreSQL

**Version**: PostgreSQL 14+ (managed by Supabase)

**Features:**
- Full ACID compliance
- JSON/JSONB support for flexible schemas
- Array types for multi-value fields
- UUID primary keys
- Full-text search capabilities
- Triggers and stored procedures

**Schema Organization:**
- `bb_*` tables: Subscription system V2 (new)
- Legacy tables: Phase 2 system (being phased out)
- `profiles`, `vendors`, `riders`: Core entity tables
- Enums for status values and types

#### Authentication

**Providers:**
- **Phone OTP**: Primary method via Twilio SMS
- **Email OTP**: Email-based verification
- **Google OAuth**: Social authentication
- **Feature Flags**: Configurable via environment variables

**Features:**
- Multi-method authentication
- Phone verification workflows
- Session management
- Role-based access control
- Account linking (merge accounts with same email)

#### Row Level Security (RLS)

**Purpose**: Database-level access control

**Implementation:**
- Policies for SELECT, INSERT, UPDATE, DELETE
- Role-based policies (consumer, vendor, rider, admin)
- Ownership-based policies (users can only access own data)
- Public read policies (active vendors only)
- Admin bypass via service role (server actions)

**Security Model:**
- No service role key exposed to client
- All client queries respect RLS
- Server actions use service role when needed
- Policies tested and verified

#### Realtime

**Features:**
- Real-time subscriptions to database changes
- Order status updates
- Delivery tracking
- Notification delivery
- Live dashboard updates

**Usage:**
- Order status changes
- Delivery tracking
- Admin monitoring dashboards
- Future: Real-time notifications

### Storage: Cloudflare R2 (Primary)

**Why Cloudflare R2:**
- **S3-Compatible API**: Easy integration
- **No Egress Fees**: Cost-effective for high traffic
- **CDN Integration**: Fast global delivery
- **Cost-Effective**: Lower storage costs than AWS S3
- **Private Buckets**: Secure document storage

**Buckets:**
- **`tt-public`**: Public vendor media, profile photos, menu images
  - Served via custom CDN domain
  - Cache-control headers for optimization
- **`tt-private`**: Private documents (KYC, FSSAI, rider docs)
  - Access via presigned URLs (60-600s expiry)
  - Admin and owner access only

**Supabase Storage**: Used as optional fallback for small files

### Payments: Razorpay

**Version**: 2.9.6+

**Integration Type**: Server-side SDK

**Features Used:**
- Order creation for invoices
- Payment link generation
- Webhook handling for payment status
- Payment verification
- Refund processing (future)

**Implementation:**
- Server actions create Razorpay orders
- Webhook endpoints verify payment signatures
- Payment status updates invoice records
- Idempotent payment processing

**Future Enhancements:**
- UPI Autopay for automatic renewals
- Payment mandates for subscription renewals
- Razorpay Subscriptions API (if needed)

### SMS: Twilio

**Purpose**: Phone OTP delivery

**Integration:**
- Supabase Phone Auth Provider configured with Twilio
- OTP sent via SMS for phone verification
- Test mode available to skip SMS in development

**Configuration:**
- Twilio account linked to Supabase
- Phone number verification
- Rate limiting and throttling

## Development Tools

### TypeScript

**Version**: 5.x

**Benefits:**
- Type safety across codebase
- Better IDE support and autocomplete
- Catch errors at compile time
- Self-documenting code

**Configuration:**
- Strict mode enabled
- Path aliases for clean imports
- Type generation from Supabase schema

### Package Management: npm

**Version**: Latest

**Scripts:**
- `dev`: Development server with Turbopack
- `build`: Production build
- `start`: Production server
- `lint`: ESLint checks
- `supabase:*`: Supabase CLI commands

### Code Quality

**ESLint**: 9.x
- Next.js recommended rules
- Custom configuration
- TypeScript support

**Prettier**: (via ESLint)
- Code formatting
- Consistent style

### Database Tools

**Supabase CLI**: 2.58.5+
- Local development
- Migration management
- Type generation
- Database introspection

**Migration Management:**
- SQL migration files
- Version control for schema changes
- Rollback support
- Type generation from schema

## Deployment & Infrastructure

### Hosting: Vercel

**Platform**: Vercel

**Why Vercel:**
- Optimized for Next.js
- Automatic deployments from Git
- Edge network for fast global delivery
- Serverless functions
- Environment variable management
- Preview deployments for PRs

**Configuration:**
- Production and preview environments
- Custom domain support
- SSL certificates (automatic)
- Analytics and monitoring

### Environment Management

**Environments:**
- **Development**: Local development
- **Staging**: Pre-production testing
- **Production**: Live platform

**Environment Variables:**
- Supabase credentials (anon key, service role key)
- Razorpay keys (key ID, secret)
- Cloudflare R2 credentials
- Twilio configuration
- Feature flags
- API keys for third-party services

## Monitoring & Analytics

### Error Monitoring: Sentry (Future)

**Planned Integration:**
- Frontend error tracking
- Server-side error logging
- Performance monitoring
- User session replay
- Error alerts and notifications

### Analytics: Mixpanel / PostHog (Future)

**Planned Integration:**
- User behavior tracking
- Funnel analysis
- Retention metrics
- Feature usage analytics
- Custom event tracking

### Logging

**Current:**
- Console logging in development
- Server action logging
- Database trigger logging

**Future:**
- Structured logging
- Log aggregation
- Production log monitoring

## Third-Party Services

### Google Maps API (Planned)

**Purpose:**
- Address autocomplete
- Geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- Zone detection
- Distance calculation
- Route optimization (future)

**Status**: Integration planned for Phase 1+

### Email Service (Future)

**Options:**
- SendGrid
- Resend
- AWS SES

**Purpose:**
- Transactional emails (receipts, confirmations)
- Marketing emails (newsletters, promotions)
- Notification emails

## Development Workflow

### Version Control: Git

**Repository**: Private Git repository

**Branching Strategy:**
- `main`: Production-ready code
- Feature branches for development
- PR reviews before merge

### Database Migrations

**Process:**
1. Create migration file via Supabase CLI
2. Write SQL schema changes
3. Test migration locally
4. Commit migration file
5. Apply to staging/production
6. Generate TypeScript types

**Migration Files:**
- Located in `supabase/migrations/`
- Numbered sequentially
- Descriptive names
- Rollback considerations

### Type Generation

**Process:**
```bash
npm run supabase:types
```

**Output:**
- `types/supabase.ts`: Database types
- `types/bb-subscription.ts`: Custom subscription types

**Usage:**
- Import types in components and server actions
- Type-safe database queries
- IDE autocomplete for table columns

## Performance Optimizations

### Frontend
- Server Components for reduced client-side JavaScript
- Image optimization (Next.js Image component)
- Code splitting and lazy loading
- CSS purging (Tailwind)
- Static generation where possible

### Backend
- Database indexes on frequently queried columns
- Efficient RLS policies
- Connection pooling (Supabase)
- Query optimization
- Caching strategies (future)

### Assets
- Cloudflare R2 CDN for public assets
- Image compression and optimization
- WebP format support
- Lazy loading for images

## Security

### Authentication
- Secure passwordless auth (OTP)
- OAuth with verified providers
- Session management
- CSRF protection (Next.js built-in)

### Database
- Row Level Security (RLS) policies
- Prepared statements (SQL injection prevention)
- No direct database access from client
- Service role key never exposed

### API
- Server-side validation
- Rate limiting (future)
- Webhook signature verification
- HTTPS only (production)

### Storage
- Private bucket access controls
- Presigned URLs with expiration
- Content-type validation
- File size limits

## Future Technology Considerations

### Mobile Apps
- **React Native**: Share codebase with web
- Same backend API
- Shared authentication tokens
- Native features (push notifications, location)

### Background Jobs
- **Supabase Edge Functions**: Scheduled functions
- **Vercel Cron**: Alternative for scheduled tasks
- Job queue system (if needed)

### Search
- **PostgreSQL Full-Text Search**: Built-in search
- **Algolia/Meilisearch**: Advanced search (if needed)

### Caching
- **Redis**: Session storage, caching
- **Vercel Edge Cache**: CDN caching
- **Next.js Cache**: Built-in caching

## Related Documentation

- [Overview](overview.md) - Platform overview
- [13-Frontend](../13-frontend/overview.md) - Frontend architecture details
- [14-Integrations](../14-integrations/overview.md) - Third-party integrations
- [17-Deployment](../17-deployment/overview.md) - Deployment processes
- [11-Database](../11-database/overview.md) - Database schema and architecture
