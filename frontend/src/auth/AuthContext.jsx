import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "msd_token";

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(false);

  function setToken(tokenValue) {
    if (tokenValue) {
      localStorage.setItem(TOKEN_KEY, tokenValue);
      setTokenState(tokenValue);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setMe(null);
    }
  }

  function logout() {
    setToken(null);
  }

  // Fetch /me whenever token changes
  useEffect(() => {
    async function fetchMe() {
      if (!token) {
        setMe(null);
        return;
      }

      setLoadingMe(true);
      try {
        const user = await apiFetch("/api/users/me", { token });
        setMe(user);
      } catch (e) {
        // token invalid/expired -> clean logout
        setMe(null);
        localStorage.removeItem(TOKEN_KEY);
        setTokenState(null);
      } finally {
        setLoadingMe(false);
      }
    }

    fetchMe();
  }, [token]);

  const value = useMemo(
    () => ({ token, setToken, logout, me, loadingMe }),
    [token, me, loadingMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}