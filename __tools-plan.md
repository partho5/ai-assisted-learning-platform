# Tools Ecosystem — Implementation Plan

First tool: **Bold Text Generator / Editor** at `/en/tools/bold-text-generator-editor`.
Index page: `/en/tools`. Public, no login. English only (`/bn/tools*` → 404).

**How to use this file:** each part is sized for one session. At the start of a session, find the first part marked `[ ]`, build only that part, tick its boxes, set its status, update the Progress table, commit. Do not start the next part.

## Progress

| Part | Scope | Status |
|------|-------|--------|
| 1 | Backend: contract, registry, manager, controller, routes, redirect | `[x]` |
| 2 | Frontend foundation: Unicode engine, tools layout, shared pieces | `[ ]` |
| 3 | Tool page: bold-text-generator-editor (both modes) | `[ ]` |
| 4 | Tools index page (card view) + footer link | `[ ]` |
| 5 | Sitemap + backend tests + final checks | `[ ]` |

Status values: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## Decisions (locked — do not re-litigate)

- **Output is pure Unicode** (Mathematical Alphanumerics), never HTML/CSS. Must survive copy-paste into LinkedIn / X / WhatsApp / Instagram.
- **Bold** = Sans-Serif Bold (𝗔, base `U+1D5D4` upper, `U+1D5EE` lower, `U+1D7EC` digits).
- **Italic** = Sans-Serif Bold Italic (𝘼, base `U+1D63C` upper, `U+1D656` lower; no italic digits exist, so digits pass through). Style choices are data in one map so they can change later without touching anything else.
- **Fully client-side conversion.** No DB, models, migrations, or server state for tools.
- **English only.** Tools routes accept `locale=en` only. Bengali is irrelevant here.
- **Registry pattern.** Adding a tool must not require editing `routes/web.php` or `ToolController`.
- **Tool list is hardcoded** (PHP registry array). Not DB-driven.
- **Own layout.** Do not reuse `public-layout.tsx`. Tools layout has a top navbar with the logo + brand name linking home; nothing else in the nav.
- **Footer link** to Tools added in the existing public footer. No top-nav link.
- **JS tests skipped for now.** PHPUnit feature tests only.
- Follow `CLAUDE.md` rules: `make:` artisan commands with `--no-interaction`, Form-less (no forms here), explicit return types, PHPDoc over inline comments, `vendor/bin/pint --dirty --format agent`, activate the `inertia-react-development`, `wayfinder-development`, `tailwindcss-development` skills before frontend work, use `search-docs` before coding.

## Non-disruption footprint

New files (safe):
- `app/Contracts/Tool.php`
- `app/Services/Tools/ToolRegistry.php`
- `app/Services/Tools/UnicodeBoldManager.php`
- `app/Http/Controllers/ToolController.php`
- `resources/js/layouts/tools-layout.tsx`
- `resources/js/lib/unicode-text.ts`
- `resources/js/components/tools/*`
- `resources/js/pages/tools/index.tsx`, `resources/js/pages/tools/bold-text-generator-editor.tsx`
- `tests/Feature/ToolsTest.php`

Edits to existing files (small, additive only):
- `routes/web.php` — one new route group + one redirect (see Part 1)
- `app/Http/Controllers/SitemapController.php` — one new method, one line in `index()`
- `resources/js/layouts/public-layout.tsx` — one footer `<li>`
- `resources/lang/en/ui.php`, `resources/lang/bn/ui.php` — `footer.tools` key

No changes to: ArticleController, CourseController, WelcomeController, middleware, models, migrations, `HandleInertiaRequests`.

## Gotchas to respect

