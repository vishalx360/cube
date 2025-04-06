"use client"

import { Cpu, MemoryStickIcon as Memory, HardDrive, Container } from "lucide-react"
import type { SystemMetricsData } from "@/lib/types"

interface SystemMetricsProps {
  metrics: SystemMetricsData
}

export default function SystemMetrics({ metrics }: SystemMetricsProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">System Metrics</h2>
        <p className="text-gray-400">System metrics updated every 5 seconds</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Metrics */}
        <div className="bg-black rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5" />
            <h3 className="font-medium">CPU</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Usage</p>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics.cpu.usage_percent}%` }} />
              </div>
              <p className="text-right text-sm mt-1">{metrics.cpu.usage_percent.toFixed(0)}%</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-400">Cores:</p>
                <p>{metrics.cpu.core_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Load (1m):</p>
                <p>{metrics.cpu.load_avg_1min.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Load (5m):</p>
                <p>{metrics.cpu.load_avg_5min.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Metrics */}
        <div className="bg-black rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Memory className="h-5 w-5" />
            <h3 className="font-medium">Memory</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Usage</p>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${metrics.memory.usage_percent}%` }}
                />
              </div>
              <p className="text-right text-sm mt-1">{metrics.memory.usage_percent.toFixed(0)}%</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm text-gray-400">Total:</p>
                <p>{formatBytes(metrics.memory.total_bytes)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Used:</p>
                <p>{formatBytes(metrics.memory.used_bytes)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Free:</p>
                <p>{formatBytes(metrics.memory.free_bytes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disk Metrics */}
        <div className="bg-black rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5" />
            <h3 className="font-medium">Disk</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Usage</p>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics.disk.usage_percent}%` }} />
              </div>
              <p className="text-right text-sm mt-1">{metrics.disk.usage_percent.toFixed(0)}%</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm text-gray-400">Total:</p>
                <p>{formatBytes(metrics.disk.total_bytes)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Used:</p>
                <p>{formatBytes(metrics.disk.used_bytes)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Free:</p>
                <p>{formatBytes(metrics.disk.free_bytes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Docker Metrics */}
        <div className="bg-black rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Container className="h-5 w-5" />
            <h3 className="font-medium">Docker</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm text-gray-400">Running Containers:</p>
                <p>{metrics.docker.running_containers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Containers:</p>
                <p>{metrics.docker.total_containers}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Images:</p>
                <p>{metrics.docker.images}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400">Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

