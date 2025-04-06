package model

import "time"

// ContainerInfo represents information about a Docker container
type ContainerInfo struct {
	ID        string    `json:"id"`
	SessionID string    `json:"session_id,omitempty"`
	Name      string    `json:"name"`
	Image     string    `json:"image"`
	Command   string    `json:"command"`
	Status    string    `json:"status"`
	State     string    `json:"state"`
	Created   int64     `json:"created"`
	CreatedAt time.Time `json:"created_at"`
	Ports     []Port    `json:"ports"`
	IsManaged bool      `json:"is_managed"`
}

// ListAllContainersResponse is the response for the ListAllContainers API
type ListAllContainersResponse struct {
	Containers []ContainerInfo `json:"containers"`
}
