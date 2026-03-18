
import React from 'react';
import { useToast, ToastType } from '../../context/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getColorClass = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'error': return 'bg-red-500 text-white shadow-red-500/20';
      case 'info': return 'bg-blue-500 text-white shadow-blue-500/20';
      default: return 'bg-slate-800 text-white shadow-slate-800/20';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getColorClass(toast.type)} pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-full fade-in duration-300 min-w-[300px] max-w-md`}
        >
          <span className="material-symbols-outlined">{getIcon(toast.type)}</span>
          <p className="text-sm font-black uppercase tracking-tight flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
