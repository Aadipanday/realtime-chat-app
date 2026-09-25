import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://realtime-chat-app-25ow.onrender.com/api"
    : "/api");

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Interceptor to handle expired tokens or automatic refresh if needed
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/users/login") &&
      !originalRequest.url.includes("/users/register") &&
      !originalRequest.url.includes("/users/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        return API(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
