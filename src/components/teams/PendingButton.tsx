import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface PendingButtonProps {
  onWithdraw: () => void;
  size?: 'xs' | 'sm';
}

export function PendingButton({ onWithdraw, size = 'sm' }: PendingButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleMouseEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    leaveTimer.current = setTimeout(() => setOpen(false), 200);
  }

  const btnClass = size === 'xs'
    ? 'btn-secondary text-2xs px-2 py-0.5 opacity-50 cursor-default'
    : 'btn-secondary text-2xs px-2.5 py-1 opacity-50 cursor-default';

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className={btnClass} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        Join
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1.5"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-500">
            <Clock size={11} className="text-gray-400 flex-shrink-0" />
            <span>Request pending</span>
          </div>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onWithdraw(); }}
              className="w-full text-left px-3 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              Withdraw request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
