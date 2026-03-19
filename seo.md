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
- **CRITICAL:** All `<Head>` meta tags (title, description, OG, JSON-LD) depend on SSR. Without it, crawlers see ONLY the default `<title>Skill Evidence</title>` and zero meta/structured data.

### robots.txt
- ✅ Now served dynamically via `RobotsController` — Sitemap URL built from `config('app.url')`
- ✅ `.htaccess` updated — `RewriteRule ^robots\.txt$` before `!-f` check forces PHP handling
- ✅ Blocks: dashboard, admin, mentor, settings, login, register, password-reset, email/verify, _boost (all locales)
- ✅ `Sitemap:` line uses full dynamic URL from `APP_URL`
- **Nginx note:** documented in README — needs `try_files` override for `/robots.txt`
- Learn pages intentionally NOT blocked — decision: index all lesson pages

### Sitemap
- ✅ Route defined: `GET /sitemap.xml` → `SitemapController@index`
- ✅ Static page `lastmod` uses fixed date (not `now()`) — prevents Google from thinking pages change every fetch
- ✅ Course catalog `lastmod` uses `MAX(updated_at)` from published courses
- ✅ Free learn page URLs included — publicly accessible lesson pages are in sitemap
- ❌ Not yet submitted to Google Search Console — do on launch day

### LLM Discoverability (llms.txt)
- ✅ Dynamic route: `GET /llms.txt` → `LlmsTxtController@index`
- ✅ Auto-generates markdown with platform description, key pages, all published courses with titles/URLs/prices/mentors
- ✅ LLMs (ChatGPT, Perplexity, Claude) check for this file to understand site content

### Shared Inertia Props (SEO Foundation)
- ✅ `appUrl` shared globally from `HandleInertiaRequests` via `config('app.url')` — all pages have access to absolute base URL
- ✅ `name` (app name) shared globally — consistent across all OG/JSON-LD references
- **Rule:** Never use `window.location.origin` for SEO URLs — always use the server-provided `appUrl` prop

### Core Web Vitals — Images (CLS)
- ✅ `welcome.tsx` CourseCard thumbnails: `width={600}` `height={340}` present
- ✅ `show.tsx` main course thumbnail: `width={1280}` `height={720}` present
- ✅ `show.tsx` sidebar thumbnail: `width={320}` `height={180}` present

---

## On-Page SEO

### Landing Page (`welcome.tsx`)
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `AppName — Learn, Prove, Get Hired` |
| `meta description` | ✅ | Static, well-written, 160 chars |
| `canonical` | ✅ | Locale-aware `${appUrl}/${l}/` |
| `og:site_name` | ✅ | App name |
| `og:title` | ✅ | |
| `og:description` | ✅ | |
| `og:image` | ✅ | `/og-image.png` with width/height/alt declared |
| `og:type` | ✅ | `website` |
| `og:locale` | ✅ | `en_US` with `bn_BD` alternate |
| `hrefLang en` | ✅ | `/en/` |
| `hrefLang bn` | ✅ | `/bn/` (fixed — was incorrectly pointing to `/en?course_lang=bn`) |
| `hrefLang x-default` | ✅ | `/en/` |
| JSON-LD EducationalOrganization | ✅ | |
| JSON-LD WebSite + SearchAction | ✅ | Target URL uses `?search=` (fixed — was `?q=`) |
| JSON-LD Course (featured courses) | ✅ | Renders one per featured course |
| Keywords meta | ✅ | Present (low SEO weight but harmless) |
| `appUrl` source | ✅ | From server-shared `appUrl` prop (fixed — was `window.location.origin`) |

