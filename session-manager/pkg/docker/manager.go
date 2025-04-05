package docker

import (
	"fmt"
	"os/exec"
	"strings"
	"time"
)

type DockerManager struct {
	// No need for client field anymore
}

func NewDockerManager() (*DockerManager, error) {
	// Check if docker is available
	cmd := exec.Command("docker", "version")
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("docker is not available: %v", err)
	}

	return &DockerManager{}, nil
}

func (dm *DockerManager) CreateContainer(frontendPort, backendPort, postgresPort int) (string, error) {
	// Run docker run command
	cmd := exec.Command(
		"docker", "run",
		"-d", // Detached mode
		"-p", fmt.Sprintf("%d:80", frontendPort),
		"-p", fmt.Sprintf("%d:3000", backendPort),
		"-p", fmt.Sprintf("%d:5432", postgresPort),
		"todo-app:latest",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed to create container: %v, output: %s", err, output)
	}

	// Return container ID
	return strings.TrimSpace(string(output)), nil
}

func (dm *DockerManager) StopContainer(containerID string) error {
	cmd := exec.Command("docker", "stop", containerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to stop container: %v, output: %s", err, output)
	}
	return nil
}

func (dm *DockerManager) RemoveContainer(containerID string) error {
	cmd := exec.Command("docker", "rm", "-f", containerID)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to remove container: %v, output: %s", err, output)
	}
	return nil
}

type Container struct {
	ID      string
	Image   string
	Status  string
	Created time.Time
}

func (dm *DockerManager) ListContainers() ([]Container, error) {
	cmd := exec.Command(
		"docker", "ps",
		"-a",                                                        // All containers
		"--format", "{{.ID}}|{{.Image}}|{{.Status}}|{{.CreatedAt}}", // Custom format
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %v, output: %s", err, output)
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var containers []Container

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.Split(line, "|")
		if len(parts) != 4 {
			continue
		}

		created, _ := time.Parse(time.RFC3339, parts[3])

		containers = append(containers, Container{
			ID:      parts[0],
			Image:   parts[1],
			Status:  parts[2],
			Created: created,
		})
	}

	return containers, nil
}
