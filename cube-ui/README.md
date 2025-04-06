# Cube UI

A React-based user interface for managing Todo App sessions.

## Overview

This application provides a user-friendly interface for managing Todo App sessions created by the Cube Core Go service. It allows users to:

- Create new sessions with a single click
- View details of all active sessions
- Access frontend, backend, and database endpoints for each session
- Delete individual sessions
- Delete all sessions at once

## Tech Stack

- React 18
- Material UI for UI components
- Axios for API requests

## Getting Started

1. Make sure the Cube Core Go service is running on port 8080
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

### Session Management

- Create new Todo App sessions
- Delete individual sessions
- Delete all sessions at once
- View real-time status of all sessions

### Session Details

- View session ID and creation time
- Access the Todo App frontend UI
- Access the REST API endpoints
- Database connection information

### User Interface

- Clean, responsive design
- Error handling and notifications
- Loading indicators for async operations
- Confirmation dialogs for destructive actions

## Integration with Cube Core Go Service

This UI communicates with the Cube Core Go service using REST API calls:

- `GET /sessions` - Fetch all active sessions
- `POST /sessions` - Create a new session
- `DELETE /sessions/{id}` - Delete a specific session
- `DELETE /sessions/all` - Delete all sessions

## Development

The application uses the standard React development workflow:

- `npm start` - Start the development server
- `npm build` - Build for production
- `npm test` - Run tests

The proxy is configured to forward API requests to the Cube Core service running on port 8080.
