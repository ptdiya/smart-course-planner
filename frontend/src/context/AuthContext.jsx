import { useMemo, useState } from "react";
import AuthContext from "./authContext";
const STORAGE_KEY = "pathwise-session";

function getStoredSession() {
  const storedSession = localStorage.getItem(STORAGE_KEY);

  if (!storedSession) {
    return { user: null, role: null };
  }

  try {
    const session = JSON.parse(storedSession);
    return {
      user: session.user ?? null,
      role: session.role ?? null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { user: null, role: null };
  }
}

export function AuthProvider({ children }) {
  const [{ user, role }, setSession] = useState(getStoredSession);

  function login(nextUser, nextRole) {
    const session = { user: nextUser, role: nextRole };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setSession(session);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession({ user: null, role: null });
  }

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user && role),
      login,
      logout,
    }),
    [user, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
