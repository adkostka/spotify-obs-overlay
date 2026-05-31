import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/tokenStore";

export const dynamic = "force-dynamic";

/** Forget the stored Spotify authorization. */
export async function POST() {
  await clearTokens();
  return NextResponse.json({ ok: true });
}
