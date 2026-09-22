/**
 * Phase 1 Content Engine — server-only helpers (audit log, safe wrappers).
 * Import only from route handlers / server code.
 */

import 'server-only';
import type { getServiceClient } from '@/lib/supabase/service';

type ServiceClient = ReturnType<typeof getServiceClient>;

export interface AuditEntry {
  actorEmail: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit write. Never throws (auditing must not break the action),
 * and never stores secrets — callers must pass only safe metadata.
 */
export async function writeAudit(client: ServiceClient, entry: AuditEntry): Promise<void> {
  try {
    await client.from('content_audit_log').insert({
      actor_email: entry.actorEmail,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // Swallow: auditing is observability, not a hard dependency of the action.
  }
}
