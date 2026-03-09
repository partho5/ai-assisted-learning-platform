# SkillEvidence Development Progress

**Tests**: 121 passing | **Build**: ✓ | **Last Updated**: 2026-03-04

---

## ✅ Completed

### Part 1 — Authentication & User System
- Email/password login, Fortify + 2FA
- Roles: Admin, Mentor, Learner | Tiers: Free, Observer, Paid
- Username auto-generated from name

### Part 2 — Design System
- oklch-based brand colors, light/dark themes
- 10 button variants, Badge, Card, Input, Select, Dialog, etc.

### Part 3 — Course Management (Mentor)
- Course/Module/Resource CRUD, 7 resource types
- Draft/published toggle, bulk ops, reordering

### Part 4 — Course Discovery & Enrollment
- Public course catalog, filter, search, course detail page
- Enrollment: observer (free) vs full access (paid/tier 2)

### Part 5 — Learning Experience
- Resource display by type (video, article, text, doc, audio, image, assignment)
- Polymorphic test engine: self-tests + assignment submissions
- AI grading via OpenAI (GradeTestAnswerWithAi queued job)
- Endorsement flow: auto (non-test / formative) or mentor (assignment)
- resource_completions tracking table
- Mentor: test editor, submissions queue, attempt review + endorse

---

## ✅ Part 6 — Dashboards (Complete)

**Core requirement**: Each role has its own URL so any dashboard view can be shared as a direct link.

### Learner Dashboard — `/en/dashboard` ✓
- [x] Enrolled courses with per-course progress bar (endorsed / total resources)
- [x] Continue / Start learning CTA per course
- [x] Pending endorsements count
- [x] Stats: total enrolled, pending endorsements, completed courses
- [ ] Recent activity feed _(deferred to Part 7/footprint tracking)_

### Mentor Dashboard — `/en/mentor/dashboard` ✓
- [x] Stats: total courses, total enrollments, active learners (7d), pending submissions
- [x] Pending submissions banner with count
- [x] Course table: title, resources, enrollments, status, Edit + Submissions links
- [ ] Per-course learner insights detail _(deferred)_
- [ ] Duplicate course feature _(deferred)_

### Admin Dashboard — `/en/admin/dashboard` ✓
- [x] Platform stats: learners, mentors, published/draft courses, total enrollments, new users (7d)
- [x] Recent users table (last 10)
- [x] Recent courses table (last 10)
- [ ] User management actions (activate/deactivate, role changes) _(deferred to admin panel part)_
- [ ] Course approval flow _(deferred)_

**Tests**: 134 passing (13 new in Part 6) | **Build**: ✓

---

## ✅ Part 7 — Public Evidence Portfolio (Complete)

**Route**: `/{locale}/u/{username}` — no auth required, respects privacy setting

### Profile Settings Extended ✓
- [x] `headline`, `bio`, `avatar` (URL), `portfolio_visibility` (public/unlisted/private) added to profile settings form
- [x] `portfolio_visibility`, `showcased_attempt_ids` migration added to users table

### Public Portfolio Page — `/{locale}/u/{username}` ✓
- [x] Shows: avatar, name, username, headline, bio
- [x] Stats: courses enrolled, courses completed, assignments endorsed
- [x] Enrolled courses grid with per-course progress bars
- [x] Privacy: `private` → 404; `unlisted` → accessible via direct link; `public` → open
- [x] Featured assignments section (shows showcased, or falls back to 5 most recent endorsed)

### Assignment Showcase ✓
- [x] "Feature on Portfolio" toggle on attempt-result page (endorsed only)
- [x] `POST /{locale}/portfolio/attempts/{attempt}/showcase` — toggles ID in `showcased_attempt_ids` JSON
- [x] Max 5 showcased at a time; owner can remove inline on portfolio page
- [ ] QR code / PDF export _(deferred — needs media/PDF module)_

**Tests**: 150 passing (16 new in Part 7) | **Build**: ✓

---

## ✅ Part 8 Pre-Addendum — AI Chat Context Engineering (Complete)

### Context Architecture
- `ChatContextMeta` DTO (`app/AiChat/ChatContextMeta.php`) — carries `authStatus`, `userTier`, `courseAccess`
- Every system prompt now injects one context line: `User: authenticated. Tier: paid. Course access: full.`
- New `CourseChatContext` for the course show page — includes title, description, what_you_will_learn, prerequisites, module list
- `PlatformChatContext` + `ResourceChatContext` updated to accept `ChatContextMeta`
- `AiChatController::buildContextMeta()` resolves all context server-side (no client trust needed)

