import { useEffect, useRef, useState } from "react";
import RestoreDiagnostics from "../ui/RestoreDiagnostics";

const TABS = [
  { id: "beans", label: "Roasted Beans" },
  { id: "greenBeans", label: "Green Beans" },
  { id: "roastProfiles", label: "Roast Profiles" },
  { id: "recipes", label: "Recipes" },
];

export default function AppShell({
  view,
  tab,
  setTab,
  setView,
  onBack,
  isDetailView = false,
  userEmail,
  onSync,
  onSignOut,
  restoreDiagnostics = [],
  onClearDiagnostics,
  loading,
  children,
}) {
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    menuRef.current?.querySelector("[role='menuitem']:not(:disabled)")?.focus();
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  const closeMenu = (restoreFocus = true) => {
    setMenuOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event) => {
    const items = [...menuRef.current.querySelectorAll("[role='menuitem']:not(:disabled)")];
    const index = items.indexOf(document.activeElement);
    const move = (next) => { event.preventDefault(); items[(next + items.length) % items.length]?.focus(); };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(items.length - 1);
    else if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
    else if (event.key === "Tab") closeMenu(false);
  };

  const showTabs = view === "beans" && !isDetailView;
  const isRedesigned = showTabs
    || view === "beanForm"
    || view === "brewForm"
    || view === "recipeForm"
    || view === "greenBeanRoastForm"
    || view === "roastProfileForm"
    || (view === "beans" && tab === "roastProfiles" && isDetailView);
  const isBeanDetail = view === "beanDetail";

  return (
    <div className="mbl-app" data-section={tab}>
      <header className="mbl-header">
        <div className="mbl-header-inner">
          <div className="mbl-header-top">
            <div className="mbl-wordmark">WyattCoffeeLab</div>
            <div className="mbl-account">
              <div className="mbl-account-email">{userEmail}</div>
              <div className="mbl-account-actions">
                <button className="mbl-link" onClick={onSignOut}>Sign out</button>
                <div className="mbl-menu">
                  <button
                    ref={triggerRef}
                    className="mbl-menu-trigger"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown" && !menuOpen) { event.preventDefault(); setMenuOpen(true); }
                    }}
                  >⋯</button>
                  {menuOpen && (
                    <div ref={menuRef} className="mbl-menu-list" role="menu" aria-label="More actions" onKeyDown={onMenuKeyDown}>
                      <button role="menuitem" className="mbl-menu-item" disabled={loading} onClick={() => { closeMenu(); onSync?.(); }}>Refresh</button>
                      <button role="menuitem" className="mbl-menu-item" onClick={() => { closeMenu(); setShowTroubleshooting((v) => !v); }}>Troubleshooting</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <nav className="mbl-tabs" aria-label="Sections">
            {showTabs ? TABS.map((item) => (
              <button key={item.id} className="mbl-tab" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}>
                {item.label}
              </button>
            )) : (
              <button className="mbl-tab" onClick={onBack || (() => setView("beans"))}>← Back</button>
            )}
          </nav>
        </div>
      </header>

      {showTroubleshooting && (
        <div className="mbl-header-inner" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
          <RestoreDiagnostics entries={restoreDiagnostics} onClear={onClearDiagnostics} defaultOpen />
        </div>
      )}

      {isRedesigned || isBeanDetail ? children : <div className="mbl-legacy">{children}</div>}
    </div>
  );
}
