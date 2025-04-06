"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import ContainerSessions from "@/components/container-sessions"
import SystemMetrics from "@/components/system-metrics"
import ContainersTable from "@/components/containers-table"
import { fetchSystemMetrics, fetchContainers } from "@/lib/api"
import type { SystemMetricsData, Container } from "@/lib/types"

export default function Dashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetricsData | null>(null)
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [metricsData, containersData] = await Promise.all([fetchSystemMetrics(), fetchContainers()])

      setSystemMetrics(metricsData.metrics)
      setContainers(containersData.containers)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up polling for metrics every 5 seconds
    const intervalId = setInterval(fetchData, 5000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      <Header onRefresh={fetchData} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <ContainerSessions onSessionsChange={fetchData} />

        {systemMetrics && <SystemMetrics metrics={systemMetrics} />}

        <ContainersTable containers={containers} onContainerAction={fetchData} />
      </main>
    </div>
  )
}

