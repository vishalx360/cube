import axios from "axios";

const API_BASE_URL = "/api/v1";

export const createSession = async (imageConfig) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/sessions`,
      imageConfig || {
        image_name: "nginx",
        // Let the backend automatically detect exposed ports
      },
    );
    return response.data.session;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

export const listSessions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sessions`);
    return response.data.sessions || [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/sessions/${sessionId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

export const deleteAllSessions = async () => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/sessions`);
    return response.data;
  } catch (error) {
    console.error("Error deleting all sessions:", error);
    throw error;
  }
};

export const listImages = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/images`);
    return response.data.images || [];
  } catch (error) {
    console.error("Error fetching images:", error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await axios.get("/health");
    return response.data;
  } catch (error) {
    console.error("Health check failed:", error);
    throw error;
  }
};

// New metrics API methods
export const getSystemMetrics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/metrics/system`);
    console.log("System metrics response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    throw error;
  }
};

export const getContainerMetrics = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/metrics/containers`);
    console.log("Container metrics response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching container metrics:", error);
    throw error;
  }
};

export const getContainerMetricsForSession = async (sessionId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/metrics/containers/${sessionId}`,
    );
    console.log(`Metrics for session ${sessionId}:`, response.data);

    // Check the response structure and extract metrics properly
    if (response.data && response.data.metrics) {
      return response.data.metrics;
    } else if (response.data && typeof response.data === "object") {
      // If metrics aren't in a 'metrics' field, but the response is an object,
      // assume the entire response is the metrics object
      return response.data;
    } else {
      console.error("Unexpected metrics response format:", response.data);
      throw new Error("Invalid metrics format received from server");
    }
  } catch (error) {
    console.error(`Error fetching metrics for session ${sessionId}:`, error);
    throw error;
  }
};

// New function to list all Docker containers
export const listAllContainers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/containers`);
    console.log("All containers response:", response.data);
    return response.data.containers || [];
  } catch (error) {
    console.error("Error fetching all containers:", error);
    throw error;
  }
};

// New function to delete any container
export const deleteContainer = async (containerId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/containers/${containerId}`,
    );
    console.log(`Container ${containerId} deleted`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting container ${containerId}:`, error);
    throw error;
  }
};
