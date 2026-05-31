import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/spotify";

export const dynamic = "force-dynamic";

/**
 * Kick off the OAuth Authorization Code flow.
 *
 * We mint a random `state` value, stash it in an httpOnly cookie, and hand the
 * same value to Spotify. On the callback we compare them — if they don't match,
 * the request didn't originate from us (CSRF protection).
 *
 * The cookie is set directly on the redirect response so it reliably ships with
 * the 3xx — modifying cookies() from next/headers does not always attach to a
 * custom NextResponse.
 */
export async function GET() {
  const state = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes is plenty to finish the consent screen.
    path: "/",
  });
  return response;
}
