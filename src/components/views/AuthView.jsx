import RestoreDiagnostics from "../ui/RestoreDiagnostics";

export default function AuthView({
  authState,
  restoreRetryCount = 0,
  restoreDiagnostics = [],
  clearDiagnostics,
  retryRestore,
  abandonRestore,
  authEmail,
  setAuthEmail,
  authCode,
  setAuthCode,
  authError,
  authLoading,
  handleSendOtp,
  handleVerifyOtp,
  setAuthState,
  setAuthError,
}) {
  const restoreRejected = restoreDiagnostics[restoreDiagnostics.length - 1]?.category === "request_rejected";
  return (
    <div className="mbl-auth-page">
      <main className="mbl-auth-content">
        <header className="mbl-auth-brand">
          <div className="mbl-wordmark">WyattCoffeeLab</div>
          <div className="mbl-label">Coffee Journal</div>
        </header>

        {authState === "restoring" && (
          <div className="mbl-auth-status" role="status">
            <span className="mbl-auth-spinner" aria-hidden="true">⟳</span>
            <span>Restoring your session…</span>
            {restoreRetryCount > 0 && (
              <div className="mbl-auth-status-detail">Connection is slow — retrying ({restoreRetryCount})</div>
            )}
          </div>
        )}

        {authState === "restore_failed" && (
          <div className="mbl-auth-state">
            <h1 className="mbl-title">{restoreRejected ? "We couldn’t restore your session." : "Can't reach the server right now."}</h1>
            <p>{restoreRejected ? "Your saved sign-in is kept on this device. You can try again or sign in with email." : "Your saved sign-in is kept on this device. We'll retry when you're back online."}</p>
            <button className="mbl-auth-primary" onClick={retryRestore}>Try again</button>
            <button className="mbl-auth-secondary" onClick={abandonRestore}>Sign in with email instead</button>
          </div>
        )}

        {authState === "login" && (
          <div className="mbl-auth-state">
            <h1 className="mbl-title">Sign in</h1>
            <p className="mbl-auth-prompt">
              Enter your email — we'll send you an eight-digit code
            </p>
            <input className="mbl-auth-field" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendOtp()} placeholder="your@email.com" type="email" />
            {authError && <div className="mbl-auth-error">{authError}</div>}
            <button className="mbl-auth-primary" onClick={handleSendOtp} disabled={authLoading || !authEmail.trim()}>
              {authLoading ? "Sending…" : "Send Code"}
            </button>
          </div>
        )}

        {authState === "verify" && (
          <div className="mbl-auth-state">
            <h1 className="mbl-title">Enter your code</h1>
            <p className="mbl-auth-prompt">
              We sent an eight-digit code to
            </p>
            <div className="mbl-auth-email">{authEmail}</div>
            <input className="mbl-auth-field mbl-auth-code" value={authCode} onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, "").slice(0, 8))} onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()} placeholder="12345678" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} />
            {authError && <div className="mbl-auth-error">{authError}</div>}
            <button className="mbl-auth-primary" onClick={handleVerifyOtp} disabled={authLoading || !/^\d{8}$/.test(authCode)}>
              {authLoading ? "Verifying…" : "Sign In"}
            </button>
            <button className="mbl-auth-secondary" onClick={() => { setAuthState("login"); setAuthCode(""); setAuthError(""); }}>
              ← Use a different email
            </button>
          </div>
        )}

        <RestoreDiagnostics entries={restoreDiagnostics} onClear={clearDiagnostics} />
      </main>
    </div>
  );
}
