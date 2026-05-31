"use client";

import { useEffect, useRef, useState } from "react";
import { IDLE_NOW_PLAYING, NowPlaying } from "@/lib/types";

export type NowPlayingStatus = "loading" | "ok" | "not_authorized" | "error";

interface UseNowPlayingResult {
  /** Latest snapshot, with `progressMs` smoothly interpolated for display. */
  track: NowPlaying;
  status: NowPlayingStatus;
}

/**
 * Polls `/api/now-playing` on an interval and exposes a render-friendly track.
 *
 * Two clocks are at play:
 *  - the POLL (every `pollMs`) fetches a fresh, authoritative snapshot.
 *  - the TICK (every 250ms) advances the progress bar locally between polls so
 *    it moves smoothly instead of jumping. We stamp `fetchedAt` with the
 *    CLIENT clock on receipt, so interpolation never depends on server time.
 */
export function useNowPlaying(pollMs = 3000): UseNowPlayingResult {
  const [snapshot, setSnapshot] = useState<NowPlaying>(IDLE_NOW_PLAYING);
  const [status, setStatus] = useState<NowPlayingStatus>("loading");
  const [displayProgress, setDisplayProgress] = useState(0);
  const snapshotRef = useRef<NowPlaying>(snapshot);

  // --- POLL: fetch authoritative snapshots -------------------------------
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" });

        if (res.status === 401) {
          if (active) setStatus("not_authorized");
          return;
        }
        if (!res.ok) {
          if (active) setStatus("error");
          return;
        }

        const data = (await res.json()) as NowPlaying;
        // Re-stamp with the client clock so interpolation is skew-proof.
        const stamped: NowPlaying = { ...data, fetchedAt: Date.now() };

        if (active) {
          snapshotRef.current = stamped;
          setSnapshot(stamped);
          setDisplayProgress(stamped.progressMs);
          setStatus("ok");
        }
      } catch {
        if (active) setStatus("error");
      }
    }

    poll();
    const id = setInterval(poll, pollMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [pollMs]);

  // --- TICK: interpolate the progress bar between polls -------------------
  useEffect(() => {
    const id = setInterval(() => {
      const s = snapshotRef.current;
      if (!s.isPlaying || s.durationMs === 0) return;
      const elapsed = Date.now() - s.fetchedAt;
      setDisplayProgress(Math.min(s.progressMs + elapsed, s.durationMs));
    }, 250);
    return () => clearInterval(id);
  }, []);

  const track: NowPlaying = { ...snapshot, progressMs: displayProgress };
  return { track, status };
}
