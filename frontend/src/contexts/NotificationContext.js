import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

let idSeq = 0;

export function NotificationProvider({ children, defaultPosition = 'top-right', maxToasts = 5, duration = 4000 }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((type, message, opts = {}) => {
    const id = ++idSeq;
    const toast = {
      id,
      type, // 'success' | 'error' | 'info' | 'warning'
      message,
      position: opts.position || defaultPosition,
      duration: opts.duration ?? duration,
    };
    setToasts((prev) => {
      const next = [...prev, toast];
      // trim to max
      if (next.length > maxToasts) next.shift();
      return next;
    });
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
    return id;
  }, [defaultPosition, duration, maxToasts, remove]);

  const api = useMemo(() => ({
    success: (msg, opts) => notify('success', msg, opts),
    error: (msg, opts) => notify('error', msg, opts),
    info: (msg, opts) => notify('info', msg, opts),
    warning: (msg, opts) => notify('warning', msg, opts),
    remove,
    toasts,
  }), [notify, remove, toasts]);

  return (
    <NotificationContext.Provider value={api}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
