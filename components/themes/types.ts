import { NowPlaying } from "@/lib/types";

/** Props every theme receives. `track.progressMs` is already interpolated. */
export interface ThemeProps {
  track: NowPlaying;
}

/** All built-in theme identifiers. Add new ones here and in the registry. */
export type ThemeId = "premium" | "minimal" | "retro" | "neon";
