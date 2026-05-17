import { LuxurySkeletonGrid } from '@/components/ui/LuxurySkeleton';

export default function EventsLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="aspect-[16/9] min-h-[280px] w-full bg-white/5 animate-pulse" />
      <section className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-4 w-48 bg-white/10 rounded mb-10 mx-auto animate-pulse" />
          <LuxurySkeletonGrid count={3} />
        </div>
      </section>
    </div>
  );
}
