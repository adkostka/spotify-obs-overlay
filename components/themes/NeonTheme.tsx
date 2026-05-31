"use client";

import { formatTime, progressPercent } from "./format";
import styles from "./NeonTheme.module.css";
import { ThemeProps } from "./types";

/**
 * Neon theme — high-glow outline card with a pulsing border and bright,
 * shadowed text. Reads well over busy or dark gameplay footage.
 */
export function NeonTheme({ track }: ThemeProps) {
  const idle = !track.title;
  const pct = progressPercent(track.progressMs, track.durationMs);

  return (
    <div className={styles.card} data-idle={idle} data-playing={track.isPlaying}>
      {track.albumArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.art} src={track.albumArt} alt="" />
      ) : (
        <div className={styles.artFallback} aria-hidden />
      )}

      <div className={styles.info}>
        <div className={styles.title}>{track.title || "Nothing playing"}</div>
        <div className={styles.artist}>{track.artist || "Spotify"}</div>

        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.times}>
          <span>{formatTime(track.progressMs)}</span>
          <span>{formatTime(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}
