import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { registerUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let evt;

  try {
    evt = await verifyWebhook(req);
  } catch (error) {
    console.error("[api/webhooks/clerk] verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, primary_email_address_id, first_name, last_name } = evt.data;

    const primaryEmail =
      email_addresses?.find((e) => e.id === primary_email_address_id)?.email_address ??
      email_addresses?.[0]?.email_address ??
      null;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await registerUser({ externalId: id, email: primaryEmail, name });
  }

  return NextResponse.json({ received: true });
}
