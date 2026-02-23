import axios from "axios";

const DEFAULT_API_BASE_URL = "http://localhost:3002";

const sanitizeBaseUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const parsed = new URL(value);
    if (!parsed.hostname) {
      return DEFAULT_API_BASE_URL;
    }
    return parsed.origin;
  } catch (_error) {
    return DEFAULT_API_BASE_URL;
  }
};

const API_BASE_URL = sanitizeBaseUrl(process.env.REACT_APP_API_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
