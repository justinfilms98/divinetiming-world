/**
 * Feature flags. Client- and server-safe (uses NEXT_PUBLIC_ vars only here).
 *
 * Content Inbox (Phase 1 content engine) is OFF by default so nothing changes
 * on the existing site until explicitly enabled. Set
 * NEXT_PUBLIC_CONTENT_INBOX_ENABLED=1 to reveal the admin Inbox and enable its
 * API routes. Disabling the flag hides the feature without removing any data.
 */

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function isContentInboxEnabled(): boolean {
  return isTruthyFlag(process.env.NEXT_PUBLIC_CONTENT_INBOX_ENABLED);
}
