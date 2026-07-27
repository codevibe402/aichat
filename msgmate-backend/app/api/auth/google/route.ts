import { NextRequest } from "next/server";
import { json, options } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, accessToken } = body;
    if (!idToken && !accessToken) {
      return json(req, { error: "Missing idToken or accessToken" }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return json(req, { error: "Server not configured for Google auth" }, { status: 500 });
    }

    let googleId, email, name;

    if (idToken) {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );
      if (!response.ok) return json(req, { error: "Invalid token" }, { status: 401 });
      const payload = await response.json();
      if (payload.aud !== clientId) return json(req, { error: "Token audience mismatch" }, { status: 401 });
      googleId = payload.sub;
      email = payload.email || null;
      name = payload.name || null;
    } else {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) return json(req, { error: "Invalid token" }, { status: 401 });
      const payload = await response.json();
      if (payload.aud !== clientId && payload.azp !== clientId) return json(req, { error: "Token audience mismatch" }, { status: 401 });
      googleId = payload.sub;
      email = payload.email || null;
      name = payload.name || null;
    }

    const user = await prisma.user.upsert({
      where: { externalId: googleId },
      update: { email: email ?? undefined, name: name ?? undefined },
      create: { externalId: googleId, email: email ?? undefined, name: name ?? undefined, settings: { create: {} } },
    });

    const token = await createSessionToken(user.id);

    const res = json(req, {
      signedIn: true,
      userId: user.id,
      email: email || '',
      name: name || '',
    });
    res.cookies.set(SESSION_COOKIE_OPTIONS.name, token, SESSION_COOKIE_OPTIONS);
    return res;
  } catch (error) {
    console.error("[api/auth/google]", error);
    return json(req, { error: "Authentication failed" }, { status: 401 });
  }
}