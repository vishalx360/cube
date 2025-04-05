package docker

import (
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

type DockerManager struct {
	// No need for client field
}

type PortMapping struct {
	HostPort      int
	ContainerPort int
	Protocol      string
}

func NewDockerManager() (*DockerManager, error) {
	// Check if docker is available
	cmd := exec.Command("docker", "version")
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("docker is not available: %v", err)
	}

	return &DockerManager{}, nil
}

func (dm *DockerManager) CreateContainer(imageName string, portMappings []PortMapping) (string, error) {
	args := []string{"run", "-d"} // Detached mode

	// Add port mappings
	for _, mapping := range portMappings {
		protocol := mapping.Protocol
		if protocol == "" {
			protocol = "tcp"
		}

		portArg := fmt.Sprintf("%d:%d/%s", mapping.HostPort, mapping.ContainerPort, protocol)
		args = append(args, "-p", portArg)
	}

	// Add image name
	args = append(args, imageName)

	// Run the container
	cmd := exec.Command("docker", args...)
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
	Ports   []PortInfo
}

type PortInfo struct {
	HostPort      int
	ContainerPort int
	Protocol      string
}

func (dm *DockerManager) ListContainers() ([]Container, error) {
	// Command to list all containers in JSON format
	cmd := exec.Command("docker", "ps", "-a", "--format", "{{json .}}")

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

		var data map[string]interface{}
		if err := json.Unmarshal([]byte(line), &data); err != nil {
			continue
		}

		id, _ := data["ID"].(string)
		image, _ := data["Image"].(string)
		status, _ := data["Status"].(string)
		createdStr, _ := data["CreatedAt"].(string)

		created, _ := time.Parse(time.RFC3339, createdStr)

		containers = append(containers, Container{
			ID:      id,
			Image:   image,
			Status:  status,
			Created: created,
		})
	}

	return containers, nil
}

type ImageInfo struct {
	ID           string
	Repository   string
	Tag          string
	Size         string
	CreatedAt    string
	ExposedPorts []int
}

func (dm *DockerManager) ListImages() ([]ImageInfo, error) {
	// Command to list all images with specific format
	cmd := exec.Command("docker", "images", "--format", "{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to list images: %v, output: %s", err, output)
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	var images []ImageInfo

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.Split(line, "|")
		if len(parts) != 5 {
			continue
		}

		// Get exposed ports for the image
		exposedPorts, _ := dm.getImageExposedPorts(parts[0])

		images = append(images, ImageInfo{
			ID:           parts[0],
			Repository:   parts[1],
			Tag:          parts[2],
			Size:         parts[3],
			CreatedAt:    parts[4],
			ExposedPorts: exposedPorts,
		})
	}

	return images, nil
}

func (dm *DockerManager) getImageExposedPorts(imageID string) ([]int, error) {
	cmd := exec.Command("docker", "image", "inspect", "--format", "{{json .Config.ExposedPorts}}", imageID)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to inspect image: %v, output: %s", err, output)
	}

	// Parse the port string
	portsStr := strings.TrimSpace(string(output))
	if portsStr == "null" || portsStr == "{}" {
		return []int{}, nil
	}

	var portsMap map[string]interface{}
	if err := json.Unmarshal([]byte(portsStr), &portsMap); err != nil {
		return nil, err
	}

	var ports []int
	for portStr := range portsMap {
		// Format is like "8080/tcp"
		parts := strings.Split(portStr, "/")
		if len(parts) != 2 {
			continue
		}

		port, err := strconv.Atoi(parts[0])
		if err != nil {
			continue
		}

		ports = append(ports, port)
	}

	return ports, nil
}

func (dm *DockerManager) InspectContainer(containerID string) (map[string]interface{}, error) {
	cmd := exec.Command("docker", "container", "inspect", containerID)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to inspect container: %v, output: %s", err, output)
	}

	var containerInfo []map[string]interface{}
	if err := json.Unmarshal(output, &containerInfo); err != nil {
		return nil, err
	}

	if len(containerInfo) == 0 {
		return nil, errors.New("no container info returned")
	}

	return containerInfo[0], nil
}
