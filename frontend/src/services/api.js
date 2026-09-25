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

// Request interceptor: Attach Bearer token from localStorage for browsers that block 3rd-party cross-site cookies (Brave, Safari, Incognito)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat_app_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle expired tokens or automatic refresh if needed
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/users/login") &&
      !originalRequest.url?.includes("/users/register") &&
      !originalRequest.url?.includes("/users/refresh-token")
    ) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = localStorage.getItem("chat_app_refresh_token");
        const { data } = await axios.post(
          `${BASE_URL}/users/refresh-token`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = data.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem("chat_app_token", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        if (data.data?.refreshToken) {
          localStorage.setItem("chat_app_refresh_token", data.data.refreshToken);
        }

        return API(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
