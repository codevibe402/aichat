import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// ── Private: CORS helpers ───────────────────────────────────────────────────

/** @internal Validates the request origin and returns CORS headers. */
function _getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin");

  if (origin !== env.EXTENSION_ORIGIN) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ── Public API: Response helpers used by route handlers ─────────────────────

/** Wraps data in a NextResponse JSON with CORS headers. */
export function json(
  req: Request,
  data: unknown,
  init?: ResponseInit,
) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ..._getCorsHeaders(req),
      ...init?.headers,
    },
  });
}

/** Returns a 401 Unauthorized JSON response. */
export function unauthorized(req: Request) {
  return json(req, { error: "Unauthorized" }, { status: 401 });
}

/** Handles OPTIONS preflight requests with strict origin validation. */
export function options(req: Request) {
  const origin = req.headers.get("origin");

  if (origin !== env.EXTENSION_ORIGIN) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: _getCorsHeaders(req),
  });
}
