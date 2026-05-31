import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/spotify";
import { saveRefreshToken } from "@/lib/tokenStore";

export const dynamic = "force-dynamic";

/** Build a redirect back to the landing page carrying an auth status. */
function redirectHome(request: NextRequest, status: string): NextResponse {
  const url = new URL("/", request.url);
  url.searchParams.set("auth", status);
  const response = NextResponse.redirect(url);
  // The state cookie has served its purpose — clear it on the way out.
  response.cookies.delete("spotify_auth_state");
  return response;
}

/**
 * OAuth redirect target. Spotify sends the user here with either a `code`
 * (success) or an `error`. We verify state, exchange the code for tokens, and
 * persist the refresh token so the overlay can run unattended.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return redirectHome(request, "denied");
  }

  const storedState = request.cookies.get("spotify_auth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return redirectHome(request, "state_mismatch");
  }

  if (!code) {
    return redirectHome(request, "missing_code");
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Should never happen for the Authorization Code flow, but be defensive.
      return redirectHome(request, "no_refresh_token");
    }
    await saveRefreshToken(tokens.refresh_token);
    return redirectHome(request, "success");
  } catch (err) {
    console.error("[auth/callback] token exchange error:", err);
    return redirectHome(request, "exchange_failed");
  }
}
