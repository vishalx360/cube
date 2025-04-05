# Use Ubuntu as base image
FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && apt-get install -y \
    postgresql \
    postgresql-contrib \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

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

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Make init-db.sh executable
WORKDIR /app/backend
RUN chmod +x init-db.sh

# Create a script to start both services
RUN echo '#!/bin/bash\n\
service postgresql start\n\
./init-db.sh\n\
cd /app/backend && npm start &\n\
cd /app/frontend && npx serve -s build -l 80 &\n\
tail -f /dev/null' > /start.sh && chmod +x /start.sh

# Expose ports
EXPOSE 80 3000 5432

# Start the services
CMD ["/start.sh"] 