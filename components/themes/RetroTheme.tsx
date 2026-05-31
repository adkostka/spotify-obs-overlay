"use client";

import { formatTime, progressPercent } from "./format";
import styles from "./RetroTheme.module.css";
import { ThemeProps } from "./types";

/**
 * Retro theme — synthwave / cassette vibe: monospace type, neon grid accents
 * and a scanline overlay. Cover art doubles as the "tape window".
 */
export function RetroTheme({ track }: ThemeProps) {
  const idle = !track.title;
  const pct = progressPercent(track.progressMs, track.durationMs);

  return (
    <div className={styles.frame} data-idle={idle}>
      <div className={styles.scanlines} aria-hidden />

      <div className={styles.header}>
        <span className={styles.led} data-on={track.isPlaying} />
        <span className={styles.label}>
          {track.isPlaying ? "▶ NOW PLAYING" : "❚❚ PAUSED"}
        </span>
      </div>

      <div className={styles.body}>
        {track.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.art} src={track.albumArt} alt="" />
        ) : (
          <div className={styles.artFallback} aria-hidden />
        )}

        <div className={styles.info}>
          <div className={styles.title}>{track.title || "INSERT TAPE"}</div>
          <div className={styles.artist}>{track.artist || "—"}</div>

          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.times}>
            <span>{formatTime(track.progressMs)}</span>
            <span>{formatTime(track.durationMs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
