/**
 * Publication status rules shared by the admin save routes (events, collections,
 * products, releases). New items are never public unless the request explicitly
 * asks for it; an edit that omits the status keeps whatever the item already has.
 */

/** Returns the requested status when it is one of `allowed`, otherwise null. */
export function requestedStatus<T extends string>(input: unknown, allowed: readonly T[]): T | null {
  return typeof input === 'string' && (allowed as readonly string[]).includes(input) ? (input as T) : null;
}

/** Status for a newly created item: the explicit request, else Draft. */
export function statusForCreate<T extends string>(input: unknown, allowed: readonly T[]): T | 'draft' {
  return requestedStatus(input, allowed) ?? 'draft';
}
