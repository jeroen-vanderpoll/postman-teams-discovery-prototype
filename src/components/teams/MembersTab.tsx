import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Sparkles, Trash2 } from 'lucide-react';
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
  return index <= 1 ? 'Collaborator' : 'Member';
}

function roleForIndex(index: number): Role {
  return index % 7 === 0 ? 'Manager' : 'Developer';
}

function mapMembership(role: 'member' | 'collaborator' | null): Membership {
  return role === 'collaborator' ? 'Collaborator' : 'Member';
}

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
  }).map((m, index) => ({
    ...m,
    handle: toHandle(m.name),
    membership: membershipForIndex(index),
    role: roleForIndex(index),
  }));

  if (!isMember || baseMembers.length === 0) return baseMembers;

  const currentUser = {
    ...baseMembers[0],
    id: `${teamId}-you`,
    membership: mapMembership(currentUserMembership),
    role: 'Manager' as Role,
    isCurrentUser: true,
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
  const [tableStateVersion, setTableStateVersion] = useState(0);
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
      width: '46%',
    },
    { id: 'role', header: 'Role', accessor: (row) => row.role, getValue: (row) => row.role, width: '22%' },
    {
      id: 'membership',
      header: 'Membership',
      headerTooltip: 'Members have full access to all team resources. Collaborators have access only to the specific resources they\'ve been invited to.',
      accessor: (row) => row.membership,
      getValue: (row) => row.membership,
      width: '22%',
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
      width: '10%',
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
            defaultVisibleColumnIds={columns.map((column) => column.id)}
            searchableColumnIds={['name', 'role', 'membership']}
            filterableColumnIds={['role', 'membership']}
            filterSelectionModeByColumnId={{ role: 'multi', membership: 'multi' }}
            filterOptionsByColumnId={{
              role: MEMBERS_ROLE_OPTIONS,
              membership: MEMBERS_MEMBERSHIP_OPTIONS,
            }}
            filterSectionLabelByColumnId={{ role: 'Role', membership: 'Membership' }}
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
