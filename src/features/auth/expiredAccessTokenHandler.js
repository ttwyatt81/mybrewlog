let nextSessionGeneration = 0;

export function createSessionGeneration() {
  let generation = ++nextSessionGeneration;
  const isCurrent = (candidate) => generation === candidate;

  return {
    advance() {
      generation = ++nextSessionGeneration;
      return generation;
    },
    current() {
      return generation;
    },
    isCurrent(candidate) {
      return isCurrent(candidate);
    },
    async refresh(currentSession, requestRefresh, getSession, saveSession) {
      const startedInGeneration = generation;
      const refreshed = await requestRefresh(currentSession.refresh_token);
      if (!isCurrent(startedInGeneration)) {
        return { session: null, errorType: "stale_session" };
      }
      if (!refreshed?.session) return refreshed;

      const latestSession = getSession();
      if (
        latestSession?.access_token === refreshed.session.access_token
        && latestSession?.refresh_token === refreshed.session.refresh_token
      ) {
        return { session: latestSession, errorType: null };
      }
      if (latestSession?.refresh_token !== currentSession.refresh_token) {
        return { session: null, errorType: "stale_session" };
      }

      const nextSession = {
        ...currentSession,
        ...refreshed.session,
        expires_at: Date.now() + (refreshed.session.expires_in || 0) * 1000
      };
      saveSession(nextSession);
      return { session: nextSession, errorType: null };
    }
  };
}

export function createExpiredAccessTokenHandler({ generation, getSession, refreshSession, clearSession }) {
  return async (rejectedToken, requestGeneration) => {
    if (!generation.isCurrent(requestGeneration)) return null;

    const currentSession = getSession();
    if (!currentSession?.refresh_token) return null;
    if (currentSession.access_token !== rejectedToken) return currentSession.access_token || null;

    const refreshed = await refreshSession(currentSession);
    if (!generation.isCurrent(requestGeneration)) return null;

    const latestSession = getSession();
    if (refreshed?.session?.access_token && latestSession?.access_token) {
      return latestSession.access_token;
    }

    if (refreshed?.errorType === "invalid_refresh_token" && latestSession?.refresh_token === currentSession.refresh_token) {
      clearSession();
    }
    return null;
  };
}

export function restoreStoredSessionState({
  generation,
  startedInGeneration,
  storedSession,
  refreshed,
  getSession,
  setAuthState,
  loadData,
  clearSession,
  setAuthCode,
}) {
  if (!generation.isCurrent(startedInGeneration)) return false;

  const currentSession = getSession();
  if (refreshed?.session) {
    if (
      currentSession?.access_token !== refreshed.session.access_token
      || currentSession?.refresh_token !== refreshed.session.refresh_token
    ) return false;

    setAuthState("app");
    loadData(refreshed.session.access_token);
    return true;
  }

  if (currentSession?.refresh_token !== storedSession.refresh_token) return false;
  if (refreshed?.errorType === "invalid_refresh_token") {
    clearSession();
  } else {
    setAuthState("login");
    setAuthCode("");
  }
  return true;
}