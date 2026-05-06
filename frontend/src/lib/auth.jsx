import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = guest, object = logged-in
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        setUser(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.access_token) localStorage.setItem("iw_token", data.access_token);
    setUser(data);
    return data;
  }

  async function register(payload) {
    await api.post("/auth/register", payload);
    // log in to get the access_token in the response body
    const loginRes = await api.post("/auth/login", {
      email: payload.email,
      password: payload.password,
    });
    if (loginRes.data.access_token) localStorage.setItem("iw_token", loginRes.data.access_token);
    setUser(loginRes.data);
    return loginRes.data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("iw_token");
    setUser(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