### Course Catalog (`index.tsx`) — `/en/courses`
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `Courses` |
| `meta description` | ✅ | Static, descriptive |
| `canonical` | ✅ | `ogUrl` from controller |
| `og:site_name` | ✅ | App name |
| `og:title` | ✅ | `Courses | AppName` |
| `og:description` | ✅ | |
| `og:image` | ✅ | Absolute URL `${appUrl}/og-image.png` with width/height/alt |
| `og:type` | ✅ | `website` |
| `og:locale` | ✅ | `en_US` with `bn_BD` alternate |
| `hrefLang en/bn/x-default` | ✅ | All three present |
| `twitter:card` | ✅ | `summary_large_image` with absolute image URL |
| JSON-LD CollectionPage + ItemList | ✅ | Lists all visible courses as `ListItem` entries |
| JSON-LD BreadcrumbList | ✅ | Home → Courses |

### Course Intro Page (`show.tsx`) — `/en/courses/{slug}`
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `course.title \| AppName` |
| `meta description` | ✅ | Uses `course.subtitle`, falls back to stripped `description` |
| `canonical` | ✅ | `ogUrl` passed from controller |
| `og:site_name` | ✅ | App name |
| `og:title` | ✅ | |
| `og:description` | ✅ | Uses `course.subtitle` (same as meta description) |
| `og:image` | ✅ | Absolute URL with width/height/alt; `course.thumbnail ?? '/logo.png'` |
| `og:type` | ✅ | `"website"` |
| `og:locale` | ✅ | `en_US` with `bn_BD` alternate |
| `hrefLang en/bn/x-default` | ✅ | All three present |
| `twitter:card` | ✅ | `summary_large_image` with absolute image URL |
| JSON-LD Course schema | ✅ | Implemented with `hasCourseInstance`, `instructor`, `offers` |
| JSON-LD BreadcrumbList | ✅ | Courses → Course title |
| Thumbnail `width`/`height` | ✅ | Main `1280×720`, sidebar `320×180` |
| `<article>` wrapper | ✅ | Main content column is `<article>` |
| Breadcrumb HTML | ✅ | `<nav aria-label="Breadcrumb"><ol><li>` with real `<Link>` href |
| `appUrl` source | ✅ | From server-shared `appUrl` prop (fixed — was undefined) |

### Learn Page (`learn.tsx`) — `/en/courses/{slug}/learn/{id}`
| Tag | Status | Notes |
|-----|--------|-------|
| `<title>` | ✅ | `{activeResourceTitle} — {course.title}` (improved — was generic `course.title — Learn`) |
| `meta description` | ✅ | `{activeResourceTitle} — {courseDescription}` (improved — was just course description) |
| `canonical` | ✅ | Points to learn page URL itself (fixed — was pointing to show page) |
| `og:site_name` | ✅ | App name |
| `og:image` | ✅ | Absolute URL with width/height/alt |
| `og:type` | ✅ | `"article"` |
| `og:locale` | ✅ | `en_US` with `bn_BD` alternate |
| `hrefLang en/bn/x-default` | ✅ | All three present |
| JSON-LD LearningResource | ✅ | With `isPartOf: Course`, provider |
| JSON-LD BreadcrumbList | ✅ | Courses → Course → Resource title |
| `robots` | ✅ | Indexable — paid content not SSR-rendered |

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
- [x] Add `Disallow: /password-reset`, `/email/verify`, `/_boost/`
- [ ] **Nginx only:** add `try_files` override (documented in README)

#### Global SEO infrastructure
- [x] Share `appUrl` globally from `HandleInertiaRequests` — `config('app.url')`
- [x] All pages use server `appUrl` prop (not `window.location.origin`)
- [x] `og:site_name` on all 4 audited pages
- [x] `hreflang` tags (en, bn, x-default) on all 4 audited pages
- [x] `og:image:width`, `og:image:height`, `og:image:alt` on all pages
- [x] `og:locale` and `og:locale:alternate` on all pages
- [x] All OG/Twitter image URLs are absolute (not relative `/logo.png`)

