export default function AuthView({
  authState,
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
  return (
    <div style={{ minHeight: "100vh", background: "#0c0905", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(110,55,8,0.18) 0%, transparent 55%)", fontFamily: "'DM Sans', sans-serif", color: "#f0e6d3", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", marginBottom: "6px" }}>Bean & Brew</div>
          <div style={{ fontSize: "10px", color: "#c3aa90", letterSpacing: "0.2em", textTransform: "uppercase" }}>Coffee Journal</div>
        </div>

        {authState === "login" && (
          <div>
            <div style={{ fontSize: "14px", color: "#d0b69a", marginBottom: "20px", textAlign: "center" }}>
              Enter your email — we'll send you a 8-digit code
            </div>
            <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendOtp()} placeholder="your@email.com" type="email" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "9px", color: "#f0e6d3", padding: "13px 16px", fontSize: "15px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "12px" }} />
            {authError && <div style={{ color: "#c87060", fontSize: "13px", marginBottom: "10px" }}>{authError}</div>}
            <button onClick={handleSendOtp} disabled={authLoading || !authEmail.trim()} style={{ width: "100%", background: authEmail.trim() ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.2)", border: "none", borderRadius: "9px", color: authEmail.trim() ? "#fff" : "#c3aa90", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: authEmail.trim() ? "pointer" : "not-allowed" }}>
              {authLoading ? "Sending…" : "Send Code"}
            </button>
          </div>
        )}

        {authState === "verify" && (
          <div>
            <div style={{ fontSize: "14px", color: "#d0b69a", marginBottom: "6px", textAlign: "center" }}>
              We sent a 8-digit code to
            </div>
            <div style={{ fontSize: "14px", color: "#c8a060", marginBottom: "24px", textAlign: "center", fontWeight: "500" }}>{authEmail}</div>
            <input value={authCode} onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, "").slice(0, 8))} onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()} placeholder="12345678" type="text" maxLength={8} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,137,58,0.3)", borderRadius: "9px", color: "#f0e6d3", padding: "13px 16px", fontSize: "28px", outline: "none", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "12px", letterSpacing: "0.4em", textAlign: "center" }} />
            {authError && <div style={{ color: "#c87060", fontSize: "13px", marginBottom: "10px", textAlign: "center" }}>{authError}</div>}
            <button onClick={handleVerifyOtp} disabled={authLoading || authCode.length < 6} style={{ width: "100%", background: authCode.length >= 6 ? "linear-gradient(135deg,#c8893a,#a06828)" : "rgba(200,137,58,0.2)", border: "none", borderRadius: "9px", color: authCode.length >= 6 ? "#fff" : "#c3aa90", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: authCode.length >= 6 ? "pointer" : "not-allowed", marginBottom: "12px" }}>
              {authLoading ? "Verifying…" : "Sign In"}
            </button>
            <button onClick={() => { setAuthState("login"); setAuthCode(""); setAuthError(""); }} style={{ width: "100%", background: "none", border: "none", color: "#c3aa90", cursor: "pointer", fontSize: "13px", padding: "8px" }}>
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
