/**
 * Normalized "now playing" shape consumed by the overlay and all themes.
 * This is the single source of truth for what a theme can render — keep it
 * decoupled from Spotify's raw API response so themes never touch the API.
 */
export interface NowPlaying {
  /** Whether something is actively playing right now. */
  isPlaying: boolean;
  /** Track title. */
  title: string;
  /** Artists joined into a single display string ("A, B, C"). */
  artist: string;
  /** Individual artist names. */
  artists: string[];
  /** Album name. */
  album: string;
  /** Album art URL (largest available), or null if none. */
  albumArt: string | null;
  /** Current playback position in milliseconds. */
  progressMs: number;
  /** Total track length in milliseconds. */
  durationMs: number;
  /** Public Spotify URL for the track, or null. */
  trackUrl: string | null;
  /**
   * Client clock timestamp (ms) of when this snapshot was produced. Used by the
   * overlay to smoothly interpolate the progress bar between polls.
   */
  fetchedAt: number;
}

/** The empty/idle state — nothing is playing. */
export const IDLE_NOW_PLAYING: NowPlaying = {
  isPlaying: false,
  title: "",
  artist: "",
  artists: [],
  album: "",
  albumArt: null,
  progressMs: 0,
  durationMs: 0,
  trackUrl: null,
  fetchedAt: 0,
};
