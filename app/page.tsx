import { HeroMedia } from '@/components/home/HeroMedia';
import { PulsingLogo } from '@/components/home/PulsingLogo';
import { MemberNames } from '@/components/home/MemberNames';

// Force static rendering - no cookies, headers, or server-side data fetching
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export default function HomePage() {
  // Use defaults - no Supabase server client calls (avoids cookies())
  // Settings will be loaded client-side if needed via API routes
  // Components handle null/undefined gracefully

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Hero Media Background */}
      <HeroMedia mediaType={null} mediaUrl={null} />

      {/* Pulsing Logo */}
      <PulsingLogo 
        artistName="DIVINE:TIMING"
      />

      {/* Member Names - positioned above social links */}
      <MemberNames 
        member1Name={undefined}
        member2Name={undefined}
      />
    </div>
  );
}
