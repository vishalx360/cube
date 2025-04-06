const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

// Helper function for API requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `API request failed with status ${response.status}`)
  }

  return response.json()
}

// Session Management
export function fetchSessions() {
  return fetchAPI<{ sessions: any[] }>("/sessions")
}

export function createSession(data: {
  image_name: string
  num_ports: number
  port_mappings: { container_port: number; protocol: string; description: string }[]
}) {
  return fetchAPI("/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function deleteSession(id: string) {
  return fetchAPI(`/sessions/${id}`, {
    method: "DELETE",
  })
}

export function deleteAllSessions() {
  return fetchAPI("/sessions", {
    method: "DELETE",
  })
}

// Container Management
export function fetchContainers() {
  return fetchAPI<{ containers: any[] }>("/containers")
}

export function deleteContainer(id: string) {
  return fetchAPI(`/containers/${id}`, {
    method: "DELETE",
  })
}

// Image Management
export function fetchImages() {
  return fetchAPI<{ images: any[] }>("/images")
}

// Metrics
export function fetchSystemMetrics() {
  return fetchAPI<{ metrics: any }>("/metrics/system")
}

export function fetchContainerMetrics() {
  return fetchAPI<{ metrics: any[] }>("/metrics/containers")
}

export function fetchContainerMetricsForSession(sessionId: string) {
  return fetchAPI<{ metrics: any }>(`/metrics/containers/${sessionId}`)
}

