# Cube: Session Manager for Todo App

A multi-tenant session manager for dynamically spinning up isolated Todo application instances.

## Project Structure

```
.
├── cube-core/                 # Go service for managing sessions (formerly session-manager)
│   ├── cmd/                   # Command line entrypoints
│   │   └── main.go            # Main application entry point
│   ├── go.mod                 # Go module definition
│   ├── go.sum                 # Go dependencies checksum
│   ├── internal/              # Internal packages
│   │   ├── config/            # Configuration management
│   │   ├── handler/           # API handlers
│   │   ├── model/             # Data models
│   │   └── service/           # Business logic
│   ├── pkg/                   # Reusable packages
│   │   ├── docker/            # Docker management
│   │   ├── port/              # Port allocation
│   │   └── util/              # Utility functions
│   └── server.log             # Server logs
│
├── cube-ui/                   # React UI for session management (formerly session-manager-ui)
│   ├── package.json           # NPM package definition
│   ├── package-lock.json      # NPM dependencies lock file
│   ├── public/                # Static assets
│   └── src/                   # React components
│       ├── App.js             # Main React application
│       ├── components/        # UI components
│       ├── index.js           # React entry point
│       └── services/          # API service clients
│
└── services/
    └── todo-app/              # Todo application
        ├── backend/           # Backend server
        ├── frontend/          # React frontend
        ├── Dockerfile         # Docker config for todo-app
        ├── Caddyfile          # Caddy server configuration
        └── start.sh           # Startup script
```

## Components

### 1. Todo Application

A full-stack Todo application with:

- React frontend
- Express backend with REST API
- PostgreSQL database
- Containerized with Docker

### 2. Cube Core (Go Service)

A Go service that provides:

- On-demand container provisioning
- Dynamic port allocation
- Session lifecycle management
- REST API for session operations

### 3. Cube UI

A React-based UI that provides:

- User-friendly interface for session management
- Create/list/delete sessions
- View session details and access endpoints

## Getting Started

### Prerequisites

- Docker
- Go 1.16+
- Node.js 14+
- npm 6+

### Setup

1. Build the Todo application image:

```bash
cd services/todo-app
docker build -t todo-app .
```

2. Start the Cube Core service:

```bash
cd cube-core
go run cmd/main.go
```

3. Start the Cube UI:

```bash
cd cube-ui
npm install
npm start
```

4. Access the UI at http://localhost:3000

## API Endpoints

The Cube Core service exposes the following API endpoints:

- `POST /sessions` - Create a new session
- `GET /sessions` - List all active sessions
- `DELETE /sessions/{id}` - Delete a specific session
- `DELETE /sessions/all` - Delete all sessions

## Session Information

Each session includes:

- A frontend UI running on a unique port
- A backend API running on a unique port
- A PostgreSQL instance running on a unique port
- Session metadata (ID, creation time, status)

## Use Cases

- Development environments: Create isolated Todo app instances for testing
- Demos: Spin up dedicated instances for different clients
- Education: Provide isolated environments for students
- QA: Test different scenarios in parallel without interference

```

```
