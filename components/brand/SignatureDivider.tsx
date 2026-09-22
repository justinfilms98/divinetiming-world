import { SpiralMark } from '@/components/brand/SpiralMark';
import { cn } from '@/lib/ui/cn';

interface SignatureDividerProps {
  className?: string;
}

/**
 * Brand signature between major sections: hairline fade with the tribal spiral
 * nestled in the centre — the necklace sub-logo as a quiet pause, not decoration.
 */
export function SignatureDivider({ className }: SignatureDividerProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-4 max-w-2xl mx-auto my-12 md:my-16 px-6', className)}
      aria-hidden
    >
      <div className="signature-divider-line flex-1" />
      <SpiralMark size={22} className="shrink-0 opacity-90" />
      <div className="signature-divider-line flex-1" />
    </div>
  );
}
