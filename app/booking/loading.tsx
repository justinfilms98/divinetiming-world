export default function BookingLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="aspect-[16/9] min-h-[260px] w-full bg-white/5 animate-pulse" />
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-4">
              <div className="h-10 bg-white/10 rounded animate-pulse" />
              <div className="h-10 bg-white/10 rounded animate-pulse" />
              <div className="h-24 bg-white/10 rounded animate-pulse" />
              <div className="h-10 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-48 bg-white/10 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
