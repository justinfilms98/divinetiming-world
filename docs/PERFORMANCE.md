# Performance Notes

- **Hero**: Fixed aspect ratio / min-height to reduce CLS; Next/Image with `sizes` for responsive loading.
- **Cards**: EventCard, ProductCard, GalleryCard, MediaTile use fixed aspect-ratio image containers.
- **Videos**: Hero videos muted, playsInline, preload="metadata"; poster fallback when available.
- **Lazy load**: Gallery ViewerModal and VideoModal lazy-loaded via dynamic import; Spotify/YouTube embeds lazy in ListenNow.
- **Route loading**: `loading.tsx` added for /events, /media, /shop, /booking using LuxurySkeleton to match layout and reduce perceived jank.
- **CLS**: Skeleton placeholders and aspect-ratio wrappers used; text blocks use stable spacing.
- **How to verify**: Run Lighthouse (Performance, LCP, CLS); confirm no large layout shifts on hero and cards; check that loading states appear before content.
