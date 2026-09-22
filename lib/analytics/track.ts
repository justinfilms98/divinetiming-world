/**
 * Client-side analytics tracking. Posts to first-party /api/analytics/track.
 * Session id lives in sessionStorage (`dt_sid`), not a cookie. No IP, no
 * advertising pixels, no third-party analytics SDKs. A cookie-consent banner
 * is not required for this tracker; YouTube embeds elsewhere are a separate
 * question and should stay load-on-click if EU consent is later required.
 * Fails silently so UI is never blocked.
 */

const ENDPOINT = '/api/analytics/track';

export interface TrackPayload {
  event_name: string;
  path?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = sessionStorage.getItem('dt_sid');
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('dt_sid', id);
    }
    return id;
  } catch {
    return '';
  }
}

export function track(payload: TrackPayload): void {
  if (typeof window === 'undefined') return;
  const sessionId = getSessionId();
  const body = {
    ...payload,
    path: payload.path ?? window.location.pathname,
    session_id: sessionId,
  };
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
