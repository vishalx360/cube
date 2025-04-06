package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"runtime"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/yourusername/session-manager/internal/model"
	"github.com/yourusername/session-manager/pkg/docker"
	"github.com/yourusername/session-manager/pkg/util"
)

// MetricsService handles collecting system metrics
type MetricsService struct {
	dockerManager  *docker.DockerManager
	dockerClient   *client.Client
	sessionService *SessionService
	logger         *util.Logger
}

// NewMetricsService creates a new metrics service
func NewMetricsService(dockerManager *docker.DockerManager, sessionService *SessionService) (*MetricsService, error) {
	// Create Docker client for stats
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %v", err)
	}

	return &MetricsService{
		dockerManager:  dockerManager,
		dockerClient:   cli,
		sessionService: sessionService,
		logger:         util.NewLogger(),
	}, nil
}

// GetSystemMetrics collects system metrics
func (ms *MetricsService) GetSystemMetrics(ctx context.Context) (*model.SystemMetrics, error) {
	systemMetrics := &model.SystemMetrics{
		CPU:       model.CPUMetrics{},
		Memory:    model.MemoryMetrics{},
		Disk:      model.DiskMetrics{},
		Docker:    model.DockerMetrics{},
		Timestamp: time.Now().Unix(),
	}

	// Create context with timeout for Docker operations
	ctxWithTimeout, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Collect CPU metrics
	cpuMetrics, err := ms.getCPUMetrics()
	if err != nil {
		ms.logger.Error("Failed to get CPU metrics: %v", err)
		// Continue with default CPU metrics
	} else {
		systemMetrics.CPU = cpuMetrics
	}

	// Collect memory metrics
	memMetrics, err := ms.getMemoryMetrics()
	if err != nil {
		ms.logger.Error("Failed to get memory metrics: %v", err)
		// Continue with default memory metrics
	} else {
		systemMetrics.Memory = memMetrics
	}

	// Collect disk metrics
	diskMetrics, err := ms.getDiskMetrics()
	if err != nil {
		ms.logger.Error("Failed to get disk metrics: %v", err)
		// Continue with default disk metrics
	} else {
		systemMetrics.Disk = diskMetrics
	}

	// Collect Docker metrics
	dockerMetrics, err := ms.getDockerMetrics(ctxWithTimeout)
	if err != nil {
		ms.logger.Error("Failed to get Docker metrics: %v", err)
		// Continue with default Docker metrics
	} else {
		systemMetrics.Docker = dockerMetrics
	}

	return systemMetrics, nil
}

