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
        'admin-card p-6',
        'transition-[border-color,box-shadow] duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
