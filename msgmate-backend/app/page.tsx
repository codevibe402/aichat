"use client";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, user } = useUser();

  return (
    <main style={{
      fontFamily: "system-ui",
      padding: "40px 24px",
      maxWidth: 500,
      margin: "0 auto",
      textAlign: "center"
    }}>
      {isSignedIn ? (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", fontSize: 22
          }}>✓</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>
            signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName}
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            you can close this tab and go back to the msgmate extension.
            your session is now synced to the extension.
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 8px 32px rgba(99,102,241,0.3)"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#f1f5f9" }}>
            sign in to msgmate
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
            click the sign in button in the top right to connect your account.
            once signed in, the extension will automatically pick up your session.
          </p>
          <div style={{
            padding: 16, borderRadius: 12,
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.12)",
            fontSize: 12, color: "#94a3b8", lineHeight: 1.5, textAlign: "left"
          }}>
            <strong style={{ color: "#a5b4fc", display: "block", marginBottom: 4 }}>why sign in?</strong>
            signing in lets msgmate generate ai replies, summarize conversations, and schedule messages across all your supported platforms from one place.
          </div>
        </>
      )}
    </main>
  );
}
