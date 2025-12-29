# Development Documentation System - Implementation Plan

## Document Control
- **Product**: BellyBox
- **Feature**: Development Documentation System with Workflow Management
- **Route**: `/dev-docs` (Admin-only access)
- **Status**: Planning
- **Created**: 2025-01-XX

---

## 1. Overview

### 1.1 Purpose
Create a comprehensive development documentation system that allows admins to view, edit, and manage documentation with advanced workflow features including drafts, approvals, version history, and comments.

### 1.2 Core Principles
- **Markdown files as source of truth**: All documentation stored as `.md` files in `documentation/` folder
- **Database for workflow**: Metadata, drafts, versions, and comments stored in database
- **Two-way sync**: Approved drafts write to markdown files; file changes tracked in database
- **Admin-only access**: All features accessible only to users with `admin` role

### 1.3 Key Features
1. **Documentation Viewer**: Browse and read all documentation files
2. **Live Editing**: Edit documents directly in the UI
3. **Draft System**: Create drafts without modifying source files
4. **Approval Workflow**: Submit drafts for review and approval
5. **Version History**: Track all changes with ability to view diffs and rollback
6. **Comments**: Add inline and general comments on documents
7. **Search**: Full-text search across all documentation
8. **Navigation**: Tree view sidebar with categories and documents

---

## 2. Architecture

### 2.1 File Structure
```
documentation/                    # Root folder (source of truth)
├── README.md
├── 01-introduction/
│   ├── overview.md
│   └── ...
├── 03-subscription-system/
│   ├── overview.md
│   └── ...
└── ... (all other folders)

# Only .md files, no config or JSON files
```

### 2.2 Database Schema

#### 2.2.1 Core Tables

**`documentation_pages`**
- Stores metadata for each documentation page
- Links to file path in `documentation/` folder
- Tracks status: `draft`, `pending_review`, `published`, `archived`
- Stores version number, content hash, and publication info
- Unique constraint on `file_path` and `(category, slug)`

**`documentation_versions`**
- Version history snapshots
- Stores content hash and optional content snapshot
- Links to page and user who made changes
- Includes change summary for each version
- Unique constraint on `(page_id, version)`

**`documentation_drafts`**
- Draft content separate from published files
- Status: `draft` or `pending_approval`
- Stores full markdown content
- Tracks creator and approver
- Links to parent page

**`documentation_comments`**
- Comments on published pages or drafts
- Optional line number for inline comments
- Threaded discussions with resolve status
- Links to page or draft

#### 2.2.2 Relationships
- `documentation_pages` → `documentation_versions` (one-to-many)
- `documentation_pages` → `documentation_drafts` (one-to-many, only one active)
- `documentation_pages` → `documentation_comments` (one-to-many)
- All tables reference `profiles(id)` for user tracking

### 2.3 Route Structure
```
/dev-docs                          # Landing page with category list
/dev-docs/[category]               # Category listing page
/dev-docs/[category]/[slug]       # View published document
/dev-docs/[category]/[slug]/edit  # Edit mode (creates draft)
/dev-docs/[category]/[slug]/history # Version history view
/dev-docs/admin                    # Admin management panel
  - Drafts queue
  - Pending approvals
  - All pages overview
```

### 2.4 Access Control
- Middleware checks for `admin` role on all `/dev-docs/*` routes
- Redirects non-admin users to their default dashboard
- RLS policies ensure users can only see their own drafts/comments
- Admin can see all drafts and pending approvals

---

## 3. Implementation Phases

### Phase 1: Foundation & File Reading (Week 1)

#### 3.1.1 Setup
1. Create database migration for core tables
2. Install markdown rendering libraries: `react-markdown`, `remark-gfm`, `rehype-highlight`
3. Create route structure: `/dev-docs` with middleware protection
4. Build file system utilities to read from `documentation/` folder

#### 3.1.2 File Scanner
- Create utility function to scan `documentation/` folder recursively
- Parse markdown frontmatter (title, description, category)
- Extract file metadata: path, size, last modified
- Build hierarchical structure (categories → files)

#### 3.1.3 Basic Viewer
- Server component reads markdown file
- Client component renders with `react-markdown`
- Add syntax highlighting for code blocks
- Generate table of contents from headings
- Implement breadcrumb navigation

#### 3.1.4 Navigation Sidebar
- Tree view of all categories and documents
- Collapsible sections
- Active document highlighting
- Search input for quick navigation

**Deliverables:**
- Database schema migration
- File reading utilities
- Basic documentation viewer
- Navigation sidebar
- Admin route protection

