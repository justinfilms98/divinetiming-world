'use client';

/** Faint star field for booking scroll background. Contained; no overflow. */
export function StarsMotif({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 w-full h-full max-w-full max-h-full opacity-[0.06]" viewBox="0 0 800 1200" fill="none" preserveAspectRatio="xMidYMid slice">
        {[
          [100, 80],
          [650, 200],
          [180, 400],
          [720, 550],
          [90, 700],
          [600, 880],
          [200, 1000],
          [680, 1150],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 1.5 : 1} fill="currentColor" />
        ))}
      </svg>
    </div>
  );
}
