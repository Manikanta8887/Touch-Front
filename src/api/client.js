import axios from "axios";
import { Auth } from "../Components/Firebase/Firebaseconfig";
import {
  getAccessToken,
  getRefreshToken,
  refreshTokensApi,
  clearAuthTokens,
  isTokenExpired,
} from "./auth";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(apiClient(prom.config));
    }
  });
  failedQueue = [];
};

// 1. Request interceptor: Attach Access Token (or fallback to Firebase ID Token)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      let token = getAccessToken();

      // Proactive check: if access token is expired and we have a refresh token, refresh before sending
      if (token && isTokenExpired(token)) {
        const refreshToken = getRefreshToken();
        if (refreshToken && !isRefreshing) {
          try {
            isRefreshing = true;
            const res = await refreshTokensApi(refreshToken);
            if (res?.accessToken) {
              token = res.accessToken;
            }
          } catch {
            // If proactive refresh fails, proceed and let 401 response interceptor handle
          } finally {
            isRefreshing = false;
          }
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Fallback to Firebase current user ID token
        const currentUser = Auth.currentUser;
        if (currentUser) {
          const fbToken = await currentUser.getIdToken();
          config.headers.Authorization = `Bearer ${fbToken}`;
        }
      }
    } catch (err) {
      console.warn("Authorization header interceptor warning:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response interceptor: Automatic 401 Refresh Token rotation & Retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 Unauthorized that haven't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken();

      // If no refresh token available, reject immediately
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshTokensApi(refreshToken);
        const newAccessToken = refreshResponse?.accessToken;

        if (newAccessToken) {
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          clearAuthTokens();
          processQueue(new Error("Failed to refresh access token"), null);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        clearAuthTokens();
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
