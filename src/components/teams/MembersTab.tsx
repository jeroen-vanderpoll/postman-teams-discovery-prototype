import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Building2, Eye, LayoutGrid, List, Pencil, ShieldCheck, Sparkles, Trash2, Users } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { DatabaseTable, type DatabaseTableColumn, type DatabaseTableState } from '../ui/DatabaseTable';
import { TableAgentPane } from '../ui/TableAgentPane';
import { TableGridControls } from '../ui/TableGridControls';
import { buildTeamMemberPreviewList } from '../../utils/teamMembers';
import {
  MEMBERS_MEMBERSHIP_OPTIONS,
  MEMBERS_ROLE_OPTIONS,
  parseMembersSemanticInput,
} from '../../utils/tableSemantics';
import type { MemberPreview } from '../../types';

type Membership = 'Member' | 'Collaborator';
type Role = 'Developer' | 'Manager';
type Member = MemberPreview & {
  handle: string;
  membership: Membership;
  role: Role;
  isCurrentUser?: boolean;
  lastActivityTimestamp: string;
  workspaceAccessCount: number;
  activeWorkspacesCount: number;
  adminWorkspacesCount: number;
  editorWorkspacesCount: number;
  groupsCount: number;
  otherTeamsCount: number;
};

const VIEW_STORAGE_KEY = 'team-members-view-mode-v2';

interface MembersTabProps {
  teamId: string;
  membersCount: number;
  memberPreview: MemberPreview[];
  isMember: boolean;
  currentUserMembership: 'member' | 'collaborator' | null;
  onInvitePeople: () => void;
  onAgentPaneOpenChange?: (open: boolean) => void;
}

function toHandle(name: string): string {
  return `@${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')}`;
}

function membershipForIndex(index: number): Membership {
  return index <= 1 || index % 4 === 0 ? 'Collaborator' : 'Member';
}

function roleForIndex(index: number): Role {
  return index % 7 === 0 ? 'Manager' : 'Developer';
}

function mapMembership(role: 'member' | 'collaborator' | null): Membership {
  return role === 'collaborator' ? 'Collaborator' : 'Member';
}

const ACTIVITY_HOURS = [1, 3, 6, 12, 24, 48, 72, 120, 168, 336, 720];

function buildTeamMembers(
  teamId: string,
  total: number,
  preview: MemberPreview[],
  isMember: boolean,
  currentUserMembership: 'member' | 'collaborator' | null
): Member[] {
  const baseMembers = buildTeamMemberPreviewList({
    teamId,
    total,
    memberPreview: preview,
  }).map((m, index) => {
    const workspaceAccessCount = (index % 8) + 1;
    return {
      ...m,
      handle: toHandle(m.name),
      membership: membershipForIndex(index),
      role: roleForIndex(index),
      lastActivityTimestamp: new Date(Date.now() - ACTIVITY_HOURS[index % ACTIVITY_HOURS.length] * 3_600_000).toISOString(),
      workspaceAccessCount,
      activeWorkspacesCount: Math.max(0, workspaceAccessCount - (index % 3)),
      adminWorkspacesCount: index % 5 === 0 ? 2 : index % 5 === 1 ? 1 : 0,
      editorWorkspacesCount: index % 3 === 0 ? 3 : index % 3 === 1 ? 1 : 0,
      groupsCount: index % 6 === 0 ? 3 : index % 6 === 1 ? 2 : index % 6 === 2 ? 1 : 0,
      otherTeamsCount: (index % 7) + 1,
    };
  });

  if (!isMember || baseMembers.length === 0) return baseMembers;

  const currentUser = {
    ...baseMembers[0],
    id: `${teamId}-you`,
    membership: mapMembership(currentUserMembership),
    role: 'Manager' as Role,
    isCurrentUser: true,
    lastActivityTimestamp: new Date(Date.now() - 1 * 3_600_000).toISOString(),
    workspaceAccessCount: 5,
    activeWorkspacesCount: 4,
    adminWorkspacesCount: 2,
    editorWorkspacesCount: 1,
    groupsCount: 2,
    otherTeamsCount: 3,
  };

  return [
    currentUser,
    ...baseMembers.slice(1),
  ];
}

