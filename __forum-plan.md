# Forum Module — Planning Doc

**Status**: Pre-implementation planning
**Route prefix**: `/{locale}/forum`
**Philosophy**: Standalone module, same auth. First-class public content — not a course add-on. SEO from day one. Open by nature: even paid resource content is visible in public threads.

---

## URL Structure

```
/{locale}/forum                                  — Forum home (categories)
/{locale}/forum/{category-slug}                  — Category page
/{locale}/forum/{category-slug}/{thread-slug}    — Thread page (own URL, sitemap, schema)
/{locale}/forum/search                           — Forum search
/{locale}/admin/forum                            — Admin: forum management
/{locale}/admin/forum/ai-members                 — Admin: AI member CRUD
/{locale}/admin/forum/categories                 — Admin: category management
/{locale}/admin/forum/moderation                 — Admin: moderation queue
```

---

## Data Models

### `forum_categories`
- `id`, `slug`, `name`, `description`, `color` (for badge), `sort_order`
- `thread_count`, `last_thread_id` (denormalized for perf)

### `forum_threads`
- `id`, `slug`, `title`, `body` (HTML, TipTap)
- `user_id`, `category_id`
- `is_pinned`, `is_locked`, `is_resolved`
- `upvotes_count`, `replies_count` (denormalized)
- `last_activity_at`
- `resource_id` (nullable FK → resources — for resource-linked threads)
- `course_id` (nullable FK → courses)
- `tags` (JSON array of strings)
- `created_at`, `updated_at`, `deleted_at` (soft delete)

### `forum_replies`
- `id`, `thread_id`, `user_id`
- `body` (HTML, TipTap)
- `quoted_reply_id` (nullable FK → forum_replies — for flat+quote threading)
- `is_accepted_answer`
- `upvotes_count` (denormalized)
- `created_at`, `updated_at`, `deleted_at`

### `forum_votes`
- `id`, `user_id`, `votable_type` (thread|reply), `votable_id`
- Unique constraint: one vote per user per votable

### `forum_bookmarks`
- `id`, `user_id`, `thread_id`

### `forum_thread_follows`
- `id`, `user_id`, `thread_id`

### `forum_reports`
- `id`, `user_id`, `reportable_type`, `reportable_id`, `reason`, `resolved_at`

### `ai_members`
- `id`, `user_id` (FK → users — AI member IS a user record)
- `persona_prompt` (text — system prompt for AI persona)
- `description` (short public bio shown on profile)
- `is_active` (boolean)
- `trigger_constraints` (JSON — see AI Member Constraints below)
- `created_at`, `updated_at`

### `user_reputations`
- `id`, `user_id`
- `points` (integer, default 0)
- Reputation history: `forum_reputation_events` table
  - `id`, `user_id`, `points_delta`, `reason` (enum), `reference_type`, `reference_id`, `created_at`

---

## Feature Specs

### 1. Thread & Reply System

**Creating a thread:**
- Title, body (TipTap rich text — same editor already in project)
- Category (required), tags (optional, free text, comma-separated)
- Optional: linked to a course or resource (pre-filled when coming from learn page)

**Creating a reply:**
- TipTap body
- If replying to a specific reply: `quoted_reply_id` stored, quote block auto-inserted into composer
- The quote renders as a styled blockquote with original author name + excerpt
- @mentions supported — triggers notification to mentioned user

**Threading model: Flat + Quote**
- All replies are at thread level (no nesting)
- "Reply to this" on any reply → opens composer with quote pre-filled
- Infinitely scalable, fully SEO-indexable, mobile-friendly
- No hidden/collapsed content trees

**Editing:**
- Author can edit their own thread/reply
- Shows "edited" timestamp after first edit
- No edit window restriction (platform is open-natured)

**Deleting:**
- Soft delete — reply shows as "[deleted]" placeholder if it has quotes referencing it
- Thread soft delete removes from listings but URL still resolves with tombstone

---

### 2. Voting

- Upvote only (no downvote — positive learning environment)
- One vote per user per thread/reply
- Toggle: vote again to remove
- Count visible to crawlers (not JS-gated)
- Authenticated users only

---

### 3. Accepted Answer

- Thread author OR any moderator can mark one reply as Accepted Answer
- Accepted answer visually pinned below the original question (before other replies)
- Thread gets `is_resolved = true` and "Resolved" badge in all listings
- Author of accepted reply gains reputation points

---

### 4. Discovery & Filters

**Forum home:** Category cards — name, description, thread count, unresolved count, last activity

**Category page thread list — filter tabs:**
| Filter | Purpose |
|---|---|
| Recent | Default — newest activity first |
| Trending | Most upvotes + replies in last 7 days |
| Unanswered | `replies_count = 0` — queue for mentors + AI |
| Resolved | `is_resolved = true` — searchable knowledge base |

