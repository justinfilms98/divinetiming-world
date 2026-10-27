import { isDemo, type DemoKind } from '@/lib/admin/demoContent';

/** "Demo" label for demonstration records (see lib/admin/demoContent.ts). Renders nothing otherwise. */
export function DemoBadge({ kind, id }: { kind: DemoKind; id: string }) {
  if (!isDemo(kind, id)) return null;
  return (
    <span
      title="Demonstration content kept to show how the site works. Left out of dashboard reminders."
      className="rounded border border-white/25 px-2 py-0.5 text-xs font-medium text-white/65"
    >
      Demo
    </span>
  );
}
