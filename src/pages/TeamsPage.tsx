import { useState, useMemo } from 'react';
import { Search, LayoutGrid, List, ChevronDown, ExternalLink } from 'lucide-react';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamRow } from '../components/teams/TeamRow';
import { useTeamsStore } from '../store/teamsStore';
import type { Team } from '../types';

type FilterMode = 'all' | 'my-teams' | 'not-member';
type SortMode = 'az' | 'za' | 'members' | 'workspaces';
type ViewMode = 'grid' | 'list';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
  { value: 'members', label: 'Members (high → low)' },
  { value: 'workspaces', label: 'Workspaces (high → low)' },
];

function sortTeams(teams: Team[], sort: SortMode): Team[] {
  const starred = teams.filter((t) => t.isStarred);
  const rest = teams.filter((t) => !t.isStarred);

  function compareFn(a: Team, b: Team) {
    if (sort === 'az') return a.name.localeCompare(b.name);
    if (sort === 'za') return b.name.localeCompare(a.name);
    if (sort === 'members') return b.membersCount - a.membersCount;
    if (sort === 'workspaces') return b.workspacesCount - a.workspacesCount;
    return 0;
  }

  return [...starred.sort(compareFn), ...rest.sort(compareFn)];
}

export function TeamsPage() {
  const { teams } = useTeamsStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('az');
  const [view, setView] = useState<ViewMode>('list');
  const [sortOpen, setSortOpen] = useState(false);

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

    return sortTeams(result, sort);
  }, [teams, filter, sort, search]);

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'A–Z';

  return (
    <div className="px-8 pt-5 pb-10 max-w-4xl mx-auto">
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

        {/* Filter tabs */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
          {(
            [
              { value: 'all', label: 'All teams' },
              { value: 'my-teams', label: 'My teams' },
              { value: 'not-member', label: 'Not a member' },
            ] as { value: FilterMode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 border border-gray-200 rounded px-2.5 py-1.5 text-xs text-gray-700 hover:border-gray-400 bg-white"
          >
            <span>{currentSortLabel}</span>
            <ChevronDown size={11} className="text-gray-400" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${sort === opt.value ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {/* List column headers */}
      {view === 'list' && filtered.length > 0 && (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200 mb-0">
          <span className="flex-1 text-2xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
          <span className="w-32 text-2xs font-medium text-gray-500 uppercase tracking-wide">Users and Groups</span>
          <div className="w-28" />
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No teams found
        </div>
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
