# BellyBox Dev Hub - Implementation Plan

## Document Control
- **Product**: BellyBox
- **Feature**: BellyBox Dev Hub (Documentation & Development Management System)
- **Route**: `/dev-docs` (Admin/Developer access)
- **Status**: Planning
- **Last Updated**: 2025-12-30

---

## 1. Vision & Purpose

The **BellyBox Dev Hub** is the central nervous system for the development team. It is not just a documentation viewer, but a **development management platform** that allows the team to:

1.  **Plan & Track**: Visualize the development roadmap and progress directly from documentation files.
2.  **Collaborate**: Propose changes to specifications and discuss implementation details.
3.  **Manage Tasks**: Aggregate and track granular tasks scattered across documentation.
4.  **Maintain Truth**: Keep the `documentation/` folder as the single source of truth for all system logic and rules.

### Core Philosophy
- **Files are King**: The `.md` files in `documentation/` are the absolute source of truth.
- **Database as Overlay**: The database is used only for ephemeral data (proposals, comments) and does not replace the file system.
- **Metadata Driven**: Development status and ownership are tracked via YAML frontmatter in the documentation files themselves.

---

## 2. Key Features

### 2.1 🧠 Knowledge Base (The Viewer)
- Browse the hierarchical `documentation/` folder structure.
- Clean, readable rendering of Markdown with syntax highlighting.
- Support for diagrams (Mermaid) and tables.
- **Goal**: Make system logic accessible to everyone.

### 2.2 🚀 Mission Control (The Dashboard)
- Visual high-level dashboard powered by file Frontmatter.
- **Kanban View**: Group docs by status (`Planned`, `In Development`, `Complete`).
- **Progress Bars**: Visualize `% Complete` from metadata.
- **Workload View**: See who is working on what (grouped by `owner`).

### 2.3 ✍️ Proposal System (Simple Approval Workflow)
- Developers can edit documents in the UI and "Submit Proposal".
- **Diff View**: Leads see a Before/After comparison of the changes.
- **Approval Action**: Approving a proposal writes the changes directly to the `.md` file on disk.
- **Reject/Discussion**: Leads can comment or reject proposals.

### 2.4 ✅ Task Aggregator
- Scans all documentation files for Markdown checkboxes (`- [ ]`).
- Aggregates them into a single "Master Task List".
- Filter by file, feature, or status.
- Interactive: Checking a box in the UI updates the physical file.

### 2.5 💬 Contextual Collaboration
- Threaded comments sidebar for each document.
- Discuss requirements *before* implementation.
- Resolve threads when decisions are made.

---

## 3. Architecture

### 3.1 File Structure Strategy
The system reads from the `documentation/` root folder. All documentation files must use YAML frontmatter for the tracking features to work.

**Standard Frontmatter Schema:**
```yaml
---
title: "Subscription System V2"
type: "system-spec"     # system-spec, feature, guide, api
status: "in-progress"   # planned, in-progress, in-review, complete, on-hold
owner: "@rohit"
priority: "high"        # critical, high, medium, low
progress: 45            # 0-100 percentage
---
```

### 3.2 Database Schema (Supabase)

We need a few simple tables to handle the "Overlay" features.

**`dev_doc_proposals`**
- `id` (uuid)
- `file_path` (text) - relative path in documentation folder
- `original_content_hash` (text) - to detect conflicts
- `proposed_content` (text)
- `author_id` (uuid) -> profiles.id
- `status` (enum): `pending`, `approved`, `rejected`
- `created_at` (timestamp)

**`dev_doc_comments`**
- `id` (uuid)
- `file_path` (text)
- `content` (text)
- `author_id` (uuid)
- `parent_id` (uuid, nullable) - for threading
- `is_resolved` (boolean)
- `created_at` (timestamp)

*Note: No "Versions" table. We rely on Git for history.*

### 3.4 Roles & Permissions Architecture
We align with the BellyBox Tiered RBAC system. Permissions are additive across a user's role array.

