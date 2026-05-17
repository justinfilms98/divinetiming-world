import { LuxurySkeletonGrid } from '@/components/ui/LuxurySkeleton';

export default function GalleryDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-clip">
      <div className="h-14 flex-shrink-0 bg-black/40" />
      <main className="flex-1 py-16 min-w-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse mb-8" />
          <div className="h-8 w-3/4 max-w-xl bg-white/10 rounded animate-pulse mb-4" />
          <div className="h-4 w-full max-w-2xl bg-white/5 rounded animate-pulse mb-12" />
          <LuxurySkeletonGrid count={8} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
        </div>
      </main>
    </div>
  );
}
