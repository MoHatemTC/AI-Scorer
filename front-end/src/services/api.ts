import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const executeQuery = async (sql: string) => {
  try {
    const response = await apiClient.post("/query", { sql });
    return response.data;
  } catch (error) {
    // Handle specific network errors
    if (axios.isAxiosError(error) && !error.response) {
      return {
        error: true,
        message: "Unable to connect to the server. Please try again later.",
      };
    }
    // Other API errors
    return {
      error: true,
      message: "An error occurred while fetching data.",
    };
  }
};

export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get("/");
    return response.data;
  } catch (error) {
    console.error("API health check failed:", error);
    return {
      error: true,
      message: "API health check failed. Please try again later.",
    };
  }
};