1. **Default locale is `bn`** (`config('app.locale')`). The existing `foreach` redirect array in `routes/web.php` sends bare paths to `/bn/...`. Do **not** add `tools` there — it would redirect to `/bn/tools` (404). Add a dedicated redirect to `/en/tools`.
2. **`SetLocale` middleware** reads the `{locale}` route param and 404s on unsupported values. Use `{locale}` constrained to `en` so the middleware sets the locale correctly and `/bn/tools` simply does not match.
3. **Sitemap emits every static page for every locale.** Tools must be emitted for `en` only — do not add to `STATIC_PAGES`.
4. **Route order:** `tools` (index) before `tools/{slug}`; slug constrained to `[a-z0-9-]+`. Unknown slug → registry returns null → `abort(404)`.
5. **Surrogate pairs:** converted characters are 2 UTF-16 code units. Use `Array.from()` / code-point iteration for mapping; `selectionStart/End` are UTF-16 offsets so slicing the string by them is consistent, but guard against a selection boundary splitting a pair (nudge the boundary outward).
6. **Re-styling already styled text:** normalise to plain ASCII first, then apply the style (so Bold over an italic selection replaces, not stacks).
7. **Wayfinder:** `@/actions/App/Http/Controllers/ToolController` only exists after Wayfinder generation (`npm run build`/`npm run dev`, or the wayfinder generate command). Check before importing.
8. **Footer is translated** via `ui.public.footer.*`. Tools link must point to `/en/tools` explicitly, even on `/bn` pages.

---

## Part 1 — Backend: contract, registry, manager, controller, routes

Status: `[x]`

- [x] `search-docs` for Inertia render + route constraints.
- [x] `php artisan make:class` / `make:controller` (`ToolController`, no resource flags). Contract `App\Contracts\Tool` with: `slug(): string`, `name(): string`, `description(): string`, `component(): string`, `meta(): array{title:string, description:string}` (PHPDoc array shape).
- [x] `App\Services\Tools\UnicodeBoldManager implements Tool` — slug `bold-text-generator-editor`, component `tools/bold-text-generator-editor`, English SEO title/description.
- [x] `App\Services\Tools\ToolRegistry` — hardcoded array of manager classes; `all(): array`, `find(string $slug): ?Tool`. Resolve managers via the container.
- [x] `ToolController@index` renders `tools/index` with the tool cards (slug, name, description) + meta. `ToolController@show(string $locale?, string $slug)` — check how `SetLocale` calls `forgetParameter('locale')` so the action signature receives only `$slug`; 404 on unknown; render `$tool->component()` with `meta` including `url => url()->current()` (canonical).
- [x] `routes/web.php`: new group `Route::prefix('{locale}')->where(['locale' => 'en'])->middleware('setlocale')` with `tools` → `tools.index` and `tools/{slug}` (where `[a-z0-9-]+`) → `tools.show`.
- [x] `routes/web.php`: GET-only 301 redirects `/tools` → `/en/tools` and `/tools/{slug}` → `/en/tools/{slug}` (dedicated, not the existing array).
- [x] Pint.

Done when: `php artisan route:list --path=tools` shows the routes; manual curl of `/en/tools/bold-text-generator-editor` renders (page component may not exist yet — fine until Part 3; tests come in Part 5).

## Part 2 — Frontend foundation

Status: `[ ]`

- [ ] Activate skills: `inertia-react-development`, `tailwindcss-development`.
- [ ] `resources/js/lib/unicode-text.ts` — pure functions, no React:
  - style map `{ bold: {...bases}, italic: {...bases} }`
  - `toStyle(text, style)`, `normalize(text)` (any styled char → ASCII), `applyToSelection(value, start, end, style)` → `{ value, selectionStart, selectionEnd }` (code-point safe, boundary guard, normalise-then-apply).
- [ ] `resources/js/layouts/tools-layout.tsx` — sticky top bar: `/logo.png` + `BRAND_NAME` (from `@/lib/brand`) linking to `/${locale}/`; centered content container; dark-mode aware (reuse tokens used by public-layout); no footer, no nav links. Check `resources/js/layouts/*` for how layouts are applied to pages (`Page.layout` vs wrapper) and match.
- [ ] Reusable `CopyButton` in `resources/js/components/tools/` — `navigator.clipboard.writeText` with textarea fallback, checkmark state for ~2s. No toast library exists in the project, so use inline state, not a new dependency.

Done when: `npm run build` (or `npx tsc --noEmit`) passes. No visible page yet.

