export interface Port {
  host_port: number
  container_port: number
  protocol: string
  description: string
  url: string
}

export interface Session {
  id: string
  created_at: string
  image_name: string
  container_id: string
  ports: Port[]
  status: string
}

export interface Container {
  id: string
  session_id: string
  name: string
  image: string
  command: string
  status: string
  state: string
  created: number
  created_at: string
  ports: Port[]
  is_managed: boolean
}

export interface Image {
  id: string
  name: string
  tag: string
  size: string
  created: string
  exposed_ports: number[]
}

export interface CPUMetrics {
  usage_percent: number
  temperature: number
  core_count: number
  load_avg_1min: number
  load_avg_5min: number
  load_avg_15min: number
}

export interface MemoryMetrics {
  total_bytes: number
  used_bytes: number
  free_bytes: number
  usage_percent: number
  swap_total_bytes: number
  swap_used_bytes: number
  swap_percent: number
}

export interface DiskMetrics {
  total_bytes: number
  used_bytes: number
  free_bytes: number
  usage_percent: number
}

export interface DockerMetrics {
  running_containers: number
  total_containers: number
  images: number
}

export interface SystemMetricsData {
  cpu: CPUMetrics
  memory: MemoryMetrics
  disk: DiskMetrics
  docker: DockerMetrics
  timestamp: number
}

export interface ContainerCPUMetrics {
  usage_percent: number
  usage_in_cores: number
  throttled_percent: number
}

export interface ContainerMemoryMetrics {
  usage_bytes: number
  limit_bytes: number
  usage_percent: number
  cache_bytes: number
  resident_bytes: number
}

export interface ContainerNetworkMetrics {
  rx_bytes: number
  tx_bytes: number
  rx_packets: number
  tx_packets: number
  rx_errors: number
  tx_errors: number
  rx_dropped: number
  tx_dropped: number
}

export interface ContainerBlockIOMetrics {
  read_bytes: number
  write_bytes: number
  read_ops: number
  write_ops: number
}

export interface ContainerMetrics {
  container_id: string
  session_id: string
  name: string
  cpu: ContainerCPUMetrics
  memory: ContainerMemoryMetrics
  network: ContainerNetworkMetrics
  block_io: ContainerBlockIOMetrics
  restart_count: number
  status: string
  uptime_seconds: number
  uptime_display: string
  timestamp: number
}

