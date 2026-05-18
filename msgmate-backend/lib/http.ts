import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Access-Control-Allow-Origin": env.EXTENSION_ORIGIN ?? "*",
      "Access-Control-Allow-Headers": "content-type,x-msgmate-api-key,x-msgmate-user-id",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      ...init?.headers
    }
  });
}

export function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

export function options() {
  return json({ ok: true });
}
