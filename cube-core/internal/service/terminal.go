package service

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/gorilla/websocket"
	"github.com/yourusername/session-manager/pkg/util"
)

// WebSocketConfig contains WebSocket configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins
	},
}

// HandleContainerTerminal manages WebSocket connections for container terminals
func (ss *SessionService) HandleContainerTerminal(w http.ResponseWriter, r *http.Request, containerID string) error {
	// Log the request
	ss.logger.Info("Handling terminal WebSocket request for container: %s", containerID)

	// Check if container exists
	exists, err := ss.dockerManager.ContainerExists(containerID)
	if err != nil {
		ss.logger.Error("Failed to check if container exists: %v", err)
		return util.WrapError(err, "failed to check if container exists")
	}
	if !exists {
		ss.logger.Error("Container not found: %s", containerID)
		return fmt.Errorf("container not found: %s", containerID)
	}

	// Check if container is running
	containerInfo, err := ss.dockerManager.InspectContainer(containerID)
	if err != nil {
		ss.logger.Error("Failed to inspect container: %v", err)
		return fmt.Errorf("failed to inspect container: %v", err)
	}

	// Extract state from the container info
	state, ok := containerInfo["State"].(map[string]interface{})
	if !ok {
		ss.logger.Error("Failed to get container state")
		return fmt.Errorf("failed to get container state")
	}

	running, ok := state["Running"].(bool)
	if !ok || !running {
		ss.logger.Error("Container is not running: %s", containerID)
		return fmt.Errorf("container is not running: %s", containerID)
	}

	// Upgrade HTTP connection to WebSocket
	ss.logger.Debug("Upgrading connection to WebSocket")
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		ss.logger.Error("Failed to upgrade to WebSocket: %v", err)
		return fmt.Errorf("failed to upgrade connection: %v", err)
	}
	defer ws.Close()

	ss.logger.Info("WebSocket connection established for container: %s", containerID)

	// Create context with timeout for docker exec
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	ss.logger.Debug("Starting docker exec for container: %s", containerID)

	// Create a done channel for handling completion and potential retry
	done := make(chan struct{})
	execError := make(chan error, 1)

	// Try using the shell approach first
	go func() {
		if err := ss.execWithShell(ctx, ws, containerID, done); err != nil {
			ss.logger.Warn("Shell exec approach failed: %v, trying fallback", err)
			execError <- err
		} else {
			close(execError) // No error
		}
	}()

	// Wait for either completion or error
	select {
	case err := <-execError:
		if err != nil {
			// Try the fallback approach with docker API
			ss.logger.Info("Using fallback approach with docker API")
			return ss.execWithDockerAPI(ctx, ws, containerID, done)
		}
	case <-done:
		// Shell exec completed successfully
	}

	ss.logger.Info("Terminal session completed for container: %s", containerID)
	return nil
}

