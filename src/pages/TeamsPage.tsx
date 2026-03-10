import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, ChevronDown, ExternalLink, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamRow } from '../components/teams/TeamRow';
import { useTeamsStore } from '../store/teamsStore';
import type { Team } from '../types';

type FilterMode = 'all' | 'my-teams' | 'not-member';
type SortCol = 'name' | 'members' | 'workspaces';
type SortDir = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'All teams' },
  { value: 'my-teams', label: 'My teams' },
  { value: 'not-member', label: 'Not a member' },
];

function sortTeams(teams: Team[], col: SortCol, dir: SortDir): Team[] {
  const starred = teams.filter((t) => t.isStarred);
  const rest = teams.filter((t) => !t.isStarred);

  function compareFn(a: Team, b: Team) {
    let v = 0;
    if (col === 'name') v = a.name.localeCompare(b.name);
    else if (col === 'members') v = a.membersCount - b.membersCount;
    else if (col === 'workspaces') v = a.workspacesCount - b.workspacesCount;
    return dir === 'asc' ? v : -v;
  }

  return [...starred.sort(compareFn), ...rest.sort(compareFn)];
}

function SortIcon({ col, active, dir }: { col: SortCol; active: SortCol; dir: SortDir }) {
  if (active !== col) return <ChevronsUpDown size={11} className="text-gray-400 ml-0.5" />;
  return dir === 'asc'
    ? <ChevronUp size={11} className="text-gray-700 ml-0.5" />
    : <ChevronDown size={11} className="text-gray-700 ml-0.5" />;
}

export function TeamsPage() {
  const { teams } = useTeamsStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortCol, setSortCol] = useState<SortCol>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [view, setView] = useState<ViewMode>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
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
      setSortDir('asc');
    }
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
    return sortTeams(result, sortCol, sortDir);
  }, [teams, filter, sortCol, sortDir, search]);

  const currentFilterLabel = FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'All teams';

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
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
            className="input-base pl-7 w-52"
          />
        </div>

        {/* Filter dropdown */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-1.5 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 hover:border-gray-400 bg-white"
          >
            <span>{currentFilterLabel}</span>
            <ChevronDown size={11} className="text-gray-400" />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilter(opt.value); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${filter === opt.value ? 'font-medium text-gray-900' : 'text-gray-600'}`}
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
            onClick={() => setView('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List view"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {/* List column headers with sort */}
      {view === 'list' && filtered.length > 0 && (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200">
          <button
            onClick={() => handleColSort('name')}
            className="flex items-center flex-1 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Name <SortIcon col="name" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('members')}
            className="flex items-center w-32 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Members <SortIcon col="members" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleColSort('workspaces')}
            className="flex items-center w-28 text-2xs font-medium text-gray-500 uppercase tracking-wide hover:text-gray-700"
          >
            Workspaces <SortIcon col="workspaces" active={sortCol} dir={sortDir} />
          </button>
          {/* Actions column spacer */}
          <div className="w-28" />
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No teams found</div>
      ) : view === 'list' ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {filtered.map((team) => (
            <TeamRow key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
