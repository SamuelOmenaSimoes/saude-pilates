#!/usr/bin/env bash
# One-command deploy on your DigitalOcean server.
# First time: install Docker + Docker Compose, put .env in app dir, then run ./deploy.sh
set -e

# Default app directory (override with DEPLOY_DIR env or first argument)
APP_DIR="${DEPLOY_DIR:-/var/www/saude-pilates-folder/saude-pilates}"
cd "$APP_DIR"

# Use absolute path to .env so Compose finds it even if run from another directory
export ENV_FILE="${APP_DIR}/.env"

echo "==> Pulling latest from main..."
git fetch origin
git checkout main
git pull origin main

echo "==> Building and starting containers..."
docker compose build --no-cache
docker compose up -d

echo "==> Cleaning old images (optional)..."
docker image prune -f

echo "==> Deploy finished. App should be running on port 3000."
