import { describe, expect, it } from 'vitest';
import { checkCtaLabel, checkCtaUrl, checkSocialUrl, instagramHandle, SOCIAL_HOSTS } from './externalLinks';

describe('checkSocialUrl', () => {
  it.each([
    ['https://soundcloud.com/divinetiming_music', SOCIAL_HOSTS.soundcloud, 'https://soundcloud.com/divinetiming_music'],
    ['  https://www.beatport.com/artist/divinetiming/1423755  ', SOCIAL_HOSTS.beatport, 'https://www.beatport.com/artist/divinetiming/1423755'],
    ['https://m.soundcloud.com/x', SOCIAL_HOSTS.soundcloud, 'https://m.soundcloud.com/x'],
    ['', SOCIAL_HOSTS.soundcloud, null],
    [null, SOCIAL_HOSTS.soundcloud, null],
  ])('accepts %s', (input, hosts, expected) => {
    expect(checkSocialUrl(input, hosts, 'X')).toEqual({ ok: true, value: expected });
  });

  it.each([
    ['http://soundcloud.com/x', 'must start with https://'],
    ['soundcloud.com/x', 'full address'],
    ['https://evil.example/soundcloud.com', 'must be on soundcloud.com'],
    ['https://soundcloud.com.evil.example/x', 'must be on soundcloud.com'],
    ['https://user:pw@soundcloud.com/x', 'login'],
    ['javascript:alert(1)', 'https://'],
    [`https://soundcloud.com/${'a'.repeat(300)}`, 'too long'],
    [42, 'must be text'],
  ])('rejects %s', (input, message) => {
    const result = checkSocialUrl(input, SOCIAL_HOSTS.soundcloud, 'SoundCloud');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});

describe('instagramHandle', () => {
  it.each([
    ['https://www.instagram.com/divinetimingworld', '@divinetimingworld'],
    ['https://instagram.com/DivineTiming_OFC/', '@divinetiming_ofc'],
    ['https://www.instagram.com/divinetiming_ofc?hl=en', '@divinetiming_ofc'],
    ['https://www.instagram.com/', null],
    ['https://example.com/divinetimingworld', null],
    ['not a url', null],
    [null, null],
  ])('%s → %s', (input, expected) => {
    expect(instagramHandle(input)).toBe(expected);
  });
});

describe('checkCtaUrl', () => {
  it.each([
    ['/music', '/music'],
    ['/#tribe', '/#tribe'],
    ['#tribe', '#tribe'],
    ['/booking?from=hero', '/booking?from=hero'],
    ['https://open.spotify.com/artist/x', 'https://open.spotify.com/artist/x'],
    ['', null],
  ])('accepts %s', (input, expected) => {
    expect(checkCtaUrl(input)).toEqual({ ok: true, value: expected });
  });

  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', '//evil.example', '/\\evil.example', 'http://insecure.example', '#', '#1bad', '/a b', 'mailto:x@y.z'])(
    'rejects %s',
    (input) => {
      expect(checkCtaUrl(input).ok).toBe(false);
    }
  );
});

describe('checkCtaLabel', () => {
  it('trims and limits the label', () => {
    expect(checkCtaLabel('  Join the tribe ')).toEqual({ ok: true, value: 'Join the tribe' });
    expect(checkCtaLabel('').ok).toBe(true);
    expect(checkCtaLabel('x'.repeat(41)).ok).toBe(false);
  });
});
