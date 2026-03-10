# Landing Page Plan

## The goal

A world-class landing page. Professional, credible, fast. Built from the perspective of a real potential learner or buyer. SEO-first from the ground up.

---

## SEO Architecture

### Server-Side Rendering (SSR) — already configured

`resources/js/ssr.tsx` and Vite SSR are both set up. The landing page renders on the server — crawlers see full HTML, not a blank JS shell. This is the most important SEO foundation and it's already done.

### Blade template (`app.blade.php`) — what to add/improve

```html
<!-- Font: preconnect + preload critical font files (no FOUT) -->
<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
<link rel="preload" href="https://fonts.bunny.net/css?family=bricolage-grotesque:600,700&instrument-sans:400,500,600" as="style">
<link href="https://fonts.bunny.net/css?family=bricolage-grotesque:600,700&instrument-sans:400,500,600&display=swap" rel="stylesheet">

<!-- Already have: favicon, apple-touch-icon -->
<!-- Add: OG image fallback, theme-color -->
<meta name="theme-color" content="#0f0f0f">
```

### Meta tags — in `welcome.tsx` via Inertia `<Head>`

Every tag that matters:

```tsx
<Head title="Learn. Prove. Get Hired.">
    <meta name="description" content="Take mentor-led courses, complete real tests and assignments, and build a verified skill portfolio employers can trust. Free to start." />
    <meta name="keywords" content="skill evidence, online courses, verified learning, skill portfolio, mentor courses" />
    <link rel="canonical" href="https://yoursite.com/en/" />

    {/* hreflang — EN/BN language variants */}
    <link rel="alternate" hreflang="en" href="https://yoursite.com/en/" />
    <link rel="alternate" hreflang="bn" href="https://yoursite.com/bn/" />
    <link rel="alternate" hreflang="x-default" href="https://yoursite.com/en/" />

    {/* Open Graph */}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Learn. Prove. Get Hired. — SkillEvidence" />
    <meta property="og:description" content="Take mentor-led courses, complete real tests and assignments, and build a verified skill portfolio employers can trust." />
    <meta property="og:url" content="https://yoursite.com/en/" />
    <meta property="og:image" content="https://yoursite.com/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:locale:alternate" content="bn_BD" />

    {/* Twitter Card */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Learn. Prove. Get Hired." />
    <meta name="twitter:description" content="Build a verified skill portfolio with real mentor-reviewed work." />
    <meta name="twitter:image" content="https://yoursite.com/og-image.png" />
</Head>
```

### Schema.org JSON-LD — injected in the page

Three schemas, inlined as `<script type="application/ld+json">`:

**1. Organization**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SkillEvidence",
  "url": "https://yoursite.com",
  "logo": "https://yoursite.com/logo.png",
  "sameAs": []
}
```

**2. WebSite (enables Google sitelinks search box)**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SkillEvidence",
  "url": "https://yoursite.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://yoursite.com/en/courses?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**3. EducationalOrganization**
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "SkillEvidence",
  "description": "Mentor-led online courses with verified skill portfolios.",
  "url": "https://yoursite.com",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Courses"
  }
}
```

For featured courses (rendered from deferred props), add per-course `Course` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Course Title",
  "description": "...",
  "provider": { "@type": "Person", "name": "Mentor Name" },
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
```

### Sitemap — Laravel route

Add a `GET /sitemap.xml` route that returns dynamic XML:
- `/en/` and `/bn/` (homepage)
- `/en/courses` and `/bn/courses`
- `/en/about-us`
- Each published course: `/en/courses/{slug}`
- Each public portfolio: `/en/u/{username}`

Priority: homepage=1.0, courses=0.9, individual course=0.8, portfolio=0.6.

### robots.txt — `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /en/dashboard
Disallow: /en/admin/
Disallow: /en/mentor/
Disallow: /settings/

