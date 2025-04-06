package model

import "time"

// Port represents a mapped port for a container
type Port struct {
	HostPort      int    `json:"host_port"`
	ContainerPort int    `json:"container_port"`
	Protocol      string `json:"protocol"`
	Description   string `json:"description"`
	URL           string `json:"url,omitempty"`
}

// Session represents a container session
type Session struct {
	ID          string    `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	ImageName   string    `json:"image_name"`
	ContainerID string    `json:"container_id"`
	Ports       []Port    `json:"ports"`
	Status      string    `json:"status"` // "running", "stopped", "error"
}

// CreateSessionRequest represents a request to create a new session
type CreateSessionRequest struct {
	ImageName    string `json:"image_name"`
	NumPorts     int    `json:"num_ports,omitempty"`
	PortMappings []struct {
		ContainerPort int    `json:"container_port"`
		Protocol      string `json:"protocol,omitempty"`
		Description   string `json:"description,omitempty"`
	} `json:"port_mappings,omitempty"`
}

// CreateSessionResponse represents the response for a create session request
type CreateSessionResponse struct {
	Session Session `json:"session"`
}

// ListSessionsResponse represents the response for a list sessions request
type ListSessionsResponse struct {
	Sessions []Session `json:"sessions"`
}

// DeleteSessionResponse represents the response for a delete session request
type DeleteSessionResponse struct {
	Message string `json:"message"`
}

// DeleteAllSessionsResponse represents the response for a delete all sessions request
type DeleteAllSessionsResponse struct {
	Count   int    `json:"count"`
	Message string `json:"message"`
}

// DockerImageInfo represents information about a Docker image
type DockerImageInfo struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Tag          string `json:"tag"`
	Size         string `json:"size"`
	Created      string `json:"created"`
	ExposedPorts []int  `json:"exposed_ports,omitempty"`
}

// ListImagesResponse represents the response for a list images request
type ListImagesResponse struct {
	Images []DockerImageInfo `json:"images"`
}
