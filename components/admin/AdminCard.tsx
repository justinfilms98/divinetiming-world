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
        'admin-card p-4 md:p-6 rounded-2xl shadow-sm',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        className
      )}
    >
      {children}
    </div>
  );
}
