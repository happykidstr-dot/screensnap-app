'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Global toast function that can be called from anywhere
export const toast = (message: string, type: ToastType = 'success') => {
  const event = new CustomEvent('screensnap-toast', { detail: { message, type } });
  window.dispatchEvent(event);
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  useEffect(() => {
    const handleEvent = (e: any) => {
      const { message, type } = e.detail;
      addToast(message, type);
    };

    window.addEventListener('screensnap-toast', handleEvent);
    return () => window.removeEventListener('screensnap-toast', handleEvent);
  }, [addToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 duration-300
            ${t.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : 
              t.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' : 
              'bg-blue-500/20 border-blue-500/30 text-blue-100'}
          `}
          style={{ minWidth: '280px', maxWidth: '400px' }}
        >
          <div className="shrink-0">
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <p className="text-sm font-semibold flex-1 leading-tight">{t.message}</p>
          <button 
            onClick={() => removeToast(t.id)}
            className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ))}
    </div>
  );
}
