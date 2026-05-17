'use client';

/** Faint pocket watch / clock outline for booking scroll. Percentage positioning; no overflow. */
export function ClockMotif({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute right-[8%] top-[18%] w-[min(12rem,20%)] aspect-square max-w-full opacity-[0.05] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-full h-full block">
        <circle cx="32" cy="32" r="28" />
        <circle cx="32" cy="32" r="2" fill="currentColor" />
        <line x1="32" y1="32" x2="32" y2="16" strokeWidth="1" />
        <line x1="32" y1="32" x2="44" y2="36" strokeWidth="0.8" />
      </svg>
    </div>
  );
}
