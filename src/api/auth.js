import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "touch_live_access_token",
  ID_TOKEN: "touch_live_id_token",
  REFRESH_TOKEN: "touch_live_refresh_token",
};

/**
 * Storage helpers
 */
export const getAccessToken = () => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
};

export const getIdToken = () => {
  return localStorage.getItem(STORAGE_KEYS.ID_TOKEN) || null;
};

export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
};

export const setAuthTokens = ({ accessToken, idToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (idToken) localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Decode JWT token payload in browser without signature verification
 */
export const parseJwt = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check if a token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
};

/**
 * Exchange user data / Firebase auth token for backend token trio
 * (Access Token, ID Token, Refresh Token)
 */
export const exchangeForTokens = async (userData, firebaseToken = null) => {
  const headers = { "Content-Type": "application/json" };
  if (firebaseToken) {
    headers.Authorization = `Bearer ${firebaseToken}`;
  }

  const response = await axios.post(`${baseURL}/api/auth/tokens`, userData, {
    headers,
  });

  if (response.data?.success) {
    const { accessToken, idToken, refreshToken } = response.data;
    setAuthTokens({ accessToken, idToken, refreshToken });
  }

  return response.data;
};

/**
 * Call refresh endpoint to get fresh access & id tokens
 */
export const refreshTokensApi = async (refreshToken) => {
  const response = await axios.post(
    `${baseURL}/api/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  if (response.data?.success) {
    const { accessToken, idToken, refreshToken: newRefreshToken } = response.data;
    setAuthTokens({
      accessToken,
      idToken,
      refreshToken: newRefreshToken || refreshToken,
    });
  }

  return response.data;
};

/**
 * Revoke refresh token on backend on logout
 */
export const logoutTokensApi = async (refreshToken) => {
  try {
    const res = await axios.post(
      `${baseURL}/api/auth/logout`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  } catch (err) {
    console.warn("Backend token revocation warning:", err);
  } finally {
    clearAuthTokens();
  }
};

