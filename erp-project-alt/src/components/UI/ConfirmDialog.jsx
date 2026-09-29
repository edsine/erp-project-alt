import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, options: null });
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        open: true,
        options: {
          title: options.title || 'Are you sure?',
          message: options.message || '',
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          danger: !!options.danger,
        },
      });
    });
  }, []);

  const close = useCallback((result) => {
    setState((s) => ({ ...s, open: false }));
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => close(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={state.options.title}
            className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800">{state.options.title}</h3>
            {state.options.message && (
              <p className="mt-2 text-sm text-gray-500 break-words">{state.options.message}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
              >
                {state.options.cancelLabel}
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                  state.options.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#1E5269] hover:bg-[#1E5269]/90'
                }`}
              >
                {state.options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
