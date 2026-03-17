# SEO — Skill Evidence Platform

## Status Legend
- ✅ Done / Already correct
- ❌ Missing — needs implementation
- ⚠️ Exists but wrong / suboptimal
- 🔒 Decision pending

---

## Technical SEO

### SSR (Server-Side Rendering)
- ✅ **Confirmed working** — verified via `wget`, full HTML content returned (not blank div)
- ✅ **Documented** — `README.md` created with PM2 setup, verification command, env var notes
- `ssr.tsx` configured, Node.js SSR process is running in production
- **Rule:** If the SSR process ever goes down, Googlebot sees `<div id="app"></div>` — monitor it

### robots.txt
- ✅ Now served dynamically via `RobotsController` — Sitemap URL built from `config('app.url')`
- ✅ `.htaccess` updated — `RewriteRule ^robots\.txt$` before `!-f` check forces PHP handling
- ✅ Blocks: dashboard, admin, mentor, settings, login, register (all locales)
- ✅ `Sitemap:` line uses full dynamic URL from `APP_URL`
- **Nginx note:** documented in README — needs `try_files` override for `/robots.txt`
- Learn pages intentionally NOT blocked — decision: index all lesson pages

### Sitemap
- ✅ Route defined: `GET /sitemap.xml` → `SitemapController@index`
- ❌ Not yet submitted to Google Search Console — do on launch day
- Verify SitemapController includes all course slugs + welcome/about/contact/courses-index

### Core Web Vitals — Images (CLS)
- ✅ `welcome.tsx` CourseCard thumbnails: `width={600}` `height={340}` present
- ❌ `show.tsx` main course thumbnail: missing `width` and `height` — causes layout shift
- ❌ `show.tsx` sidebar thumbnail: missing `width` and `height` — causes layout shift

---

## On-Page SEO

### Landing Page (`welcome.tsx`)
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `AppName — Learn, Prove, Get Hired` |
| `meta description` | ✅ | Static, well-written, 160 chars |
| `canonical` | ✅ | Locale-aware `${appUrl}/${l}/` |
| `og:title` | ✅ | |
| `og:description` | ✅ | |
| `og:image` | ✅ | `/og-image.png` with width/height declared |
| `og:type` | ✅ | `website` |
| `hrefLang en` | ✅ | `/en/` |
| `hrefLang bn` | ⚠️ | Points to `/en?course_lang=bn` — should point to `/bn/` if locale prefix exists |
| `hrefLang x-default` | ✅ | `/en/` |
| JSON-LD EducationalOrganization | ✅ | |
| JSON-LD WebSite + SearchAction | ✅ | |
| JSON-LD Course (featured courses) | ✅ | Renders one per featured course |
| Keywords meta | ✅ | Present (low SEO weight but harmless) |

### Course Intro Page (`show.tsx`) — `/en/courses/{slug}`
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `course.title \| AppName` |
| `meta description` | ✅ | Uses `course.subtitle`, falls back to stripped `description` |
| `canonical` | ✅ | `ogUrl` passed from controller |
| `og:title` | ✅ | |
| `og:description` | ✅ | Uses `course.subtitle` (same as meta description) |
| `og:image` | ✅ | `course.thumbnail ?? '/logo.png'` |
| `og:type` | ✅ | `"website"` |
| `twitter:card` | ✅ | `summary_large_image` |
| JSON-LD Course schema | ✅ | Implemented with `hasCourseInstance`, `instructor`, `offers` |
| JSON-LD BreadcrumbList | ✅ | Implemented — Courses → Course title |
| Thumbnail `width`/`height` | ✅ | Main `1280×720`, sidebar `320×180` |
| `<article>` wrapper | ✅ | Main content column is `<article>` |
| Breadcrumb HTML | ✅ | `<nav aria-label="Breadcrumb"><ol><li>` with real `<Link>` href |

### Learn Page (`learn.tsx`) — `/en/courses/{slug}/learn/{id}`
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `course.title — Learn` |
| `meta description` | ⚠️ | Uses `course.description` — could use active lesson title + course name |
| `canonical` | ✅ | `ogUrl` from server (no fragment — `#r-5` is client-side only, canonical is clean) |
| `og:image` | ✅ | `course.thumbnail` |
| `og:type` | ⚠️ | `"article"` — acceptable, low priority |
| `robots` | ✅ | Indexable — paid content not SSR-rendered, lock overlay only shown client-side |
| URL fragments (`#r-5`) | ✅ | Not an SEO issue — Google strips fragments, canonical resolves to `/learn/{id}` |
| JSON-LD LearningResource | ❌ | Missing — useful for indexed lesson pages (week 1, not day 1) |

