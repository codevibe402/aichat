import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { json } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return json(req, { signedIn: false }, { status: 401 });
  }

  const token = await getToken();

  return json(req, {
    signedIn: true,
    userId,
    token,
  });
}