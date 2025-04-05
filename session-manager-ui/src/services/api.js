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
