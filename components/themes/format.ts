/** Format a millisecond duration as "m:ss" (e.g. 187000 -> "3:07"). */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Progress as a 0–100 percentage, clamped and safe against zero-length tracks. */
export function progressPercent(progressMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return Math.min(100, Math.max(0, (progressMs / durationMs) * 100));
}