Sitemap: https://yoursite.com/sitemap.xml
```

---

## Page Speed (Core Web Vitals)

### LCP — Largest Contentful Paint
- The hero headline is text (renders instantly via SSR). No hero image that blocks LCP.
- If a product screenshot is used: `<img fetchpriority="high" loading="eager">` — not lazy.
- Font: `display=swap` on Bunny CDN URL ensures text renders immediately in fallback font.

### CLS — Cumulative Layout Shift
- Always set explicit `width` and `height` on all `<img>` tags (prevents layout shift).
- Logo in nav: fixed dimensions.
- Featured courses section: skeleton placeholder while deferred props load (prevents jump).

### INP — Interaction to Next Paint
- No heavy JS on initial load. Animations are pure CSS transitions.
- Deferred props (Inertia v2) load featured courses after paint — main thread stays free.

---

## Fonts

```
Bricolage Grotesque 600/700  →  h1, h2 headings (editorial, confident)
Instrument Sans 400/500/600  →  body, nav, buttons (already default)
```

Both loaded from Bunny (GDPR-safe Google Fonts mirror) with `display=swap`.

---

## Animations — zero new packages

- **Scroll-triggered**: 1 `useInView` hook (~10 lines) using native `IntersectionObserver`
- **Transitions**: Tailwind `transition-all duration-700 ease-out`
- **Entry state**: `opacity-0 translate-y-6` → `opacity-100 translate-y-0`
- **tw-animate-css**: already in `app.css`, use for hero entrance on mount

---

## Semantic HTML structure

```html
<body>
  <header role="banner">        ← sticky nav
    <nav aria-label="Main navigation">
  </header>
  <main>
    <section aria-label="Hero">          ← h1 here (only one on page)
    <section aria-label="How it works">  ← id="how-it-works"
    <section aria-label="Courses">
    <section aria-label="Portfolio">
    <section aria-label="For mentors">   ← id="for-mentors"
    <section aria-label="Pricing">       ← id="pricing"
    <section aria-label="Get started">
  </main>
  <footer role="contentinfo">
</body>
```

One `h1` only. Section headings are `h2`. Sub-items are `h3`.

---

## Visitor's mental journey (content)

### 1. Hero (0–3 seconds)

> **"Take courses. Pass real tests. Get a portfolio employers actually trust."**

Two CTAs: "Browse Courses" + "See a sample portfolio" (links to real `/u/username`).
Below: product screenshot — real UI, not illustration.

### 2. How it works (#how-it-works)

Three steps:
- **Pick a course** — mentors build structured courses with videos, readings, assignments.
- **Do the work** — complete resources, take tests, submit assignments. AI helps.
- **Earn your evidence** — mentors endorse your work. Your portfolio updates automatically.

### 3. Featured courses

2–3 real courses from the catalog. Real titles, mentor names, prices. Loaded via Inertia deferred props. Skeleton shown while loading.

### 4. Portfolio angle (differentiator)

> "Every learner gets a public profile at yoursite.com/u/yourname"

Show a real or stylized portfolio card. This is what makes the platform different from Udemy.

### 5. For mentors (#for-mentors)

Brief. One paragraph. One "Start teaching" button.

### 6. Pricing (#pricing)

- Free: browse, access free resources, AI chat
- Per course: individual purchase at mentor's price
- Coupons available

### 7. Final CTA

> "Start learning for free. No credit card."

One button.

### 8. Footer

Courses, About, Privacy, Terms, locale switcher (EN | বাংলা).

---

## What NOT to include

- Fake testimonials or inflated numbers
- "Powered by AI" as a selling point
- Feature grid with 12+ icons
- Stock photos of people at laptops
- Fake enterprise pricing tiers

---

## File checklist when building

- [ ] `resources/js/pages/welcome.tsx` — rewrite with all sections + schema JSON-LD
- [ ] `resources/js/layouts/public-layout.tsx` — expand nav links
- [ ] `resources/views/app.blade.php` — add font preload, theme-color
- [ ] `app/Http/Controllers/` — WelcomeController to pass featured courses (deferred)
- [ ] `routes/web.php` — sitemap route
- [ ] `app/Http/Controllers/SitemapController.php` — dynamic sitemap
- [ ] `public/robots.txt` — create
- [ ] `public/og-image.png` — create 1200×630 OG image
