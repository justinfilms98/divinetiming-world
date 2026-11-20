export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;
  const { assertStagingIsolation } = await import('@/lib/env/stagingGuard');
  assertStagingIsolation();
}