#### `welcome.tsx`
- [x] Use server `appUrl` prop instead of `window.location.origin`
- [x] Fix `hrefLang="bn"` → `/bn/` (was `/en?course_lang=bn`)
- [x] Fix SearchAction target `?search=` (was `?q=`)
- [x] Remove `console.log('locale', l)` debug statement
- [x] Add `og:site_name`, `og:image:alt`

#### `courses/index.tsx`
- [x] Add `CollectionPage` + `ItemList` JSON-LD schema
- [x] Add `BreadcrumbList` JSON-LD schema
- [x] Add `hreflang` en/bn/x-default
- [x] Use absolute OG image URL `${appUrl}/og-image.png`
- [x] Add `og:site_name`, `og:image:width/height/alt`, `og:locale`

#### `courses/show.tsx`
- [x] Add `hreflang` en/bn/x-default
- [x] Make OG image URL absolute
- [x] Add `og:site_name`, `og:image:width/height/alt`, `og:locale`
- [x] Use server `appUrl` prop (was destructured as undefined)

#### `courses/learn.tsx`
- [x] Add `LearningResource` JSON-LD schema
- [x] Add `BreadcrumbList` JSON-LD schema (Courses → Course → Resource)
- [x] Fix canonical → learn page URL (was pointing to show page)
- [x] Improve title: `{activeResourceTitle} — {courseTitle}` (was generic)
- [x] Add `hreflang` en/bn/x-default
- [x] Make OG image URL absolute
- [x] Add `og:site_name`, `og:image:width/height/alt`, `og:locale`

#### Sitemap
- [x] Fix static page `lastmod` — use fixed date instead of `now()`
- [x] Course catalog `lastmod` uses `MAX(updated_at)` from published courses
- [x] Add free learn page URLs to sitemap

#### LLM Discoverability
- [x] Create dynamic `/llms.txt` route via `LlmsTxtController`
- [x] Auto-generates markdown with platform info + all published courses

#### Verify manually
- [ ] `public/og-image.png` exists and is 1200×630px
- [ ] Submit `sitemap.xml` to Google Search Console on launch day

### Standards to Maintain (Ongoing)
- Every new indexable page: unique `<title>` (≤60 chars) + `<meta description>` (≤160 chars) + `canonical` + `hreflang` + `og:site_name`
- `og:image` always 1200×630px landscape with absolute URL — never portrait, square, or relative path
- Every new course page: Course JSON-LD with `hasCourseInstance` + BreadcrumbList JSON-LD
- New courses added to sitemap automatically via `SitemapController` — never hardcode URLs
- `<article>` for all primary content pages, `<section>` for named content blocks, `<aside>` for sidebars
- Heading hierarchy: one `<h1>` per page → `<h2>` sections → `<h3>` subsections — never skip levels
- All OG/Twitter image URLs must be absolute (prefix with `appUrl` if path starts with `/`)
- Use server-provided `appUrl` prop for all canonical/OG/hreflang URLs — never `window.location.origin`

---

## Page Index Decision Log
| Page | Index? | Rationale |
|------|--------|-----------|
| `/` (welcome) | ✅ Yes | Main landing page |
| `/en/` | ✅ Yes | Locale landing |
| `/en/courses` | ✅ Yes | Course listing page |
| `/en/courses/{slug}` | ✅ Yes | Primary SEO target per course |
| `/en/courses/{slug}/learn/{id}` | ✅ Yes | Canonical is learn page itself; free resources in sitemap |
| `/login`, `/register` | ❌ No | Blocked in robots.txt — no SEO value |
| `/dashboard` | ❌ No | Blocked in robots.txt |
| `/admin/*` | ❌ No | Blocked in robots.txt |
| `/mentor/*` | ❌ No | Blocked in robots.txt |
| `/settings/*` | ❌ No | Blocked in robots.txt |

---

## Google Translate Widget
- ✅ Script URL uses `https://` protocol (fixed — was protocol-relative `//`)
- Widget loads on all pages — low CWV impact since it defers
