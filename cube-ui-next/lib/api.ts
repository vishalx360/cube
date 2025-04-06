'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

console.log("Using API URL:", API_BASE_URL);

// Helper function for API requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    console.log(`Fetching from: ${API_BASE_URL}${endpoint}`);
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
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    // For development/testing, return mock data if API is unavailable
    if (endpoint === "/containers" && process.env.NODE_ENV !== 'production') {
      console.log("Using mock container data");
      return {
        containers: [
          {
            id: "1797a9352ff02e9eae235203ea5a256249d131ef857f67d0ae4f1056975ae213",
            name: "postgres-db",
            port: 5432,
            status: "running",
            created_at: new Date().toISOString()
          }
        ]
      } as T;
    }

    throw error;
  }
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

// Database instances
export interface DatabaseInstance {
  id: string;
  name: string;
  port: number;
  status: string;
  created_at: string;
}

export function listDatabases(): Promise<DatabaseInstance[]> {
  return fetchAPI<{ containers: DatabaseInstance[] }>("/containers")
    .then(response => response.containers || []);
}

// Terminal WebSocket URL
export function getWebSocketUrl(containerId: string): string {
  const host = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080/api/v1/terminal"

  // Ensure the URL has the correct protocol (ws:// or wss://)
  let wsUrl = host;
  if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
    wsUrl = wsUrl.startsWith('http://') ? wsUrl.replace('http://', 'ws://') :
      wsUrl.startsWith('https://') ? wsUrl.replace('https://', 'wss://') :
        `ws://${wsUrl}`;
  }

  // Make sure we don't have double slashes in the path
  return `${wsUrl.replace(/\/$/, '')}/${containerId}`;
}

