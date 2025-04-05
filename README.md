# Session Manager for Todo App

A multi-tenant session manager for dynamically spinning up isolated Todo application instances.

## Project Structure

```
.
├── services/
│   └── todo-app/                # Todo application (Express + PostgreSQL)
│       ├── backend/            # Express backend
│       ├── frontend/           # React frontend
│       └── Dockerfile          # Docker config for todo-app
│
├── session-manager/            # Go service for managing sessions
│   ├── cmd/                    # Command line entrypoints
│   ├── internal/               # Internal packages
│   │   ├── api/                # API handlers
│   │   ├── model/              # Data models
│   │   └── service/            # Business logic
│   └── pkg/                    # Reusable packages
│       ├── docker/             # Docker management
│       └── port/               # Port allocation
│
└── session-manager-ui/         # React UI for session management
    ├── public/                 # Static assets
    └── src/                    # React components
```

## Components

### 1. Todo Application

A full-stack Todo application with:

- React frontend
- Express backend with REST API
- PostgreSQL database
- Containerized with Docker

### 2. Session Manager (Go Service)

A Go service that provides:

- On-demand container provisioning
- Dynamic port allocation
- Session lifecycle management
- REST API for session operations

### 3. Session Manager UI

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

2. Start the Session Manager service:

```bash
cd session-manager
go run cmd/main.go
```

3. Start the Session Manager UI:

```bash
cd session-manager-ui
npm install
npm start
```

4. Access the UI at http://localhost:3000

## API Endpoints

The Session Manager exposes the following API endpoints:

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
