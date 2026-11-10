'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastState {
  type: ToastType;
  message?: string;
}

interface AdminToastContextValue {
  showToast: (type: ToastType, message?: string) => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;
/** Errors carry instructions, so they stay long enough to read (and can be dismissed). */
const ERROR_TOAST_DURATION_MS = 12000;

export function useAdminToast(): AdminToastContextValue {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    return {
      showToast: (type, message) => {
        if (type === 'error' && typeof message === 'string') {
          // Fallback if used outside provider (e.g. in a page that doesn't wrap with provider)
          console.warn('[AdminToast] Used outside provider. Error:', message);
        }
      },
    };
  }
  return ctx;
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastType, message?: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ type, message });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, type === 'error' ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS);
  }, []);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setToast(null);
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          // Phones: above the bottom tab bar, full width. Desktop: top-right.
          className={`fixed z-[130] left-4 right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:left-auto md:bottom-auto md:top-4 md:right-4 md:max-w-sm flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="min-w-0 flex-1">
            {toast.type === 'success'
              ? toast.message || 'Saved'
              : toast.message || 'Something went wrong'}
          </span>
          {toast.type === 'error' && (
            <button
              type="button"
              onClick={dismiss}
              className="admin-icon-btn shrink-0 -mr-2 rounded text-white/90 hover:bg-white/15"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </AdminToastContext.Provider>
  );
}