| Role | Dev Hub Capability | Type |
| :--- | :--- | :--- |
| **Super Admin** | **Approver/Lead** | Universal read/write. Can Approve any proposal. |
| **Admin** | **Proposer** | Read/View + Propose changes. Cannot approve. |
| **Product Manager** | **Proposer** | Read/View + Propose changes. Cannot approve. |
| **Developer** | **Proposer** | Read/View + Propose changes. Cannot approve. |
| **Operations** | **Proposer** | Read/View + Propose changes. Cannot approve. |

**The "Strict Approval" Workflow:**
1. **Proposal Phase**: Any internal role (except base roles) edits a doc and submits a "Proposal".
2. **Review Phase**: Proposal enters `pending` status. Discussion via comments.
3. **Approval Phase**: **Strictly limited to Super Admin.** Approval triggers the filesystem write to the `.md` file.
4. **Direct Edit**: Super Admin can bypass the proposal system for immediate fixes.

**Status Flow:**
`Draft` (Editing) → `Pending Approval` (Proposed) → `Approved` (Merged to File) OR `Rejected`.

---

## 4. Implementation Zones

### Phase 1: The Foundation (Viewer + Metadata)
**Goal**: Read-only viewer that visualizes the project status.

1.  **File System Integration**: 
    - Server functions to recursively read `documentation/`.
    - `gray-matter` for parsing frontmatter.
2.  **Sidebar Navigation**: Auto-generate tree from folder structure.
3.  **Mission Control Dashboard**: 
    - Compute aggregates (e.g., "7 Docs In Progress").
    - Render status badges and progress bars.
4.  **Document Renderer**: `react-markdown` viewer with customized typography.

### Phase 2: The Proposal Engine
**Goal**: Allow editing and approval flow.

1.  **Proposal UI**:
    - "Edit" button opens Monaco Editor/Textarea.
    - Save action creates entry in `dev_doc_proposals`.
2.  **Review Dashboard**:
    - List all pending proposals.
    - **Diff Viewer**: Use `diff` library to show added/removed lines.
3.  **Approval Logic**:
    - Server Action: `approveProposal(id)`.
    - Reads `proposed_content` from DB -> Writes to File System (`fs.writeFile`).
    - Updates proposal status to `approved`.

### Phase 3: RBAC (Roles & Permissions)
**Goal**: Secure the workflow and distinguish between Contributors and Approvers.

1.  **Role Definition**:
    - Add `roles` column (`text[]`) to `profiles` table.
    - Seed initial Admin user.
2.  **Permission Enforcement**:
    - Update `approveProposal` action to strictly check for `admin` role.
    - Update UI to hide/disable "Approve" buttons for non-admins.
3.  **User Management**:
    - Simple Admin page to assign `developer` or `admin` roles to users.
4.  **Middleware**:
    - Protect `/dev-docs` routes to ensure user has at least `developer` access.

### Phase 4: Task & Collaboration
**Goal**: Detailed tracking and discussion.

1.  **Task Scanner**:
    - Regex parse `/- \[[ x]\] (.*)/g` across all files.
    - Build virtual list of tasks linked to their source files.
    - Action: Toggle checkbox -> updates file content.
2.  **Comments System**:
    - Real-time (or near real-time) comments sidebar.
    - Linked to `file_path`.

---

## 5. Technical Stack

- **Framework**: Next.js 15 (Server Actions strongly used here).
- **Styling**: Tailwind CSS + Shadcn UI.
- **Backend**: Supabase (Postgres) for Proposals/Comments.
- **File Ops**: Node.js `fs/promises`.
- **Markdown**: `react-markdown`, `gray-matter`, `remark-gfm`.
- **Diffing**: `diff` package for text comparison.

---

## 6. Security & Safety

1.  **Path Traversal Protection**: Ensure all file operations are strictly scoped to `process.cwd() + '/documentation'`.
2.  **Auth**: Middleware Protection. Only users with role `admin` or specific `developer` permission can access `/dev-docs`.
3.  **Conflict Detection**: Before applying a proposal, check if the file on disk has changed since the proposal was created (using hash comparison).

---

## 7. Next Steps (Action Items)

1.  [ ] Create `documentation/` folder and move existing docs there (if any).
2.  [ ] Add standard frontmatter to existing documentation files.
3.  [ ] Create Supabase migration for `dev_doc_proposals` and `dev_doc_comments`.
4.  [ ] Scaffold the `/dev-docs` route layout.
