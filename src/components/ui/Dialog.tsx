import { X } from 'lucide-react';
import { useEffect } from 'react';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export function Dialog({ title, onClose, children, width = 'w-96' }: DialogProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl ${width} max-w-[calc(100vw-2rem)]`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
