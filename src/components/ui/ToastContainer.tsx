import { X, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2.5 bg-gray-900 text-white text-xs px-3 py-2.5 rounded-lg shadow-lg min-w-[240px] max-w-sm"
        >
          {toast.type === 'success' && <CheckCircle size={14} className="text-green-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info size={14} className="text-blue-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={14} className="text-red-400 flex-shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
