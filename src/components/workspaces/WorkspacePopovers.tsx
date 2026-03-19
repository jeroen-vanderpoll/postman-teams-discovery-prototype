import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { Activity, Users, FolderOpen, Search } from 'lucide-react';
import type { WorkspaceCollection, WorkspaceContributor, WorkspaceContributorRole } from '../../types';

const PAGE_SIZE = 8;
const ROLE_ORDER: WorkspaceContributorRole[] = ['admin', 'editor', 'viewer'];

function roleLabel(role: WorkspaceContributorRole): string {
  if (role === 'admin') return 'Admin';
  if (role === 'editor') return 'Editor';
  return 'Viewer';
}

function usePopoverState() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
        setShown(PAGE_SIZE);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function toggle(e: ReactMouseEvent) {
    e.stopPropagation();
    setOpen((v) => !v);
    if (!open) {
      setSearch('');
      setShown(PAGE_SIZE);
    }
  }

  return {
    ref,
    open,
    hovered,
    search,
    shown,
    setOpen,
    setHovered,
    setSearch,
    setShown,
    toggle,
  };
}

export function ContributorsPopover({
  contributors,
  total,
  status,
  triggerClassName,
}: {
  contributors: WorkspaceContributor[];
  total: number;
  status?: { label: string; colorClass?: string; bgClass?: string };
  triggerClassName?: string;
}) {
  const state = usePopoverState();
  const sorted = [...contributors].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name)
  );
  const filtered = state.search.trim()
    ? sorted.filter(
        (c) =>
          c.name.toLowerCase().includes(state.search.toLowerCase()) ||
          roleLabel(c.role).toLowerCase().includes(state.search.toLowerCase())
      )
    : sorted;
  const visible = filtered.slice(0, state.shown);
  const hasMore = filtered.length > state.shown;

  return (
    <div ref={state.ref} className="relative">
      <button
        onClick={state.toggle}
        onMouseEnter={() => state.setHovered(true)}
        onMouseLeave={() => state.setHovered(false)}
        className={triggerClassName ?? 'flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors'}
      >
        <Users size={11} className="text-gray-500" />
        <span className="font-medium w-[1.75rem] text-left tabular-nums">{total.toLocaleString()}</span>
        {status && (
          <span data-secondary className={`inline-flex items-center gap-0.5 font-normal rounded px-1 py-px min-h-[18px] ${status.bgClass ?? 'bg-gray-100'} ${status.colorClass ?? 'text-gray-400'}`}>
            <Activity size={10} className="flex-shrink-0" />
            {status.label}
          </span>
        )}
      </button>

      {state.hovered && !state.open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none z-20">
          {total.toLocaleString()} contributors{status ? ` · ${status.label} active` : ''}
        </div>
      )}

      {state.open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={state.search}
                onChange={(e) => { state.setSearch(e.target.value); state.setShown(PAGE_SIZE); }}
                placeholder="Search contributors..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : (
              visible.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: c.avatarColor }}
                  >
                    {c.initials.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-700 truncate">{c.name}</p>
                  </div>
                  <span className="text-2xs text-gray-500 capitalize">{roleLabel(c.role)}</span>
                </div>
              ))
            )}
            {hasMore && (
              <button
                onClick={() => state.setShown((s) => s + PAGE_SIZE)}
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - state.shown)} more...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CollectionsPopover({
  collections,
  total,
  status,
  triggerClassName,
}: {
  collections: WorkspaceCollection[];
  total: number;
  status?: { label: string; colorClass?: string; bgClass?: string };
  triggerClassName?: string;
}) {
  const state = usePopoverState();
  const filtered = state.search.trim()
    ? collections.filter((c) => c.name.toLowerCase().includes(state.search.toLowerCase()))
    : collections;
  const visible = filtered.slice(0, state.shown);
  const hasMore = filtered.length > state.shown;

  return (
    <div ref={state.ref} className="relative">
      <button
        onClick={state.toggle}
        onMouseEnter={() => state.setHovered(true)}
        onMouseLeave={() => state.setHovered(false)}
        className={triggerClassName ?? 'flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors'}
      >
        <FolderOpen size={11} className="text-gray-500" />
        <span className="font-medium w-[1.75rem] text-left tabular-nums">{total.toLocaleString()}</span>
        {status && (
          <span data-secondary className={`inline-flex items-center gap-0.5 font-normal rounded px-1 py-px min-h-[18px] ${status.bgClass ?? 'bg-gray-100'} ${status.colorClass ?? 'text-gray-400'}`}>
            <Activity size={10} className="flex-shrink-0" />
            {status.label}
          </span>
        )}
      </button>

      {state.hovered && !state.open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none z-20">
          {total.toLocaleString()} collections{status ? ` · ${status.label} active` : ''}
        </div>
      )}

      {state.open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={state.search}
                onChange={(e) => { state.setSearch(e.target.value); state.setShown(PAGE_SIZE); }}
                placeholder="Search collections..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : (
              visible.map((collection) => (
                <div key={collection.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                  <FolderOpen size={11} className="text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700 truncate">{collection.name}</span>
                </div>
              ))
            )}
            {hasMore && (
              <button
                onClick={() => state.setShown((s) => s + PAGE_SIZE)}
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - state.shown)} more...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminsPopover({
  admins,
  trigger,
}: {
  admins: WorkspaceContributor[];
  trigger: ReactNode;
}) {
  const state = usePopoverState();

  return (
    <div ref={state.ref} className="relative">
      <button
        onClick={(e) => {
          if (admins.length > 1) state.toggle(e);
          else e.stopPropagation();
        }}
        className={admins.length > 1 ? 'cursor-pointer' : 'cursor-default'}
      >
        {trigger}
      </button>

      {state.open && admins.length > 1 && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          <div className="px-3 py-2 border-b border-gray-100 text-xs font-medium text-gray-600 flex items-center justify-between">
            <span>Admins</span>
            <span className="text-gray-400">{admins.length}</span>
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: admin.avatarColor }}
                >
                  {admin.initials.slice(0, 2)}
                </div>
                <span className="text-xs text-gray-700 truncate">{admin.name}</span>
                <span className="text-2xs text-gray-500 ml-auto">Admin</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
