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
