"use client";

export function AuthHeader() {
  return (
    <header style={{
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "linear-gradient(135deg, #1e1b4b, #312e81)",
      borderBottom: "1px solid rgba(99,102,241,0.3)",
      fontFamily: "system-ui"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#a5b4fc">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span style={{ color: "#a5b4fc", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>MsgMate</span>
      </div>
    </header>
  );
}