---

## To-Do List (Priority Order)

### Day 1 — Before Launch

#### `README.md` (create)
- [x] Document SSR Node process: how to start, what breaks if it's down, production deployment steps

#### `robots.txt` (now dynamic via controller)
- [x] `RobotsController` created — Sitemap URL from `config('app.url')`
- [x] Route registered in `web.php`
- [x] `.htaccess` updated to force `/robots.txt` through PHP
- [x] Add `Disallow: /login` and `Disallow: /register`
- [ ] **Nginx only:** add `try_files` override (documented in README)

#### `resources/js/pages/courses/show.tsx`
- [x] Meta description + `og:description`: `course.subtitle` with `description` fallback
- [x] `og:type`: `"website"`
- [x] Course JSON-LD schema with `hasCourseInstance`, `instructor`, `offers`
- [x] BreadcrumbList JSON-LD schema
- [x] `width`/`height` on both thumbnail images
- [x] `<article>` wrapper on main content column
- [x] Semantic `<nav aria-label="Breadcrumb"><ol><li>` breadcrumb with real link

#### Verify manually
- [ ] `public/og-image.png` exists and is 1200×630px

### Week 1 — After Launch
- [ ] Create `/public/llms.txt` — markdown file listing all courses + descriptions for LLM crawlers (ChatGPT, Perplexity, Claude)
- [ ] Submit `sitemap.xml` to Google Search Console on launch day
- [ ] Verify SitemapController covers all course slugs + welcome/about/contact/courses-index
- [ ] `learn.tsx`: add `LearningResource` JSON-LD schema for indexed lesson pages
- [ ] Fix `hrefLang="bn"` in `welcome.tsx` — currently points to `/en?course_lang=bn`, should be `/bn/` if that locale route exists
- [ ] Monitor Core Web Vitals in Google Search Console (LCP, CLS, INP)

### Standards to Maintain (Ongoing)
- Every new indexable page: unique `<title>` (≤60 chars) + `<meta description>` (≤160 chars) + `canonical`
- `og:image` always 1200×630px landscape — never portrait or square
- Every new course page: Course JSON-LD with `hasCourseInstance` + BreadcrumbList JSON-LD
- New courses added to sitemap automatically via `SitemapController` — never hardcode URLs
- `<article>` for all primary content pages, `<section>` for named content blocks, `<aside>` for sidebars
- Heading hierarchy: one `<h1>` per page → `<h2>` sections → `<h3>` subsections — never skip levels

---

## Page Index Decision Log
| Page | Index? | Rationale |
|------|--------|-----------|
| `/` (welcome) | ✅ Yes | Main landing page |
| `/en/` | ✅ Yes | Locale landing |
| `/en/courses` | ✅ Yes | Course listing page |
| `/en/courses/{slug}` | ✅ Yes | Primary SEO target per course |
| `/en/courses/{slug}/learn/{id}` | ✅ Yes | Paid content not SSR-rendered; Google sees lock overlay, not paid content — not a cloaking issue |
| `/login`, `/register` | ❌ No | Add to robots.txt — no SEO value |
| `/dashboard` | ❌ No | Blocked in robots.txt |
| `/admin/*` | ❌ No | Blocked in robots.txt |
| `/mentor/*` | ❌ No | Blocked in robots.txt |
| `/settings/*` | ❌ No | Blocked in robots.txt |

---

## LLM Discoverability (GEO)

### What LLMs use to understand your site
- `og:title`, `og:description`, `og:image` — already set ✅
- JSON-LD structured data — Course schema missing on show.tsx ❌
- Semantic HTML (`<article>`, `<section>`, heading hierarchy) — mostly done ✅ (article missing ❌)
- `/llms.txt` — not created yet ❌

### `/llms.txt` format (create at `/public/llms.txt`)
A markdown file at domain root. LLMs (ChatGPT browsing, Perplexity, Claude) check for it.
Lists your platform description, all course URLs with descriptions, and key pages.
Directly influences how LLMs describe your platform when users ask "what's a good course for X".
