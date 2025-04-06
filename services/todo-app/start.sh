#!/bin/bash

service postgresql start
./init-db.sh
cd /app/backend && npm start &

if [ ! -d "/app/frontend/build" ]; then
  echo "Error: Frontend build directory not found at /app/frontend/build"
  exit 1
fi

# Start frontend server on port 5000
cd /app/frontend && npm run serve &

# Stop any running Caddy instance
caddy stop || true
sleep 1

# Validate Caddy configuration
echo "Validating Caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile

# Start Caddy with the configuration file
echo "Starting Caddy with configuration from /etc/caddy/Caddyfile"
caddy run --config /etc/caddy/Caddyfile &

echo "Todo application is running!"
echo "Frontend: http://localhost:80 (proxied from port 5000)"
echo "Backend API: http://localhost:3000/api"
tail -f /dev/null 