// GetContainerMetrics retrieves metrics for all containers
func (ms *MetricsService) GetContainerMetrics(ctx context.Context) ([]model.ContainerMetrics, error) {
	containers, err := ms.dockerClient.ContainerList(ctx, types.ContainerListOptions{
		All: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %v", err)
	}

	// Get session map for quick lookups
	sessions := ms.sessionService.ListSessions()
	sessionMap := make(map[string]string) // containerID -> sessionID
	for _, session := range sessions {
		sessionMap[session.ContainerID] = session.ID
	}

	var metrics []model.ContainerMetrics
	for _, container := range containers {
		// Only include metrics for containers that are part of our sessions
		sessionID, exists := sessionMap[container.ID]
		if !exists {
			continue
		}

		// Get detailed stats
		stats, err := ms.getContainerStats(ctx, container.ID)
		if err != nil {
			ms.logger.Error("Failed to get stats for container %s: %v", container.ID, err)
			continue
		}

		// Get container details like restart count and status
		inspect, err := ms.dockerClient.ContainerInspect(ctx, container.ID)
		if err != nil {
			ms.logger.Error("Failed to inspect container %s: %v", container.ID, err)
			continue
		}

		// Calculate uptime
		var uptime int64
		var uptimeDisplay string
		if inspect.State.StartedAt != "" {
			startTime, err := time.Parse(time.RFC3339, inspect.State.StartedAt)
			if err == nil {
				duration := time.Since(startTime)
				uptime = int64(duration.Seconds())
				uptimeDisplay = formatDuration(duration)
			}
		}

		metrics = append(metrics, model.ContainerMetrics{
			ContainerID:   container.ID,
			SessionID:     sessionID,
			Name:          container.Names[0],
			CPU:           stats.CPU,
			Memory:        stats.Memory,
			Network:       stats.Network,
			BlockIO:       stats.BlockIO,
			RestartCount:  inspect.RestartCount,
			Status:        inspect.State.Status,
			Uptime:        uptime,
			UptimeDisplay: uptimeDisplay,
			Timestamp:     time.Now().Unix(),
		})
	}

	return metrics, nil
}

// GetContainerMetricsForSession retrieves metrics for a specific session
func (ms *MetricsService) GetContainerMetricsForSession(ctx context.Context, sessionID string) (*model.ContainerMetrics, error) {
	// Create a context with longer timeout
	ctxWithTimeout, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Find session
	sessions := ms.sessionService.ListSessions()
	var containerID string
	var containerName string

	for _, session := range sessions {
		if session.ID == sessionID {
			containerID = session.ContainerID
			break
		}
	}

	if containerID == "" {
		return nil, fmt.Errorf("session not found: %s", sessionID)
	}

	// Get container inspect info first (lightweight operation)
	inspect, err := ms.dockerClient.ContainerInspect(ctxWithTimeout, containerID)
	if err != nil {
		ms.logger.Error("Failed to inspect container %s: %v", containerID, err)
		// Continue with minimal metrics
		return &model.ContainerMetrics{
			ContainerID: containerID,
			SessionID:   sessionID,
			Status:      "unknown",
			Timestamp:   time.Now().Unix(),
		}, nil
	}

	containerName = inspect.Name
	containerStatus := inspect.State.Status

	// Calculate uptime
	var uptime int64
	var uptimeDisplay string
	if inspect.State.StartedAt != "" {
		startTime, err := time.Parse(time.RFC3339, inspect.State.StartedAt)
		if err == nil {
			duration := time.Since(startTime)
			uptime = int64(duration.Seconds())
			uptimeDisplay = formatDuration(duration)
		}
	}

	// Only get detailed stats if container is running
	var stats containerStats
	var statsErr error
	if containerStatus == "running" {
		stats, statsErr = ms.getContainerStats(ctxWithTimeout, containerID)
		if statsErr != nil {
			ms.logger.Error("Failed to get stats for container %s: %v", containerID, statsErr)
			// Continue with minimal metrics
		}
	}

	metrics := &model.ContainerMetrics{
		ContainerID:   containerID,
		SessionID:     sessionID,
		Name:          containerName,
		CPU:           stats.CPU,
		Memory:        stats.Memory,
		Network:       stats.Network,
		BlockIO:       stats.BlockIO,
		RestartCount:  inspect.RestartCount,
		Status:        containerStatus,
		Uptime:        uptime,
		UptimeDisplay: uptimeDisplay,
		Timestamp:     time.Now().Unix(),
	}

	return metrics, nil
}

// Helper functions

func (ms *MetricsService) getCPUMetrics() (model.CPUMetrics, error) {
	metrics := model.CPUMetrics{
		CoreCount: runtime.NumCPU(),
	}

	// Get CPU usage percentage
	percent, err := cpu.Percent(0, false)
	if err == nil && len(percent) > 0 {
		metrics.UsagePercent = percent[0]
	}

	// Get load average
	avgStat, err := load.Avg()
	if err == nil {
		metrics.LoadAverage1Min = avgStat.Load1
		metrics.LoadAverage5Min = avgStat.Load5
		metrics.LoadAverage15Min = avgStat.Load15
	}

	// Try to get CPU temperature on supported systems
	temps, err := host.SensorsTemperatures()
	if err == nil {
		for _, temp := range temps {
			if temp.SensorKey == "coretemp_packageid0_input" || temp.SensorKey == "cpu_thermal" {
				metrics.Temperature = temp.Temperature
				break
			}
		}
	}

	return metrics, nil
}

func (ms *MetricsService) getMemoryMetrics() (model.MemoryMetrics, error) {
	metrics := model.MemoryMetrics{}

	// Get virtual memory stats
	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return metrics, err
	}

	metrics.TotalBytes = memInfo.Total
	metrics.UsedBytes = memInfo.Used
	metrics.FreeBytes = memInfo.Free
	metrics.UsagePercent = memInfo.UsedPercent

	// Get swap memory stats
	swapInfo, err := mem.SwapMemory()
	if err == nil {
		metrics.SwapTotalBytes = swapInfo.Total
		metrics.SwapUsedBytes = swapInfo.Used
		metrics.SwapPercent = swapInfo.UsedPercent
	}

	return metrics, nil
}

func (ms *MetricsService) getDiskMetrics() (model.DiskMetrics, error) {
	metrics := model.DiskMetrics{}

	// Get disk usage of root partition
	usage, err := disk.Usage("/")
	if err != nil {
		return metrics, err
	}

	metrics.TotalBytes = usage.Total
	metrics.UsedBytes = usage.Used
	metrics.FreeBytes = usage.Free
	metrics.UsagePercent = usage.UsedPercent

	return metrics, nil
}

func (ms *MetricsService) getDockerMetrics(ctx context.Context) (model.DockerMetrics, error) {
	metrics := model.DockerMetrics{}

	// Get container counts
	containers, err := ms.dockerClient.ContainerList(ctx, types.ContainerListOptions{All: true})
	if err != nil {
		ms.logger.Error("Failed to list containers: %v", err)
		// Continue with other Docker metrics
	} else {
		metrics.TotalContainers = len(containers)

		// Count running containers
		for _, container := range containers {
			if container.State == "running" {
				metrics.RunningContainers++
			}
		}
	}

	// Get image count
	images, err := ms.dockerClient.ImageList(ctx, types.ImageListOptions{All: true})
	if err != nil {
		ms.logger.Error("Failed to list images: %v", err)
		// Continue with partial Docker metrics
	} else {
		metrics.Images = len(images)
	}

	return metrics, nil
}

