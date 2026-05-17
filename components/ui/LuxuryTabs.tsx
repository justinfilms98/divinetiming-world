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
            'min-h-[48px] px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
            activeId === tab.id
              ? 'bg-[var(--accent)] text-[var(--text)]'
              : 'bg-[var(--bg-secondary)]/80 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
