import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "msd_token";

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));

  function setToken(tokenValue) {
    if (tokenValue) {
      localStorage.setItem(TOKEN_KEY, tokenValue);
      setTokenState(tokenValue);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
    }
  }

  function logout() {
    setToken(null);
  }

  const value = useMemo(() => ({ token, setToken, logout }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}