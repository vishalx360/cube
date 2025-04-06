package model

// SystemMetrics represents system-wide metrics
type SystemMetrics struct {
	CPU       CPUMetrics    `json:"cpu"`
	Memory    MemoryMetrics `json:"memory"`
	Disk      DiskMetrics   `json:"disk"`
	Docker    DockerMetrics `json:"docker"`
	Timestamp int64         `json:"timestamp"`
}

// CPUMetrics represents CPU usage metrics
type CPUMetrics struct {
	UsagePercent     float64 `json:"usage_percent"`
	Temperature      float64 `json:"temperature,omitempty"`
	CoreCount        int     `json:"core_count"`
	LoadAverage1Min  float64 `json:"load_avg_1min"`
	LoadAverage5Min  float64 `json:"load_avg_5min"`
	LoadAverage15Min float64 `json:"load_avg_15min"`
}

// MemoryMetrics represents memory usage metrics
type MemoryMetrics struct {
	TotalBytes     uint64  `json:"total_bytes"`
	UsedBytes      uint64  `json:"used_bytes"`
	FreeBytes      uint64  `json:"free_bytes"`
	UsagePercent   float64 `json:"usage_percent"`
	SwapTotalBytes uint64  `json:"swap_total_bytes,omitempty"`
	SwapUsedBytes  uint64  `json:"swap_used_bytes,omitempty"`
	SwapPercent    float64 `json:"swap_percent,omitempty"`
}

// DiskMetrics represents disk usage metrics
type DiskMetrics struct {
	TotalBytes   uint64  `json:"total_bytes"`
	UsedBytes    uint64  `json:"used_bytes"`
	FreeBytes    uint64  `json:"free_bytes"`
	UsagePercent float64 `json:"usage_percent"`
}

// DockerMetrics represents Docker-related metrics
type DockerMetrics struct {
	RunningContainers int `json:"running_containers"`
	TotalContainers   int `json:"total_containers"`
	Images            int `json:"images"`
}

// ContainerMetrics represents metrics for a specific container
type ContainerMetrics struct {
	ContainerID   string          `json:"container_id"`
	SessionID     string          `json:"session_id"`
	Name          string          `json:"name"`
	CPU           CPUUsageMetrics `json:"cpu"`
	Memory        MemoryUsage     `json:"memory"`
	Network       NetworkMetrics  `json:"network"`
	BlockIO       BlockIOMetrics  `json:"block_io"`
	RestartCount  int             `json:"restart_count"`
	Status        string          `json:"status"`
	Uptime        int64           `json:"uptime_seconds"`
	UptimeDisplay string          `json:"uptime_display"`
	Timestamp     int64           `json:"timestamp"`
}

// CPUUsageMetrics represents CPU usage metrics for a container
type CPUUsageMetrics struct {
	UsagePercent float64 `json:"usage_percent"`
	UsageInCores float64 `json:"usage_in_cores"`
	ThrottledPct float64 `json:"throttled_percent,omitempty"`
}

// MemoryUsage represents memory usage metrics for a container
type MemoryUsage struct {
	UsageBytes    uint64  `json:"usage_bytes"`
	LimitBytes    uint64  `json:"limit_bytes"`
	UsagePercent  float64 `json:"usage_percent"`
	CacheBytes    uint64  `json:"cache_bytes,omitempty"`
	ResidentBytes uint64  `json:"resident_bytes,omitempty"`
}

// NetworkMetrics represents network usage metrics for a container
type NetworkMetrics struct {
	RxBytes   uint64 `json:"rx_bytes"`
	TxBytes   uint64 `json:"tx_bytes"`
	RxPackets uint64 `json:"rx_packets"`
	TxPackets uint64 `json:"tx_packets"`
	RxErrors  uint64 `json:"rx_errors"`
	TxErrors  uint64 `json:"tx_errors"`
	RxDropped uint64 `json:"rx_dropped"`
	TxDropped uint64 `json:"tx_dropped"`
}

// BlockIOMetrics represents block I/O metrics for a container
type BlockIOMetrics struct {
	ReadBytes  uint64 `json:"read_bytes"`
	WriteBytes uint64 `json:"write_bytes"`
	ReadOps    uint64 `json:"read_ops"`
	WriteOps   uint64 `json:"write_ops"`
}

// ContainerMetricsResponse represents a response containing metrics for containers
type ContainerMetricsResponse struct {
	Metrics []ContainerMetrics `json:"metrics"`
}

// SystemMetricsResponse represents a response containing system metrics
type SystemMetricsResponse struct {
	Metrics SystemMetrics `json:"metrics"`
}
