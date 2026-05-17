'use client';

export function SpotifyEmbed({ uri }: { uri: string }) {
  const path = uri.replace(/^spotify:/, '').replace(/:/g, '/');
  const src = `https://open.spotify.com/embed/${path}?utm_source=generator`;
  return (
    <iframe
      src={src}
      width="100%"
      height="100%"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Spotify"
      className="w-full h-full min-h-[280px]"
    />
  );
}
