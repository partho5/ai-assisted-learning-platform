# Portfolio Builder — Implementation Plan

> **You are on skip-permission mode. Work carefully — double-check destructive operations, verify file paths before writing, and confirm migrations before running.**

---

## Overview

A **free, standalone portfolio builder** feature. Does NOT replace the existing profile page at `/{locale}/u/{username}`. Each user gets one portfolio visible at `/{locale}/u/{username}/portfolio`. Category filtering via `?category=slug` query param shows only projects of that category.

---

## URL Structure

| URL | Purpose | Auth |
|-----|---------|------|
| `/portfolio-builder` | SEO landing page (marketing, keyword-dense for "portfolio builder") | Public |
| `/{locale}/dashboard/portfolio-builder` | Portfolio builder dashboard (CRUD projects, settings, messages, analytics) | Auth |
| `/{locale}/u/{username}/portfolio` | Public portfolio view | Public |
| `/{locale}/u/{username}/portfolio/{project_slug}` | Single project page (SEO-optimized) | Public |

---

## Database Schema

### `portfolios` table
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| user_id | bigint FK (users) | unique — one per user |
| bio | text, nullable | Separate from profile bio |
| secondary_bio | text, nullable | |
| services | json, nullable | Array of service strings |
| is_published | boolean | default false — must publish to make visible |
| created_at, updated_at | timestamps | |

### `portfolio_categories` table
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| portfolio_id | bigint FK | |
| name | varchar(100) | |
| slug | varchar(100) | Auto-generated from name |
| sort_order | int | default 0 |
| created_at, updated_at | timestamps | |
| **unique** | (portfolio_id, slug) | |

### `portfolio_skill_tags` table
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| portfolio_id | bigint FK | |
| name | varchar(50) | |
| sort_order | int | default 0 |

### `portfolio_projects` table
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| portfolio_id | bigint FK | |
| category_id | bigint FK (portfolio_categories), nullable | |
| title | varchar(255) | |
| slug | varchar(255) | Unique per portfolio |
| description | text | Rich text (HTML via TipTap) |
| featured_image | varchar(500), nullable | Cloudinary URL, 16:9 enforced |
| external_url | varchar(500), nullable | Live project link |
| tech_tags | json, nullable | Array of strings |
| meta_description | varchar(300), nullable | User-editable, defaults to excerpt (plain text of first ~160 chars of description) |
| sort_order | int | default 0 |
| is_published | boolean | default true |
| created_at, updated_at | timestamps | |
| **unique** | (portfolio_id, slug) | |

### `portfolio_project_media` table
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| project_id | bigint FK (portfolio_projects) | |
| type | enum: 'image', 'youtube' | |
| url | varchar(500) | Cloudinary URL for images, YouTube embed URL for videos |
| sort_order | int | default 0 |
| created_at, updated_at | timestamps | |

### `portfolio_messages` table
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| portfolio_id | bigint FK | |
| sender_name | varchar(100) | |
| sender_email | varchar(255) | Required — no chat, email-based |
| subject | varchar(255), nullable | |
| body | text | |
| is_read | boolean | default false |
| created_at, updated_at | timestamps | |

### `portfolio_visits` table (mini analytics)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | |
| portfolio_id | bigint FK | |
| project_id | bigint FK, nullable | null = portfolio home visit |
| ip_hash | varchar(64) | Hashed for privacy |
| user_agent | varchar(500), nullable | |
| referer | varchar(500), nullable | |
| visited_at | timestamp | |

---

## Models (7 new)

1. **Portfolio** — belongsTo User, hasMany categories/projects/messages/visits/skillTags
2. **PortfolioCategory** — belongsTo Portfolio, hasMany projects
3. **PortfolioSkillTag** — belongsTo Portfolio
4. **PortfolioProject** — belongsTo Portfolio + Category, hasMany media. Delete observer: delete Cloudinary images on project delete
5. **PortfolioProjectMedia** — belongsTo Project. Delete observer: delete Cloudinary image if type=image
6. **PortfolioMessage** — belongsTo Portfolio
7. **PortfolioVisit** — belongsTo Portfolio, belongsTo Project (nullable)

---

## Controllers

### `PortfolioLandingController` (public)
- `index()` — SEO landing page at `/portfolio-builder`

### `PortfolioBuilderController` (auth)
- `index()` — Dashboard overview (stats, recent messages)
- `settings()` — Edit portfolio bio, secondary bio, skill tags, services, publish toggle
- `updateSettings()` — Save settings
- `projects()` — List/manage projects
- `createProject()` — Project create form
- `storeProject()` — Save new project
- `editProject(project)` — Project edit form
- `updateProject(project)` — Update project
- `destroyProject(project)` — Delete project (Cloudinary cleanup via observer)
- `categories()` — Manage categories (inline CRUD)
- `storeCategory()` / `updateCategory()` / `destroyCategory()`
- `messages()` — Inbox list
- `showMessage(message)` — Mark read + view
- `destroyMessage(message)` — Delete message
- `analytics()` — Visit/click history

### `PublicPortfolioController` (public)
- `show(username)` — Render portfolio (supports `?category=slug` filter)
- `showProject(username, project_slug)` — Single project page
- `sendMessage(username)` — Contact form submission + email notification

---

## Frontend Pages (standalone layout — NOT existing AppLayout/PublicLayout)

### New Layout: `PortfolioLayout`
- Standalone — does not use existing app layouts
- Used only for public portfolio pages
- Top navbar: portfolio owner name/logo + category links (scrollable on mobile)
- Left sidebar (PC): avatar, bio, secondary bio, skill tags, services, contact button
- Mobile: hamburger menu replaces both top navbar categories AND left sidebar content
- Footer minimal

