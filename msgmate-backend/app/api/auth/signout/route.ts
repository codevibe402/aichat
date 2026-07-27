import { NextRequest } from "next/server";
import { json, options } from "@/lib/http";
import { SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function OPTIONS(req: NextRequest) {
  return options(req);
}

export async function POST(req: NextRequest) {
  const res = json(req, { signedIn: false });
  res.cookies.set(SESSION_COOKIE_OPTIONS.name, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}