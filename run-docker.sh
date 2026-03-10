#!/usr/bin/env bash
# Run the app with Docker (same setup as production deploy).
# Requires: .env in project root, Docker installed.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
APP_DIR="$SCRIPT_DIR"
export ENV_FILE="${APP_DIR}/.env"
if ! test -f "$ENV_FILE"; then
  echo "Error: .env not found at $ENV_FILE"
  exit 1
fi
if ! test -f "$APP_DIR/docker-compose.yml"; then
  echo "Error: docker-compose.yml not found at $APP_DIR"
  exit 1
fi
echo "Using ENV_FILE=$ENV_FILE"
echo "Building and starting (Ctrl+C to stop)..."
echo ""
echo "When the server is up, open in your browser:"
echo "  http://127.0.0.1:3000"
echo "  (Use 127.0.0.1 if localhost does not connect.)"
echo ""
docker compose --project-directory "$APP_DIR" -f "$APP_DIR/docker-compose.yml" up --build
