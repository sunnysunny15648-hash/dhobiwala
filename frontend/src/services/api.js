import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const recoveryToken = new URLSearchParams(window.location.hash.slice(1)).get("access_token");
  const token = localStorage.getItem("dw_access_token") || recoveryToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem("dw_refresh_token");
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      refreshToken &&
      !original.url?.includes("/auth/refresh")
    ) {
      original._retried = true;
      try {
        const refreshed = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const session = refreshed.data.data;
        localStorage.setItem("dw_access_token", session.access_token);
        localStorage.setItem("dw_refresh_token", session.refresh_token);
        original.headers.Authorization = `Bearer ${session.access_token}`;
        return api(original);
      } catch {
        localStorage.removeItem("dw_access_token");
        localStorage.removeItem("dw_refresh_token");
        window.dispatchEvent(new Event("dw:session-expired"));
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      "The service could not be reached.";
    return Promise.reject(new Error(message));
  },
);

export default api;
