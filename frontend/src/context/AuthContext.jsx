import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener("dw:session-expired", expireSession);
    const token = localStorage.getItem("dw_access_token");
    if (!token) {
      setReady(true);
      return () => window.removeEventListener("dw:session-expired", expireSession);
    }
    const expiresSoon = (() => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload.exp * 1000 < Date.now() + 30000;
      } catch { return false; }
    })();
    const refresh = expiresSoon && localStorage.getItem("dw_refresh_token")
      ? api.post("/auth/refresh", { refresh_token: localStorage.getItem("dw_refresh_token") }).then(({ data }) => {
          localStorage.setItem("dw_access_token", data.access_token);
          localStorage.setItem("dw_refresh_token", data.refresh_token);
          return data.access_token;
        })
      : Promise.resolve(token);
    refresh
      .then(() => api.get("/auth/me"))
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem("dw_access_token"); localStorage.removeItem("dw_refresh_token"); })
      .finally(() => setReady(true));
    return () => window.removeEventListener("dw:session-expired", expireSession);
  }, []);

  async function signIn(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("dw_access_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("dw_refresh_token", data.refresh_token);
    setUser(data.user);
    return data.user;
  }

  async function signUp(details) {
    const { data } = await api.post("/auth/register", details);
    if (data.access_token) {
      localStorage.setItem("dw_access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("dw_refresh_token", data.refresh_token);
      setUser(data.user);
    }
    return data;
  }

  function signOut() {
    localStorage.removeItem("dw_access_token");
    localStorage.removeItem("dw_refresh_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
