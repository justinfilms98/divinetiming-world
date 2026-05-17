import { LuxurySkeletonGrid } from '@/components/ui/LuxurySkeleton';

export default function MediaLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="aspect-[16/9] min-h-[280px] w-full bg-white/5 animate-pulse" />
      <section className="flex-1 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-6 w-64 bg-white/10 rounded mb-8 mx-auto animate-pulse" />
          <div className="flex gap-4 justify-center mb-10">
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
          </div>
          <LuxurySkeletonGrid count={6} />
        </div>
      </section>
    </div>
  );
}
