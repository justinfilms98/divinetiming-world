/**
 * Standardized API response helpers. Phase 14 — no raw error leaks.
 */

import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
