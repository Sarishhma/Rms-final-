import axios from "axios";
import { apiMiddleware } from "./api/interceptor";
const BASE = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

const refreshApi = axios.create({
  baseURL: BASE,
});
const forceLogout = () => {
  window.dispatchEvent(new Event("force-logout"));
};
/* ---------------- STATE ---------------- */
let accessToken: string | null = null;
let storedRefreshToken: string | null = null;

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

let refreshTimer: any = null;

/* ---------------- TOKEN SETTER ---------------- */
export const setToken = (
  token: string,
  refresh: string,
  expiresIn?: number, // seconds
) => {
  accessToken = token;
  storedRefreshToken = refresh;

  localStorage.setItem("accessToken", token);
  localStorage.setItem("refreshToken", refresh);

  // schedule proactive refresh
  if (expiresIn) {
    scheduleRefresh(expiresIn);
  }
};

/* ---------------- GET TOKENS ---------------- */
export const getToken = () =>
  accessToken || localStorage.getItem("accessToken");

export const getRefreshToken = () =>
  storedRefreshToken || localStorage.getItem("refreshToken");

/* ---------------- PROACTIVE REFRESH (13 min logic) ---------------- */
const scheduleRefresh = (expiresIn: number) => {
  // refresh at 80% of token lifetime (safe default)
  const refreshTime = expiresIn * 0.8 * 1000;

  if (refreshTimer) clearTimeout(refreshTimer);

  refreshTimer = setTimeout(() => {
    refreshToken();
  }, refreshTime);
};

/* ---------------- ACTUAL REFRESH FUNCTION ---------------- */
const refreshToken = async () => {
  if (isRefreshing) return;

  isRefreshing = true;

  try {
    const res = await refreshApi.post("/api/auth/refresh", {
      refreshToken: getRefreshToken(),
    });

    const newToken =
      res.data.accessToken || res.data.token || res.data.data?.accessToken;

    const newRefresh = res.data.refreshToken || res.data.data?.refreshToken;

    const expiresIn = res.data.expiresIn;

    if (!newToken) {
      throw new Error("Invalid refresh response");
    }

    setToken(newToken, newRefresh, expiresIn);

    isRefreshing = false;

    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
  } catch (err) {
    isRefreshing = false;
    refreshSubscribers = [];

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    forceLogout(); 
  }
};

/* ---------------- REQUEST INTERCEPTOR ---------------- */
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ---------------- RESPONSE INTERCEPTOR (401 fallback) ---------------- */
api.interceptors.response.use(apiMiddleware.onResponse, async (error) => {
  const originalRequest = error.config;

  if (!error.response) {
    return apiMiddleware.onError(error);
  }

  if (error.response.status !== 401 || originalRequest._retry) {
    return apiMiddleware.onError(error);
  }

  originalRequest._retry = true;

  /* ---------------- QUEUE IF ALREADY REFRESHING ---------------- */
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(api(originalRequest));
      });
    });
  }

  isRefreshing = true;

  try {
    const refreshTokenValue = getRefreshToken();

    if (!refreshTokenValue) {
      window.location.href = "/sign-in";
      return Promise.reject("No refresh token");
    }

    const res = await refreshApi.post("/api/auth/refresh", {
      refreshToken: refreshTokenValue,
    });

    const newToken =
      res.data.accessToken || res.data.token || res.data.data?.accessToken;

    const newRefresh = res.data.refreshToken || res.data.data?.refreshToken;

    const expiresIn = res.data.expiresIn;

    if (!newToken) {
      throw new Error("Invalid refresh response");
    }

    setToken(newToken, newRefresh, expiresIn);

    isRefreshing = false;

    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];

    originalRequest.headers.Authorization = `Bearer ${newToken}`;

    return api(originalRequest);
  } catch (err) {
    isRefreshing = false;
    refreshSubscribers = [];

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    forceLogout();
    return apiMiddleware.onError(error);
  }
});

export default api;
