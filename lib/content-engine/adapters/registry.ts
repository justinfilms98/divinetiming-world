/**
 * Provider registry — the extensibility surface for the content engine.
 *
 * Each platform is described by its capabilities so the admin UI and pipeline
 * can treat providers uniformly. Adding a future platform (TikTok, Spotify, …)
 * means adding an entry here plus its adapter — the Approval Center and inbox
 * do not change. `manual` import is the universal, compliant fallback.
 */

export interface ProviderMeta {
  provider: string;
  label: string;
  /** Automated sync via an official API is implemented. */
  supportsSync: boolean;
  /** Manual URL import is supported (paste a link in the Content Inbox). */
  supportsManualImport: boolean;
  /** Short admin-facing status note. */
  note: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    provider: 'youtube',
    label: 'YouTube',
    supportsSync: true,
    supportsManualImport: true,
    note: 'Connect a channel to sync uploads automatically, or paste a video URL in the Content Inbox.',
  },
  {
    provider: 'instagram',
    label: 'Instagram',
    supportsSync: false,
    supportsManualImport: true,
    note: 'Manual import only for now: paste a post or reel URL in the Content Inbox. Direct API sync needs a Meta app with a Business/Creator account and will be added later.',
  },
];

export function getProviderMeta(provider: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.provider === provider);
}
