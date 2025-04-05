package service

import (
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/session-manager/internal/model"
	"github.com/yourusername/session-manager/pkg/docker"
	"github.com/yourusername/session-manager/pkg/port"
	"github.com/yourusername/session-manager/pkg/util"
)

// SessionService manages container sessions
type SessionService struct {
	dockerManager *docker.DockerManager
	portManager   *port.PortManager
	sessions      map[string]*model.Session
	mu            sync.Mutex
	logger        *util.Logger
}

// NewSessionService creates a new session service
func NewSessionService(dockerManager *docker.DockerManager, portManager *port.PortManager) *SessionService {
	return &SessionService{
		dockerManager: dockerManager,
		portManager:   portManager,
		sessions:      make(map[string]*model.Session),
		logger:        util.NewLogger(),
	}
}

// CreateSession creates a new container session for the specified Docker image
func (ss *SessionService) CreateSession(req *model.CreateSessionRequest) (*model.Session, error) {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	// Validate request
	if req.ImageName == "" {
		return nil, util.ErrInvalidRequest
	}

	// Internal struct to handle port mappings consistently
	type portConfig struct {
		ContainerPort int
		Protocol      string
		Description   string
	}

	// Create a slice to hold our port configurations
	var portConfigs []portConfig

	// First attempt: Use provided port mappings if available
	if len(req.PortMappings) > 0 {
		ss.logger.Info("Using explicitly defined port mappings for image %s", req.ImageName)
		portConfigs = make([]portConfig, len(req.PortMappings))
		for i, mapping := range req.PortMappings {
			portConfigs[i] = portConfig{
				ContainerPort: mapping.ContainerPort,
				Protocol:      mapping.Protocol,
				Description:   mapping.Description,
			}
		}
	} else if req.NumPorts > 0 {
		// Second attempt: Use NumPorts if specified
		ss.logger.Info("Using specified number of ports (%d) for image %s", req.NumPorts, req.ImageName)
		portConfigs = make([]portConfig, req.NumPorts)

		for i := 0; i < req.NumPorts; i++ {
			portConfigs[i] = portConfig{
				ContainerPort: 8080 + i, // Generic default starting at 8080
				Protocol:      "tcp",
				Description:   fmt.Sprintf("Port %d", i+1),
			}
		}
	} else {
		// Final attempt: Detect exposed ports from the image
		ss.logger.Info("Attempting to detect exposed ports for image %s", req.ImageName)
		images, err := ss.dockerManager.ListImages()
		if err != nil {
			ss.logger.Error("Failed to list images: %v", err)
			return nil, util.WrapError(err, "failed to list images")
		}

		var exposedPorts []int

		// Find matching image and get its exposed ports
		for _, img := range images {
			imgNameWithTag := img.Repository
			if img.Tag != "" {
				imgNameWithTag += ":" + img.Tag
			}

			// Check for match by full name:tag or just name
			if imgNameWithTag == req.ImageName || img.Repository == req.ImageName {
				exposedPorts = img.ExposedPorts
				ss.logger.Info("Found matching image: %s with %d exposed ports", imgNameWithTag, len(exposedPorts))
				break
			}
		}

		if len(exposedPorts) == 0 {
			// If we couldn't detect any ports, use a default configuration
			ss.logger.Warn("No exposed ports detected for image %s, using default HTTP port", req.ImageName)
			portConfigs = []portConfig{
				{ContainerPort: 80, Protocol: "tcp", Description: "HTTP"},
			}
		} else {
			// Use the detected exposed ports
			ss.logger.Info("Using %d exposed ports from image %s: %v", len(exposedPorts), req.ImageName, exposedPorts)
			portConfigs = make([]portConfig, len(exposedPorts))

			for i, port := range exposedPorts {
				// Use more descriptive names for common ports
				var description string
				switch port {
				case 80, 8080:
					description = "HTTP"
				case 443, 8443:
					description = "HTTPS"
				case 22:
					description = "SSH"
				case 3306:
					description = "MySQL"
				case 5432:
					description = "PostgreSQL"
				case 27017:
					description = "MongoDB"
				case 6379:
					description = "Redis"
				default:
					description = fmt.Sprintf("Port %d", port)
				}

				portConfigs[i] = portConfig{
					ContainerPort: port,
					Protocol:      "tcp",
					Description:   description,
				}
			}
		}
	}

	// Get available host ports from the port manager
	hostPorts := make([]int, len(portConfigs))
	for i := range portConfigs {
		port, err := ss.portManager.GetAvailablePort()
		if err != nil {
			// Release any ports we've already allocated
			ss.logger.Error("Failed to get available port: %v", err)
			for j := 0; j < i; j++ {
				ss.portManager.ReleasePort(hostPorts[j])
			}
			return nil, util.WrapError(err, "failed to get available port")
		}
		hostPorts[i] = port
	}

	// Create docker port mappings
	dockerPortMappings := make([]docker.PortMapping, len(portConfigs))
	for i, config := range portConfigs {
		dockerPortMappings[i] = docker.PortMapping{
			HostPort:      hostPorts[i],
			ContainerPort: config.ContainerPort,
			Protocol:      config.Protocol,
		}
	}

	// Log the ports being allocated
	ss.logger.Info("Creating container for image %s with %d port mappings", req.ImageName, len(dockerPortMappings))
	for i, mapping := range dockerPortMappings {
		ss.logger.Debug("Port %d: %d -> %d/%s", i+1, mapping.HostPort, mapping.ContainerPort, mapping.Protocol)
	}

	// Create container
	containerID, err := ss.dockerManager.CreateContainer(req.ImageName, dockerPortMappings)
	if err != nil {
		// Release all allocated ports
		ss.logger.Error("Failed to create container: %v", err)
		for _, port := range hostPorts {
			ss.portManager.ReleasePort(port)
		}
		return nil, util.WrapError(err, "failed to create container")
	}

	// Create session ports
	sessionPorts := make([]model.Port, len(portConfigs))
	hostname, _ := getLocalIP()
	if hostname == "" {
		hostname = "localhost"
	}

	for i, config := range portConfigs {
		proto := config.Protocol
		if proto == "" {
			proto = "tcp"
		}

		portURL := ""
		if proto == "tcp" {
			scheme := "http"
			if config.ContainerPort == 443 || config.ContainerPort == 8443 {
				scheme = "https"
			}
			portURL = fmt.Sprintf("%s://%s:%d", scheme, hostname, hostPorts[i])
		}

		sessionPorts[i] = model.Port{
			HostPort:      hostPorts[i],
			ContainerPort: config.ContainerPort,
			Protocol:      proto,
			Description:   config.Description,
			URL:           portURL,
		}
	}

	// Create session
	sessionID := uuid.New().String()
	session := &model.Session{
		ID:          sessionID,
		CreatedAt:   time.Now(),
		ImageName:   req.ImageName,
		ContainerID: containerID,
		Ports:       sessionPorts,
		Status:      "running",
	}

	ss.sessions[session.ID] = session
	ss.logger.Info("Created session %s for image %s", session.ID, req.ImageName)
	return session, nil
}

