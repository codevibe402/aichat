import { NextResponse } from "next/server";
import { env } from "@/lib/env";

function getCorsHeaders(req: Request) : HeadersInit {
  const origin = req.headers.get("origin");

  if (origin !== env.EXTENSION_ORIGIN) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,authorization",
  };
}

export function json(
  req: Request,
  data:unknown,
  init?: ResponseInit,
) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...getCorsHeaders(req),
      ...init?.headers,
    },
  });
}

export function unauthorized(req: Request) {
  return json(req, { error: "Unauthorized" }, { status: 401 });
}

export function options(req: Request) {
  const origin = req.headers.get("origin");

  if (origin !== env.EXTENSION_ORIGIN) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}