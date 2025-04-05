package model

import "time"

type Session struct {
	ID           string    `json:"id"`
	CreatedAt    time.Time `json:"created_at"`
	FrontendURL  string    `json:"frontend_url"`
	BackendURL   string    `json:"backend_url"`
	PostgresURL  string    `json:"postgres_url"`
	ContainerID  string    `json:"container_id"`
	FrontendPort int       `json:"frontend_port"`
	BackendPort  int       `json:"backend_port"`
	PostgresPort int       `json:"postgres_port"`
	Status       string    `json:"status"` // "running", "stopped", "error"
}

type CreateSessionRequest struct {
	// Add any specific configuration for the session if needed
}

type CreateSessionResponse struct {
	Session Session `json:"session"`
}

type ListSessionsResponse struct {
	Sessions []Session `json:"sessions"`
}

type DeleteSessionResponse struct {
	Message string `json:"message"`
}

type DeleteAllSessionsResponse struct {
	Count   int    `json:"count"`
	Message string `json:"message"`
}
