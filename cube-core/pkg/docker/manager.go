package docker

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

type DockerManager struct {
	client *client.Client
	ctx    context.Context
}

type PortMapping struct {
	HostPort      int
	ContainerPort int
	Protocol      string
}

func NewDockerManager() (*DockerManager, error) {
	// Create Docker client using environment variables
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %v", err)
	}

	// Ping the Docker daemon to make sure connection works
	ctx := context.Background()
	_, err = cli.Ping(ctx)
	if err != nil {
		return nil, fmt.Errorf("docker is not available: %v", err)
	}

	return &DockerManager{
		client: cli,
		ctx:    ctx,
	}, nil
}

func (dm *DockerManager) CreateContainer(imageName string, portMappings []PortMapping) (string, error) {
	// Prepare port bindings
	portBindings := nat.PortMap{}
	exposedPorts := nat.PortSet{}

	for _, mapping := range portMappings {
		protocol := mapping.Protocol
		if protocol == "" {
			protocol = "tcp"
		}

		containerPort := nat.Port(fmt.Sprintf("%d/%s", mapping.ContainerPort, protocol))
		hostPort := strconv.Itoa(mapping.HostPort)

		portBindings[containerPort] = []nat.PortBinding{
			{
				HostIP:   "0.0.0.0",
				HostPort: hostPort,
			},
		}

		exposedPorts[containerPort] = struct{}{}
	}

	// Create container configuration
	containerConfig := &container.Config{
		Image:        imageName,
		ExposedPorts: exposedPorts,
	}

	// Configure host settings including port bindings
	hostConfig := &container.HostConfig{
		PortBindings: portBindings,
	}

	// Create the container
	resp, err := dm.client.ContainerCreate(
		dm.ctx,
		containerConfig,
		hostConfig,
		nil,
		nil,
		"",
	)
	if err != nil {
		return "", fmt.Errorf("failed to create container: %v", err)
	}

	// Start the container
	if err := dm.client.ContainerStart(dm.ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %v", err)
	}

	return resp.ID, nil
}

func (dm *DockerManager) StopContainer(containerID string) error {
	// Default timeout is 10 seconds
	timeoutSeconds := 10
	return dm.client.ContainerStop(dm.ctx, containerID, container.StopOptions{Timeout: &timeoutSeconds})
}

func (dm *DockerManager) RemoveContainer(containerID string) error {
	return dm.client.ContainerRemove(dm.ctx, containerID, types.ContainerRemoveOptions{
		Force: true,
	})
}

type Container struct {
	ID      string
	Image   string
	Status  string
	State   string
	Command string
	Names   []string
	Created int64
	Ports   []PortInfo
}

type PortInfo struct {
	HostPort      int
	ContainerPort int
	Protocol      string
}

