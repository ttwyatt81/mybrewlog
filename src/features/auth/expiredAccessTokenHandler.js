let nextSessionGeneration = 0;

function sessionIdentity(session) {
  if (!session) return null;
  if (session.user?.id) return `user:${session.user.id}`;

  try {
    const payload = session.access_token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(paddedPayload));
    if (claims.sub) return `user:${claims.sub}`;
  } catch {
    // Fall back to the email saved with OTP sessions.
  }

  const email = String(session.email || "").trim().toLowerCase();
  return email ? `email:${email}` : null;
}

export function sameSessionIdentity(left, right) {
  const leftIdentity = sessionIdentity(left);
  return Boolean(leftIdentity && leftIdentity === sessionIdentity(right));
}

export function commitIfCurrent(canCommit, commit) {
  if (!canCommit()) return false;
  commit();
  return true;
}

export function createSessionDataCommitGuard(generation, generationId, requestToken, getCurrentSession) {
  return () => generation.isCurrent(generationId)
    && sameSessionIdentity({ access_token: requestToken }, getCurrentSession());
}

export async function coordinateSessionRefresh({
  locks,
  generation,
  requestGeneration,
  currentSession,
  getCurrentSession,
  getSharedSession,
  refresh,
  adoptSession,
}) {
  const run = async () => {
    if (!generation.isCurrent(requestGeneration)) return { session: null, errorType: "stale_session" };

    const sharedSession = getSharedSession();
    if (!sharedSession?.access_token || !sharedSession?.refresh_token) {
      return { session: null, errorType: "stale_session" };
    }

    if (sharedSession.refresh_token !== currentSession.refresh_token) {
      if (
        !sameSessionIdentity(sharedSession, currentSession)
        || (getCurrentSession() && !sameSessionIdentity(getCurrentSession(), currentSession))
      ) return { session: null, errorType: "stale_session" };

      adoptSession(sharedSession);
      return { session: sharedSession, errorType: null };
    }

    return refresh();
  };

  if (locks?.request) {
    return locks.request("mybrewlog-session-refresh", run);
  }
  return run();
}

export function reconcileExternalSession({ generation, currentSession, nextSession, onRotation, onAccountChange, onSignOut }) {
  if (!nextSession?.access_token || !nextSession?.refresh_token) {
    generation.advance();
    onSignOut();
    return "signed-out";
  }

  const currentIdentity = sessionIdentity(currentSession);
  const nextIdentity = sessionIdentity(nextSession);
  if (currentIdentity && currentIdentity === nextIdentity) {
    onRotation(nextSession);
    return "rotated";
  }

  const nextGeneration = generation.advance();
  onAccountChange(nextSession, nextGeneration);
  return "account-changed";
}

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
    async refresh(currentSession, requestRefresh, getSession, saveSession, isSharedSessionCurrent = () => true) {
      const startedInGeneration = generation;
      const refreshed = await requestRefresh(currentSession.refresh_token);
      if (!isCurrent(startedInGeneration)) {
        return { session: null, errorType: "stale_session" };
      }
      if (!refreshed?.session) {
        return isSharedSessionCurrent(currentSession)
          ? refreshed
          : { session: null, errorType: "stale_session" };
      }

      const latestSession = getSession();
      if (
        latestSession?.access_token === refreshed.session.access_token
        && latestSession?.refresh_token === refreshed.session.refresh_token
        && isSharedSessionCurrent(refreshed.session)
      ) {
        return { session: latestSession, errorType: null };
      }
      if (latestSession?.refresh_token !== currentSession.refresh_token || !isSharedSessionCurrent(currentSession)) {
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
  setAuthLoading = () => {},
}) {
  if (!generation.isCurrent(startedInGeneration)) return false;

  const currentSession = getSession();
  if (refreshed?.session) {
    if (
      currentSession?.access_token !== refreshed.session.access_token
      || currentSession?.refresh_token !== refreshed.session.refresh_token
    ) return false;

    setAuthState("app");
    setAuthLoading(false);
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

export function isCurrentOtpAttempt({
  generation,
  startedInGeneration,
  expectedAuthState,
  getAuthState,
  startingRefreshToken,
  getRefreshToken,
}) {
  return generation.isCurrent(startedInGeneration)
    && getAuthState() === expectedAuthState
    && getRefreshToken() === startingRefreshToken;
}