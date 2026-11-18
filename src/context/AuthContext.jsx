"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_LOGOUT_EVENT, tokenStorage } from "@/services/apiClient";
import * as authService from "@/services/authService";

const AuthContext = createContext(null);
const PROFILE_KEY = "alhanna_admin_profile";

// Cached profile so a refresh renders immediately while the token is re-checked.
const profileStorage = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    } catch {
      return null;
    }
  },
  set: (p) => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch {
      /* storage full or blocked: not critical */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* ignore */
    }
  },
};

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  // "checking" -> first look at storage; "ready" -> decided; "offline" -> have a token but the API can't be reached
  const [status, setStatus] = useState("checking");

  const verify = useCallback(async () => {
    if (!tokenStorage.get()) {
      setAdmin(null);
      setStatus("ready");
      return;
    }
    try {
      const { data } = await authService.getMe();
      setAdmin(data);
      profileStorage.set(data);
      setStatus("ready");
    } catch (err) {
      if (err.status === 401) {
        // Token really is invalid or expired: sign out.
        tokenStorage.clear();
        profileStorage.clear();
        setAdmin(null);
        setStatus("ready");
      } else {
        // Server down, restarting, or network blip: keep the session, try again later.
        setStatus((s) => (s === "ready" && profileStorage.get() ? "ready" : "offline"));
      }
    }
  }, []);

  useEffect(() => {
    // Show the cached profile at once if we still hold a token, then verify it.
    const cached = tokenStorage.get() ? profileStorage.get() : null;
    if (cached) {
      // localStorage is only readable after hydration, so this must run in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdmin(cached);
      setStatus("ready");
    }
    verify();

    const onLogout = () => {
      profileStorage.clear();
      setAdmin(null);
      setStatus("ready");
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  }, [verify]);

  // While offline, retry every few seconds and whenever the tab regains focus or the network returns.
  useEffect(() => {
    if (status !== "offline") return;
    const t = setInterval(verify, 5000);
    window.addEventListener("online", verify);
    window.addEventListener("focus", verify);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", verify);
      window.removeEventListener("focus", verify);
    };
  }, [status, verify]);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password);
    tokenStorage.set(data.token);
    profileStorage.set(data.admin);
    setAdmin(data.admin);
    setStatus("ready");
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    profileStorage.clear();
    setAdmin(null);
    setStatus("ready");
  }, []);

  const value = useMemo(
    () => ({ admin, loading: status === "checking", offline: status === "offline", retry: verify, login, logout }),
    [admin, status, verify, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
