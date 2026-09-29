import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

const ToastContext = createContext(null);

const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

const TOAST_STYLES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      warning: (m) => push('warning', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm ${TOAST_STYLES[t.type]}`}
          >
            <span className="font-bold leading-none mt-px">{TOAST_ICONS[t.type]}</span>
            <p className="flex-1 break-words">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="opacity-50 hover:opacity-100 ml-1 leading-none"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
