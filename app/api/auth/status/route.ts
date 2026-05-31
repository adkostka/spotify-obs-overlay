import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/tokenStore";

export const dynamic = "force-dynamic";

/** Lightweight check used by the landing page to show connection state. */
export async function GET() {
  return NextResponse.json(
    { authorized: await isAuthorized() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
