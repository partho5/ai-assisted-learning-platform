# SkillEvidence — Production Deployment Guide

Target: **Ubuntu 22.04 LTS or 24.04 LTS** · **Nginx** · **PostgreSQL 17 + pgvector** · **PHP 8.4**

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [System Packages](#2-system-packages)
3. [PHP 8.4](#3-php-84)
4. [Node.js 22](#4-nodejs-22)
5. [PostgreSQL 17 + pgvector](#5-postgresql-17--pgvector)
6. [PostgreSQL: Create Database & User](#6-postgresql-create-database--user)
7. [Application: Clone & Install Dependencies](#7-application-clone--install-dependencies)
8. [Environment Configuration](#8-environment-configuration)
9. [Laravel Setup Commands](#9-laravel-setup-commands)
10. [File Permissions](#10-file-permissions)
11. [Queue Worker (Supervisor)](#11-queue-worker-supervisor)
12. [Task Scheduler (Cron)](#12-task-scheduler-cron)
13. [Nginx Configuration](#13-nginx-configuration)
14. [Let's Encrypt SSL (Certbot)](#14-lets-encrypt-ssl-certbot)
15. [First Admin User](#15-first-admin-user)
16. [RAG Knowledge Index (Initial Run)](#16-rag-knowledge-index-initial-run)
17. [Health Check](#17-health-check)
18. [Deploying Updates](#18-deploying-updates)

---

## 1. Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB (pgvector HNSW index benefits greatly) |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 20 GB | 40 GB |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

Open ports: **22** (SSH), **80** (HTTP → HTTPS redirect), **443** (HTTPS).

---

## 2. System Packages

```bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  git curl wget unzip gnupg2 ca-certificates \
  lsb-release software-properties-common \
  supervisor
```

---

## 3. PHP 8.4

Ubuntu's default repos do not carry PHP 8.4. Use the `ondrej/php` PPA.

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

sudo apt install -y \
  php8.4 php8.4-fpm \
  php8.4-pgsql \
  php8.4-mbstring \
  php8.4-xml \
  php8.4-curl \
  php8.4-zip \
  php8.4-bcmath \
  php8.4-intl \
  php8.4-pcntl \
  php8.4-tokenizer \
  php8.4-fileinfo \
  php8.4-readline
```

Install Composer:

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

Tune PHP-FPM for production — edit `/etc/php/8.4/fpm/pool.d/www.conf`:

```ini
; Process management: dynamic is safe; adjust pm.max_children to available RAM ÷ ~80 MB
pm = dynamic
pm.max_children = 20
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 8
pm.max_requests = 500

; Pass real client IP from nginx
clear_env = no
```

Edit `/etc/php/8.4/fpm/php.ini`:

```ini
upload_max_filesize = 50M
post_max_size = 55M
max_execution_time = 120
memory_limit = 256M
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 16
opcache.max_accelerated_files = 10000
opcache.validate_timestamps = 0   ; set to 1 during initial setup, 0 in production
opcache.save_comments = 1
```

```bash
sudo systemctl enable --now php8.4-fpm
sudo systemctl restart php8.4-fpm
```

---

## 4. Node.js 22

Vite 7 (used by this app) requires Node.js ≥ 20. Node 22 LTS is recommended.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should be v22.x
```

---

## 5. PostgreSQL 17 + pgvector

The app requires PostgreSQL with the `pgvector` extension for RAG-powered AI chat (512-dimension embeddings, HNSW index). The migration enables it automatically — you just need the extension installed at the OS level.

```bash
# Add the official PostgreSQL apt repository
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list'

wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

sudo apt update

# PostgreSQL 17 + pgvector extension package
sudo apt install -y postgresql-17 postgresql-client-17 postgresql-17-pgvector

sudo systemctl enable --now postgresql
```

Verify pgvector is available:

```bash
sudo -u postgres psql -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';"
# Should return one row. The migration will CREATE EXTENSION IF NOT EXISTS vector automatically.
```

---

## 6. PostgreSQL: Create Database & User

```bash
sudo -u postgres psql <<'SQL'
CREATE USER skillevidence WITH PASSWORD 'replace_with_strong_password';
CREATE DATABASE skillevidence_db OWNER skillevidence ENCODING 'UTF8';
GRANT ALL PRIVILEGES ON DATABASE skillevidence_db TO skillevidence;
-- Allow the app user to create extensions (needed for pgvector during migrate)
GRANT pg_extension_owner TO skillevidence;
ALTER DATABASE skillevidence_db OWNER TO skillevidence;
SQL
```

> **Note:** `pg_extension_owner` is a PostgreSQL 15+ role that allows non-superuser accounts to create extensions. On PostgreSQL < 15, you need a superuser to run `CREATE EXTENSION vector`, or pre-create it as superuser before running migrations:
>
> ```bash
> sudo -u postgres psql -d skillevidence_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
> ```

---

## 7. Application: Clone & Install Dependencies

```bash
sudo mkdir -p /var/www/skillevidence
sudo chown www-data:www-data /var/www/skillevidence

# Clone as www-data (or your deploy user)
cd /var/www
sudo -u www-data git clone https://github.com/YOUR_ORG/YOUR_REPO.git skillevidence
cd skillevidence

# PHP dependencies (no dev packages in production)
sudo -u www-data composer install \
  --no-dev \
  --optimize-autoloader \
  --no-interaction

# JS dependencies & production build
sudo -u www-data npm ci
sudo -u www-data npm run build
```

`npm run build` compiles and fingerprints all Vite assets into `public/build/`. This must run on every deploy when frontend files change.

---

## 8. Environment Configuration

```bash
sudo -u www-data cp .env.example .env
sudo -u www-data nano .env
```

Set the following values. Every other key can stay at its default unless you need it.

```dotenv
APP_NAME="SkillEvidence"
APP_ENV=production
APP_KEY=                          # generated in next step
APP_DEBUG=false
APP_URL=https://yourdomain.com

APP_LOCALE=en
APP_FALLBACK_LOCALE=en

LOG_CHANNEL=stack
LOG_STACK=daily
LOG_LEVEL=error                   # error in production; use debug only when diagnosing

# PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=skillevidence_db
DB_USERNAME=skillevidence
DB_PASSWORD=replace_with_strong_password

# Use database drivers — no Redis required
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database

# Mail — choose one transport
MAIL_MAILER=smtp                  # or: postmark | resend | ses | log (log = no real mail)
MAIL_HOST=your.smtp.host
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_smtp_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="no-reply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"

# OpenAI — used for AI grading, hints, chat, and RAG embeddings
# Embedding model is hardcoded to text-embedding-3-small (512 dims)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini          # chat/grading model; gpt-4o for better quality

# PayPal
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_MODE=live                  # sandbox | live
PAYPAL_WEBHOOK_ID=your_webhook_id # from PayPal developer dashboard
```

---

## 9. Laravel Setup Commands

Run these **in order** after configuring `.env`. All commands are idempotent — safe to re-run.

```bash
cd /var/www/skillevidence

# 1. Generate application encryption key
sudo -u www-data php artisan key:generate --no-interaction

# 2. Run all database migrations
#    This includes: all tables, pgvector extension, knowledge_chunks HNSW index
sudo -u www-data php artisan migrate --force --no-interaction

# 3. Cache configuration (critical for production performance)
sudo -u www-data php artisan config:cache --no-interaction

# 4. Cache routes
sudo -u www-data php artisan route:cache --no-interaction

# 5. Cache views
sudo -u www-data php artisan view:cache --no-interaction

# 6. Generate Wayfinder TypeScript route bindings
#    (already baked into npm run build, but run if routes changed post-build)
sudo -u www-data php artisan wayfinder:generate --no-interaction

# 7. Create storage symlink (public disk → public/storage)
sudo -u www-data php artisan storage:link --no-interaction
```

> **Important:** Whenever you change `.env`, re-run `php artisan config:cache`. Cached config ignores live `.env` changes.

---

## 10. File Permissions

```bash
# Entire app owned by www-data
sudo chown -R www-data:www-data /var/www/skillevidence

# Laravel needs write access to storage and bootstrap/cache
sudo chmod -R 775 /var/www/skillevidence/storage
sudo chmod -R 775 /var/www/skillevidence/bootstrap/cache
```

---

## 11. Queue Worker (Supervisor)

The app uses queued jobs for:
- **AI test grading** (`GradeTestAnswerWithAi` — 3 tries, 30s backoff, up to 60s per job)
- Other background work

Create `/etc/supervisor/conf.d/skillevidence-worker.conf`:

```ini
[program:skillevidence-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/skillevidence/artisan queue:work database \
  --sleep=3 \
  --tries=3 \
  --max-time=3600 \
  --timeout=90
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/skillevidence-worker.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=3
stopwaitsecs=120
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start skillevidence-worker:*
sudo supervisorctl status
```

> After every deploy, restart workers to pick up new code:
> ```bash
> sudo supervisorctl restart skillevidence-worker:*
> ```

---

## 12. Task Scheduler (Cron)

The scheduler runs `rag:index` daily at 03:00 to re-embed any changed course content (only changed chunks cost OpenAI API calls).

Add to `www-data`'s crontab:

```bash
sudo crontab -u www-data -e
```

Add this line:

```
* * * * * cd /var/www/skillevidence && php artisan schedule:run >> /dev/null 2>&1
```

---

## 13. Nginx Configuration

See the full Nginx config in [`nginx/skillevidence.nginx.conf`](nginx/skillevidence.nginx.conf).

It covers:
- HTTP → HTTPS permanent redirect
- TLS 1.2/1.3 with strong ciphers
- Let's Encrypt certificate paths
- OCSP stapling
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Gzip compression
- Static asset immutable caching (Vite build hashes)
- PHP-FPM with appropriate timeouts (streaming AI chat needs 120s+)
- `fastcgi_buffering off` for SSE/streaming endpoints
- PayPal webhook pass-through
- Upload size limit (50MB)
- Certbot `.well-known` challenge

**Quick setup:**

```bash
# Copy the config
sudo cp /var/www/skillevidence/docs/nginx/skillevidence.nginx.conf \
  /etc/nginx/sites-available/skillevidence

# Edit and replace all PLACEHOLDER_DOMAIN occurrences with your actual domain
sudo nano /etc/nginx/sites-available/skillevidence

# Enable site
sudo ln -s /etc/nginx/sites-available/skillevidence \
  /etc/nginx/sites-enabled/skillevidence

# Disable default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## 14. Let's Encrypt SSL (Certbot)

Nginx must be running and DNS must point to this server before running Certbot.

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate (replace with your actual domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive \
  --agree-tos \
  --email admin@yourdomain.com \
  --redirect

# Verify auto-renewal
sudo certbot renew --dry-run
```

Certbot edits your nginx config to fill in certificate paths. After obtaining the cert, update your nginx config's `ssl_certificate` paths if you created it manually first:

```
ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

Auto-renewal runs via a systemd timer installed by Certbot:

```bash
sudo systemctl status certbot.timer
```

---

## 15. First Admin User

```bash
# Option A: Create a brand-new admin account interactively
sudo -u www-data php artisan app:make-admin

# Option B: Promote an existing registered user
sudo -u www-data php artisan app:make-admin --email=user@example.com
```

---

## 16. RAG Knowledge Index (Initial Run)

After deploying with published courses, run the initial knowledge index to populate embeddings for AI chat:

```bash
# Index all published courses (makes OpenAI embedding API calls per chunk)
sudo -u www-data php artisan rag:index --no-interaction

# Force re-index everything from scratch (e.g. after changing embedding model)
sudo -u www-data php artisan rag:index --fresh --no-interaction
```

This runs automatically daily at 03:00 via the scheduler (only re-embeds changed content — no cost for unchanged chunks).

---

## 17. Health Check

```bash
# Laravel health endpoint (returns 200 if app is up)
curl -I https://yourdomain.com/up

# Check queue workers are running
sudo supervisorctl status

# Check scheduled tasks are firing
sudo -u www-data php artisan schedule:list

# Check latest application logs
tail -f /var/www/skillevidence/storage/logs/laravel-$(date +%Y-%m-%d).log
```

---

## 18. Deploying Updates

```bash
cd /var/www/skillevidence

# 1. Pull latest code
sudo -u www-data git pull origin main

# 2. Install/update PHP dependencies
sudo -u www-data composer install --no-dev --optimize-autoloader --no-interaction

# 3. Install/update JS dependencies and rebuild assets
sudo -u www-data npm ci
sudo -u www-data npm run build

# 4. Run new migrations
sudo -u www-data php artisan migrate --force --no-interaction

# 5. Clear and re-cache everything
sudo -u www-data php artisan optimize:clear --no-interaction
sudo -u www-data php artisan config:cache --no-interaction
sudo -u www-data php artisan route:cache --no-interaction
sudo -u www-data php artisan view:cache --no-interaction

# 6. Restart queue workers (pick up new job class code)
sudo supervisorctl restart skillevidence-worker:*

# 7. Reload nginx if config changed
sudo nginx -t && sudo systemctl reload nginx
```

> Put the app in maintenance mode during deploy if you need zero-downtime window:
> ```bash
> sudo -u www-data php artisan down --retry=60
> # ... run deploy steps ...
> sudo -u www-data php artisan up
> ```
