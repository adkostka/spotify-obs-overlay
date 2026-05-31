"use client";

import { formatTime, progressPercent } from "./format";
import styles from "./PremiumTheme.module.css";
import { ThemeProps } from "./types";

/**
 * Premium theme — glassmorphism card with album art, animated equalizer and a
 * thin progress bar. The "Amuse-like" flagship look.
 */
export function PremiumTheme({ track }: ThemeProps) {
  const idle = !track.title;
  const pct = progressPercent(track.progressMs, track.durationMs);

  return (
    <div className={styles.card} data-idle={idle}>
      <div className={styles.artWrap}>
        {track.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.art} src={track.albumArt} alt="" />
        ) : (
          <div className={styles.artFallback} aria-hidden />
        )}
        {track.isPlaying && (
          <div className={styles.equalizer} aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.title}>{track.title || "Nothing playing"}</div>
        <div className={styles.artist}>{track.artist || "Spotify"}</div>

        <div className={styles.progressRow}>
          <span className={styles.time}>{formatTime(track.progressMs)}</span>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.time}>{formatTime(track.durationMs)}</span>
        </div>
      </div>
    </div>
  );
}