---

### Phase 2: Database Sync & Metadata (Week 1-2)

#### 3.2.1 Initial Sync
- Create sync job/function to scan `documentation/` folder
- Populate `documentation_pages` table with file metadata
- Calculate content hash (SHA-256) for each file
- Set initial status as `published` for existing files
- Handle new files, deleted files, and modified files

#### 3.2.2 Sync Mechanism
- Manual sync button in admin panel
- Automatic sync on file system changes (optional: file watcher)
- Compare file hashes to detect changes
- Update database when files change externally
- Create version entry when published file changes

#### 3.2.3 Status Management
- Track file status in database
- Show status badges in UI (Published, Draft, Pending Review)
- Filter documents by status in admin panel
- Handle status transitions with validation

**Deliverables:**
- Sync utility functions
- Database population script
- Status management UI
- Change detection logic

---

### Phase 3: Live Editing & Drafts (Week 2)

#### 3.3.1 Editor Component
- Rich markdown editor (use `react-markdown` with edit mode or `@uiw/react-md-editor`)
- Live preview pane (split view: editor | preview)
- Syntax highlighting in editor
- Auto-save draft to database every 30 seconds
- Show "Unsaved changes" indicator

#### 3.3.2 Draft Creation
- "Edit" button on published pages creates draft
- Draft stored in `documentation_drafts` table
- Link draft to parent page
- Status set to `draft` initially
- Creator tracked in database

#### 3.3.3 Draft Management
- List all drafts in admin panel
- Show draft status and creator
- Continue editing existing drafts
- Delete drafts
- Compare draft vs published version (diff view)

#### 3.3.4 Draft Submission
- "Submit for Review" button on draft
- Changes status to `pending_approval`
- Notifies admins (optional: email/notification)
- Shows in "Pending Approvals" queue

**Deliverables:**
- Markdown editor component
- Draft creation and management
- Auto-save functionality
- Draft submission workflow

---

### Phase 4: Approval Workflow (Week 2-3)

#### 3.4.1 Approval Queue
- Admin panel shows all `pending_approval` drafts
- List view with: document title, creator, created date, changes summary
- Click to view draft with diff against published version
- Side-by-side comparison view

#### 3.4.2 Approval Actions
- **Approve**: Writes draft content to markdown file, updates database, creates version entry
- **Reject**: Returns draft to creator with optional comment, status back to `draft`
- **Request Changes**: Adds comment, keeps status `pending_approval`

#### 3.4.3 Publish Process
When draft is approved:
1. Read current file content (if exists)
2. Create version snapshot in `documentation_versions` table
3. Write draft content to markdown file at correct path
4. Update `documentation_pages` with new hash and version number
5. Set status to `published`
6. Update `published_at` and `published_by` fields
7. Archive or delete the draft

#### 3.4.4 File Writing Safety
- Validate file path to prevent directory traversal
- Ensure path is within `documentation/` folder
- Create parent directories if they don't exist
- Backup original file before overwriting (optional)
- Handle write errors gracefully

**Deliverables:**
- Approval queue UI
- Diff comparison view
- Approve/reject/reject with changes actions
- File writing utilities with safety checks
- Version snapshot creation

---

### Phase 5: Version History (Week 3)

#### 3.5.1 Version Tracking
- On file write (approval), create entry in `documentation_versions`
- Store content hash and optional full content snapshot
- Track version number (auto-increment)
- Store change summary (auto-generated or manual)
- Link to user who made change

#### 3.5.2 Version View
- "History" button on document pages
- List all versions with: version number, date, author, summary
- Click version to view that version's content
- Show version metadata

#### 3.5.3 Diff View
- Compare any two versions side-by-side
- Highlight additions (green) and deletions (red)
- Show line-by-line changes
- Use library like `react-diff-view` or `diff2html`

#### 3.5.4 Rollback
- "Restore this version" button on old versions
- Creates new draft with old version's content
- Goes through normal approval workflow
- Prevents direct file modification (maintains audit trail)

**Deliverables:**
- Version history UI
- Version comparison/diff view
- Rollback functionality
- Version metadata display

---

### Phase 6: Comments System (Week 3-4)

#### 3.6.1 Comment Types
- **General comments**: On entire document (no line number)
- **Inline comments**: On specific line (line_number stored)
- **Threaded replies**: Comments can have replies
- **Resolved status**: Mark comments as resolved

