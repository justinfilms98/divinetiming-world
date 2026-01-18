import { createClient } from '@/lib/supabase/server';
import { GlassPanel } from '@/components/ui/GlassPanel';

export default async function TourPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <GlassPanel>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center tracking-tight">
          TOUR
        </h1>

        {events && events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                <div>
                  <div className="text-[var(--accent)] text-sm font-semibold mb-2 tracking-wider uppercase">
                    {formatDate(event.date)}
                  </div>
                  <div className="text-2xl font-semibold text-white mb-1">
                    {event.city}
                  </div>
                  <div className="text-white/70">
                    {event.venue}
                  </div>
                </div>

                {event.ticket_url && (
                  <a
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 md:mt-0 px-6 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent2)] transition-colors font-medium"
                  >
                    Tickets
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-white/70 py-12">
            <p>No upcoming events. Check back soon!</p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
