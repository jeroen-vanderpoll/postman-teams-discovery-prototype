import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, ChevronsUpDown, ChevronUp, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';
import { WorkspaceRow } from './WorkspaceRow';
import { WorkspaceCard } from './WorkspaceCard';
import { Avatar } from '../ui/Avatar';
import { useWorkspacesStore } from '../../store/workspacesStore';
import { useToastStore } from '../../store/toastStore';
import { getAccessibleTeamWorkspaces } from '../../utils/workspaceAccess';
import type { Workspace, WorkspaceType } from '../../types';

type SortCol = 'name' | 'contributors' | 'collections' | 'activity';
type SortDir = 'asc' | 'desc';

function sortWorkspaces(workspaces: Workspace[], col: SortCol, dir: SortDir): Workspace[] {
  const starred = workspaces.filter((w) => w.isStarred);
  const rest = workspaces.filter((w) => !w.isStarred);

  function cmp(a: Workspace, b: Workspace) {
    let v = 0;
    if (col === 'name') v = a.name.localeCompare(b.name);
    else if (col === 'contributors') v = a.contributorsCount - b.contributorsCount;
    else if (col === 'collections') v = a.collectionsCount - b.collectionsCount;
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

const TYPE_OPTIONS: { value: WorkspaceType; label: string }[] = [
  { value: 'internal', label: 'Internal' },
  { value: 'partner', label: 'Partner' },
  { value: 'public', label: 'Public' },
];

const SORT_OPTIONS: { value: SortCol; label: string }[] = [
  { value: 'activity', label: 'Activity' },
  { value: 'name', label: 'Name' },
  { value: 'contributors', label: 'Contributors' },
  { value: 'collections', label: 'Collections' },
];

interface WorkspacesTabProps {
  teamId: string;
  isMember: boolean;
  isTeamOpen?: boolean;
}

export function WorkspacesTab({ teamId, isMember, isTeamOpen = true }: WorkspacesTabProps) {
  const { workspaces } = useWorkspacesStore();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState('');
  const ALL_TYPES = TYPE_OPTIONS.map((o) => o.value);
  const [typeFilters, setTypeFilters] = useState<WorkspaceType[]>(ALL_TYPES);
  const [selectedContributorNames, setSelectedContributorNames] = useState<string[]>([]);
  const [contributorSearch, setContributorSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('activity');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [controlsOpen, setControlsOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) {
        setControlsOpen(false);
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

  function setGridSort(col: SortCol) {
    setSortCol(col);
    setSortDir(col === 'activity' ? 'desc' : 'asc');
  }

  function toggleTypeFilter(value: WorkspaceType) {
    setTypeFilters((prev) => {
      const has = prev.includes(value);
      if (has) {
        // Keep at least one type selected.
        if (prev.length === 1) return prev;
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  }

  const allTypesSelected = typeFilters.length === ALL_TYPES.length;
  const isCustomized =
    !allTypesSelected ||
    selectedContributorNames.length > 0 ||
    (view === 'grid' && (sortCol !== 'activity' || sortDir !== 'desc'));

  const baseTeamWorkspaces = useMemo(() => {
    return getAccessibleTeamWorkspaces({
      workspaces,
      teamId,
      isTeamMember: isMember,
      isTeamOpen,
    });
  }, [workspaces, teamId, isMember, isTeamOpen]);

  const contributorOptions = useMemo(() => {
    const byName = new Map<string, { name: string; initials: string; avatarColor: string }>();
    baseTeamWorkspaces.forEach((w) => {
      w.contributors.forEach((c) => {
        if (!byName.has(c.name)) {
          byName.set(c.name, {
            name: c.name,
            initials: c.initials,
            avatarColor: c.avatarColor,
          });
        }
      });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [baseTeamWorkspaces]);

  const shownContributorOptions = useMemo(() => {
    if (!contributorSearch.trim()) return contributorOptions;
    const q = contributorSearch.toLowerCase();
    return contributorOptions.filter((c) => c.name.toLowerCase().includes(q));
  }, [contributorOptions, contributorSearch]);

  function toggleContributor(name: string) {
    setSelectedContributorNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  const teamWorkspaces = useMemo(() => {
    let result = baseTeamWorkspaces;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }

    result = result.filter((w) => typeFilters.includes(w.type));
    if (selectedContributorNames.length > 0) {
      result = result.filter((w) =>
        w.contributors.some((c) => selectedContributorNames.includes(c.name))
      );
    }

    return sortWorkspaces(result, sortCol, sortDir);
  }, [baseTeamWorkspaces, search, typeFilters, selectedContributorNames, sortCol, sortDir]);

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

        {/* Merged filter + sort control */}
        <div ref={controlsRef} className="relative">
          <button
            onClick={() => setControlsOpen(!controlsOpen)}
            title="Filter & sort"
            className={`relative flex items-center justify-center p-1.5 rounded transition-colors ${
              controlsOpen
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <SlidersHorizontal size={13} />
            {isCustomized && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>

          {controlsOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <p className="px-3 pt-1.5 pb-0.5 text-2xs font-semibold text-gray-400">Show</p>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleTypeFilter(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${typeFilters.includes(opt.value) ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                >
                  <span className="w-3 flex-shrink-0">
                    {typeFilters.includes(opt.value) && <Check size={11} className="text-gray-700" />}
                  </span>
                  {opt.label}
                </button>
              ))}

              {view === 'grid' && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <p className="px-3 pt-1 pb-0.5 text-2xs font-semibold text-gray-400">Sort by</p>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGridSort(opt.value)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${sortCol === opt.value ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                    >
                      <span className="w-3 flex-shrink-0">
                        {sortCol === opt.value && <Check size={11} className="text-gray-700" />}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </>
              )}

              <div className="border-t border-gray-100 my-1" />
              <p className="px-3 pt-1 pb-0.5 text-2xs font-semibold text-gray-400">Contributors</p>
              <div className="px-3 pb-1">
                <div className="relative">
                  <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={contributorSearch}
                    onChange={(e) => setContributorSearch(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="max-h-44 overflow-y-auto py-1">
                {shownContributorOptions.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400 text-center">No matches</p>
                ) : (
                  shownContributorOptions.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => toggleContributor(c.name)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${selectedContributorNames.includes(c.name) ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                    >
                      <span className="w-3 flex-shrink-0">
                        {selectedContributorNames.includes(c.name) && (
                          <Check size={11} className="text-gray-700" />
                        )}
                      </span>
                      <Avatar initials={c.initials} color={c.avatarColor} size="xs" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))
                )}
              </div>
              {selectedContributorNames.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => setSelectedContributorNames([])}
                    className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    Clear selected
                  </button>
                </>
              )}

              {isCustomized && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setTypeFilters(ALL_TYPES);
                      setSelectedContributorNames([]);
                      setContributorSearch('');
                      setSortCol('activity');
                      setSortDir('desc');
                      setControlsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-2"
                  >
                    <span className="w-3 flex-shrink-0" />
                    Reset
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right-side actions */}
        {isMember && (
          <button
            onClick={() => addToast('Create workspace flow coming soon', 'info')}
            className="btn-primary text-2xs px-2.5 py-1.5 ml-auto"
          >
            Create workspace
          </button>
        )}
        <div className={`flex items-center border border-gray-200 rounded overflow-hidden ${isMember ? '' : 'ml-auto'}`}>
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
          You are seeing the workspaces you can access in this team.
        </div>
      )}

      {/* Column headers with sort (list view) */}
      {view === 'list' && teamWorkspaces.length > 0 && (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200">
          <button
            onClick={() => handleColSort('name')}
            className="flex items-center flex-1 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Name <SortIcon col="name" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('contributors')}
            className="flex items-center w-32 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Contributors <SortIcon col="contributors" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('collections')}
            className="flex items-center w-24 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Collections <SortIcon col="collections" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('activity')}
            className="flex items-center w-36 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Activity <SortIcon col="activity" active={sortCol} dir={sortDir} />
          </button>
          <div className="w-28 text-2xs font-medium text-gray-500">Your role</div>
          {/* Actions spacer */}
          <div className="w-14" />
        </div>
      )}

      {/* Results */}
      {teamWorkspaces.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No accessible workspaces found
        </div>
      ) : view === 'list' ? (
        <div className="divide-y divide-gray-100">
          {teamWorkspaces.map((ws) => (
            <WorkspaceRow key={ws.id} workspace={ws} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {teamWorkspaces.map((ws) => (
            <WorkspaceCard key={ws.id} workspace={ws} />
          ))}
          {isMember && (
            <div className="card px-3 py-3 flex flex-col justify-between gap-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-xs text-gray-600">Need another workspace?</p>
              <button
                onClick={() => addToast('Create workspace flow coming soon', 'info')}
                className="btn-secondary text-2xs px-2 py-1"
              >
                Create workspace
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
