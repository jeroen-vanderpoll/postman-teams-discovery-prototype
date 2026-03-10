import { useState, useMemo } from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { WorkspaceRow } from './WorkspaceRow';
import { WorkspaceCard } from './WorkspaceCard';
import { useWorkspacesStore } from '../../store/workspacesStore';
import type { Workspace } from '../../types';

type WSSortMode = 'recent' | 'az';

function sortWorkspaces(workspaces: Workspace[], sort: WSSortMode): Workspace[] {
  const starred = workspaces.filter((w) => w.isStarred);
  const rest = workspaces.filter((w) => !w.isStarred);

  function cmp(a: Workspace, b: Workspace) {
    if (sort === 'recent') {
      return new Date(b.lastActivityTimestamp).getTime() - new Date(a.lastActivityTimestamp).getTime();
    }
    return a.name.localeCompare(b.name);
  }

  return [...starred.sort(cmp), ...rest.sort(cmp)];
}

interface WorkspacesTabProps {
  teamId: string;
  isMember: boolean;
}

export function WorkspacesTab({ teamId, isMember }: WorkspacesTabProps) {
  const { workspaces } = useWorkspacesStore();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<WSSortMode>('recent');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const teamWorkspaces = useMemo(() => {
    let result = workspaces.filter((w) => w.teamId === teamId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }

    return sortWorkspaces(result, sort);
  }, [workspaces, teamId, search, sort]);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workspaces…"
            className="input-base pl-7 w-48"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden">
          <button
            onClick={() => setSort('recent')}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              sort === 'recent' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Most recent
          </button>
          <button
            onClick={() => setSort('az')}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              sort === 'az' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            A–Z
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden ml-auto">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {/* Non-member notice for open teams */}
      {!isMember && (
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
          Join this team to collaborate on workspaces.
        </div>
      )}

      {/* Column headers (list view) */}
      {view === 'list' && teamWorkspaces.length > 0 && (
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200">
          <span className="flex-1 text-2xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
          <span className="w-24 text-2xs font-medium text-gray-500 uppercase tracking-wide">Contributors</span>
          <span className="w-20 text-2xs font-medium text-gray-500 uppercase tracking-wide">Type</span>
          <span className="w-28 text-2xs font-medium text-gray-500 uppercase tracking-wide">Activity</span>
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
