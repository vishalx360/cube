FROM node:20

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages and Caddy (from official Caddy repo)
RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    curl \
    apt-transport-https \
    gnupg \
    ca-certificates \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | tee /etc/apt/sources.list.d/caddy-stable.list \
    && apt-get update \
    && apt-get install -y caddy \
    && rm -rf /var/lib/apt/lists/*

# Install serve package globally
RUN npm install -g serve@14.2.1

# Create directories for the application
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/init-db.sh ./backend/
COPY backend/app.js ./backend/

# Copy frontend files
COPY frontend/package*.json ./frontend/
COPY frontend/public ./frontend/public/
COPY frontend/src ./frontend/src/

# Copy Caddyfile and start script
COPY Caddyfile /etc/caddy/Caddyfile
COPY start.sh /start.sh

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Make scripts executable
WORKDIR /app/backend
RUN chmod +x init-db.sh
RUN chmod +x /start.sh

# Expose only the main web port
EXPOSE 80

# Start the services
CMD ["/start.sh"] 