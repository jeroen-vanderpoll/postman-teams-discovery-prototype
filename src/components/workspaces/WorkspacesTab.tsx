import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { WorkspaceRow } from './WorkspaceRow';
import { WorkspaceCard } from './WorkspaceCard';
import { useWorkspacesStore } from '../../store/workspacesStore';
import type { Workspace, WorkspaceType } from '../../types';

type SortCol = 'name' | 'contributors' | 'type' | 'activity';
type SortDir = 'asc' | 'desc';

function sortWorkspaces(workspaces: Workspace[], col: SortCol, dir: SortDir): Workspace[] {
  const starred = workspaces.filter((w) => w.isStarred);
  const rest = workspaces.filter((w) => !w.isStarred);

  function cmp(a: Workspace, b: Workspace) {
    let v = 0;
    if (col === 'name') v = a.name.localeCompare(b.name);
    else if (col === 'contributors') v = a.contributorPreview.length - b.contributorPreview.length;
    else if (col === 'type') v = a.type.localeCompare(b.type);
    else if (col === 'activity') {
      v = new Date(a.lastActivityTimestamp).getTime() - new Date(b.lastActivityTimestamp).getTime();
    }
    return dir === 'asc' ? v : -v;
  }

  return [...starred.sort(cmp), ...rest.sort(cmp)];
}

function SortIcon({ col, active, dir }: { col: SortCol; active: SortCol; dir: SortDir }) {
  if (active !== col) return <ChevronsUpDown size={11} className="text-gray-400 ml-0.5" />;
  return dir === 'asc'
    ? <ChevronUp size={11} className="text-gray-700 ml-0.5" />
    : <ChevronDown size={11} className="text-gray-700 ml-0.5" />;
}

const TYPE_OPTIONS: { value: WorkspaceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'internal', label: 'Internal' },
  { value: 'partner', label: 'Partner' },
  { value: 'public', label: 'Public' },
];

interface WorkspacesTabProps {
  teamId: string;
  isMember: boolean;
}

export function WorkspacesTab({ teamId, isMember }: WorkspacesTabProps) {
  const { workspaces } = useWorkspacesStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WorkspaceType | 'all'>('all');
  const [sortCol, setSortCol] = useState<SortCol>('activity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleColSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'activity' ? 'desc' : 'asc');
    }
  }

  const teamWorkspaces = useMemo(() => {
    let result = workspaces.filter((w) => w.teamId === teamId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }

    if (typeFilter !== 'all') {
      result = result.filter((w) => w.type === typeFilter);
    }

    return sortWorkspaces(result, sortCol, sortDir);
  }, [workspaces, teamId, search, typeFilter, sortCol, sortDir]);

  const currentTypeLabel = TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'All types';

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces…"
            className="input-base pl-7 w-48"
          />
        </div>

        {/* Type filter */}
        <div ref={typeRef} className="relative">
          <button
            onClick={() => setTypeOpen(!typeOpen)}
            className="flex items-center gap-1.5 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 hover:border-gray-400 bg-white"
          >
            <span>{currentTypeLabel}</span>
            <ChevronDown size={11} className="text-gray-400" />
          </button>
          {typeOpen && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTypeFilter(opt.value); setTypeOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${typeFilter === opt.value ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden ml-auto">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List view"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* Non-member notice */}
      {!isMember && (
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
          Join this team to collaborate on workspaces.
        </div>
      )}

      {/* Column headers with sort (list view) */}
      {view === 'list' && teamWorkspaces.length > 0 && (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200">
          <button
            onClick={() => handleColSort('name')}
            className="flex items-center flex-1 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Name <SortIcon col="name" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('contributors')}
            className="flex items-center w-28 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Contributors <SortIcon col="contributors" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('type')}
            className="flex items-center w-24 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Type <SortIcon col="type" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('activity')}
            className="flex items-center w-32 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Activity <SortIcon col="activity" active={sortCol} dir={sortDir} />
          </button>
          {/* Actions spacer */}
          <div className="w-14" />
        </div>
      )}

      {/* Results */}
      {teamWorkspaces.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No workspaces found</div>
      ) : view === 'list' ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {teamWorkspaces.map((ws) => (
            <WorkspaceRow key={ws.id} workspace={ws} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {teamWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}
