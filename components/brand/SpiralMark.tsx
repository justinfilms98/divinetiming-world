import { TRIBAL_SPIRAL_LENGTH, TRIBAL_SPIRAL_PATH } from '@/components/brand/tribalSpiralPath';
import { cn } from '@/lib/ui/cn';

type SpiralSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<SpiralSize, number> = {
  sm: 28,
  md: 48,
  lg: 72,
  xl: 112,
};

interface SpiralMarkProps {
  className?: string;
  size?: SpiralSize | number;
  /** Soft luminous fill behind the stroke — nods to the necklace glow without fighting brand gold. */
  glow?: boolean;
  title?: string;
}

/**
 * Static tribal spiral mark (sub-logo). Prefer SpiralLoader when awaiting content.
 */
export function SpiralMark({ className, size = 'md', glow = true, title }: SpiralMarkProps) {
  const px = typeof size === 'number' ? size : SIZE_PX[size];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      className={cn('spiral-mark', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {glow && (
        <circle
          cx="50"
          cy="50"
          r="38"
          className="spiral-mark__glow"
          fill="currentColor"
        />
      )}
      <path
        d={TRIBAL_SPIRAL_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={TRIBAL_SPIRAL_LENGTH}
      />
    </svg>
  );
}
