import { useCallback, useEffect, useRef, useState } from "react";
import {
  sbSendOtp,
  sbVerifyOtp,
  sbSignOut,
  sbRefreshSession,
  sbGetUser
} from "../../lib/supabase";

const SESSION_KEY = "sb_session";
const LAST_EMAIL_KEY = "last_auth_email";

export function useAuthSession({
  loadBrewsData,
  loadBeansData,
  loadRecipesData,
  setBeans,
  setRecipes,
}) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authState, setAuthState] = useState("login"); // login | verify | app
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const userLoadInFlightRef = useRef({ token: null, promise: null });
  const activeSessionTokenRef = useRef(null);

  const loadCurrentUser = useCallback(async (token) => {
    if (!token) {
      setCurrentUser(null);
      userLoadInFlightRef.current = { token: null, promise: null };
      return null;
    }

    const inflight = userLoadInFlightRef.current;
    if (inflight.promise && inflight.token === token) {
      return inflight.promise;
    }

    const promise = (async () => {
      try {
        const user = await sbGetUser(token);
        if (activeSessionTokenRef.current === token) {
          setCurrentUser(user || null);
        }
        return user || null;
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        if (activeSessionTokenRef.current === token) {
          setCurrentUser(null);
        }
        return null;
      } finally {
        if (userLoadInFlightRef.current.token === token) {
          userLoadInFlightRef.current = { token: null, promise: null };
        }
      }
    })();

    userLoadInFlightRef.current = { token, promise };
    return promise;
  }, []);

  const saveSession = useCallback((sessionData) => {
    setSession(sessionData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setCurrentUser(null);
    setAuthState("login");
    setAuthCode("");
  }, []);

  const refreshSession = useCallback(async (currentSession) => {
    if (!currentSession?.refresh_token) return null;
    const { session: refreshed, errorType } = await sbRefreshSession(currentSession.refresh_token);
    if (!refreshed) return { session: null, errorType: errorType || "refresh_failed" };

    const nextSession = {
      ...currentSession,
      ...refreshed,
      expires_at: Date.now() + (refreshed.expires_in || 0) * 1000
    };

    saveSession(nextSession);
    return { session: nextSession, errorType: null };
  }, [saveSession]);

  const getValidAccessToken = useCallback(async () => {
    if (session?.access_token && session?.expires_at && Date.now() < session.expires_at - 60000) {
      return { token: session.access_token, errorType: null };
    }
    const refreshed = await refreshSession(session);
    return { token: refreshed?.session?.access_token || null, errorType: refreshed?.errorType || null };
  }, [refreshSession, session]);

  const ensureValidAccessToken = useCallback(async () => {
    const result = await getValidAccessToken();
    if (!result?.token && result?.errorType === "invalid_refresh_token") {
      clearSession();
    }
    return result;
  }, [clearSession, getValidAccessToken]);

  const loadData = useCallback(async (token) => {
    setLoading(true);
    try {
      const brewRows = await loadBrewsData(token);
      await loadBeansData(token, brewRows);
      await loadRecipesData(token);
    } catch (e) {
      console.error("Load data error:", e);
    }
    setLoading(false);
  }, [loadBeansData, loadBrewsData, loadRecipesData]);

  useEffect(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (lastEmail) setAuthEmail(lastEmail);
  }, []);

  useEffect(() => {
    const token = session?.access_token || null;
    activeSessionTokenRef.current = token;
    if (!token) {
      setCurrentUser(null);
      return;
    }
    loadCurrentUser(token);
  }, [loadCurrentUser, session?.access_token]);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;

    try {
      const storedSession = JSON.parse(stored);
      const validAccess = storedSession?.access_token && storedSession?.expires_at && Date.now() < storedSession.expires_at - 60000;

      if (validAccess) {
        setSession(storedSession);
        setAuthState("app");
        loadData(storedSession.access_token);
        return;
      }

      if (storedSession?.refresh_token) {
        (async () => {
          const refreshed = await refreshSession(storedSession);
          if (refreshed?.session) {
            setAuthState("app");
            loadData(refreshed.session.access_token);
          } else if (refreshed?.errorType === "invalid_refresh_token") {
            clearSession();
          } else {
            // Keep remembered email and allow retry later instead of forcing full logout.
            setAuthState("login");
            setAuthCode("");
          }
        })();
        return;
      }

      clearSession();
    } catch {
      clearSession();
    }
  }, [clearSession, loadData, refreshSession]);

  // Sync when app regains focus (multi-device sync)
  useEffect(() => {
    if (!session) return;
    const handleFocus = async () => {
      const { token } = await ensureValidAccessToken();
      if (token) {
        loadData(token);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [ensureValidAccessToken, loadData, session]);

  useEffect(() => {
    if (!session?.expires_at || !session?.refresh_token) return;

    const refreshDelayMs = Math.max(5000, session.expires_at - Date.now() - 30000);
    const timer = window.setTimeout(() => {
      ensureValidAccessToken();
    }, refreshDelayMs);

    return () => window.clearTimeout(timer);
  }, [ensureValidAccessToken, session?.expires_at, session?.refresh_token]);

  const handleSendOtp = useCallback(async () => {
    if (!authEmail.trim()) return;
    setAuthLoading(true);
    setAuthError("");
    const cleanEmail = authEmail.trim();
    const { ok, error } = await sbSendOtp(cleanEmail);
    if (ok) {
      setAuthState("verify");
    } else {
      setAuthError(error || "Could not send code. Check your email address.");
    }
    localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
    setAuthLoading(false);
  }, [authEmail]);

  const handleVerifyOtp = useCallback(async () => {
    if (authCode.length < 6) return; // allow 6-8 digits
    setAuthLoading(true);
    setAuthError("");
    const cleanEmail = authEmail.trim();
    const data = await sbVerifyOtp(cleanEmail, authCode.trim());
    if (data) {
      const sess = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 0) * 1000,
        email: cleanEmail
      };
      localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
      saveSession(sess);
      setAuthState("app");
      loadData(data.access_token);
    } else {
      setAuthError("Invalid code. Please try again.");
    }
    setAuthLoading(false);
  }, [authCode, authEmail, loadData, saveSession]);

  const handleSignOut = useCallback(async () => {
    if (session) await sbSignOut(session.access_token);
    clearSession();
    setBeans([]);
    setRecipes([]);
  }, [clearSession, session, setBeans, setRecipes]);

  return {
    session,
    currentUser,
    authState,
    authEmail,
    setAuthEmail,
    authCode,
    setAuthCode,
    authError,
    setAuthError,
    authLoading,
    loading,
    setLoading,
    loadData,
    ensureValidAccessToken,
    handleSendOtp,
    handleVerifyOtp,
    setAuthState,
    handleSignOut,
  };
}
