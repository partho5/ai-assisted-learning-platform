#!/bin/bash
set -e
APP=/home/kaleb/ai-assisted-learning-platform
PIDFILE=$APP/storage/queue-worker.pid

echo "==> Pulling latest code..."
cd $APP
git pull origin main

echo "==> Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Clearing stale caches..."
php artisan optimize:clear --no-interaction

echo "==> Running migrations..."
php artisan migrate --force --no-interaction

echo "==> Generating Wayfinder actions..."
php artisan wayfinder:generate --no-interaction

echo "==> Installing JS dependencies & building assets..."
npm ci
npm run build

echo "==> Recaching..."
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan view:cache --no-interaction

echo "==> Fixing permissions..."
chown -R www-data:www-data $APP
chmod -R 775 $APP/storage $APP/bootstrap/cache

echo "==> Ensuring Laravel scheduler cron is installed for www-data..."
(crontab -u www-data -l 2>/dev/null | grep -qF 'schedule:run') || \
  { crontab -u www-data -l 2>/dev/null; echo "* * * * * cd $APP && php artisan schedule:run >> /dev/null 2>&1"; } | crontab -u www-data -

echo "==> Restarting queue worker..."
# Signal any running workers to stop after their current job
php artisan queue:restart 2>/dev/null || true
# Kill previous worker started by this script
if [ -f "$PIDFILE" ]; then
  OLD_PID=$(cat "$PIDFILE")
  kill "$OLD_PID" 2>/dev/null || true
  rm -f "$PIDFILE"
fi
# Start a fresh persistent worker
nohup php artisan queue:work --tries=3 --backoff=30 --timeout=120 \
  >> $APP/storage/logs/queue-worker.log 2>&1 &
echo $! > "$PIDFILE"
echo "    Queue worker started (PID: $!)"

echo "==> Done. Site is live."