### New Route
- `POST /{locale}/courses/{course}/chat` → `AiChatController::course` (throttle:15/min, public)

### Frontend
- `ChatContext.type` union: `'platform' | 'course' | 'resource'`
- `courses/show.tsx` — course-specific `FloatingChatButton`, `hidePlatformChat` on layout
- `chat-panel.tsx` — empty state copy for `course` type

### Extensibility hook
- Add `courseAccess` field to `ChatContextMeta` — already present for course/resource contexts
- To inject more context later: add fields to `ChatContextMeta` and call `toContextLine()` or extend it

**Tests**: 14 passing in `AiChatTest` (4 new course chat tests) | **Build**: ✓ | **Last Updated**: 2026-03-09

---

## 🟡 Part 8 — Rich Text & Visual Polish (In Progress)

### TipTap Editor Integration ✓
- [x] TipTap v3 React editor with: bold, italic, underline, text color, background color, font size, highlight, link, table support
- [x] Integrated into course edit page: description, what_you_will_learn, prerequisites, why_this_resource
- [x] Integrated into course create page: description, what_you_will_learn
- [x] Integrated into resource form (text resource content)
- [x] Backward-compatible RichHtml component: detects HTML tags, renders as HTML or plain text

### UI/UX Refinement — Colorful Premium Design ✓
- [x] Course show page (`/en/courses/{slug}`): colored badges/pills (indigo/amber/sky/violet/emerald), removed left borders, clean card sections
- [x] Course index (`/en/courses`): indigo→violet gradient header, 2-col grid, larger cards with better spacing
- [x] Course create (`/en/courses/create`): widened to max-w-3xl, replaced textareas with RichTextEditor
- [x] Course edit (`/en/mentor/courses/edit`): removed all pips, simplified visual hierarchy
- [x] Dashboard: removed left border accents, kept colorful stat cards
- [x] Learn page: RichHtml rendering for resource guidance text
- [x] Curriculum section: simplified borders, less visual noise

**Design philosophy applied**: People love colorful, but it must not spoil premium feel.
- Clean white/card backgrounds
- Color only on small intentional accents (badges, pills, section headers)
- Light colored backgrounds for grouped sections
- No unnecessary left borders or decorative pips

**Tests**: 150 passing | **Build**: ✓ | **Last Updated**: 2026-03-06

---

## 🟡 Queued — Build After Part 8

### Part 9 — Learning Footprint Tracking *(THE DIFFERENTIATOR)*
- Study sessions: login/logout timestamps, daily time on platform
- Learning streak (consecutive active days)
- Calendar heatmap (GitHub-style) in learner private dashboard
- Course progress timeline (visual: when each resource was completed)
- Pattern recognition: avg time per resource type, most active time of day

### Part 10 — Certificates
- Auto-generated PDF on course completion
- Contains: learner name, course, date, mentor, total hours, unique verification ID, QR code
- Verification endpoint for employers

### Part 11 — Messaging & Notifications
- Simple inbox between platform users
- Social-style notifications: read/unread count badge, clear

### Part 12 — Discussion *(consult before starting — SEO architecture decision)*
- SEO-first: each thread gets its own URL, schema markup, sitemap entry
- Public readable without login, course/topic organized
- Votes + threading

---

## ⚠️ Cross-Cutting Gaps (address as needed per part)

- **Profile**: photo upload + bio field not confirmed built — needed for Part 7
- **Media module**: no abstracted Cloudinary module yet — needed before file uploads at scale
- **SEO**: no meta tags, Open Graph, schema markup, or sitemap on any page yet
- **Bilingual search**: route prefix done; en/bn keyword search not done
- **i18n**: Bangla translations likely incomplete

---

## Architecture Reference

- Locale-prefixed routes: `/{locale}/` — always pass `['locale' => 'en']` in `route()`
- Role middleware: `role:mentor,admin` | Tier check via `UserTier` enum
- Wayfinder: run `php artisan wayfinder:generate --no-interaction` after route changes
- Pint: run `vendor/bin/pint --dirty --format agent` before finalizing
