import Link from 'next/link';
import Image from 'next/image';
import { Disc3 } from 'lucide-react';
import type { Release } from '@/lib/types/content';

interface ReleaseCardProps {
  release: Release;
}

function formatYear(date: string | null) {
  if (!date) return null;
  return new Date(date).getFullYear();
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  const cover = release.resolved_cover_url ?? release.cover_image_url;
  const year = formatYear(release.release_date);

  return (
    <article>
      <Link
        href={`/music/${release.slug}`}
        className="group block focus-ring rounded-[var(--radius-card)]"
      >
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          {cover ? (
            <Image
              src={cover}
              alt={`${release.title} cover art`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <Disc3 className="w-10 h-10 text-[var(--accent)]/40" />
            </div>
          )}
        </div>
        <p className="section-label mt-4">
          {release.release_type}
          {year && ` · ${year}`}
        </p>
        <h3 className="type-h3 text-[var(--text)] mt-1 group-hover:text-[var(--accent)] transition-colors duration-200 line-clamp-2">
          {release.title}
        </h3>
      </Link>
    </article>
  );
}
