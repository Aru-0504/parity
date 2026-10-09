import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => addToast('success', msg), [addToast]);
  const error = useCallback((msg: string) => addToast('error', msg), [addToast]);
  const info = useCallback((msg: string) => addToast('info', msg), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 border bg-white ${
              t.type === 'success'
                ? 'border-[#CCD8BF]'
                : t.type === 'error'
                ? 'border-[#E8C6CA]'
                : 'border-[#C8D9E6]'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && (
                <div className="w-5 h-5 rounded-full bg-[#F0F5EA] flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7D8C62]" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-5 h-5 rounded-full bg-[#F9ECEE] flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-[#934E55]" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-5 h-5 rounded-full bg-[#EBF2F5] flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-[#567C8D]" />
                </div>
              )}
            </div>

            <p className="flex-1 text-xs font-semibold text-[#2F4156] leading-relaxed">
              {t.message}
            </p>

            <button
              onClick={() => removeToast(t.id)}
              className="text-[#8A9BA8] hover:text-[#2F4156] p-0.5 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
