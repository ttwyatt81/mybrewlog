export default function AppShell({
  view,
  tab,
  setTab,
  setView,
  canLogBrew,
  onLogBrew,
  canLogRoast,
  onLogRoast,
  userEmail,
  onSync,
  onSignOut,
  loading,
  children,
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#0c0905", backgroundImage: "radial-gradient(ellipse at 15% 15%, rgba(110,55,8,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(50,25,3,0.25) 0%, transparent 55%)", fontFamily: "'DM Sans', sans-serif", color: "#f6eee0" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />

      <div style={{ borderBottom: "1px solid rgba(200,137,58,0.13)", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(12,9,5,0.93)", backdropFilter: "blur(14px)", zIndex: 10 }}>
        <div style={{ display: "flex" }}>
          {view === "beans" && [{ id: "beans", label: "Roasted Beans" }, { id: "greenBeans", label: "Green Beans" }, { id: "roastProfiles", label: "Roast Profiles" }, { id: "recipes", label: "Recipes" }, { id: "brews", label: "Brews" }].map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ padding: "14px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === item.id ? "#c8893a" : "transparent"}`, color: tab === item.id ? "#e2bc7f" : "#c2a587", cursor: "pointer", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", marginBottom: "-1px" }}>
              {item.label}
            </button>
          ))}
          {view !== "beans" && (
            <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
              <button onClick={() => setView("beans")} style={{ background: "none", border: "none", color: "#ccb396", cursor: "pointer", fontSize: "13px", padding: "14px 8px" }}>← Back</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {canLogRoast && (
            <button onClick={onLogRoast}
              style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Log Roast
            </button>
          )}
          {canLogBrew && (
            <button onClick={onLogBrew}
              style={{ background: "linear-gradient(135deg,#c8893a,#a06828)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 15px", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap" }}>
              + Log Brew
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px" }}>
            <div style={{ fontSize: "10px", color: "#d0b59a", letterSpacing: "0.03em", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={onSync} disabled={loading} style={{ background: "none", border: "none", color: loading ? "#d4c6b2" : "#c6a98c", cursor: loading ? "not-allowed" : "pointer", fontSize: "10px", padding: 0, letterSpacing: "0.05em", textDecoration: "underline" }}>Sync</button>
              <button onClick={onSignOut} style={{ background: "none", border: "none", color: "#c6a98c", cursor: "pointer", fontSize: "10px", padding: 0, letterSpacing: "0.05em" }}>Sign out</button>
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