#### 3.6.2 Comment UI
- Comment icon/button on document pages
- Click line number to add inline comment
- Comment panel/sidebar
- Show comments with author, timestamp, content
- Highlight lines with comments
- Resolve/unresolve toggle

#### 3.6.3 Comment Management
- Add, edit, delete own comments
- Admin can delete any comment
- Filter by resolved/unresolved
- Show comment count badge
- Notification when someone comments (optional)

#### 3.6.4 Draft Comments
- Comments can be added to drafts
- Shown in approval queue
- Help reviewers provide feedback
- Resolved when addressed in new draft

**Deliverables:**
- Comment creation UI
- Inline comment support
- Comment thread display
- Comment management (edit, delete, resolve)

---

### Phase 7: Search & Enhancements (Week 4)

#### 3.7.1 Full-Text Search
- Search input in header/navbar
- Search across all markdown content
- Search in titles, descriptions, and body
- Highlight search results
- Show search result snippets
- Filter by category

#### 3.7.2 Advanced Features
- **Export**: Download document as PDF or HTML
- **Print**: Print-friendly view
- **Share**: Generate shareable link (admin-only)
- **Bookmarks**: Save frequently accessed docs (optional)
- **Recent**: Show recently viewed documents

#### 3.7.3 Performance Optimization
- Cache rendered markdown
- Lazy load document content
- Optimize file reading (batch operations)
- Index search content (optional: use full-text search in database)

#### 3.7.4 Mobile Responsiveness
- Responsive sidebar (collapsible on mobile)
- Mobile-friendly editor
- Touch-optimized interactions
- Bottom navigation for mobile

**Deliverables:**
- Full-text search functionality
- Export/print features
- Performance optimizations
- Mobile-responsive design

---

## 4. Technical Implementation Details

### 4.1 File System Operations

**Reading Files:**
- Use Node.js `fs/promises` in server components
- Path: `join(process.cwd(), 'documentation', ...)`
- Handle file not found errors gracefully
- Cache file metadata to reduce I/O

**Writing Files:**
- Only on draft approval
- Validate path is within `documentation/` folder
- Use `writeFile` with UTF-8 encoding
- Create parent directories if needed with `mkdir` recursive

**File Watching (Optional):**
- Use `chokidar` or `fs.watch` to detect external file changes
- Trigger sync when files modified outside UI
- Debounce sync operations to avoid excessive updates

### 4.2 Markdown Processing

**Rendering:**
- `react-markdown` for rendering
- `remark-gfm` for GitHub Flavored Markdown (tables, strikethrough, etc.)
- `rehype-highlight` for syntax highlighting
- Custom components for headings, links, code blocks

**Parsing:**
- Use `gray-matter` to parse frontmatter
- Extract title, description, category from frontmatter
- Fallback to filename if no frontmatter

**Table of Contents:**
- Parse headings from markdown AST
- Generate TOC with anchor links
- Show in sidebar or floating widget

### 4.3 Database Operations

**Content Hashing:**
- Use `crypto.createHash('sha256')` to generate file hashes
- Compare hashes to detect changes
- Store hash in `documentation_pages.current_content_hash`

**Version Snapshots:**
- Store full content in `documentation_versions.content_snapshot` (optional, for small files)
- Or only store hash and read from file system when needed
- Consider file size limits (e.g., only snapshot files < 100KB)

**Sync Strategy:**
- Initial sync: Scan all files, populate database
- Incremental sync: Compare hashes, update changed files
- Handle deleted files: Mark as `archived` in database
- Handle new files: Create new `documentation_pages` entry

### 4.4 Security Considerations

**Path Validation:**
```typescript
// Ensure path is within documentation folder
const docsPath = join(process.cwd(), 'documentation')
const fullPath = join(docsPath, userProvidedPath)
if (!fullPath.startsWith(docsPath)) {
  throw new Error('Invalid path')
}
```

**Access Control:**
- Middleware checks admin role before allowing access
- RLS policies on database tables
- Server actions validate user permissions
- File operations only allowed for admins

**Content Sanitization:**
- Sanitize markdown before saving to prevent XSS
- Validate markdown structure
- Limit file size (e.g., max 1MB per file)

### 4.5 Error Handling

**File Operations:**
- Handle file not found (404 page)
- Handle permission errors
- Handle disk space issues
- Log all file operations for audit

**Database Operations:**
- Handle unique constraint violations
- Handle foreign key constraints
- Transaction rollback on errors
- User-friendly error messages

---

## 5. User Workflows

