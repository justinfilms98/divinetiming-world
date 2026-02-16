'use client';

import { cn } from '@/lib/ui/cn';

export interface LuxuryTabItem {
  id: string;
  label: string;
}

interface LuxuryTabsProps {
  tabs: LuxuryTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function LuxuryTabs({ tabs, activeId, onChange, className }: LuxuryTabsProps) {
  return (
    <div
      role="tablist"
      className={cn('flex flex-wrap gap-2', className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeId === tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
            activeId === tab.id
              ? 'bg-[var(--accent)] text-[var(--bg)]'
              : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