**Search:**
- Full-text search across thread titles + bodies + tags
- Filter by category, resolved status, date range
- Results: thread cards with category pill, reply count, vote count

---

### 5. Reputation System

**Config file: `config/forum.php`**
All point values and level thresholds defined here — no hardcoded values anywhere.

```php
'reputation' => [
    'points' => [
        'thread_upvoted'       => 2,
        'reply_upvoted'        => 10,
        'reply_accepted'       => 25,
        'thread_created'       => 5,   // only awarded once thread has 1+ upvote
        'mention_ai_responded' => 3,
    ],
    'levels' => [
        ['min' => 0,    'max' => 49,   'label' => 'Newcomer'],
        ['min' => 50,   'max' => 199,  'label' => 'Contributor'],
        ['min' => 200,  'max' => 499,  'label' => 'Regular'],
        ['min' => 500,  'max' => 1499, 'label' => 'Respected'],
        ['min' => 1500, 'max' => 3999, 'label' => 'Expert'],
        ['min' => 4000, 'max' => null, 'label' => 'Legend'],
    ],
],
```

**Reputation surfaces:**
- Colored level badge on every post byline
- Reputation score + level on public portfolio (`/u/username`)
- Reputation score on user profile page

AI members earn and display reputation the same as regular members. Their byline shows both the `AI` badge and their reputation level badge.

---

### 6. User Identity on Posts

Each post byline shows:
- Avatar
- Display name (links to `/u/username`)
- Role badge: `Mentor` / `Admin` — colored, from existing badge system
- Reputation level badge (colored by level)
- `AI` badge for AI members (distinct style, not a reputation level)
- Post timestamp ("3 hours ago" / full date on hover)
- "edited" label if applicable

---

### 7. AI Members

**Nature:**
- Stored as regular `users` records with `is_ai = true`
- Linked `ai_members` record holds persona config
- Cannot self-register — admin CRUD only (`/en/admin/forum/ai-members`)
- Not notified via OneSignal (no push notifications for AI)
- Participate like regular members: create threads, reply, upvote, be @mentioned

**Admin can configure per AI member:**
- Name, avatar, public description (shown on their profile)
- System prompt (persona definition)
- Active / Inactive toggle
- Trigger constraints (JSON, see below)
- Categories they are active in (multi-select — can be all)

**Trigger Constraints (stored in `trigger_constraints` JSON):**
Default: no constraints — AI participates in everything.
Admin can optionally restrict:

```json
{
  "categories": ["course-help", "general"],        // null = all
  "keywords": ["help", "stuck", "how to"],         // null = no keyword filter
  "trigger_on": ["new_thread", "mention", "unanswered_after_hours"],
  "unanswered_after_hours": 2                      // only if above includes it
}
```

Trigger events (all active by default):
- `new_thread` — AI sees new threads in its active categories
- `mention` — @mention triggers immediate response
- `unanswered_after_hours` — AI replies if thread has no human reply after N hours
- `keyword_match` — AI participates only if thread title/body matches keyword list

**Auto-moderation (v1):**
- AI moderators (flagged `is_moderator = true` in `ai_members`) can auto-flag content
- Flag criteria defined in their system prompt
- Flagged content goes to the moderation queue — human moderator confirms action
- AI does not delete/lock unilaterally in v1

**AI reply generation:**
- Uses `AiProvider` contract (already in project)
- System prompt = persona prompt + context: thread title, body, category, last N replies
- Response posted as that AI member's user account
- Queued job (like `GradeTestAnswerWithAi` pattern already used)

---

### 8. Per-Resource Forum Link

On the learn page, below each resource:
- "Discuss this resource" button → links to forum thread tagged with that resource
- If no thread exists: button reads "Start a discussion" → opens new thread form pre-filled:
  - Title: "Discussion: [Resource Title]"
  - Category: Course Help (default, editable)
  - Tags: course slug + resource reference
  - `resource_id` + `course_id` stored on the thread

**Public visibility:**
- Forum thread is fully public — even if the resource is paid/restricted
- The thread content is user-generated discussion, not the resource itself
- This is intentional: open platform philosophy, drives SEO, shows value to non-subscribers

**On the learn page inline:**
- Show thread reply count + last activity date (lightweight API call)
- Guests see: "X people discussing this — Join the conversation"

---

### 9. Moderation

**Who can moderate:**
- Admin (always)
- Mentor (always)
- AI members with `is_moderator = true` (admin-assigned)

**Moderator actions:**
- Pin thread (stays top of category)
- Lock thread (no new replies)
- Delete thread or reply (soft)
- Move thread to different category
- Mark spam
- Resolve reports in moderation queue

**Report system:**
- Any authenticated user can report a thread or reply
- Reason (dropdown): spam, misinformation, off-topic, inappropriate
- Goes to `/en/admin/forum/moderation` queue
- Queue shows: content, reporter, reason, flagged by AI (if applicable)
- Moderator: approve (take action) or dismiss

