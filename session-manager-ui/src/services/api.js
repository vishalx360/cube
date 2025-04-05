import axios from "axios";

const API_BASE_URL = "/sessions";

export const createSession = async () => {
  try {
    const response = await axios.post(API_BASE_URL);
    return response.data.session;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

export const listSessions = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data.sessions || [];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

export const deleteAllSessions = async () => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/all`);
    return response.data;
  } catch (error) {
    console.error("Error deleting all sessions:", error);
    throw error;
  }
};
