import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, ChevronDown, ExternalLink, ChevronsUpDown, ChevronUp, SlidersHorizontal, Check } from 'lucide-react';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamRow } from '../components/teams/TeamRow';
import { useTeamsStore } from '../store/teamsStore';
import type { Team } from '../types';

type FilterMode = 'all' | 'my-teams' | 'not-member';
type SortMode = 'member-first' | 'az' | 'members' | 'workspaces';
type ViewMode = 'grid' | 'list';

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'Show all teams' },
  { value: 'my-teams', label: 'Only my teams' },
  { value: 'not-member', label: 'Only teams to join' },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'member-first', label: 'My teams first' },
  { value: 'az', label: 'A–Z' },
  { value: 'members', label: 'Members' },
  { value: 'workspaces', label: 'Workspaces' },
];

const DEFAULT_FILTER: FilterMode = 'all';
const DEFAULT_SORT: SortMode = 'member-first';
const VIEW_STORAGE_KEY = 'teams-view-mode';

function sortTeams(teams: Team[], mode: SortMode): Team[] {
  const starred = teams.filter((t) => t.isStarred);
  const rest = teams.filter((t) => !t.isStarred);

  function cmp(a: Team, b: Team): number {
    if (mode === 'member-first') {
      if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
      return a.name.localeCompare(b.name);
    }
    if (mode === 'az') return a.name.localeCompare(b.name);
    if (mode === 'members') return b.membersCount - a.membersCount;
    if (mode === 'workspaces') return b.workspacesCount - a.workspacesCount;
    return 0;
  }

  return [...starred.sort(cmp), ...rest.sort(cmp)];
}

// Membership sort order: member → collaborator → null
function membershipRank(role: Team['memberRole']): number {
  if (role === 'member') return 0;
  if (role === 'collaborator') return 1;
  return 2;
}

type SortCol = 'name' | 'members' | 'workspaces' | 'membership';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, active, dir }: { col: SortCol; active: SortCol; dir: SortDir }) {
  if (active !== col) return <ChevronsUpDown size={11} className="text-gray-400 ml-0.5" />;
  return dir === 'asc'
    ? <ChevronUp size={11} className="text-gray-700 ml-0.5" />
    : <ChevronDown size={11} className="text-gray-700 ml-0.5" />;
}

export function TeamsPage() {
  const { teams } = useTeamsStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>(DEFAULT_FILTER);
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT);
  const [view, setView] = useState<ViewMode>(
    () => (sessionStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null) ?? 'grid'
  );
  const [controlsOpen, setControlsOpen] = useState(false);

  const [listSortCol, setListSortCol] = useState<SortCol>('name');
  const [listSortDir, setListSortDir] = useState<SortDir>('asc');

  const controlsRef = useRef<HTMLDivElement>(null);

  const isCustomized = filter !== DEFAULT_FILTER || (view === 'grid' && sortMode !== DEFAULT_SORT);

  // Persist view preference
  function setViewAndPersist(v: ViewMode) {
    setView(v);
    sessionStorage.setItem(VIEW_STORAGE_KEY, v);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (controlsRef.current && !controlsRef.current.contains(e.target as Node)) setControlsOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleColSort(col: SortCol) {
    if (listSortCol === col) {
      setListSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setListSortCol(col);
      setListSortDir('asc');
    }
  }

  function handleReset() {
    setFilter(DEFAULT_FILTER);
    setSortMode(DEFAULT_SORT);
    setControlsOpen(false);
  }

  const filtered = useMemo(() => {
    let result = teams;
    if (filter === 'my-teams') result = result.filter((t) => t.isMember);
    if (filter === 'not-member') result = result.filter((t) => !t.isMember);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.handle.toLowerCase().includes(q)
      );
    }

    if (view === 'list') {
      const starred = result.filter((t) => t.isStarred);
      const rest = result.filter((t) => !t.isStarred);
      function listCmp(a: Team, b: Team) {
        let v = 0;
        if (listSortCol === 'name') v = a.name.localeCompare(b.name);
        else if (listSortCol === 'members') v = a.membersCount - b.membersCount;
        else if (listSortCol === 'workspaces') v = a.workspacesCount - b.workspacesCount;
        else if (listSortCol === 'membership') v = membershipRank(a.memberRole) - membershipRank(b.memberRole);
        return listSortDir === 'asc' ? v : -v;
      }
      return [...starred.sort(listCmp), ...rest.sort(listCmp)];
    }

    return sortTeams(result, sortMode);
  }, [teams, filter, sortMode, search, view, listSortCol, listSortDir]);

  return (
    <div className="px-8 pt-5 pb-10 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: 'Postman', to: '/' }, { label: 'Teams' }]} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Teams</h1>
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <ExternalLink size={12} />
          Open Settings
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
            className="input-base pl-7 w-52"
          />
        </div>

        {/* Merged filter + sort icon */}
        <div ref={controlsRef} className="relative">
          <button
            onClick={() => setControlsOpen(!controlsOpen)}
            title="Filter &amp; sort"
            className={`relative flex items-center justify-center w-7 h-7 rounded border transition-colors
              ${controlsOpen
                ? 'border-gray-400 bg-gray-100 text-gray-800'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-800'
              }`}
          >
            <SlidersHorizontal size={13} />
            {isCustomized && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
            )}
          </button>

          {controlsOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              {/* Filter section */}
              <p className="px-3 pt-1.5 pb-0.5 text-2xs font-semibold text-gray-400 uppercase tracking-wider">Show</p>
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${filter === opt.value ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                >
                  <span className="w-3 flex-shrink-0">
                    {filter === opt.value && <Check size={11} className="text-gray-700" />}
                  </span>
                  {opt.label}
                </button>
              ))}

              {/* Sort section (grid only) */}
              {view === 'grid' && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <p className="px-3 pt-1 pb-0.5 text-2xs font-semibold text-gray-400 uppercase tracking-wider">Sort by</p>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortMode(opt.value)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${sortMode === opt.value ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                    >
                      <span className="w-3 flex-shrink-0">
                        {sortMode === opt.value && <Check size={11} className="text-gray-700" />}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </>
              )}

              {/* Reset */}
              {isCustomized && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={handleReset}
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

        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden ml-auto">
          <button
            onClick={() => setViewAndPersist('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setViewAndPersist('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List view"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No teams found</div>
      ) : view === 'list' ? (
        <>
          <div className="flex items-center px-4 py-1.5 border-b border-gray-200">
            <button onClick={() => handleColSort('name')} className="flex items-center flex-1 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700">
              Name <SortIcon col="name" active={listSortCol} dir={listSortDir} />
            </button>
            <button onClick={() => handleColSort('members')} className="flex items-center w-56 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700">
              Members <SortIcon col="members" active={listSortCol} dir={listSortDir} />
            </button>
            <button onClick={() => handleColSort('workspaces')} className="flex items-center w-28 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700">
              Workspaces <SortIcon col="workspaces" active={listSortCol} dir={listSortDir} />
            </button>
            <button onClick={() => handleColSort('membership')} className="flex items-center w-36 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700">
              Your Membership <SortIcon col="membership" active={listSortCol} dir={listSortDir} />
            </button>
            <div className="w-24" />
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {filtered.map((team) => <TeamRow key={team.id} team={team} />)}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((team) => <TeamCard key={team.id} team={team} />)}
        </div>
      )}
    </div>
  );
}