---

### 10. Notifications — OneSignal

**Integration:**
- OneSignal Web Push SDK
- Opt-in prompt shown after user's first post or first bookmark
- Backend: OneSignal REST API to send targeted push notifications
- AI members are excluded from all OneSignal notifications

**Triggers:**
| Event | Who gets notified |
|---|---|
| Reply to your thread | Thread author |
| Reply to your reply | Reply author |
| @mention | Mentioned user |
| Reply marked Accepted Answer | Reply author |
| New thread in followed category | Category followers |
| Your thread bookmarked (optional, toggle) | Thread author |

**Implementation note:**
- Store OneSignal `player_id` / `subscription_id` on user record
- Notification preferences page: user can opt out per event type
- Feeds into Part 11 (Messaging & Notifications) in-app notification system

---

### 11. SEO

**Per-thread:**
- `<title>`: Thread title — Category — Forum — SkillEvidence
- Meta description: first 160 chars of thread body (plain text, stripped HTML)
- Open Graph: auto-generated image with thread title + category color
- Schema: `DiscussionForumPosting` on thread page, `Comment` on each reply
- Breadcrumb schema: Forum > Category > Thread

**Site-wide:**
- Sitemap: `forum-sitemap.xml` — auto-updated on every new thread
- `hreflang` for en/bn locale variants
- Canonical URLs — prevent locale duplicate competition
- All thread/reply content server-rendered (Inertia SSR) — fully crawlable
- No `noindex` on any public thread

**URL strategy:**
- `/{locale}/forum/{category-slug}/{thread-slug}` — meaningful slugs, auto-generated from title
- Slug collision: append short hash suffix (e.g. `how-to-learn-react-a3f2`)

---

### 12. Access Model

| Action | Guest | Free (Observer) | Paid |
|---|---|---|---|
| Read all threads & replies | Yes | Yes | Yes |
| Create thread | No | Yes | Yes |
| Reply | No | Yes | Yes |
| Upvote | No | Yes | Yes |
| Bookmark / Follow thread | No | Yes | Yes |
| @mention AI members | No | Yes | Yes |
| Report content | No | Yes | Yes |
| Mark accepted answer | No | Own threads only | Own threads only |

Notes:
- Guest read access is intentional and critical for SEO
- Observer tier can participate fully in forum — forum is the open layer
- Course/resource access restrictions remain at the course level, not the forum

---

### 13. Admin Panel — Forum Management

**`/en/admin/forum`** (tab in existing admin dashboard or dedicated section):

**Categories:**
- CRUD: name, slug, description, color, sort order
- Merge categories, bulk reorder

**AI Members (`/en/admin/forum/ai-members`):**
- List: name, active status, last activity, trigger summary
- Create / Edit: name, avatar upload, description, system prompt, active toggle, category multi-select, trigger constraints (form UI for JSON config)
- Delete (soft)

**Moderation Queue (`/en/admin/forum/moderation`):**
- Reported content with context
- AI-flagged content (labeled separately)
- Actions: dismiss, delete, warn user

**Forum Stats (in admin dashboard):**
- Total threads, replies, active users (7d), unanswered thread count
- Top contributors by reputation

---

## Design Notes

**Consistent with platform design system:**
- Category pills: use existing badge color system (indigo, amber, violet, emerald, sky...)
- Thread list: card-style rows — category pill, resolved badge (emerald), vote count, reply count, last activity
- Thread page: question in elevated card; accepted answer in green-tinted card; replies as clean list with dividers
- Composer: TipTap editor (already in project) — same toolbar
- Level badges: color-coded by tier (gray → blue → green → amber → orange → violet for Legend)
- AI badge: distinct style (e.g. sky/cyan) — not in reputation level color system
- Responsive: category nav becomes select on mobile; sidebar collapses

**No new button variants needed** — all actions covered by existing collection.

---

## Open Questions — All Resolved

1. **Bangla (bn) forum content** — UI translated, thread/reply content is free-language. No special handling.
2. **Thread edit window** — unlimited. Confirmed.
3. **Reputation for AI members** — they earn and display reputation like regular members. Confirmed.
4. **OneSignal account** — API key will be added to `.env`. Wire up with `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY`.
5. **SSR** — confirmed. `resources/js/ssr.tsx` exists, `vite.config.ts` points to it.

---

## Implementation Parts (proposed breakdown — not started)

- **Forum Part A** — Core: categories, threads, flat replies, voting, basic listing + SEO
- **Forum Part B** — Reputation system + user identity badges
- **Forum Part C** — AI member CRUD, trigger constraint engine, AI reply job
- **Forum Part D** — Moderation system (queue, reports, AI auto-flag)
- **Forum Part E** — OneSignal notification integration
- **Forum Part F** — Per-resource forum link (learn page integration)
- **Forum Part G** — Admin panel: forum stats, category management, AI member management
