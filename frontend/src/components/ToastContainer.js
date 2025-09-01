import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const typeStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-600" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  },
};

function positionClass(position) {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-right':
    default:
      return 'bottom-4 right-4';
  }
}

export function ToastContainer() {
  const { toasts, remove } = useNotifications();
  const pos = toasts[0]?.position || 'top-right';

  return (
    <div className={`fixed z-50 pointer-events-none ${positionClass(pos)} space-y-2 max-w-sm w-[90vw] sm:w-96`}>
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const s = typeStyles[t.type] || typeStyles.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto ${s.bg} ${s.border} border shadow-sm rounded-md p-3 flex items-start gap-3`}
              role="status"
              aria-live="polite"
            >
              <div className="mt-0.5">{s.icon}</div>
              <div className={`text-sm ${s.text} flex-1`}>{t.message}</div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
