'use client';

import { cn } from '@/lib/ui/cn';

interface LuxuryCardProps {
  children: React.ReactNode;
  className?: string;
}

export function LuxuryCard({ children, className }: LuxuryCardProps) {
  return (
    <div
      className={cn(
        'bg-white/5 border border-white/10 rounded-2xl shadow-md',
        'hover:border-white/20 hover:shadow-lg transition-all duration-300',
        'overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

export function LuxuryCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-4 border-b border-white/10', className)}>{children}</div>
  );
}

export function LuxuryCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export function LuxuryCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-6 py-4 border-t border-white/10 bg-white/[0.02]', className)}>
      {children}
    </div>
  );
}
