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
        'bg-white/[0.04] border border-white/10 rounded-2xl',
        'shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
        'hover:border-white/15 hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]',
        'transition-[border-color,box-shadow] duration-250 ease-out',
        'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
