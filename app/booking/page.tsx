import { createClient } from '@/lib/supabase/server';
import { GlassPanel } from '@/components/ui/GlassPanel';

export default async function BookingPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <GlassPanel>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center tracking-tight">
          BOOKING
        </h1>

        <p className="text-white/70 text-lg mb-12 max-w-2xl mx-auto text-center">
          For booking inquiries, vendor information, and management requests, please contact us
          using the information below.
        </p>

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--accent)] mb-3 tracking-wider uppercase">Phone</h2>
            <a
              href={`tel:${settings?.booking_phone || '+33 635 640 200'}`}
              className="text-white text-xl hover:text-[var(--accent)] transition-colors"
            >
              {settings?.booking_phone || '+33 635 640 200'}
            </a>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-[var(--accent)] mb-3 tracking-wider uppercase">Email</h2>
            <a
              href={`mailto:${settings?.booking_email || 'info@divinetimingmusic.com'}`}
              className="text-white text-xl hover:text-[var(--accent)] transition-colors"
            >
              {settings?.booking_email || 'info@divinetimingmusic.com'}
            </a>
          </div>

          <div className="pt-8 border-t border-white/10 text-center">
            <a
              href={`mailto:${settings?.booking_email || 'info@divinetimingmusic.com'}`}
              className="inline-block px-8 py-4 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent2)] transition-colors font-semibold text-lg"
            >
              Book Now
            </a>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
