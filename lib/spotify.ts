import { IDLE_NOW_PLAYING, NowPlaying } from "./types";
import {
  getCachedAccessToken,
  getRefreshToken,
  setCachedAccessToken,
} from "./tokenStore";

/**
 * Thin Spotify Web API client.
 *
 * Everything secret (client secret, token exchange) lives here, on the server.
 * The browser never sees a token — it only ever talks to our own
 * `/api/now-playing` route. That separation is the whole reason this app needs
 * a backend at all.
 */

const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

/** Scopes required to read what's currently playing. Nothing more. */
export const SCOPES = ["user-read-currently-playing", "user-read-playback-state"];

function getClientId(): string {
  const id = process.env.SPOTIFY_CLIENT_ID;
  if (!id) throw new Error("Missing SPOTIFY_CLIENT_ID env var");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!secret) throw new Error("Missing SPOTIFY_CLIENT_SECRET env var");
  return secret;
}

export function getRedirectUri(): string {
  return (
    process.env.SPOTIFY_REDIRECT_URI ??
    "http://127.0.0.1:3000/api/auth/callback"
  );
}

/** HTTP Basic auth header used by the token endpoints. */
function basicAuthHeader(): string {
  const creds = `${getClientId()}:${getClientSecret()}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

/**
 * Build the Spotify authorize URL the user is redirected to in order to grant
 * access. `state` is an opaque anti-CSRF value we verify on the callback.
 */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    scope: SCOPES.join(" "),
    redirect_uri: getRedirectUri(),
    state,
  });
  return `${ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** Exchange the authorization `code` for an access + refresh token pair. */
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

/** Trade the stored refresh token for a fresh access token. */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as TokenResponse;
  setCachedAccessToken(data.access_token, data.expires_in);
  return data.access_token;
}

/**
 * Return a valid access token, reusing the in-memory cache when possible and
 * only hitting Spotify's token endpoint when the cached one is missing/stale.
 * Throws `NotAuthorizedError` when the user has never connected their account.
 */
export class NotAuthorizedError extends Error {
  constructor() {
    super("No Spotify refresh token on disk — user has not authorized yet.");
    this.name = "NotAuthorizedError";
  }
}

async function getAccessToken(): Promise<string> {
  const cached = getCachedAccessToken();
  if (cached) return cached;

  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new NotAuthorizedError();

  return refreshAccessToken(refreshToken);
}

/** Pick the largest album image Spotify returns (they come sorted desc). */
function pickAlbumArt(images: Array<{ url: string }> | undefined): string | null {
  if (!images || images.length === 0) return null;
  return images[0].url ?? null;
}

/**
 * Fetch and normalize what's currently playing.
 *
 * Spotify returns HTTP 204 (no content) when nothing is playing — we map that
 * to the idle state instead of treating it as an error.
 */
export async function getNowPlaying(): Promise<NowPlaying> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${API_BASE}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // Always hit Spotify fresh; the overlay polls on its own cadence.
    cache: "no-store",
  });

  if (res.status === 204) {
    return { ...IDLE_NOW_PLAYING, fetchedAt: Date.now() };
  }

  if (!res.ok) {
    throw new Error(`currently-playing failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const item = data?.item;

  // Episodes / ads / unknown item types -> treat as idle to keep themes simple.
  if (!item || data?.currently_playing_type !== "track") {
    return { ...IDLE_NOW_PLAYING, isPlaying: !!data?.is_playing, fetchedAt: Date.now() };
  }

  const artists: string[] = (item.artists ?? []).map((a: { name: string }) => a.name);

  return {
    isPlaying: !!data.is_playing,
    title: item.name ?? "",
    artist: artists.join(", "),
    artists,
    album: item.album?.name ?? "",
    albumArt: pickAlbumArt(item.album?.images),
    progressMs: data.progress_ms ?? 0,
    durationMs: item.duration_ms ?? 0,
    trackUrl: item.external_urls?.spotify ?? null,
    fetchedAt: Date.now(),
  };
}