// Container stats structure
type containerStats struct {
	CPU     model.CPUUsageMetrics
	Memory  model.MemoryUsage
	Network model.NetworkMetrics
	BlockIO model.BlockIOMetrics
}

func (ms *MetricsService) getContainerStats(ctx context.Context, containerID string) (containerStats, error) {
	var stats containerStats

	// Create a context with a longer timeout for Docker API calls
	ctxWithTimeout, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Use the Docker API to get stats
	response, err := ms.dockerClient.ContainerStats(ctxWithTimeout, containerID, false)
	if err != nil {
		return stats, fmt.Errorf("failed to get container stats: %v", err)
	}
	defer response.Body.Close()

	// Parse the stats
	var dockerStats types.StatsJSON
	if err := json.NewDecoder(response.Body).Decode(&dockerStats); err != nil {
		return stats, fmt.Errorf("failed to decode container stats: %v", err)
	}

	// CPU stats
	cpuDelta := float64(dockerStats.CPUStats.CPUUsage.TotalUsage - dockerStats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(dockerStats.CPUStats.SystemUsage - dockerStats.PreCPUStats.SystemUsage)

	cpuPercent := 0.0
	if systemDelta > 0.0 && cpuDelta > 0.0 {
		// Handle case where PercpuUsage might be empty or nil
		numCPUs := len(dockerStats.CPUStats.CPUUsage.PercpuUsage)
		if numCPUs == 0 {
			numCPUs = runtime.NumCPU() // Fallback to system CPU count
		}
		cpuPercent = (cpuDelta / systemDelta) * float64(numCPUs) * 100.0
	}

	stats.CPU = model.CPUUsageMetrics{
		UsagePercent: math.Round(cpuPercent*100) / 100, // Round to 2 decimal places
		UsageInCores: cpuPercent / 100.0 * float64(runtime.NumCPU()),
	}

	// If throttling data is available
	if dockerStats.CPUStats.ThrottlingData.Periods > 0 {
		stats.CPU.ThrottledPct = float64(dockerStats.CPUStats.ThrottlingData.ThrottledPeriods) / float64(dockerStats.CPUStats.ThrottlingData.Periods) * 100.0
	}

	// Memory stats
	memUsage := dockerStats.MemoryStats.Usage
	// Safely access cache value with fallback
	var cache uint64
	if val, ok := dockerStats.MemoryStats.Stats["cache"]; ok {
		cache = val
		memUsage -= cache
	}

	memLimit := dockerStats.MemoryStats.Limit
	memPercent := 0.0
	if memLimit > 0 {
		memPercent = float64(memUsage) / float64(memLimit) * 100.0
	}

	stats.Memory = model.MemoryUsage{
		UsageBytes:   memUsage,
		LimitBytes:   memLimit,
		UsagePercent: math.Round(memPercent*100) / 100, // Round to 2 decimal places
		CacheBytes:   cache,
	}

	// Safely access RSS value
	if val, ok := dockerStats.MemoryStats.Stats["rss"]; ok {
		stats.Memory.ResidentBytes = val
	}

	// Network stats
	for _, network := range dockerStats.Networks {
		stats.Network.RxBytes += network.RxBytes
		stats.Network.TxBytes += network.TxBytes
		stats.Network.RxPackets += network.RxPackets
		stats.Network.TxPackets += network.TxPackets
		stats.Network.RxErrors += network.RxErrors
		stats.Network.TxErrors += network.TxErrors
		stats.Network.RxDropped += network.RxDropped
		stats.Network.TxDropped += network.TxDropped
	}

	// Block I/O stats
	for _, io := range dockerStats.BlkioStats.IoServiceBytesRecursive {
		if io.Op == "Read" {
			stats.BlockIO.ReadBytes += io.Value
		} else if io.Op == "Write" {
			stats.BlockIO.WriteBytes += io.Value
		}
	}

	for _, io := range dockerStats.BlkioStats.IoServicedRecursive {
		if io.Op == "Read" {
			stats.BlockIO.ReadOps += io.Value
		} else if io.Op == "Write" {
			stats.BlockIO.WriteOps += io.Value
		}
	}

	return stats, nil
}

// formatDuration formats a duration to a human-readable string (e.g., "2h 5m 30s")
func formatDuration(d time.Duration) string {
	days := int(d.Hours() / 24)
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	} else if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	}
	return fmt.Sprintf("%ds", seconds)
}
