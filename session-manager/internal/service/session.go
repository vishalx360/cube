package service

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/session-manager/internal/model"
	"github.com/yourusername/session-manager/pkg/docker"
	"github.com/yourusername/session-manager/pkg/port"
)

type SessionService struct {
	dockerManager *docker.DockerManager
	portManager   *port.PortManager
	sessions      map[string]*model.Session
	mu            sync.Mutex
}

func NewSessionService(dockerManager *docker.DockerManager, portManager *port.PortManager) *SessionService {
	return &SessionService{
		dockerManager: dockerManager,
		portManager:   portManager,
		sessions:      make(map[string]*model.Session),
	}
}

func (ss *SessionService) CreateSession() (*model.Session, error) {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	// Get available ports - now using the improved port finder that checks actual availability
	frontendPort, backendPort, postgresPort, err := ss.portManager.GetAvailablePorts()
	if err != nil {
		return nil, fmt.Errorf("failed to get available ports: %v", err)
	}

	// Log the ports being allocated
	fmt.Printf("Allocating ports - Frontend: %d, Backend: %d, Postgres: %d\n",
		frontendPort, backendPort, postgresPort)

	// Create container
	containerID, err := ss.dockerManager.CreateContainer(frontendPort, backendPort, postgresPort)
	if err != nil {
		// Make sure to release the ports if container creation fails
		ss.portManager.ReleasePorts(frontendPort, backendPort, postgresPort)
		return nil, fmt.Errorf("failed to create container: %v", err)
	}

	// Create session
	session := &model.Session{
		ID:           uuid.New().String(),
		CreatedAt:    time.Now(),
		FrontendURL:  fmt.Sprintf("http://localhost:%d", frontendPort),
		BackendURL:   fmt.Sprintf("http://localhost:%d", backendPort),
		PostgresURL:  fmt.Sprintf("localhost:%d", postgresPort),
		ContainerID:  containerID,
		FrontendPort: frontendPort,
		BackendPort:  backendPort,
		PostgresPort: postgresPort,
		Status:       "running",
	}

	ss.sessions[session.ID] = session
	return session, nil
}

func (ss *SessionService) DeleteSession(sessionID string) error {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	session, exists := ss.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session not found")
	}

	// Stop and remove container
	if err := ss.dockerManager.StopContainer(session.ContainerID); err != nil {
		return fmt.Errorf("failed to stop container: %v", err)
	}

	if err := ss.dockerManager.RemoveContainer(session.ContainerID); err != nil {
		return fmt.Errorf("failed to remove container: %v", err)
	}

	// Release ports using the new variadic signature
	ss.portManager.ReleasePorts(session.FrontendPort, session.BackendPort, session.PostgresPort)

	// Remove session
	delete(ss.sessions, sessionID)
	return nil
}

func (ss *SessionService) DeleteAllSessions() (int, error) {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	if len(ss.sessions) == 0 {
		return 0, nil // No sessions to delete
	}

	count := 0
	errors := []error{}

	// Create a copy of the sessions map keys to avoid modifying while iterating
	sessionIDs := make([]string, 0, len(ss.sessions))
	for id := range ss.sessions {
		sessionIDs = append(sessionIDs, id)
	}

	// Iterate through all sessions and delete them
	for _, id := range sessionIDs {
		session, exists := ss.sessions[id]
		if !exists {
			continue
		}

		// Stop and remove container
		stopErr := ss.dockerManager.StopContainer(session.ContainerID)
		removeErr := ss.dockerManager.RemoveContainer(session.ContainerID)

		// We attempt to remove even if stop fails
		if stopErr != nil {
			errors = append(errors, fmt.Errorf("failed to stop container %s: %v", session.ContainerID, stopErr))
		}

		if removeErr != nil {
			errors = append(errors, fmt.Errorf("failed to remove container %s: %v", session.ContainerID, removeErr))
		}

		// Release ports regardless of container operations
		ss.portManager.ReleasePorts(session.FrontendPort, session.BackendPort, session.PostgresPort)

		// Remove session from map
		delete(ss.sessions, id)
		count++
	}

	// If no sessions were successfully deleted but there were errors, return the first error
	if count == 0 && len(errors) > 0 {
		return 0, errors[0]
	}

	return count, nil
}

func (ss *SessionService) ListSessions() []*model.Session {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	sessions := make([]*model.Session, 0, len(ss.sessions))
	for _, session := range ss.sessions {
		sessions = append(sessions, session)
	}
	return sessions
}
