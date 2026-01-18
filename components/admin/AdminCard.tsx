import { ReactNode } from 'react';

interface AdminCardProps {
  children: ReactNode;
  className?: string;
}

export function AdminCard({ children, className = '' }: AdminCardProps) {
  return (
    <div className={`bg-[#0f0c10] border border-white/10 rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
}
