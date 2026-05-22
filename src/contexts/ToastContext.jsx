import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ToastViewport } from '@components/ui/Toast';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4500;
const MAX_STACK = 5;

let counter = 0;
const nextId = () => `t_${++counter}_${Date.now()}`;

export function ToastProvider({ children, position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback((toast) => {
    const id = nextId();
    const next = {
      id,
      duration: DEFAULT_DURATION,
      variant: 'info',
      ...toast,
    };
    setToasts((prev) => {
      const updated = [...prev, next];
      return updated.length > MAX_STACK ? updated.slice(-MAX_STACK) : updated;
    });
    if (next.duration > 0) {
      const timer = setTimeout(() => dismiss(id), next.duration);
      timersRef.current.set(id, timer);
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      show:    (opts) => push(opts),
      success: (message, opts) => push({ ...opts, message, variant: 'success' }),
      error:   (message, opts) => push({ ...opts, message, variant: 'error' }),
      info:    (message, opts) => push({ ...opts, message, variant: 'info' }),
      warning: (message, opts) => push({ ...opts, message, variant: 'warning' }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} position={position} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