### 5.1 Viewing Documentation
1. Admin navigates to `/dev-docs`
2. Sees category list or landing page
3. Clicks category to see documents
4. Clicks document to view content
5. Can search, navigate via sidebar, view TOC

### 5.2 Editing Documentation
1. Admin clicks "Edit" on published document
2. Editor opens with current content
3. Makes changes (auto-saved as draft)
4. Clicks "Submit for Review"
5. Draft status changes to `pending_approval`
6. Appears in approval queue

### 5.3 Approving Documentation
1. Admin views approval queue
2. Clicks draft to see diff view
3. Reviews changes
4. Clicks "Approve" or "Reject"
5. If approved: file is written, version created, status updated
6. If rejected: draft returned to creator with comment

### 5.4 Adding Comments
1. Admin views document
2. Clicks line number or comment button
3. Types comment and submits
4. Comment appears with highlight
5. Others can reply or resolve

### 5.5 Viewing History
1. Admin clicks "History" on document
2. Sees list of all versions
3. Clicks version to view content
4. Can compare versions with diff
5. Can restore old version (creates draft)

---

## 6. Database Migration Strategy

### 6.1 Initial Migration
- Create all tables with proper constraints
- Add indexes on frequently queried columns (file_path, status, category)
- Set up RLS policies for admin-only access
- Create helper functions for common operations

### 6.2 Data Migration
- Run initial sync to populate `documentation_pages`
- Set all existing files as `published` status
- Generate initial content hashes
- Create initial version entry for each file

### 6.3 Rollback Plan
- Keep backup of database before migration
- Document rollback steps
- Test migration on staging first

---

## 7. Testing Strategy

### 7.1 Unit Tests
- File reading/writing utilities
- Markdown parsing functions
- Hash generation and comparison
- Path validation functions

### 7.2 Integration Tests
- Database sync operations
- Draft creation and approval flow
- Version history creation
- Comment creation and management

### 7.3 E2E Tests
- Complete edit → submit → approve → publish workflow
- Version rollback workflow
- Comment and resolve workflow
- Search functionality

---

## 8. Future Enhancements (Post-MVP)

1. **Real-time Collaboration**: Multiple admins editing simultaneously
2. **Templates**: Document templates for common structures
3. **Tags**: Tag documents for better organization
4. **Analytics**: Track most viewed documents, search queries
5. **Export Site**: Generate static documentation website
6. **API Access**: REST API to access documentation programmatically
7. **Webhooks**: Notify external systems on publish/update
8. **Multi-language**: Support for multiple languages
9. **Access Control**: Granular permissions (view, edit, approve)
10. **Integration**: Link documentation to code (GitHub, etc.)

---

## 9. Success Metrics

- **Adoption**: Number of admins using the system
- **Content**: Number of documents created/updated
- **Workflow**: Average time from draft to publish
- **Quality**: Number of comments and reviews per document
- **Performance**: Page load times, search response times

---

## 10. Timeline Summary

- **Week 1**: Foundation, file reading, basic viewer
- **Week 2**: Database sync, live editing, drafts
- **Week 3**: Approval workflow, version history
- **Week 4**: Comments system, search, enhancements

**Total Estimated Time**: 4 weeks for MVP

---

## 11. Dependencies

### 11.1 NPM Packages
- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub Flavored Markdown
- `rehype-highlight` - Syntax highlighting
- `gray-matter` - Frontmatter parsing
- `react-diff-view` or `diff2html` - Diff visualization
- `@uiw/react-md-editor` or similar - Markdown editor

### 11.2 Database
- Supabase PostgreSQL (existing)
- RLS policies for security
- Full-text search capabilities

### 11.3 Infrastructure
- File system access (Node.js)
- Admin role verification (existing auth system)

---

## 12. Risks & Mitigation

### 12.1 File System Risks
- **Risk**: Accidental file deletion or corruption
- **Mitigation**: Backup before writes, version history, Git version control

### 12.2 Performance Risks
- **Risk**: Slow file reading with many documents
- **Mitigation**: Caching, lazy loading, pagination

### 12.3 Security Risks
- **Risk**: Path traversal attacks
- **Mitigation**: Strict path validation, sanitization

### 12.4 Data Sync Risks
- **Risk**: Database and files out of sync
- **Mitigation**: Regular sync jobs, manual sync button, hash comparison

---

## Conclusion

This plan provides a comprehensive roadmap for building a production-ready documentation system that maintains markdown files as the source of truth while enabling advanced collaboration features through database-backed workflows. The phased approach allows for incremental development and testing, ensuring a stable and reliable system.

