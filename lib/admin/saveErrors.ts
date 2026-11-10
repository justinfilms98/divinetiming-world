/** Owner-facing message for a failed admin request. Always says whether the edits are still on screen. */

const GENERIC_SERVER_MESSAGES = new Set(['operation failed.', 'operation failed', 'failed', 'internal server error']);

export interface SaveErrorInput {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  /** `error` from the JSON response, if any. */
  serverMessage?: unknown;
  /** What was being saved, e.g. "slot 2" or "chapter “The land”". */
  subject: string;
  /** Defaults to true: the editor still holds the unsaved values. */
  editsKept?: boolean;
  /** Verb for the failed action. Defaults to "save". */
  action?: 'save' | 'load' | 'delete' | 'reorder';
  /** Replaces the default "Your changes are still here." sentence. */
  keptNote?: string;
}

export function describeSaveError({
  status,
  serverMessage,
  subject,
  editsKept = true,
  action = 'save',
  keptNote,
}: SaveErrorInput): string {
  const kept = editsKept ? ` ${keptNote ?? 'Your changes are still here.'}` : '';
  const verb = action;
  const detail = typeof serverMessage === 'string' ? serverMessage.trim() : '';
  const useful = detail && !GENERIC_SERVER_MESSAGES.has(detail.toLowerCase()) ? detail.replace(/\.+$/, '') : '';

  if (status === 0) {
    return `Couldn't ${verb} ${subject}: the server couldn't be reached. Check your connection and try again.${kept}`;
  }
  if (status === 401 || status === 403) {
    return `Couldn't ${verb} ${subject}: your admin session has ended. Sign in again in a new tab, then try again.${kept}`;
  }
  if (status === 404) {
    return `Couldn't ${verb} ${subject}: ${useful ? `${useful}.` : 'it no longer exists (it may have been deleted elsewhere). Refresh the page.'}${kept}`;
  }
  if (status === 400 || status === 413 || status === 422) {
    return `Couldn't ${verb} ${subject}: ${useful || 'the server rejected the change'}.${kept}`;
  }
  return `Couldn't ${verb} ${subject} (server error ${status}${useful ? `: ${useful}` : ''}). Try again in a moment.${kept}`;
}
