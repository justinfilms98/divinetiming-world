import { HeroMedia } from '@/components/home/HeroMedia';
import { PulsingLogo } from '@/components/home/PulsingLogo';
import { MemberNames } from '@/components/home/MemberNames';

// Force static rendering - no cookies, headers, or server-side data fetching
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export default function HomePage() {
  // Use defaults - no Supabase server client calls (avoids cookies())
  // Settings will be loaded client-side if needed via API routes
  const settings = null;

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Hero Media Background */}
      <HeroMedia mediaType={settings?.hero_media_type} mediaUrl={settings?.hero_media_url} />

      {/* Pulsing Logo */}
      <PulsingLogo 
        artistName={settings?.artist_name || 'DIVINE:TIMING'}
      />

      {/* Member Names - positioned above social links */}
      <MemberNames 
        member1Name={settings?.member_1_name}
        member2Name={settings?.member_2_name}
      />
    </div>
  );
}
