import { useMemo, useState } from 'react';
import { Activity, ExternalLink, GitBranch, LayoutGrid, List, Lock, Sparkles, Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { TeamCard } from '../components/teams/TeamCard';
import { Avatar } from '../components/ui/Avatar';
import { DatabaseTable, type DatabaseTableColumn, type DatabaseTableState } from '../components/ui/DatabaseTable';
import { TableAgentPane } from '../components/ui/TableAgentPane';
import { TableGridControls } from '../components/ui/TableGridControls';
import { JoinRequestModal } from '../components/teams/JoinRequestModal';
import { PendingButton } from '../components/teams/PendingButton';
import { useTeamsStore } from '../store/teamsStore';
import { useToastStore } from '../store/toastStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { MembersPopover, WorkspacesPopover } from '../components/teams/TeamPopovers';
import { getAccessibleTeamWorkspaces } from '../utils/workspaceAccess';
import { buildTeamMemberPreviewList } from '../utils/teamMembers';
import {
  STARRED_OPTIONS,
  TEAMS_MEMBERSHIP_OPTIONS,
  TEAMS_ROLE_OPTIONS,
  parseTeamsSemanticInput,
} from '../utils/tableSemantics';
import type { Team } from '../types';

type ViewMode = 'grid' | 'list';
const VIEW_STORAGE_KEY = 'teams-view-mode';

export function TeamsPage() {
  const { teams, joinTeam, requestToJoin, withdrawRequest, toggleStar, pendingRequests } = useTeamsStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const { workspaces } = useWorkspacesStore();
  const [view, setView] = useState<ViewMode>(
    () => (sessionStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null) ?? 'list'
  );
  const [tableState, setTableState] = useState<DatabaseTableState>({});
  const [tableStateVersion, setTableStateVersion] = useState(4);
  const [showAgentPane, setShowAgentPane] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [joinModalTeam, setJoinModalTeam] = useState<Team | null>(null);

  // Persist view preference
  function setViewAndPersist(v: ViewMode) {
    setView(v);
    sessionStorage.setItem(VIEW_STORAGE_KEY, v);
  }

  function applyAgentPrompt(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    const interpreted = parseTeamsSemanticInput(trimmed);
    const hasFilters =
      interpreted.filters !== undefined && Object.keys(interpreted.filters).length > 0;
    const resolvedSearch =
      interpreted.search !== undefined ? interpreted.search : hasFilters ? '' : trimmed;
    setTableState((current) => ({
      ...current,
      search: resolvedSearch,
      filters: interpreted.filters ?? current.filters ?? {},
    }));
    setTableStateVersion((current) => current + 1);
    setAgentInput('');
  }

  const listRows = useMemo(
    () =>
      teams.map((team, index) => {
        const accessibleWorkspaces = getAccessibleTeamWorkspaces({
          workspaces,
          teamId: team.id,
          isTeamMember: team.isMember,
          isTeamOpen: team.isOpen,
        });
        return {
          ...team,
          membershipLabel: team.memberRole === 'member' ? 'Member' : team.memberRole === 'collaborator' ? 'Collaborator' : '-',
          yourRole: team.isMember ? (index % 7 === 0 ? 'Manager' : 'Developer') : null,
          accessibleWorkspacesCount: accessibleWorkspaces.length,
          accessibleWorkspaces,
          gitConnectedCount: accessibleWorkspaces.filter((w) => w.gitRepo).length,
          teamMembers: buildTeamMemberPreviewList({
            teamId: team.id,
            total: team.membersCount,
            memberPreview: team.memberPreview,
          }),
        };
      }),
    [teams, workspaces]
  );
  const gridRows = useMemo(() => {
    const search = tableState.search?.trim().toLowerCase() ?? '';
    const membershipFilter = Array.isArray(tableState.filters?.membership)
      ? tableState.filters?.membership
      : [];
    const starredFilter = Array.isArray(tableState.filters?.actions)
      ? tableState.filters?.actions
      : [];
    return teams.filter((team) => {
      const membershipLabel =
        team.memberRole === 'member'
          ? 'Member'
          : team.memberRole === 'collaborator'
            ? 'Collaborator'
            : '-';
      if (search && !`${team.name} ${team.handle} ${membershipLabel}`.toLowerCase().includes(search)) {
        return false;
      }
      if (membershipFilter.length > 0 && !membershipFilter.includes(membershipLabel)) return false;
      if (starredFilter.length > 0 && !starredFilter.includes(String(team.isStarred))) return false;
      return true;
    });
  }, [tableState.filters, tableState.search, teams]);

  const tableColumns: DatabaseTableColumn<(typeof listRows)[number]>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => <TeamNameCell team={row} onOpen={() => window.location.assign(`/teams/${row.id}`)} />,
      getValue: (row) => row.name,
      width: '220px',
      cellClassName: 'max-w-[220px] w-[220px]',
    },
    {
      id: 'description',
      header: 'Description',
      accessor: (row) => {
        const text = row.description ?? row.about;
        if (!text) return <span className="text-gray-300">-</span>;
        return (
          <span className="group/desc relative block cursor-default">
            <span className="block truncate text-xs text-gray-500">{text}</span>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 rounded bg-gray-900 px-2 py-1.5 text-2xs text-white opacity-0 group-hover/desc:opacity-100 transition-opacity z-50 whitespace-normal leading-relaxed shadow-lg">
              {text}
            </span>
          </span>
        );
      },
      getValue: (row) => row.description ?? row.about ?? '',
      width: '280px',
      cellClassName: 'max-w-0 w-[280px]',
    },
    {
      id: 'membersCount',
      header: 'Members',
      accessor: (row) => (
        <div onClick={(event) => event.stopPropagation()} className="inline-flex min-w-0">
          <MembersPopover
            members={row.teamMembers}
            total={row.membersCount}
            groups={row.groupsCount}
            status={(() => {
              const pct = row.activeUsersPercent;
              if (pct == null) return undefined;
              const colorClass = pct >= 70 ? 'text-green-600/70' : pct >= 40 ? 'text-orange-600/70' : 'text-red-600/70';
              const bgClass = pct >= 70 ? 'bg-green-500/5' : pct >= 40 ? 'bg-orange-500/5' : 'bg-red-500/5';
              return { icon: Activity, label: `${pct}%`, colorClass, bgClass };
            })()}
            onViewAll={() => navigate(`/teams/${row.id}?tab=members`)}
            triggerClassName="inline-flex items-center gap-0.5 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer min-w-0"
          />
        </div>
      ),
      getValue: (row) => row.membersCount,
      width: '160px',
    },
    {
      id: 'workspacesCount',
      header: 'Workspaces',
      accessor: (row) => (
        <div onClick={(event) => event.stopPropagation()} className="inline-flex min-w-0">
          <WorkspacesPopover
            workspaces={row.accessibleWorkspaces.map((workspace) => ({
              id: workspace.id,
              name: workspace.name,
              type: workspace.type,
            }))}
            status={{ icon: GitBranch, label: String(row.gitConnectedCount), colorClass: row.gitConnectedCount === 0 ? 'text-yellow-600/70' : undefined, bgClass: row.gitConnectedCount === 0 ? 'bg-yellow-500/5' : undefined }}
            onViewAll={() => navigate(`/teams/${row.id}?tab=workspaces`)}
            triggerClassName="inline-flex items-center gap-0.5 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer min-w-0"
          />
        </div>
      ),
      getValue: (row) => row.accessibleWorkspacesCount,
      width: '160px',
    },
    {
      id: 'yourRole',
      header: 'Your role',
      accessor: (row) => {
        if (!row.yourRole) return <span className="text-gray-400">-</span>;
        const isCollaborator = row.membershipLabel === 'Collaborator';
        return (
          <span className="inline-flex items-center gap-1">
            <span>{row.yourRole}</span>
            {isCollaborator ? (
              <span className="group relative inline-flex items-center cursor-default">
                <span data-secondary className="inline-flex items-center gap-0.5 font-normal ml-0 rounded px-1 py-px min-h-[18px] bg-gray-100 text-gray-400">
                  <Eye size={10} className="flex-shrink-0" />
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded bg-gray-900 px-2 py-1 text-2xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-normal">
                  You only have access to the specific resources you've been invited to.
                </span>
              </span>
            ) : null}
          </span>
        );
      },
      getValue: (row) => row.yourRole ?? '',
      width: '140px',
    },
    {
      id: 'membership',
      header: 'Access',
      accessor: () => null,
      getValue: (row) => row.membershipLabel,
      isDefaultVisible: false,
    },
    {
      id: 'actions',
      header: '',
      accessor: (row) => (
        <TeamActionsCell
          team={row}
          isPending={pendingRequests.has(row.id)}
          onJoin={() => {
            joinTeam(row.id);
            addToast(`You joined ${row.name}`);
          }}
          onRequestToJoin={() => setJoinModalTeam(row)}
          onWithdraw={() => {
            withdrawRequest(row.id);
            addToast(`Request withdrawn for ${row.name}`, 'info');
          }}
          onToggleStar={() => toggleStar(row.id)}
        />
      ),
      getValue: (row) => row.isStarred,
      align: 'right',
      width: '60px',
      isHideable: false,
    },
  ];

  const askAiControl = (
    <button
      onClick={() => setShowAgentPane(true)}
      className="inline-flex h-8 items-center gap-1 rounded border border-gray-200 px-2 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
    >
      <Sparkles size={12} />
      Ask AI
    </button>
  );
  const viewToggleControl = (
    <div className="inline-flex h-8 w-16 overflow-hidden rounded border border-gray-200">
      <button
        onClick={() => setViewAndPersist('list')}
        className={`inline-flex h-full w-1/2 items-center justify-center border-r border-gray-200 ${
          view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
        }`}
        title="List view"
      >
        <List size={12} />
      </button>
      <button
        onClick={() => setViewAndPersist('grid')}
        className={`inline-flex h-full w-1/2 items-center justify-center ${
          view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
        }`}
        title="Grid view"
      >
        <LayoutGrid size={12} />
      </button>
    </div>
  );

  return (
    <div className={`px-8 pt-5 pb-10 ${showAgentPane ? '' : 'max-w-6xl mx-auto'}`}>
      <Breadcrumb items={[{ label: 'Postman', to: '/' }, { label: 'Teams' }]} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Teams</h1>
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <ExternalLink size={12} />
          Manage teams
        </button>
      </div>

      <div className={showAgentPane ? 'lg:pr-[380px]' : ''}>
        {view === 'list' ? (
          <DatabaseTable
            rows={listRows}
            columns={tableColumns}
            getRowId={(row) => row.id}
            defaultVisibleColumnIds={tableColumns.filter((c) => c.id !== 'membership').map((c) => c.id)}
            searchableColumnIds={['name']}
            filterableColumnIds={['yourRole', 'membership', 'actions']}
            filterSelectionModeByColumnId={{ yourRole: 'multi', membership: 'multi', actions: 'single' }}
            filterOptionsByColumnId={{ yourRole: TEAMS_ROLE_OPTIONS, membership: TEAMS_MEMBERSHIP_OPTIONS, actions: STARRED_OPTIONS }}
            filterSectionLabelByColumnId={{ yourRole: 'Role', membership: 'Access', actions: 'Starred' }}
            initialState={tableState}
            stateVersion={tableStateVersion}
            onStateChange={(state) => setTableState(state)}
            emptyStateText="No teams match current criteria."
            enableRowSelection
            bulkActions={[
              { id: 'star', label: 'Star selected' },
              { id: 'unstar', label: 'Unstar selected' },
              { id: 'export', label: 'Export' },
            ]}
            aiControl={askAiControl}
            rightControls={viewToggleControl}
          />
        ) : (
          <div>
            <TableGridControls
              search={tableState.search ?? ''}
              onSearchChange={(value) => setTableState((current) => ({ ...current, search: value }))}
              filterableColumnIds={['yourRole', 'membership', 'actions']}
              filters={tableState.filters ?? {}}
              onFilterChange={(columnId, value) =>
                setTableState((current) => ({
                  ...current,
                  filters: {
                    ...(current.filters ?? {}),
                    [columnId]: value,
                  },
                }))
              }
              filterOptionsByColumnId={{ yourRole: TEAMS_ROLE_OPTIONS, membership: TEAMS_MEMBERSHIP_OPTIONS, actions: STARRED_OPTIONS }}
              filterSectionLabelByColumnId={{ yourRole: 'Role', membership: 'Access', actions: 'Starred' }}
              columns={tableColumns}
              aiControl={askAiControl}
              rightControls={viewToggleControl}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gridRows.map((team) => <TeamCard key={team.id} team={team} />)}
            </div>
          </div>
        )}
      </div>

      {showAgentPane ? (
        <TableAgentPane
          suggestions={['Show teams to join', 'Show my teams', 'Show starred teams']}
          value={agentInput}
          onChange={setAgentInput}
          onSubmit={applyAgentPrompt}
          onClose={() => setShowAgentPane(false)}
        />
      ) : (
        <button
          onClick={() => setShowAgentPane(true)}
          className="fixed bottom-4 right-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-gray-300 hover:text-gray-700"
          aria-label="Open assistant"
        >
          <Sparkles size={14} />
        </button>
      )}

      {joinModalTeam ? (
        <JoinRequestModal
          team={joinModalTeam}
          onSubmit={(note) => {
            requestToJoin(joinModalTeam.id);
            setJoinModalTeam(null);
            addToast(`Request sent to ${joinModalTeam.name}`, 'info');
            void note;
          }}
          onClose={() => setJoinModalTeam(null)}
        />
      ) : null}
    </div>
  );
}

