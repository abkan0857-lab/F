#!/usr/bin/env bash
# Simple deploy helper (run on server)
# Usage: ./deploy.sh /path/to/repo.git branch
set -e

REPO_PATH=${1:-/var/www/totohax}
BRANCH=${2:-main}

echo "Deploying branch $BRANCH into $REPO_PATH"

if [ ! -d "$REPO_PATH" ]; then
  mkdir -p "$REPO_PATH"
  git clone -b "$BRANCH" https://github.com/YOUR_USERNAME/YOUR_REPO.git "$REPO_PATH"
fi

cd "$REPO_PATH"
git fetch origin
git reset --hard origin/"$BRANCH"
npm ci
# copy .env from secure location if exists
if [ -f /etc/totohax/.env ]; then
  cp /etc/totohax/.env .env
fi

# build steps if any (not required for Node server)
# restart pm2
if command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload ecosystem.config.js
else
  echo "pm2 not installed; you can start with: pm2 start ecosystem.config.js"
fi

echo "Deploy completed"