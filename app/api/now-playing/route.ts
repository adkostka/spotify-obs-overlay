import { NextResponse } from "next/server";
import { getNowPlaying, NotAuthorizedError } from "@/lib/spotify";

export const dynamic = "force-dynamic";

/**
 * The only endpoint the overlay (the browser) ever calls.
 *
 * Returns the normalized now-playing snapshot. Token handling and the Spotify
 * client secret stay entirely server-side — the client just sees clean JSON.
 */
export async function GET() {
  try {
    const data = await getNowPlaying();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof NotAuthorizedError) {
      return NextResponse.json(
        { error: "not_authorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[now-playing] error:", err);
    return NextResponse.json(
      { error: "spotify_error" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
