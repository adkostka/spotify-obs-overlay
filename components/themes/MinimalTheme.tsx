"use client";

import { progressPercent } from "./format";
import styles from "./MinimalTheme.module.css";
import { ThemeProps } from "./types";

/**
 * Minimal theme — small cover, single line of text, hairline progress bar.
 * No card, no chrome. Gets out of the way of the stream.
 */
export function MinimalTheme({ track }: ThemeProps) {
  const idle = !track.title;
  const pct = progressPercent(track.progressMs, track.durationMs);

  return (
    <div className={styles.row} data-idle={idle}>
      {track.albumArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.art} src={track.albumArt} alt="" />
      ) : (
        <div className={styles.artFallback} aria-hidden />
      )}

      <div className={styles.text}>
        <span className={styles.title}>{track.title || "Nothing playing"}</span>
        {track.artist && <span className={styles.dot}>·</span>}
        <span className={styles.artist}>{track.artist}</span>
      </div>

      <div className={styles.bar} aria-hidden>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
