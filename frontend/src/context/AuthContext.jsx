import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthContext from "./authContext";

const STORAGE_KEY = "pathwise-session";
const INACTIVITY_MESSAGE_KEY = "pathwise-inactivity-message";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const INACTIVITY_WARNING_SECONDS = 60;
const INACTIVITY_WARNING_MS = INACTIVITY_WARNING_SECONDS * 1000;
const INACTIVITY_WARNING_DELAY_MS = INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS;
const ACTIVITY_EVENTS = ["click", "keydown", "scroll", "touchstart"];

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
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(INACTIVITY_WARNING_SECONDS);
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isAuthenticated = Boolean(user && role);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowInactivityWarning(false);
    setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
    setSession({ user: null, role: null });
  }, []);

  function login(nextUser, nextRole) {
    const session = { user: nextUser, role: nextRole };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setShowInactivityWarning(false);
    setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
    setSession(session);
  }

  function logout() {
    clearSession();
  }

  const clearInactivityTimers = useCallback(() => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const handleInactiveLogout = useCallback(() => {
    clearInactivityTimers();
    clearSession();
    localStorage.setItem(
      INACTIVITY_MESSAGE_KEY,
      "You were logged out due to inactivity.",
    );
    setSession({ user: null, role: null });

    if (window.location.pathname !== "/") {
      window.location.assign("/");
    }
  }, [clearInactivityTimers, clearSession]);

  const startInactivityWarning = useCallback(() => {
    setShowInactivityWarning(true);
    setInactivityCountdown(INACTIVITY_WARNING_SECONDS);

    countdownTimerRef.current = window.setInterval(() => {
      setInactivityCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    logoutTimerRef.current = window.setTimeout(
      handleInactiveLogout,
      INACTIVITY_WARNING_MS,
    );
  }, [handleInactiveLogout]);

  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated || window.location.pathname === "/") {
      clearInactivityTimers();
      setShowInactivityWarning(false);
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      return;
    }

    clearInactivityTimers();
    setShowInactivityWarning(false);
    setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
    warningTimerRef.current = window.setTimeout(
      startInactivityWarning,
      INACTIVITY_WARNING_DELAY_MS,
    );
  }, [clearInactivityTimers, isAuthenticated, startInactivityWarning]);

  useEffect(() => {
    if (!isAuthenticated || window.location.pathname === "/") {
      clearInactivityTimers();
      setShowInactivityWarning(false);
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      return undefined;
    }

    resetInactivityTimer();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    return () => {
      clearInactivityTimers();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [clearInactivityTimers, isAuthenticated, resetInactivityTimer]);

  useEffect(() => {
    if (showInactivityWarning && inactivityCountdown === 0) {
      handleInactiveLogout();
    }
  }, [handleInactiveLogout, inactivityCountdown, showInactivityWarning]);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      login,
      logout,
    }),
    [user, role, isAuthenticated],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showInactivityWarning && (
        <div className="inactivity-modal-backdrop" role="presentation">
          <div
            className="inactivity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inactivity-modal-title"
          >
            <h2 id="inactivity-modal-title">Session timeout warning</h2>
            <p>
              You will be logged out in <strong>{inactivityCountdown}</strong>{" "}
              seconds due to inactivity.
            </p>
            <button type="button" onClick={resetInactivityTimer}>
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
