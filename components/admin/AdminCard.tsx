import { ReactNode } from 'react';
import { cn } from '@/lib/ui/cn';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className }: AdminCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03]',
        'hover:border-white/20 hover:bg-white/[0.05]',
        'transition-all duration-200 ease-out',
        'p-4 md:p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
