import { LuxurySkeletonGrid } from '@/components/ui/LuxurySkeleton';

export default function ShopLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="aspect-[16/9] min-h-[320px] w-full bg-white/5 animate-pulse" />
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <LuxurySkeletonGrid count={6} />
        </div>
      </section>
    </div>
  );
}