// execWithShell tries to exec into the container using shell commands
func (ss *SessionService) execWithShell(ctx context.Context, ws *websocket.Conn, containerID string, done chan struct{}) error {
	// Try to determine the best shell to use
	// Common shell binaries to try in order of preference
	shellBinaries := []string{"/bin/bash", "/bin/sh", "/usr/bin/bash", "/usr/bin/sh"}
	shellCmd := ""

	// Try to execute 'ls' in the container to check which shell is available
	for _, shell := range shellBinaries {
		testCmd := exec.Command("docker", "exec", containerID, "ls", shell)
		if err := testCmd.Run(); err == nil {
			shellCmd = shell
			ss.logger.Info("Found shell in container: %s", shellCmd)
			break
		}
	}

	// If no shell was found, default to /bin/sh
	if shellCmd == "" {
		shellCmd = "/bin/sh"
		ss.logger.Warn("No shell detected in container, defaulting to %s", shellCmd)
	}

	// Use Docker command directly rather than Docker API for simpler terminal handling
	// Omit -t flag if the container doesn't support a TTY
	dockerExecCmd := exec.CommandContext(ctx, "docker", "exec", "-i", containerID, shellCmd)
	ss.logger.Debug("Docker exec command: %v", dockerExecCmd.Args)

	// Try to set the command not to allocate a pseudo-TTY
	dockerExecCmd.Env = append(os.Environ(), "DOCKER_EXEC_DISABLE_TTY=1")

	// Create pipes for stdin/stdout/stderr
	stdin, err := dockerExecCmd.StdinPipe()
	if err != nil {
		ss.logger.Error("Failed to create stdin pipe: %v", err)
		return fmt.Errorf("failed to create stdin pipe: %v", err)
	}

	stdout, err := dockerExecCmd.StdoutPipe()
	if err != nil {
		ss.logger.Error("Failed to create stdout pipe: %v", err)
		return fmt.Errorf("failed to create stdout pipe: %v", err)
	}

	stderr, err := dockerExecCmd.StderrPipe()
	if err != nil {
		ss.logger.Error("Failed to create stderr pipe: %v", err)
		return fmt.Errorf("failed to create stderr pipe: %v", err)
	}

	// Start the command
	if err := dockerExecCmd.Start(); err != nil {
		ss.logger.Error("Failed to start exec: %v", err)
		return fmt.Errorf("failed to start exec: %v", err)
	}

	// Forward terminal output to WebSocket
	go func() {
		defer close(done)

		// Combine stdout and stderr
		reader := io.MultiReader(stdout, stderr)

		buffer := make([]byte, 1024)
		for {
			n, err := reader.Read(buffer)
			if err != nil {
				if err != io.EOF {
					ss.logger.Error("Error reading from exec: %v", err)
				}
				return
			}

			if err := ws.WriteMessage(websocket.BinaryMessage, buffer[:n]); err != nil {
				ss.logger.Error("Error writing to WebSocket: %v", err)
				return
			}
		}
	}()

	// Forward WebSocket input to terminal
	go func() {
		for {
			messageType, p, err := ws.ReadMessage()
			if err != nil {
				ss.logger.Error("Error reading from WebSocket: %v", err)
				return
			}

			if messageType == websocket.BinaryMessage || messageType == websocket.TextMessage {
				if _, err := stdin.Write(p); err != nil {
					ss.logger.Error("Error writing to exec: %v", err)
					return
				}
			}
		}
	}()

	// Wait for process to complete or WebSocket to close
	ss.logger.Debug("Waiting for terminal session to complete")
	<-done

	// Clean up
	ss.logger.Debug("Terminal session ended, cleaning up")
	if err := dockerExecCmd.Wait(); err != nil {
		ss.logger.Error("Exec process error: %v", err)
	}

	return nil
}

// execWithDockerAPI uses the Docker API directly to exec into the container
func (ss *SessionService) execWithDockerAPI(ctx context.Context, ws *websocket.Conn, containerID string, done chan struct{}) error {
	ss.logger.Info("Executing in container using Docker API: %s", containerID)

	// Create a Docker API exec configuration - uses dockerManager to execute commands
	execConfig := types.ExecConfig{
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          false, // Disable TTY
		Cmd:          []string{"/bin/sh", "-c", "export TERM=xterm && cd $HOME && /bin/sh"},
	}

	// Create exec instance via Docker API
	execID, err := ss.dockerManager.CreateExec(containerID, execConfig)
	if err != nil {
		ss.logger.Error("Failed to create exec using Docker API: %v", err)
		return fmt.Errorf("failed to create exec: %v", err)
	}

	// Attach to the exec
	hr, hw := io.Pipe()

	// Forward WebSocket to the exec stdin
	go func() {
		defer hw.Close()

		for {
			_, p, err := ws.ReadMessage()
			if err != nil {
				ss.logger.Error("Error reading from WebSocket: %v", err)
				return
			}

			if _, err := hw.Write(p); err != nil {
				ss.logger.Error("Error writing to exec stdin: %v", err)
				return
			}
		}
	}()

	// Start the exec and get the IO streams
	resp, err := ss.dockerManager.StartExec(execID, hr)
	if err != nil {
		ss.logger.Error("Failed to start exec: %v", err)
		return fmt.Errorf("failed to start exec: %v", err)
	}
	defer resp.Close()

	// Copy output to WebSocket
	go func() {
		defer close(done)

		buffer := make([]byte, 1024)
		for {
			n, err := resp.Read(buffer)
			if err != nil {
				if err != io.EOF {
					ss.logger.Error("Error reading from exec: %v", err)
				}
				return
			}

			if err := ws.WriteMessage(websocket.BinaryMessage, buffer[:n]); err != nil {
				ss.logger.Error("Error writing to WebSocket: %v", err)
				return
			}
		}
	}()

	// Wait for completion
	<-done

	ss.logger.Info("API Exec terminal session ended")
	return nil
}
