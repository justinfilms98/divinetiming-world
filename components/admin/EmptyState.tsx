import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 border border-slate-200 mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto text-sm leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