// DeleteSession deletes an existing session by ID
func (ss *SessionService) DeleteSession(sessionID string) error {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	session, exists := ss.sessions[sessionID]
	if !exists {
		ss.logger.Warn("Session not found: %s", sessionID)
		return util.ErrNotFound
	}

	// Stop and remove container
	ss.logger.Info("Stopping container %s for session %s", session.ContainerID, sessionID)
	if err := ss.dockerManager.StopContainer(session.ContainerID); err != nil {
		ss.logger.Error("Failed to stop container %s: %v", session.ContainerID, err)
		return util.WrapError(err, "failed to stop container")
	}

	ss.logger.Info("Removing container %s for session %s", session.ContainerID, sessionID)
	if err := ss.dockerManager.RemoveContainer(session.ContainerID); err != nil {
		ss.logger.Error("Failed to remove container %s: %v", session.ContainerID, err)
		return util.WrapError(err, "failed to remove container")
	}

	// Release all ports
	ss.logger.Info("Releasing ports for session %s", sessionID)
	for _, p := range session.Ports {
		ss.portManager.ReleasePort(p.HostPort)
	}

	// Remove session
	delete(ss.sessions, sessionID)
	ss.logger.Info("Deleted session %s", sessionID)
	return nil
}

// DeleteAllSessions deletes all existing sessions
func (ss *SessionService) DeleteAllSessions() (int, error) {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	if len(ss.sessions) == 0 {
		ss.logger.Info("No sessions to delete")
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
	ss.logger.Info("Deleting all %d sessions", len(sessionIDs))
	for _, id := range sessionIDs {
		session, exists := ss.sessions[id]
		if !exists {
			continue
		}

		// Stop and remove container
		ss.logger.Info("Stopping container %s for session %s", session.ContainerID, id)
		stopErr := ss.dockerManager.StopContainer(session.ContainerID)

		ss.logger.Info("Removing container %s for session %s", session.ContainerID, id)
		removeErr := ss.dockerManager.RemoveContainer(session.ContainerID)

		// We attempt to remove even if stop fails
		if stopErr != nil {
			errMsg := fmt.Sprintf("failed to stop container %s", session.ContainerID)
			ss.logger.Error("%s: %v", errMsg, stopErr)
			errors = append(errors, util.WrapError(stopErr, errMsg))
		}

		if removeErr != nil {
			errMsg := fmt.Sprintf("failed to remove container %s", session.ContainerID)
			ss.logger.Error("%s: %v", errMsg, removeErr)
			errors = append(errors, util.WrapError(removeErr, errMsg))
		}

		// Release all ports
		ss.logger.Info("Releasing ports for session %s", id)
		for _, p := range session.Ports {
			ss.portManager.ReleasePort(p.HostPort)
		}

		// Remove session from map
		delete(ss.sessions, id)
		count++
	}

	ss.logger.Info("Deleted %d sessions", count)

	// If no sessions were successfully deleted but there were errors, return the first error
	if count == 0 && len(errors) > 0 {
		return 0, errors[0]
	}

	return count, nil
}

// ListSessions returns a list of all sessions
func (ss *SessionService) ListSessions() []*model.Session {
	ss.mu.Lock()
	defer ss.mu.Unlock()

	sessions := make([]*model.Session, 0, len(ss.sessions))
	for _, session := range ss.sessions {
		sessions = append(sessions, session)
	}

	ss.logger.Info("Listed %d sessions", len(sessions))
	return sessions
}

// ListImages returns a list of all available Docker images
func (ss *SessionService) ListImages() ([]model.DockerImageInfo, error) {
	ss.logger.Info("Listing Docker images")
	images, err := ss.dockerManager.ListImages()
	if err != nil {
		ss.logger.Error("Failed to list images: %v", err)
		return nil, util.WrapError(err, "failed to list images")
	}

	result := make([]model.DockerImageInfo, len(images))
	for i, img := range images {
		result[i] = model.DockerImageInfo{
			ID:           img.ID,
			Name:         img.Repository,
			Tag:          img.Tag,
			Size:         img.Size,
			Created:      img.CreatedAt,
			ExposedPorts: img.ExposedPorts,
		}
	}

	ss.logger.Info("Listed %d Docker images", len(result))
	return result, nil
}

// Helper function to get the local IP address
func getLocalIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String(), nil
			}
		}
	}

	return "", fmt.Errorf("no suitable IP address found")
}
