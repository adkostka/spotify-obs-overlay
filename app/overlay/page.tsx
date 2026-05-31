import { Overlay } from "@/components/Overlay";

export const dynamic = "force-dynamic";

/**
 * The page you add to OBS as a Browser Source:
 *   http://127.0.0.1:3000/overlay?theme=premium
 *
 * Query params:
 *   theme        premium | minimal | retro | neon   (default: premium)
 *   poll         poll interval in ms                (default: 3000)
 *   hideWhenIdle "true" to disappear when nothing plays
 */
export default async function OverlayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const theme = typeof params.theme === "string" ? params.theme : undefined;
  const pollRaw = typeof params.poll === "string" ? Number(params.poll) : NaN;
  const pollMs = Number.isFinite(pollRaw) && pollRaw >= 1000 ? pollRaw : 3000;
  const hideWhenIdle = params.hideWhenIdle === "true";

  return <Overlay theme={theme} pollMs={pollMs} hideWhenIdle={hideWhenIdle} />;
}