function TeamNameCell({ team, onOpen }: { team: Team; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className="flex w-full items-center gap-2.5 min-w-0 text-left"
    >
      <Avatar initials={team.initials} color={team.avatarColor} size="sm" />
      <div className="min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-gray-900 whitespace-nowrap hover:underline">{team.name}</span>
          {!team.isOpen ? <Lock size={10} className="text-gray-400 flex-shrink-0" /> : null}
        </div>
        <span className="text-2xs text-gray-400 leading-tight whitespace-nowrap truncate">{team.handle}</span>
      </div>
    </button>
  );
}

function TeamActionsCell({
  team,
  isPending,
  onJoin,
  onRequestToJoin,
  onWithdraw,
  onToggleStar,
}: {
  team: Team;
  isPending: boolean;
  onJoin: () => void;
  onRequestToJoin: () => void;
  onWithdraw: () => void;
  onToggleStar: () => void;
}) {

  return (
    <div className="flex justify-end">
      {team.isMember ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar();
          }}
          className="p-1 text-gray-400 hover:text-yellow-400"
        >
          <Star size={12} fill={team.isStarred ? 'currentColor' : 'none'} className={team.isStarred ? 'text-yellow-400' : ''} />
        </button>
      ) : isPending ? (
        <div onClick={(event) => event.stopPropagation()}>
          <PendingButton onWithdraw={onWithdraw} size="sm" />
        </div>
      ) : (
        <button
          className="btn-secondary text-2xs px-2.5 py-1"
          onClick={(event) => {
            event.stopPropagation();
            if (team.isOpen) onJoin();
            else onRequestToJoin();
          }}
        >
          Join
        </button>
      )}
    </div>
  );
}

