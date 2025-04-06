package port

import (
	"errors"
	"net"
	"sync"
)

type PortManager struct {
	mu        sync.Mutex
	usedPorts map[int]bool
}

var ErrNoPortsAvailable = errors.New("no ports available")

func NewPortManager() *PortManager {
	return &PortManager{
		usedPorts: make(map[int]bool),
	}
}

// getRandomAvailablePort asks the OS for a free port
func getRandomAvailablePort() (int, error) {
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return 0, err
	}
	defer listener.Close()

	port := listener.Addr().(*net.TCPAddr).Port
	return port, nil
}

// GetAvailablePort returns a single available port
func (pm *PortManager) GetAvailablePort() (int, error) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	port, err := getRandomAvailablePort()
	if err != nil {
		return 0, ErrNoPortsAvailable
	}

	if !pm.usedPorts[port] {
		pm.usedPorts[port] = true
		return port, nil
	}

	// In the unlikely case that this port is already used, try again
	return pm.GetAvailablePort()
}

// ReleasePort releases a single previously used port
func (pm *PortManager) ReleasePort(port int) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	delete(pm.usedPorts, port)
}

// GetAvailablePorts returns 3 available ports (frontend, backend, postgres)
func (pm *PortManager) GetAvailablePorts() (frontendPort, backendPort, postgresPort int, err error) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	allocated := make([]int, 0, 3)

	for len(allocated) < 3 {
		port, err := getRandomAvailablePort()
		if err != nil {
			return 0, 0, 0, ErrNoPortsAvailable
		}

		if !pm.usedPorts[port] {
			pm.usedPorts[port] = true
			allocated = append(allocated, port)
		}
	}

	return allocated[0], allocated[1], allocated[2], nil
}

// ReleasePorts releases previously used ports
func (pm *PortManager) ReleasePorts(ports ...int) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	for _, port := range ports {
		delete(pm.usedPorts, port)
	}
}
