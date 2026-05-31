"use client";

import { resolveTheme } from "./themes";
import { useNowPlaying } from "./useNowPlaying";

interface OverlayProps {
  /** Theme id from `?theme=`. Falls back to the default if invalid. */
  theme?: string;
  /** Poll interval in ms (`?poll=`). */
  pollMs?: number;
  /** When true, render nothing while nothing is playing (`?hideWhenIdle=true`). */
  hideWhenIdle?: boolean;
}

/**
 * Top-level overlay. Owns the data (via useNowPlaying), picks the theme, and
 * re-mounts the theme on track change (via `key`) so its entrance animation
 * replays for every new song.
 */
export function Overlay({ theme, pollMs = 3000, hideWhenIdle = false }: OverlayProps) {
  const { track, status } = useNowPlaying(pollMs);
  const Theme = resolveTheme(theme);

  if (status === "not_authorized") {
    return (
      <div className="overlay-notice">
        Spotify not connected — open{" "}
        <strong>http://127.0.0.1:3000</strong> and click “Connect Spotify”.
      </div>
    );
  }

  if (hideWhenIdle && !track.isPlaying && !track.title) {
    return null;
  }

  const animKey = track.trackUrl || track.title || "idle";

  return (
    <div className="overlay-root">
      <div key={animKey} className="overlay-slot">
        <Theme track={track} />
      </div>
    </div>
  );
}
