'use client';

/** Faint horizon / sunset linework for booking scroll. Contained; no overflow. */
export function SunsetMotif({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-0 right-0 h-24 md:h-32 max-h-[30%] overflow-hidden opacity-[0.06] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 400 80" fill="none" stroke="currentColor" strokeWidth="0.6" className="w-full h-full block">
        <path d="M0 60 Q100 40 200 50 T400 55 L400 80 L0 80 Z" />
        <path d="M0 70 Q150 55 300 65 L400 60" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
