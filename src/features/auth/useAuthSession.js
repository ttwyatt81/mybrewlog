import { useCallback, useEffect, useRef, useState } from "react";
import {
  sbSendOtp,
  sbVerifyOtp,
  sbSignOut,
  sbRefreshSession,
  sbGetUser,
  registerUnauthorizedRefreshHandler,
  shouldReportSignOutFailure,
} from "../../lib/supabase";
import {
  createExpiredAccessTokenHandler,
  createSessionGeneration,
  commitIfCurrent,
  coordinateSessionRefresh,
  createSessionDataCommitGuard,
  isCurrentOtpAttempt,
  reconcileExternalSession,
  restoreStoredSessionState,
} from "./expiredAccessTokenHandler.js";
import {
  SESSION_KEY,
  clearRestoreDiagnostics,
  inspectStoredSession,
  readRestoreDiagnostics,
  recordRestoreEvent,
  runRestoreAttempts,
} from "./sessionRestore.js";

const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";
const RESTORE_RESTART_MIN_MS = 1000;
const LAST_EMAIL_KEY = "last_auth_email";
const emptyAsyncList = async () => [];
const noop = () => {};
const SIGN_OUT_FAILURE_MESSAGE = "Signed out on this device, but server logout could not be confirmed.";

function readPersistedSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function useAuthSession({
  loadBrewsData,
  loadBeansData,
  loadGreenBeansData,
  loadRecipesData,
  loadRoastProfilesData,
  setBeans,
  setGreenBeans,
  setRecipes,
  setRoastProfiles,
  setBrews = noop,
  resetAccountUi = noop,
}) {
  const loadGreenBeans = typeof loadGreenBeansData === "function" ? loadGreenBeansData : emptyAsyncList;
  const loadRoastProfiles = typeof loadRoastProfilesData === "function" ? loadRoastProfilesData : emptyAsyncList;
  const clearGreenBeans = typeof setGreenBeans === "function" ? setGreenBeans : noop;
  const clearRoastProfiles = typeof setRoastProfiles === "function" ? setRoastProfiles : noop;
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  // restoring | restore_failed | login | verify | app
  const [authState, setAuthState] = useState(() => (
    inspectStoredSession().kind === "missing" ? "login" : "restoring"
  ));
  const authStateRef = useRef(authState);
  authStateRef.current = authState;
  const [restoreRetryCount, setRestoreRetryCount] = useState(0);
  const [restoreDiagnostics, setRestoreDiagnostics] = useState(() => readRestoreDiagnostics());
  const restoreRunRef = useRef(0);
  const restoreBusyRunRef = useRef(null);
  const lastRestoreStartRef = useRef(0);
  const startRestoreRef = useRef(() => {});
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const sessionGenerationRef = useRef(null);
  if (!sessionGenerationRef.current) sessionGenerationRef.current = createSessionGeneration();
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const userLoadInFlightRef = useRef({ token: null, promise: null });
  const activeSessionTokenRef = useRef(null);

  const loadCurrentUser = useCallback(async (token) => {
    const generation = sessionGenerationRef.current.current();
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
        if (sessionGenerationRef.current.isCurrent(generation) && activeSessionTokenRef.current === token) {
          setCurrentUser(user || null);
        }
        return user || null;
      } catch (error) {
        console.error("Failed to load authenticated user:", error);
        if (sessionGenerationRef.current.isCurrent(generation) && activeSessionTokenRef.current === token) {
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
    sessionRef.current = sessionData;
    setSession(sessionData);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }, []);

  const clearSession = useCallback(() => {
    sessionGenerationRef.current.advance();
    sessionRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setCurrentUser(null);
    setAuthState("login");
    setAuthCode("");
    setAuthError("");
    setAuthLoading(false);
    setBeans([]);
    setBrews([]);
    clearGreenBeans([]);
    setRecipes([]);
    clearRoastProfiles([]);
    resetAccountUi();
    setLoading(false);
  }, [clearGreenBeans, clearRoastProfiles, resetAccountUi, setAuthError, setAuthLoading, setBeans, setBrews, setRecipes]);

  const refreshSession = useCallback(async (currentSession) => {
    if (!currentSession?.refresh_token) return null;
    const generation = sessionGenerationRef.current;
    const requestGeneration = generation.current();
    return coordinateSessionRefresh({
      locks: globalThis.navigator?.locks,
      generation,
      requestGeneration,
      currentSession,
      getCurrentSession: () => sessionRef.current,
      getSharedSession: readPersistedSession,
      refresh: () => generation.refresh(
        currentSession,
        sbRefreshSession,
        () => sessionRef.current,
        saveSession,
        (candidate) => readPersistedSession()?.refresh_token === candidate.refresh_token
      ),
      adoptSession: (sharedSession) => {
        sessionRef.current = sharedSession;
        setSession(sharedSession);
        setAuthState("app");
      },
    });
  }, [saveSession]);

  const refreshRejectedAccessToken = useCallback(async (rejectedToken, requestGeneration) => {
    const handler = createExpiredAccessTokenHandler({
      generation: sessionGenerationRef.current,
      getSession: () => sessionRef.current,
      refreshSession,
      clearSession,
    });
    return handler(rejectedToken, requestGeneration);
  }, [clearSession, refreshSession]);

  useEffect(() => registerUnauthorizedRefreshHandler({
    getGeneration: () => sessionGenerationRef.current.current(),
    getAccessToken: () => sessionRef.current?.access_token || null,
    refresh: refreshRejectedAccessToken,
  }), [refreshRejectedAccessToken]);

  const getValidAccessToken = useCallback(async () => {
    if (session?.access_token && session?.expires_at && Date.now() < session.expires_at - 60000) {
      return { token: session.access_token, errorType: null };
    }
    const refreshed = await refreshSession(session);
    return { token: refreshed?.session?.access_token || null, errorType: refreshed?.errorType || null };
  }, [refreshSession, session]);

  const ensureValidAccessToken = useCallback(async () => {
    const generation = sessionGenerationRef.current.current();
    const refreshToken = sessionRef.current?.refresh_token;
    const result = await getValidAccessToken();
    if (
      !result?.token
      && result?.errorType === "invalid_refresh_token"
      && sessionGenerationRef.current.isCurrent(generation)
      && sessionRef.current?.refresh_token === refreshToken
      && readPersistedSession()?.refresh_token === refreshToken
    ) {
      clearSession();
    }
    return result;
  }, [clearSession, getValidAccessToken]);

  const loadData = useCallback(async (token, generation = sessionGenerationRef.current.current()) => {
    const canCommit = createSessionDataCommitGuard(
      sessionGenerationRef.current,
      generation,
      token,
      () => sessionRef.current
    );
    if (!commitIfCurrent(canCommit, () => setLoading(true))) return;
    try {
      const brewRows = await loadBrewsData(token, canCommit);
      if (!canCommit()) return;
      await loadBeansData(token, brewRows, canCommit);
      if (!canCommit()) return;
      await loadGreenBeans(token, canCommit);
      if (!canCommit()) return;
      await loadRecipesData(token, canCommit);
      if (!canCommit()) return;
      await loadRoastProfiles(token, canCommit);
    } catch (e) {
      console.error("Load data error:", e);
    } finally {
      commitIfCurrent(canCommit, () => setLoading(false));
    }
  }, [loadBeansData, loadBrewsData, loadGreenBeans, loadRecipesData, loadRoastProfiles]);

  useEffect(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (lastEmail) setAuthEmail(lastEmail);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== SESSION_KEY) return;

      let nextSession;
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        nextSession = stored ? JSON.parse(stored) : null;
      } catch {
        nextSession = null;
      }

      reconcileExternalSession({
        generation: sessionGenerationRef.current,
        currentSession: sessionRef.current,
        nextSession,
        onRotation: (rotatedSession) => {
          sessionRef.current = rotatedSession;
          setSession(rotatedSession);
          setAuthState("app");
        },
        onAccountChange: (newSession, generation) => {
          sessionRef.current = newSession;
          setCurrentUser(null);
          setSession(newSession);
          setAuthState("app");
          setAuthCode("");
          setAuthError("");
          setAuthLoading(false);
          setBeans([]);
          setBrews([]);
          clearGreenBeans([]);
          setRecipes([]);
          clearRoastProfiles([]);
          resetAccountUi();
          loadData(newSession.access_token, generation);
        },
        onSignOut: clearSession,
      });
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearGreenBeans, clearRoastProfiles, clearSession, loadData, resetAccountUi, setBeans, setBrews, setRecipes]);

  useEffect(() => {
    const token = session?.access_token || null;
    activeSessionTokenRef.current = token;
    if (!token) {
      setCurrentUser(null);
      return;
    }
    loadCurrentUser(token);
  }, [loadCurrentUser, session?.access_token]);

  const recordRestore = useCallback((entry) => {
    setRestoreDiagnostics(recordRestoreEvent(entry));
  }, []);

  const clearDiagnostics = useCallback(() => setRestoreDiagnostics(clearRestoreDiagnostics()), []);

  const startRestore = useCallback(async (phase) => {
    // A refresh request is already in flight; its run will finish or fail on its own.
    if (phase !== "startup" && restoreBusyRunRef.current !== null) return;
    lastRestoreStartRef.current = Date.now();
    const inspected = inspectStoredSession();
    if (inspected.kind !== "ok") {
      restoreRunRef.current += 1;
      recordRestore({
        phase,
        category: inspected.kind === "missing" ? "missing_session" : "malformed_session",
        retries: 0,
        hadTokens: false,
      });
      if (inspected.kind === "malformed") clearSession();
      else setAuthState("login");
      return;
    }

    const storedSession = inspected.session;
    const validAccess = storedSession.access_token && storedSession.expires_at && Date.now() < storedSession.expires_at - 60000;
    if (validAccess) {
      restoreRunRef.current += 1;
      sessionRef.current = storedSession;
      setSession(storedSession);
      setAuthState("app");
      loadData(storedSession.access_token);
      return;
    }

    if (!storedSession.refresh_token) {
      restoreRunRef.current += 1;
      recordRestore({ phase, category: "malformed_session", retries: 0, hadTokens: true });
      clearSession();
      return;
    }

    const runId = ++restoreRunRef.current;
    const generation = sessionGenerationRef.current.current();
    sessionRef.current = storedSession;
    setRestoreRetryCount(0);
    setAuthState("restoring");
    const outcome = await runRestoreAttempts({
      refresh: async () => {
        restoreBusyRunRef.current = runId;
        try {
          return await refreshSession(storedSession);
        } finally {
          if (restoreBusyRunRef.current === runId) restoreBusyRunRef.current = null;
        }
      },
      isCurrent: () => restoreRunRef.current === runId && sessionGenerationRef.current.isCurrent(generation),
      phase,
      record: recordRestore,
      onRetry: setRestoreRetryCount,
    });
    if (outcome.status === "stale") return;

    const applied = restoreStoredSessionState({
      generation: sessionGenerationRef.current,
      startedInGeneration: generation,
      storedSession,
      refreshed: outcome.result,
      getSession: () => sessionRef.current,
      setAuthState,
      loadData,
      clearSession,
      setAuthCode,
      setAuthLoading,
    });
    if (applied && outcome.status === "invalid") setAuthError(SESSION_EXPIRED_MESSAGE);
  }, [clearSession, loadData, recordRestore, refreshSession]);
  startRestoreRef.current = startRestore;

  useEffect(() => {
    startRestoreRef.current("startup");
    return () => { restoreRunRef.current += 1; };
  }, []);

  // iPhone suspends timers and network in the background; retry on resume/reconnect.
  useEffect(() => {
    if (authState !== "restoring" && authState !== "restore_failed") return;
    const resume = (phase) => () => {
      if (document.visibilityState === "hidden") return;
      if (Date.now() - lastRestoreStartRef.current < RESTORE_RESTART_MIN_MS) return;
      startRestoreRef.current(phase);
    };
    const onVisible = resume("resume");
    const onOnline = resume("online");
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [authState]);

  const retryRestore = useCallback(() => startRestoreRef.current("manual"), []);

  const abandonRestore = useCallback(() => {
    restoreRunRef.current += 1;
    setAuthError("");
    setAuthState("login");
  }, []);

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
    const startedInGeneration = sessionGenerationRef.current.current();
    const startingRefreshToken = sessionRef.current?.refresh_token || null;
    setAuthLoading(true);
    setAuthError("");
    const cleanEmail = authEmail.trim();
    const { ok, error } = await sbSendOtp(cleanEmail);
    if (!isCurrentOtpAttempt({
      generation: sessionGenerationRef.current,
      startedInGeneration,
      expectedAuthState: "login",
      getAuthState: () => authStateRef.current,
      startingRefreshToken,
      getRefreshToken: () => sessionRef.current?.refresh_token || null,
    })) return;
    if (ok) {
      setAuthState("verify");
    } else {
      setAuthError(error || "Could not send code. Check your email address.");
    }
    localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
    setAuthLoading(false);
  }, [authEmail]);

  const handleVerifyOtp = useCallback(async () => {
    if (!/^\d{8}$/.test(authCode)) return;
    const startedInGeneration = sessionGenerationRef.current.current();
    const startingRefreshToken = sessionRef.current?.refresh_token || null;
    setAuthLoading(true);
    setAuthError("");
    const cleanEmail = authEmail.trim();
    const data = await sbVerifyOtp(cleanEmail, authCode.trim());
    if (!isCurrentOtpAttempt({
      generation: sessionGenerationRef.current,
      startedInGeneration,
      expectedAuthState: "verify",
      getAuthState: () => authStateRef.current,
      startingRefreshToken,
      getRefreshToken: () => sessionRef.current?.refresh_token || null,
    })) return;
    if (data) {
      const sess = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in || 0) * 1000,
        email: cleanEmail
      };
      localStorage.setItem(LAST_EMAIL_KEY, cleanEmail);
      sessionGenerationRef.current.advance();
      saveSession(sess);
      setAuthState("app");
      loadData(data.access_token);
    } else {
      setAuthError("Invalid code. Please try again.");
    }
    setAuthLoading(false);
  }, [authCode, authEmail, loadData, saveSession]);

  const handleSignOut = useCallback(async () => {
    const accessToken = session?.access_token;
    clearSession();
    if (!accessToken) return;

    const logoutGeneration = sessionGenerationRef.current.current();
    const result = await sbSignOut(accessToken);
    if (shouldReportSignOutFailure({
      result,
      generationIsCurrent: sessionGenerationRef.current.isCurrent(logoutGeneration),
      hasSession: Boolean(sessionRef.current),
    })) {
      setAuthError(SIGN_OUT_FAILURE_MESSAGE);
    }
  }, [clearSession, session]);

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
    restoreRetryCount,
    restoreDiagnostics,
    clearDiagnostics,
    retryRestore,
    abandonRestore,
  };
}
