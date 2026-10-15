import React, { createContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const notifySuccess = useCallback((msg, duration) => addNotification(msg, 'success', duration), [addNotification]);
  const notifyError = useCallback((msg, duration) => addNotification(msg, 'error', duration), [addNotification]);
  const notifyInfo = useCallback((msg, duration) => addNotification(msg, 'info', duration), [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all transform translate-y-0 ${
              item.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : item.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />}
            {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />}
            {item.type === 'info' && <Info className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />}

            <div className="flex-1 text-sm font-medium">{item.message}</div>

            <button
              onClick={() => removeNotification(item.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
