# Skill Evidence Platform

Mentor-led online courses with verified skill portfolios. Built with Laravel + Inertia.js + React.

---

## Local Development

```bash
composer install
npm install

cp .env.example .env
php artisan key:generate

# Fill in .env — DB, APP_URL, Stripe/PayPal keys, etc.

php artisan migrate --seed

# Start dev server (runs Laravel + Vite + queue together)
composer run dev
# or use the convenience script:
bash dev-start.sh
```

---

## Production Deployment

**One-command deploy** (pull, migrate, build assets, restart queue worker):
```bash
bash deploy.sh
```

### Required Services

| Service | Command | What breaks if down |
|---------|---------|---------------------|
| PHP-FPM / Apache | standard | entire site |
| Queue worker | `php artisan queue:work` | emails, async jobs |
| **SSR Node process** | see below | Google indexes blank pages |

### SSR (Server-Side Rendering) — Critical for SEO

The app uses Inertia.js SSR. Without the Node process, Googlebot receives an empty
`<div id="app"></div>` and indexes zero content on every page.

**Build the SSR bundle:**
```bash
npm run build
```

**Start the SSR process (must stay running):**
```bash
node bootstrap/ssr/ssr.js
```

**Run as a persistent service with PM2 (recommended):**
```bash
npm install -g pm2
pm2 start bootstrap/ssr/ssr.js --name "ssr"
pm2 save
pm2 startup   # follow the printed command to enable on reboot
```

**Verify SSR is working:**
```bash
# Should return rendered HTML — not a blank <div id="app">
wget -qO- https://yourdomain.com/en/ | grep -c "<h1"
```

If that returns `0`, the SSR process is down.

### robots.txt

Served dynamically via `RobotsController` — Sitemap URL is built from `APP_URL` in `.env`.
The static `public/robots.txt` file is bypassed by the `.htaccess` rewrite rule.

> **Note:** If you are on Nginx (not Apache), add this to your server block to route
> `robots.txt` through PHP:
> ```nginx
> location = /robots.txt {
>     try_files $uri /index.php?$query_string;
> }
> ```

### Environment Variables (minimum for production)

```env
APP_URL=https://yourdomain.com      # used in robots.txt Sitemap line, JSON-LD, og: tags
APP_ENV=production
APP_DEBUG=false
```

---

## OG / Social Media Meta Tags

### How it works

Facebook, LinkedIn, and other social crawlers **do not execute JavaScript**. Because Inertia renders pages client-side, OG tags set via React's `<Head>` component are invisible to crawlers unless SSR is running.

To guarantee crawlers always see proper OG tags, this app renders them **server-side in `resources/views/app.blade.php`** using `$page['props']['meta']` — data that is always present in the initial HTML.

### Architecture

1. **`config/seo.php`** — stores the default OG image URL (full absolute URL):
   ```php
   'og_image' => 'https://your-cdn.com/og-image.png',
   ```

2. **`HandleInertiaRequests`** — shares a default `meta` array to every page (title, description, image, url).

3. **Controllers** — override `meta` per page. Example — `CourseController::show` sets the course thumbnail as `og:image` and the subtitle as `og:description`.

4. **`app.blade.php`** — renders static OG `<meta>` tags from `$page['props']['meta']` before `@inertiaHead`, so they're in the raw HTML regardless of SSR status.

### Adding OG meta to a new page

In the controller, pass a `meta` array to `Inertia::render()`:

```php
return Inertia::render('your/page', [
    'meta' => [
        'title' => 'Page Title | ' . config('app.name'),
        'description' => 'Page description under 160 characters.',
        'image' => config('seo.og_image'), // or a specific absolute URL
        'url' => url()->current(),
    ],
    // ... other props
]);
```

If `meta` is omitted, the defaults from `HandleInertiaRequests` are used automatically.

### Updating the default OG image

Edit `config/seo.php`:

```php
'og_image' => 'https://your-cdn.com/og-image.png',
```

The image should be **1200 × 630 px** for best results.

### Verifying OG tags

View the raw HTML source (`Ctrl+U`) and search for `og:image` — the tags should appear in `<head>` before any `<script>`, with full absolute URLs.

Use [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or [OpenGraph.xyz](https://www.opengraph.xyz) to preview how a URL appears when shared.

---

## Article Drafting

AI-assisted article drafting with SEO optimization, rich HTML formatting, and automatic internal linking to existing published articles.

**Trigger:**
```
read article-instructions/draft-article.md and draft an article titled "Your Title Here"
```

Optionally append a `lesson chunk:` block to expand a specific lesson into an article.

The process: skeleton with keyword strategy (waits for approval) → queries existing articles for internal link candidates → writes full HTML with links woven into prose → inserts as draft via tinker.
