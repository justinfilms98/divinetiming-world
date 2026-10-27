/**
 * One year, for storage objects whose path is unique per upload and never overwritten.
 * Replacing media always creates a new path, so visitors never get a stale copy.
 * Do not use for fixed paths such as `hero/<page>.jpg`, which are overwritten in place.
 */
export const IMMUTABLE_CACHE_SECONDS = '31536000';