export function MembersTab({
  teamId,
  membersCount,
  memberPreview,
  isMember,
  currentUserMembership,
  onInvitePeople,
  onAgentPaneOpenChange,
}: MembersTabProps) {
  const [view, setView] = useState<'list' | 'grid'>(
    () => (sessionStorage.getItem(VIEW_STORAGE_KEY) as 'list' | 'grid' | null) ?? 'list'
  );
  const [tableState, setTableState] = useState<DatabaseTableState>({});
  const [tableStateVersion, setTableStateVersion] = useState(1);
  const [showAgentPane, setShowAgentPane] = useState(false);
  const [agentInput, setAgentInput] = useState('');

  useEffect(() => {
    onAgentPaneOpenChange?.(showAgentPane);
    return () => onAgentPaneOpenChange?.(false);
  }, [onAgentPaneOpenChange, showAgentPane]);

  useEffect(() => {
    const root = document.querySelector('[data-members-tab-root]') as HTMLElement | null;
    const table = document.querySelector('[data-members-table-wrap]') as HTMLElement | null;
    const headerCount = table?.querySelectorAll('thead th').length ?? null;
    // #region agent log
    fetch('http://127.0.0.1:7870/ingest/3980ba0b-2c70-4db9-9b3e-8d661282845b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'752e2f'},body:JSON.stringify({sessionId:'752e2f',runId:'pre-fix',hypothesisId:'H2-H3-H4',location:'MembersTab.tsx:102',message:'members tab layout state',data:{teamId,view,showAgentPane,windowWidth:window.innerWidth,rootWidth:root?.getBoundingClientRect().width ?? null,tableWrapWidth:table?.getBoundingClientRect().width ?? null,headerCount,visibleColumns:tableState.visibleColumnIds ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [showAgentPane, tableState.visibleColumnIds, teamId, view]);

  function setViewAndPersist(next: 'list' | 'grid') {
    setView(next);
    sessionStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  function applyAgentPrompt(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    const interpreted = parseMembersSemanticInput(trimmed);
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

  const allTeamMembers = buildTeamMembers(
    teamId,
    membersCount,
    memberPreview,
    isMember,
    currentUserMembership
  );
  const orderedMembers = useMemo(() => {
    const currentUser = allTeamMembers.find((member) => member.isCurrentUser);
    const others = allTeamMembers.filter((member) => !member.isCurrentUser);
    return currentUser ? [currentUser, ...others] : allTeamMembers;
  }, [allTeamMembers]);
  const gridRows = useMemo(() => {
    const search = tableState.search?.trim().toLowerCase() ?? '';
    const roleFilter = Array.isArray(tableState.filters?.role) ? tableState.filters?.role : [];
    const membershipFilter = Array.isArray(tableState.filters?.membership)
      ? tableState.filters?.membership
      : [];
    return orderedMembers.filter((member) => {
      if (search && !`${member.name} ${member.handle} ${member.role} ${member.membership}`.toLowerCase().includes(search)) {
        return false;
      }
      if (roleFilter.length > 0 && !roleFilter.includes(member.role)) return false;
      if (membershipFilter.length > 0 && !membershipFilter.includes(member.membership)) return false;
      return true;
    });
  }, [orderedMembers, tableState.filters, tableState.search]);

  const columns: DatabaseTableColumn<Member>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={row.initials} color={row.avatarColor} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900">
              {row.name}
              {row.isCurrentUser ? <span className="text-gray-500 font-normal"> (You)</span> : null}
            </p>
            <p className="text-2xs text-gray-400 truncate">{row.handle}</p>
          </div>
        </div>
      ),
      getValue: (row) => row.name,
      width: '220px',
    },
    { id: 'role', header: 'Role', accessor: (row) => {
        const isCollaborator = row.membership === 'Collaborator';
        return (
          <span className="inline-flex items-center gap-1">
            <span>{row.role}</span>
            {isCollaborator ? (
              <span className="group relative inline-flex items-center cursor-default">
                <span data-secondary className="inline-flex items-center gap-0.5 font-normal rounded px-1 py-px min-h-[18px] bg-gray-100 text-gray-400">
                  <Eye size={10} className="flex-shrink-0" />
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded bg-gray-900 px-2 py-1 text-2xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-normal">
                  {row.isCurrentUser ? 'You' : row.name.split(' ')[0]} only {row.isCurrentUser ? 'have' : 'has'} access to workspaces they were explicitly invited to.
                </span>
              </span>
            ) : null}
          </span>
        );
      }, getValue: (row) => row.role, width: '140px' },
    {
      id: 'lastActive',
      header: 'Last active',
      accessor: (row) => (
        <span className="whitespace-nowrap">
          {formatDistanceToNow(new Date(row.lastActivityTimestamp), { addSuffix: true }).replace(/^about /, '')}
        </span>
      ),
      getValue: (row) => row.lastActivityTimestamp,
      width: '120px',
    },
    {
      id: 'workspaces',
      header: 'Workspaces',
      accessor: (row) => {
        return (
          <span className="group/ws relative inline-flex items-center gap-1 cursor-default">
            <span className="inline-flex items-center gap-0.5">
              <LayoutGrid size={11} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium w-[1.25rem] text-left tabular-nums">{row.workspaceAccessCount}</span>
            </span>
            {(row.adminWorkspacesCount > 0 || row.editorWorkspacesCount > 0) && (
              <span data-secondary className="inline-flex items-center gap-1 rounded px-1 py-px min-h-[18px] bg-gray-100 text-gray-500">
                {row.adminWorkspacesCount > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <ShieldCheck size={10} className="flex-shrink-0" />
                    {row.adminWorkspacesCount}
                  </span>
                )}
                {row.adminWorkspacesCount > 0 && row.editorWorkspacesCount > 0 && (
                  <span className="w-px h-2.5 bg-gray-300/60 flex-shrink-0" />
                )}
                {row.editorWorkspacesCount > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <Pencil size={10} className="flex-shrink-0" />
                    {row.editorWorkspacesCount}
                  </span>
                )}
              </span>
            )}
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap opacity-0 group-hover/ws:opacity-100 transition-opacity z-20">
              {row.workspaceAccessCount} workspace{row.workspaceAccessCount !== 1 ? 's' : ''} · active in {row.activeWorkspacesCount}{row.adminWorkspacesCount > 0 ? ` · admin in ${row.adminWorkspacesCount}` : ''}{row.editorWorkspacesCount > 0 ? ` · editor in ${row.editorWorkspacesCount}` : ''}
            </span>
          </span>
        );
      },
      getValue: (row) => row.workspaceAccessCount,
      width: '180px',
    },
    {
      id: 'groups',
      header: 'Groups',
      accessor: (row) => (
        <span className="group/grp relative inline-flex items-center gap-0.5 cursor-default whitespace-nowrap">
          <Users size={11} className={row.groupsCount > 0 ? 'text-gray-500 flex-shrink-0' : 'text-gray-300 flex-shrink-0'} />
          <span className={`tabular-nums ${row.groupsCount === 0 ? 'text-gray-300' : ''}`}>{row.groupsCount}</span>
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap opacity-0 group-hover/grp:opacity-100 transition-opacity z-20">
            {row.groupsCount > 0 ? `Member of ${row.groupsCount} group${row.groupsCount !== 1 ? 's' : ''} in this team` : 'Not in any groups'}
          </span>
        </span>
      ),
      getValue: (row) => row.groupsCount,
      width: '80px',
    },
    {
      id: 'otherTeams',
      header: 'Teams',
      accessor: (row) => {
        const total = row.otherTeamsCount + 1;
        return (
          <span className="group/ot relative inline-flex items-center gap-0.5 cursor-default whitespace-nowrap">
            <Building2 size={11} className="text-gray-500 flex-shrink-0" />
            <span className="tabular-nums">{total}</span>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap opacity-0 group-hover/ot:opacity-100 transition-opacity z-20">
              Member of {total} team{total !== 1 ? 's' : ''} in total
            </span>
          </span>
        );
      },
      getValue: (row) => row.otherTeamsCount + 1,
      width: '80px',
    },
    {
      id: 'membership',
      header: 'Membership',
      accessor: () => null,
      getValue: (row) => row.membership,
      isDefaultVisible: false,
    },
    {
      id: 'actions',
      header: '',
      accessor: () => (
        <div className="flex justify-end">
          <button className="rounded p-1 text-gray-400 hover:bg-gray-50 hover:text-red-600" aria-label="Remove member">
            <Trash2 size={13} />
          </button>
        </div>
      ),
      getValue: (row) => row.id,
      align: 'right',
      width: '32px',
      isHideable: false,
      isSortable: false,
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
        title="Card view"
      >
        <LayoutGrid size={12} />
      </button>
    </div>
  );

  return (
    <div data-members-tab-root>
      <div data-members-table-wrap>
        {view === 'list' ? (
          <DatabaseTable
            rows={orderedMembers}
            columns={columns}
            getRowId={(row) => row.id}
            defaultVisibleColumnIds={columns.filter((c) => c.id !== 'membership').map((c) => c.id)}
            searchableColumnIds={['name', 'role']}
            filterableColumnIds={['role', 'membership']}
            filterSelectionModeByColumnId={{ role: 'multi', membership: 'multi' }}
            filterOptionsByColumnId={{
              role: MEMBERS_ROLE_OPTIONS,
              membership: MEMBERS_MEMBERSHIP_OPTIONS,
            }}
            filterSectionLabelByColumnId={{ role: 'Role', membership: 'Access' }}
            initialState={tableState}
            stateVersion={tableStateVersion}
            onStateChange={(state) => setTableState(state)}
            emptyStateText="No members match current criteria."
            enableRowSelection
            bulkActions={[{ id: 'remove', label: 'Remove', danger: true }]}
            aiControl={askAiControl}
            rightControls={
              <div className="ml-auto flex items-center gap-2">
                {isMember ? (
                  <button
                    onClick={onInvitePeople}
                    className="btn-primary inline-flex h-8 items-center px-3 text-xs"
                  >
                    Invite people
                  </button>
                ) : null}
                {viewToggleControl}
              </div>
            }
          />
        ) : (
          <>
            <TableGridControls
              search={tableState.search ?? ''}
              onSearchChange={(value) => setTableState((current) => ({ ...current, search: value }))}
              filterableColumnIds={['role', 'membership']}
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
              filterOptionsByColumnId={{
                role: MEMBERS_ROLE_OPTIONS,
                membership: MEMBERS_MEMBERSHIP_OPTIONS,
              }}
              filterSectionLabelByColumnId={{ role: 'Role', membership: 'Membership' }}
              columns={columns}
              aiControl={askAiControl}
              rightControls={
                <div className="ml-auto flex items-center gap-2">
                  {isMember ? (
                    <button className="btn-primary inline-flex h-8 items-center px-3 text-xs" onClick={onInvitePeople}>
                      Invite people
                    </button>
                  ) : null}
                  {viewToggleControl}
                </div>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gridRows.map((member) => (
                <div key={member.id} className="card px-3 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar initials={member.initials} color={member.avatarColor} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {member.name}
                        {member.isCurrentUser ? <span className="text-gray-500 font-normal"> (You)</span> : null}
                      </p>
                      <p className="text-2xs text-gray-400 truncate">{member.handle}</p>
                      <p className="text-2xs text-gray-500 truncate">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showAgentPane ? (
        <TableAgentPane
          suggestions={['Show managers', 'Show collaborators', 'Show member developers']}
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
    </div>
  );
}
