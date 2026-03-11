import { useEffect, useRef, useState } from 'react';
import { Users, LayoutGrid, Building2, Handshake, Globe, ChevronRight, Search } from 'lucide-react';
import type { MemberPreview, WorkspaceType } from '../../types';

const PAGE_SIZE = 8;

export const WORKSPACE_TYPE_ICONS: Record<WorkspaceType, { icon: React.ElementType; color: string }> = {
  internal: { icon: Building2, color: 'text-blue-500' },
  partner:  { icon: Handshake,  color: 'text-purple-500' },
  public:   { icon: Globe,      color: 'text-green-500' },
};

// ── Members popover ──────────────────────────────────────────────────────────
export function MembersPopover({
  members,
  total,
  groups,
  onViewAll,
  triggerClassName,
}: {
  members: MemberPreview[];
  total: number;
  groups: number;
  onViewAll: () => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch(''); setShown(PAGE_SIZE);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : members;
  const visible = filtered.slice(0, shown);
  const hasMore = filtered.length > shown;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); if (!open) { setSearch(''); setShown(PAGE_SIZE); } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={triggerClassName ?? 'flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors'}
      >
        <Users size={11} className="text-gray-500" />
        <span className="font-medium">{total.toLocaleString()}</span>
      </button>

      {hovered && !open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none z-20">
          {total.toLocaleString()} users{groups > 0 ? ` · ${groups} groups` : ''}
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }}
                placeholder="Search members…"
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : (
              visible.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials[0]}
                  </div>
                  <span className="text-xs text-gray-700 truncate">{m.name}</span>
                </div>
              ))
            )}
            {hasMore && (
              <button
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - shown)} more…
              </button>
            )}
          </div>
          <div className="border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); onViewAll(); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
            >
              <span>View all {total.toLocaleString()} members</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workspaces popover ───────────────────────────────────────────────────────
export function WorkspacesPopover({
  workspaces,
  onViewAll,
  triggerClassName,
}: {
  workspaces: { id: string; name: string; type: WorkspaceType }[];
  onViewAll: () => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch(''); setShown(PAGE_SIZE);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? workspaces.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    : workspaces;
  const visible = filtered.slice(0, shown);
  const hasMore = filtered.length > shown;
  const total = workspaces.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); if (!open) { setSearch(''); setShown(PAGE_SIZE); } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={triggerClassName ?? 'flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors'}
      >
        <LayoutGrid size={11} className="text-gray-500" />
        <span className="font-medium">{total}</span>
      </button>

      {hovered && !open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none z-20">
          {total} workspaces
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }}
                placeholder="Search workspaces…"
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : (
              visible.map((ws) => {
                const { icon: TypeIcon, color } = WORKSPACE_TYPE_ICONS[ws.type];
                return (
                  <div key={ws.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                    <TypeIcon size={11} className={`${color} flex-shrink-0`} />
                    <span className="text-xs text-gray-700 truncate">{ws.name}</span>
                  </div>
                );
              })
            )}
            {hasMore && (
              <button
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - shown)} more…
              </button>
            )}
          </div>
          <div className="border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); onViewAll(); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
            >
              <span>View all {total} workspaces</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