### New Layout: `PortfolioBuilderLayout`
- Uses existing `AppLayout` (authenticated dashboard context)
- Sub-navigation: Overview, Projects, Categories, Settings, Messages, Analytics

### Pages

| Page | Route | Layout |
|------|-------|--------|
| `portfolio-landing.tsx` | `/portfolio-builder` | PublicLayout (existing) |
| `dashboard/portfolio-builder/index.tsx` | `/{locale}/dashboard/portfolio-builder` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/settings.tsx` | `/{locale}/dashboard/portfolio-builder/settings` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/projects/index.tsx` | `/{locale}/dashboard/portfolio-builder/projects` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/projects/create.tsx` | `/{locale}/dashboard/portfolio-builder/projects/create` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/projects/edit.tsx` | `/{locale}/dashboard/portfolio-builder/projects/{project}/edit` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/categories.tsx` | `/{locale}/dashboard/portfolio-builder/categories` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/messages/index.tsx` | `/{locale}/dashboard/portfolio-builder/messages` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/messages/show.tsx` | `/{locale}/dashboard/portfolio-builder/messages/{message}` | PortfolioBuilderLayout |
| `dashboard/portfolio-builder/analytics.tsx` | `/{locale}/dashboard/portfolio-builder/analytics` | PortfolioBuilderLayout |
| `u/portfolio/show.tsx` | `/{locale}/u/{username}/portfolio` | PortfolioLayout (standalone) |
| `u/portfolio/project.tsx` | `/{locale}/u/{username}/portfolio/{project_slug}` | PortfolioLayout (standalone) |

---

## SEO Landing Page (`/portfolio-builder`)

- Keyword-dense for "portfolio builder", "free portfolio builder"
- Hero section: headline + "Create My Portfolio" CTA (redirects to register or dashboard if logged in)
- Features grid (project showcase, contact form, analytics, categories, mobile-friendly, SEO-optimized)
- "How it works" 3-step section
- Example portfolio screenshot/mockup section
- Final CTA: "Create Your Portfolio" — never "Sign Up", never pricing
- Always emphasize **free**

---

## Project Card Design (Public Portfolio)

- 3 per row PC, 1 per row mobile
- Media carousel: multiple images/YouTube embeds with left/right arrows (visible on hover)
- Smooth slide animation (CSS transform-based, simple and premium)
- On card hover: title turns blue + underline
- Excerpt always visible: plain-text first ~150 chars of description (no rich-text rendering)
- Entire card is a clickable link to `/{locale}/u/{username}/portfolio/{project_slug}`
- Featured image = first media item or dedicated featured_image field

---

## Single Project Page (SEO)

- SSR via Inertia
- `<Head>`: dynamic title, user-editable meta_description (fallback: excerpt), OG image = featured_image 16:9 (fallback: site-wide OG from seo.php config)
- Structured data: JSON-LD (CreativeWork schema)
- Full rich-text description rendered with `prose` classes
- Media gallery (all images + YouTube embeds)
- Tech tags displayed as badges
- External link button (if provided)
- "Back to portfolio" link
- Contact button (same modal as sidebar)
- Canonical URL set

---

## Contact Form

- Modal triggered by "Contact Me" button (appears in sidebar + under bio)
- Fields: name, email (required), subject (optional), message body
- Spam protection: "I am not a robot" checkbox (simple honeypot + checkbox verification)
- On submit: save to `portfolio_messages`, send email to portfolio owner with full message + link to dashboard messages page
- No reply functionality — one-way only
- Rate limit: 5 messages per IP per hour

---

## Mini Analytics

- Track portfolio page visits and project page visits
- Dashboard analytics page shows:
  - Total visits (portfolio + projects)
  - Visits over time (last 30 days chart)
  - Top projects by views
  - Recent visitors (date, referer, page visited)
  - Message count over time
- IP hashed for privacy (no PII stored)

---

## Cloudinary Integration

- Project images uploaded via Cloudinary (existing integration)
- Delete observers on `PortfolioProject` and `PortfolioProjectMedia` — clean up Cloudinary assets on delete
- Follow existing delete observer pattern already implemented in the project
- Featured image: enforce 16:9 aspect ratio guidance in UI (not hard crop server-side)
- YouTube videos: only store embed URL, no upload

---

## Implementation Order

### Phase 1: Foundation
1. Migrations (all 7 tables)
2. Models + factories + relationships
3. Delete observers (Cloudinary cleanup)
4. Form requests (validation)

### Phase 2: Builder Dashboard
5. PortfolioBuilderController + routes
6. Dashboard pages: settings, categories (inline CRUD), projects CRUD
7. Project editor with RichTextEditor + media upload + YouTube embed
8. Messages inbox

### Phase 3: Public Portfolio
9. PortfolioLayout (standalone)
10. PublicPortfolioController + routes
11. Portfolio show page with category filter + project cards
12. Single project page (full SEO)
13. Contact form modal + email notification

### Phase 4: Landing & Analytics
14. SEO landing page at `/portfolio-builder`
15. PortfolioVisit tracking middleware/service
16. Analytics dashboard page

### Phase 5: Testing
17. Feature tests for all controllers
18. Test contact form, message delivery, analytics tracking
19. Test category filtering, SEO meta tags
20. Run full test suite

---

## Key Constraints

- Standalone feature — does not touch existing profile page or layouts
- One portfolio per user — any role can create
- Always free — no pricing, no paywalls
- CTA wording: "Create Your Portfolio" / "Create My Portfolio" — never "Sign Up"
- Uses existing Cloudinary integration + delete observers
- Videos = YouTube embed URLs only (no upload)
- Contact = email-based, no chat, sender provides email
- Spam: simple "I am not a robot" checkbox
- Mobile: hamburger replaces both top nav categories and left sidebar
- Same visual theme for all portfolios (no per-user theming)
