#!/bin/bash
  set -e
  APP=/home/kaleb/ai-assisted-learning-platform

  echo "==> Pulling latest code..."
  cd $APP
  git pull origin main

  echo "==> Installing PHP dependencies..."
  composer install --no-dev --optimize-autoloader --no-interaction

  echo "==> Installing JS dependencies & building assets..."
  npm ci
  npm run build

  echo "==> Running migrations..."
  php artisan migrate --force --no-interaction

  echo "==> Clearing and recaching..."
  php artisan optimize:clear --no-interaction
  php artisan config:cache --no-interaction
  php artisan route:cache --no-interaction
  php artisan view:cache --no-interaction

  echo "==> Fixing permissions..."
  chown -R www-data:www-data $APP
  chmod -R 775 $APP/storage $APP/bootstrap/cache

  echo "==> Restarting queue workers..."
  supervisorctl restart skillevidence-worker:*

  echo "==> Done. Site is live."
