import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Local-first token store.
 *
 * After the OAuth dance, Spotify gives us a long-lived `refresh_token`. We
 * persist it to a gitignored JSON file on disk so a single login survives
 * server restarts. The short-lived `access_token` is cached in memory only —
 * there's no point persisting something that dies in an hour.
 *
 * This deliberately uses the filesystem because the app is designed to run
 * LOCALLY on the streamer's machine. It is NOT suitable for a serverless host
 * with an ephemeral/read-only filesystem.
 */

const TOKEN_DIR = path.join(process.cwd(), ".spotify");
const TOKEN_FILE = path.join(TOKEN_DIR, "tokens.json");

interface StoredTokens {
  refreshToken: string;
  /** ISO timestamp of when authorization happened (informational). */
  authorizedAt: string;
}

/** In-memory cache for the short-lived access token. */
let accessTokenCache: { token: string; expiresAt: number } | null = null;

/** Persist the refresh token to disk. Called once, right after OAuth callback. */
export async function saveRefreshToken(refreshToken: string): Promise<void> {
  await fs.mkdir(TOKEN_DIR, { recursive: true });
  const payload: StoredTokens = {
    refreshToken,
    authorizedAt: new Date().toISOString(),
  };
  await fs.writeFile(TOKEN_FILE, JSON.stringify(payload, null, 2), "utf8");
}

/** Read the stored refresh token, or null if the user hasn't authorized yet. */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredTokens;
    return parsed.refreshToken ?? null;
  } catch {
    // File doesn't exist / unreadable -> not authorized.
    return null;
  }
}

/** True if a refresh token is on disk (i.e. the user has connected Spotify). */
export async function isAuthorized(): Promise<boolean> {
  return (await getRefreshToken()) !== null;
}

/** Forget the stored authorization (used by the "disconnect" endpoint). */
export async function clearTokens(): Promise<void> {
  accessTokenCache = null;
  try {
    await fs.unlink(TOKEN_FILE);
  } catch {
    // Already gone — nothing to do.
  }
}

/** Return a non-expired cached access token, or null if we need a fresh one. */
export function getCachedAccessToken(): string | null {
  if (!accessTokenCache) return null;
  // 30s safety margin so we never use a token that's about to die mid-request.
  if (Date.now() >= accessTokenCache.expiresAt - 30_000) return null;
  return accessTokenCache.token;
}

/** Cache a freshly minted access token alongside its absolute expiry. */
export function setCachedAccessToken(token: string, expiresInSeconds: number): void {
  accessTokenCache = {
    token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
}
