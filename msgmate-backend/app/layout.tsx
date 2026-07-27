import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MsgMate Backend",
  description: "Backend API for the MsgMate Chrome extension"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0f0f1a", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  );
}