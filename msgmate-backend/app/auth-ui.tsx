"use client";
import { useAuth, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function AuthHeader() {
  const { isSignedIn } = useAuth();

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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!isSignedIn ? (
          <>
            <SignInButton mode="redirect">
              <button style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.4)",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit"
              }}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="redirect">
              <button style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent",
                color: "#c7d2fe",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit"
              }}>
                Sign up
              </button>
            </SignUpButton>
          </>
        ) : (
          <UserButton />
        )}
      </div>
    </header>
  );
}