'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';

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
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
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
          <span>
            {toast.type === 'success'
              ? toast.message || 'Saved'
              : toast.message || 'Something went wrong'}
          </span>
        </div>
      )}
    </AdminToastContext.Provider>
  );
}
