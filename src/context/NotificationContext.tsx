import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message?: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((type: NotificationType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { id, type, title, message, timestamp: Date.now() };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss après 4.5 secondes
    setTimeout(() => {
      removeNotification(id);
    }, 4500);
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
                isSuccess
                  ? 'bg-white border-emerald-200 text-slate-800'
                  : isError
                  ? 'bg-white border-rose-200 text-slate-800'
                  : isWarning
                  ? 'bg-white border-orange-200 text-slate-800'
                  : 'bg-white border-blue-200 text-slate-800'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-orange-600" />}
                {isInfo && <Info className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
                {toast.message && (
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>

              <button
                onClick={() => removeNotification(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé à l\'intérieur de NotificationProvider');
  }
  return context;
}
