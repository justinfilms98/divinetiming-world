/**
 * Client-side analytics tracking. Posts to /api/analytics/track.
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