func (dm *DockerManager) ListContainers(includeAll ...bool) ([]Container, error) {
	// Default to showing all containers if not specified
	all := true
	if len(includeAll) > 0 {
		all = includeAll[0]
	}

	containers, err := dm.client.ContainerList(dm.ctx, types.ContainerListOptions{
		All: all,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %v", err)
	}

	var result []Container
	for _, c := range containers {
		container := Container{
			ID:      c.ID,
			Image:   c.Image,
			Status:  c.Status,
			State:   c.State,
			Command: c.Command,
			Names:   c.Names,
			Created: c.Created,
		}

		// Parse port information
		var ports []PortInfo
		for _, p := range c.Ports {
			port := PortInfo{
				HostPort:      int(p.PublicPort),
				ContainerPort: int(p.PrivatePort),
				Protocol:      p.Type,
			}
			ports = append(ports, port)
		}
		container.Ports = ports

		result = append(result, container)
	}

	return result, nil
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
	images, err := dm.client.ImageList(dm.ctx, types.ImageListOptions{
		All: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list images: %v", err)
	}

	var result []ImageInfo
	for _, img := range images {
		// Parse repository and tag from RepoTags (if available)
		repository := "<none>"
		tag := "<none>"
		if len(img.RepoTags) > 0 {
			parts := strings.Split(img.RepoTags[0], ":")
			if len(parts) >= 2 {
				repository = parts[0]
				tag = parts[1]
			}
		}

		// Format size to human-readable format
		size := fmt.Sprintf("%.2f MB", float64(img.Size)/(1024*1024))

		// Get image creation time
		createdAt := time.Unix(img.Created, 0).Format(time.RFC3339)

		// Get exposed ports
		exposedPorts, _ := dm.getImageExposedPorts(img.ID)

		imageInfo := ImageInfo{
			ID:           img.ID,
			Repository:   repository,
			Tag:          tag,
			Size:         size,
			CreatedAt:    createdAt,
			ExposedPorts: exposedPorts,
		}
		result = append(result, imageInfo)
	}

	return result, nil
}

func (dm *DockerManager) getImageExposedPorts(imageID string) ([]int, error) {
	// Inspect the image to get exposed ports
	inspect, _, err := dm.client.ImageInspectWithRaw(dm.ctx, imageID)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect image: %v", err)
	}

	var ports []int
	for portStr := range inspect.Config.ExposedPorts {
		// Format is like "8080/tcp"
		parts := strings.Split(string(portStr), "/")
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
	inspect, err := dm.client.ContainerInspect(dm.ctx, containerID)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect container: %v", err)
	}

	// Convert the struct to a map to maintain compatibility with the original function
	// This is not the most efficient approach but maintains the API signature
	inspectJSON, err := json.Marshal(inspect)
	if err != nil {
		return nil, err
	}

	var containerInfo map[string]interface{}
	if err := json.Unmarshal(inspectJSON, &containerInfo); err != nil {
		return nil, err
	}

	return containerInfo, nil
}

// ContainerExists checks if a container with the given ID exists
func (dm *DockerManager) ContainerExists(containerID string) (bool, error) {
	// Create a filter to search by container ID
	filter := filters.NewArgs()
	filter.Add("id", containerID)

	containers, err := dm.client.ContainerList(dm.ctx, types.ContainerListOptions{
		All:     true,
		Filters: filter,
	})

	if err != nil {
		return false, fmt.Errorf("failed to check if container exists: %v", err)
	}

	return len(containers) > 0, nil
}

// CreateExec creates a new exec instance in a container
func (dm *DockerManager) CreateExec(containerID string, config types.ExecConfig) (string, error) {
	execConfig := types.ExecConfig{
		Tty:          config.Tty,
		AttachStdin:  config.AttachStdin,
		AttachStdout: config.AttachStdout,
		AttachStderr: config.AttachStderr,
		Cmd:          config.Cmd,
	}

	exec, err := dm.client.ContainerExecCreate(dm.ctx, containerID, execConfig)
	if err != nil {
		return "", fmt.Errorf("failed to create exec: %v", err)
	}

	return exec.ID, nil
}

// ReadCloserWrapper wraps a io.Reader with a Close method
type ReadCloserWrapper struct {
	io.Reader
	CloseFunc func()
}

// Close calls the wrapped Close function
func (r ReadCloserWrapper) Close() error {
	if r.CloseFunc != nil {
		r.CloseFunc()
	}
	return nil
}

// StartExec starts a previously created exec instance and attaches to its IO streams
func (dm *DockerManager) StartExec(execID string, stdin io.Reader) (io.ReadCloser, error) {
	// Set up exec attachment
	attachOpts := types.ExecStartCheck{
		Detach: false,
		Tty:    false,
	}

	// Attach to exec
	resp, err := dm.client.ContainerExecAttach(dm.ctx, execID, attachOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to attach to exec: %v", err)
	}

	// If stdin is provided, pipe it to the exec's stdin
	if stdin != nil {
		go func() {
			defer resp.CloseWrite()
			io.Copy(resp.Conn, stdin)
		}()
	}

	// Return a ReadCloser wrapper that properly closes the connection
	return ReadCloserWrapper{
		Reader:    resp.Reader,
		CloseFunc: resp.Close,
	}, nil
}