## Part 3 — Tool page: bold-text-generator-editor

Status: `[ ]`

- [ ] `resources/js/pages/tools/bold-text-generator-editor.tsx` using `tools-layout`; `<Head>` title/description from `meta` (pattern: `about-us.tsx`), canonical link.
- [ ] **Section 1 — Full-text converter:** input textarea, live Sans-Bold output box, Copy button, Convert behaviour = live preview (button optional/cosmetic; keep it per spec).
- [ ] **Section 2 — Mixed-style editor (the main goal):** one textarea; toolbar with **Bold (𝗕)** and **Italic (𝘐)**; click converts only the highlighted range in place, keeps the converted range selected, restores focus; buttons disabled when selection is empty; `onMouseDown` preventDefault on toolbar buttons so selection is not lost. Prefer `document.execCommand('insertText')` / `setRangeText` so native undo still works. **Copy Passage** button copies the whole textarea value.
- [ ] Toolbar is driven by the style list in `unicode-text.ts` so future styles (monospace, cursive…) are a one-line addition.
- [ ] SEO body text below the tool: How it works, Where to use (LinkedIn, X, Instagram, WhatsApp, Discord, bios), FAQ (include note: works for Latin letters and digits only; some platforms/screen readers read these characters poorly). Real semantic headings.
- [ ] Mobile-friendly layout; check light and dark.

Done when: user can type "I am a AI Expert, build RAG applications like chatbot", select "AI Expert" → Bold, select "chatbot" → Italic, and Copy yields `I am a 𝗔𝗜 𝗘𝘅𝗽𝗲𝗿𝘁, … like 𝙘𝙝𝙖𝙩𝙗𝙤𝙩`. Verify in the browser.

## Part 4 — Tools index page + footer link

Status: `[ ]`

- [ ] `resources/js/pages/tools/index.tsx` using `tools-layout`: heading + card grid (reuse `components/ui/card.tsx`), one card for the bold tool, each card links to `/en/tools/{slug}` (via Wayfinder `show` action). Data comes from the controller's registry list (hardcoded in PHP, not DB). `<Head>` meta.
- [ ] `public-layout.tsx` footer: add a Tools `<li>` in the Platform column, href `/en/tools`.
- [ ] Add `footer.tools` to `resources/lang/en/ui.php` and `resources/lang/bn/ui.php` (check how `ui.public` is shared to the front end and the TS type for it, if any).
- [ ] Verify no other existing page changed behaviour.

## Part 5 — Sitemap + tests + final checks

Status: `[ ]`

- [ ] `SitemapController`: new `toolUrls($baseUrl)` — `en` only, `/en/tools` plus one URL per registry tool; priorities ~0.6 hub / 0.7 tool, `monthly`. Merge in `index()`.
- [ ] `php artisan make:test --phpunit ToolsTest` — cases: guest gets 200 on `/en/tools` and `/en/tools/bold-text-generator-editor` (Inertia component + meta asserted); `/en/tools/unknown` → 404; `/bn/tools` and `/bn/tools/bold-text-generator-editor` → 404; `/tools` and `/tools/bold-text-generator-editor` → 301 to `/en/…`; sitemap contains the `/en/tools…` URLs and no `/bn/tools…`; registry `find()` returns null for unknown slug.
- [ ] Run only `php artisan test --compact tests/Feature/ToolsTest.php` plus `tests/Feature/ContentLanguageSitemapTest.php` (existing sitemap test, regression check).
- [ ] `vendor/bin/pint --dirty --format agent`, `npm run lint` / `npx tsc --noEmit` if configured.
- [ ] Ask the user whether to run the full suite.
- [ ] Update `__dev-progress.md` with a one-line Tools entry (only if the user wants it).

---

## Adding the next tool (after this plan)

1. Create `XyzManager implements Tool` in `app/Services/Tools/`.
2. Add it to the array in `ToolRegistry`.
3. Add `resources/js/pages/tools/<slug>.tsx`.
4. Add/adjust a test. No route, controller, index-page or sitemap edits needed.
