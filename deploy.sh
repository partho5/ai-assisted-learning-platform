#!/bin/bash
# Deploy the latest jovoc branch to production. Run it directly from the repo:
#   sudo /var/www/jovoc.com/deploy.sh
set -euo pipefail

SITE=jovoc
ROOT=/var/www/jovoc.com
BRANCH=jovoc

[ "$(id -u)" -eq 0 ] || { echo "run with sudo"; exit 1; }
cd "$ROOT"

echo "==> maintenance mode on"
sudo -u $SITE php artisan down --render="errors::503" || true
# Always leave maintenance mode, even if a step below fails.
trap 'cd "$ROOT" && sudo -u '"$SITE"' php artisan up || true' EXIT

echo "==> pulling $BRANCH"
sudo -u $SITE git pull --ff-only origin "$BRANCH"

echo "==> composer"
sudo -u $SITE composer install --no-dev --optimize-autoloader --no-interaction

echo "==> clearing stale caches"
sudo -u $SITE php artisan optimize:clear --no-interaction

echo "==> migrations"
sudo -u $SITE php artisan migrate --force --no-interaction

echo "==> npm build"
sudo -u $SITE php artisan wayfinder:generate --no-interaction
sudo -u $SITE npm ci --no-audit --no-fund
sudo -u $SITE npm run build

echo "==> rebuilding caches"
sudo -u $SITE php artisan config:cache
sudo -u $SITE php artisan route:cache
sudo -u $SITE php artisan view:cache
sudo -u $SITE php artisan event:cache

echo "==> permissions"
chown -R $SITE:$SITE "$ROOT"
chmod -R 775 "$ROOT/storage" "$ROOT/bootstrap/cache"
chmod 600 "$ROOT/.env"

# OPcache runs with validate_timestamps=0: PHP-FPM must be restarted to see new code.
echo "==> restarting php-fpm (clears OPcache)"
systemctl restart php8.4-fpm

echo "==> ensuring Laravel scheduler cron is installed for $SITE"
(crontab -u $SITE -l 2>/dev/null | grep -qF 'schedule:run') || \
  { crontab -u $SITE -l 2>/dev/null; echo "* * * * * cd $ROOT && php artisan schedule:run >> /dev/null 2>&1"; } | crontab -u $SITE -

# Workers hold the old code in memory until restarted.
echo "==> restarting queue worker"
systemctl restart ${SITE}-queue

echo "==> done"
