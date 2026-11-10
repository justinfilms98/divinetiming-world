import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import nextConfig from '@/next.config';
import { displayImageUrl, webCopyFor, webCopyPaths } from './webCopies';
import { canOptimizeImage, isVideoUrl, OPTIMIZABLE_IMAGE_HOSTS } from './mediaUrls';
import { heroUploadPath } from '@/lib/hero/heroUploadPath';
import { MediaThumb } from '@/components/admin/MediaThumb';
import { OnDemandVideo } from '@/components/media/OnDemandVideo';

const PROD = 'https://lokewuvbrrvmlgdwivoa.supabase.co/storage/v1/object/public/media/';
const STAGING = 'https://goapnjajsjslxbjqthyo.supabase.co/storage/v1/object/public/media/';

describe('web copies of oversized photos', () => {
  it('maps the two large originals to their web copies on the same host', () => {
    expect(webCopyFor(`${PROD}library/1773117243870-Photo784_Original.jpg`)).toBe(
      `${PROD}library/web/1773117243870-Photo784_Original-web3200-72a3a441af.jpg`
    );
    expect(webCopyFor(`${STAGING}library/1773117233724-Photo506_Original.jpg?x=1`)).toBe(
      `${STAGING}library/web/1773117233724-Photo506_Original-web3200-97054f4672.jpg`
    );
  });

  it('leaves every other URL unchanged', () => {
    const other = `${PROD}library/1794276458006-soe1_12.jpg`;
    expect(webCopyFor(other)).toBeNull();
    expect(displayImageUrl(other)).toBe(other);
    expect(displayImageUrl(null)).toBeNull();
    expect(displayImageUrl('https://i.ytimg.com/vi/x/hq.jpg')).toBe('https://i.ytimg.com/vi/x/hq.jpg');
  });

  it('copies live under new content-hashed paths and never overwrite an original', () => {
    for (const { original, copy } of webCopyPaths()) {
      expect(copy).not.toBe(original);
      expect(copy).toMatch(/^library\/web\/.+-web\d+-[0-9a-f]{10}\.jpg$/);
    }
  });
});

describe('image optimizer settings', () => {
  it('caches optimized images for at least 31 days', () => {
    expect(nextConfig.images?.minimumCacheTTL).toBeGreaterThanOrEqual(31 * 24 * 3600);
  });

  it('allows exactly the hosts the admin thumbnails treat as optimizable', () => {
    const hosts = (nextConfig.images?.remotePatterns ?? []).map((p) => ('hostname' in p ? p.hostname : ''));
    expect([...hosts].sort()).toEqual([...OPTIMIZABLE_IMAGE_HOSTS].sort());
  });

  it('only optimizes https URLs on allowed hosts', () => {
    expect(canOptimizeImage(`${PROD}library/a.jpg`)).toBe(true);
    expect(canOptimizeImage('https://ucarecdn.com/x/')).toBe(true);
    expect(canOptimizeImage('http://lokewuvbrrvmlgdwivoa.supabase.co/a.jpg')).toBe(false);
    expect(canOptimizeImage('data:image/png;base64,AAA')).toBe(false);
    expect(canOptimizeImage('blob:https://site/1')).toBe(false);
    expect(canOptimizeImage('https://evil.example.com/a.jpg')).toBe(false);
  });
});

describe('media URLs are never overwritten (safe with long caching)', () => {
  it('legacy hero uploads get a new path every time', () => {
    const a = heroUploadPath('events', 'media', 'jpg', 1000);
    const b = heroUploadPath('events', 'media', 'jpg', 2000);
    expect(a).not.toBe(b);
    expect(a).not.toBe('hero/events.jpg');
    expect(heroUploadPath('home', 'logo', 'png', 5)).toBe('hero/logos/home-logo-5.png');
  });
});

describe('video files are never loaded as images or preloaded', () => {
  it('detects video by MIME type or extension', () => {
    expect(isVideoUrl(`${PROD}library/clip.mp4`)).toBe(true);
    expect(isVideoUrl(`${PROD}library/clip.MOV?t=1`)).toBe(true);
    expect(isVideoUrl(`${PROD}library/a.bin`, 'video/webm')).toBe(true);
    expect(isVideoUrl(`${PROD}library/a.jpg`)).toBe(false);
  });

  it('a video tile whose only "poster" is the MP4 renders an icon, not an <img> of the video', () => {
    const html = renderToStaticMarkup(
      createElement(MediaThumb, { src: `${PROD}library/x.mp4`, isImage: false, posterUrl: `${PROD}library/x.mp4` })
    );
    expect(html).not.toContain('<img');
    expect(html).not.toContain('x.mp4');
  });

  it('an image tile requests a resized copy, not the original file', () => {
    const html = renderToStaticMarkup(createElement(MediaThumb, { src: `${PROD}library/big.jpg`, isImage: true }));
    expect(html).toContain('/_next/image?url=');
    expect(html).not.toMatch(/src="https:\/\/lokewuvbrrvmlgdwivoa[^"]*big\.jpg"/);
  });

  it('the large originals are shown from their web copies', () => {
    const html = renderToStaticMarkup(
      createElement(MediaThumb, { src: `${PROD}library/1773117243870-Photo784_Original.jpg`, isImage: true })
    );
    expect(html).toContain(encodeURIComponent('library/web/1773117243870-Photo784_Original-web3200-72a3a441af.jpg'));
  });

  it('an on-demand video renders no <video> (downloads nothing) until played', () => {
    const html = renderToStaticMarkup(
      createElement(OnDemandVideo, { src: `${PROD}library/clip.mp4`, label: 'Play video 01' })
    );
    expect(html).not.toContain('<video');
    expect(html).not.toContain('clip.mp4');
    expect(html).toContain('aria-label="Play video 01"');
  });
});
