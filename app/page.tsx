import { createClient } from '@/lib/supabase/server';
import { HeroMedia } from '@/components/home/HeroMedia';
import { PulsingLogo } from '@/components/home/PulsingLogo';
import { MemberNames } from '@/components/home/MemberNames';

export default async function HomePage() {
  let settings = null;
  
  try {
    const supabase = await createClient();
    // Get site settings for hero
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .single();
    settings = data;
  } catch (error) {
    // If Supabase fails, use defaults - don't break the homepage
    console.error('Error loading site settings:', error);
  }

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
