import { ComponentType } from "react";
import { MinimalTheme } from "./MinimalTheme";
import { NeonTheme } from "./NeonTheme";
import { PremiumTheme } from "./PremiumTheme";
import { RetroTheme } from "./RetroTheme";
import { ThemeId, ThemeProps } from "./types";

/**
 * Theme registry. The overlay resolves `?theme=<id>` against this map, so
 * adding a new look is just: build the component, import it, add one entry.
 */
export const THEMES: Record<ThemeId, ComponentType<ThemeProps>> = {
  premium: PremiumTheme,
  minimal: MinimalTheme,
  retro: RetroTheme,
  neon: NeonTheme,
};

export const DEFAULT_THEME: ThemeId = "premium";

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** Resolve a (possibly invalid) theme id from the URL to a real component. */
export function resolveTheme(id?: string | null): ComponentType<ThemeProps> {
  if (id && (THEME_IDS as string[]).includes(id)) {
    return THEMES[id as ThemeId];
  }
  return THEMES[DEFAULT_THEME];
}

export type { ThemeId, ThemeProps };
