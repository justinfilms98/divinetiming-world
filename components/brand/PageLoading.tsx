import { SpiralLoader } from '@/components/brand/SpiralLoader';

/**
 * Full-viewport route loading state — night band + tribal spiral.
 * Used by route-level loading.tsx files so every public transition feels on-brand.
 */
export function PageLoading({ caption = 'DIVINE:TIMING' }: { caption?: string }) {
  return (
    <div className="band-night relative flex min-h-[calc(100dvh-var(--public-nav-height))] w-full flex-col items-center justify-center overflow-hidden">
      <div className="hero-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <SpiralLoader size="xl" variant="both" caption={caption} label="Loading page" />
    </div>
  );
}
