/**
 * Best-effort screen Wake Lock during long encode/upload work.
 * Unsupported browsers and denied permissions simply no-op.
 */

export type WakeLockHandle = { release: () => Promise<void> };

type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener?: (type: string, fn: () => void) => void };

export async function acquireWakeLock(): Promise<WakeLockHandle> {
  const empty: WakeLockHandle = { release: async () => undefined };
  if (typeof navigator === 'undefined') return empty;
  const lockApi = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } })
    .wakeLock;
  if (!lockApi?.request) return empty;

  try {
    const sentinel = await lockApi.request('screen');
    let released = false;
    const release = async () => {
      if (released) return;
      released = true;
      try {
        await sentinel.release();
      } catch {
        // already released / tab backgrounded
      }
    };
    sentinel.addEventListener?.('release', () => {
      released = true;
    });
    return { release };
  } catch {
    return empty;
  }
}
