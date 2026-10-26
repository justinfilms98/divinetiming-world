'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/ui/cn';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' styles the confirm button red (deletes, disconnects). */
  tone?: 'default' | 'danger';
}

interface PromptOptions {
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  inputType?: 'text' | 'url';
}

interface AdminDialogApi {
  /** Resolves true when confirmed, false when cancelled or dismissed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Resolves the entered text, or null when cancelled. */
  prompt: (options: PromptOptions) => Promise<string | null>;
}

type Pending =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'prompt'; options: PromptOptions; resolve: (v: string | null) => void };

const AdminDialogContext = createContext<AdminDialogApi | null>(null);

/** In-app replacement for window.confirm/prompt: bottom sheet on phones, centred dialog on desktop. */
export function useAdminDialog(): AdminDialogApi {
  const ctx = useContext(AdminDialogContext);
  if (!ctx) throw new Error('useAdminDialog must be used inside AdminDialogProvider (AdminShell)');
  return ctx;
}

export function AdminDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ kind: 'confirm', options, resolve })),
    []
  );
  const prompt = useCallback(
    (options: PromptOptions) => new Promise<string | null>((resolve) => setPending({ kind: 'prompt', options, resolve })),
    []
  );

  const close = useCallback(
    (result: boolean | string | null) => {
      if (!pending) return;
      if (pending.kind === 'confirm') pending.resolve(result === true);
      else pending.resolve(typeof result === 'string' ? result : null);
      setPending(null);
    },
    [pending]
  );

  return (
    <AdminDialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {pending && <DialogView key={pending.options.title} pending={pending} onClose={close} />}
    </AdminDialogContext.Provider>
  );
}

function DialogView({ pending, onClose }: { pending: Pending; onClose: (result: boolean | string | null) => void }) {
  const isPrompt = pending.kind === 'prompt';
  const danger = pending.kind === 'confirm' && pending.options.tone === 'danger';
  const [value, setValue] = useState(isPrompt ? (pending.options as PromptOptions).defaultValue ?? '' : '');
  const primaryRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Destructive actions start focused on Cancel so Enter never deletes by accident.
    if (isPrompt) inputRef.current?.select();
    else if (!danger) primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(isPrompt ? null : false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [isPrompt, danger, onClose]);

  const { title, message } = pending.options;
  const confirmLabel = pending.options.confirmLabel ?? (danger ? 'Delete' : isPrompt ? 'Save' : 'Confirm');
  const cancelLabel = (pending.kind === 'confirm' && pending.options.cancelLabel) || 'Cancel';

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Dismiss"
        className="absolute inset-0 bg-black/70"
        onClick={() => onClose(isPrompt ? null : false)}
      />
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#141116] p-5 sm:p-6 shadow-2xl"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        onSubmit={(e) => {
          e.preventDefault();
          onClose(isPrompt ? value : true);
        }}
      >
        <div className="flex items-start gap-3">
          {danger && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <p id="admin-dialog-title" className="text-lg font-semibold text-[#f5f0e8]">
              {title}
            </p>
            {message && <p className="mt-1 text-sm leading-relaxed text-white/60">{message}</p>}
          </div>
        </div>
        {isPrompt && (
          <input
            ref={inputRef}
            type={(pending.options as PromptOptions).inputType ?? 'text'}
            value={value}
            placeholder={(pending.options as PromptOptions).placeholder}
            onChange={(e) => setValue(e.target.value)}
            className="mt-4"
            aria-label={title}
          />
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose(isPrompt ? null : false)}
            autoFocus={danger}
            className="admin-tap min-h-11 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
          >
            {cancelLabel}
          </button>
          <button
            ref={primaryRef}
            type="submit"
            className={cn(
              'admin-tap min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold',
              danger ? 'bg-red-600 text-white hover:bg-red-500' : 'admin-btn-primary'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
