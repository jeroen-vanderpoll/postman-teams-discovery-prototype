import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Building2, ChevronDown, GitBranch, Globe, Handshake, LayoutGrid, List, Lock, Search, Sparkles, Star, Users } from 'lucide-react';
import { WorkspaceCard } from './WorkspaceCard';
import { ContributorsPopover, CollectionsPopover } from './WorkspacePopovers';
import { WorkspacePeekCard } from './WorkspacePeekCard';
import { DatabaseTable, type DatabaseTableColumn, type DatabaseTableState } from '../ui/DatabaseTable';
import { TableAgentPane } from '../ui/TableAgentPane';
import { TableGridControls } from '../ui/TableGridControls';
import { useWorkspacesStore } from '../../store/workspacesStore';
import { useToastStore } from '../../store/toastStore';
import { useTeamsStore } from '../../store/teamsStore';
import { getAccessibleTeamWorkspaces } from '../../utils/workspaceAccess';
import {
  STARRED_OPTIONS,
  WORKSPACES_ACCESS_OPTIONS,
  WORKSPACES_GIT_OPTIONS,
  WORKSPACES_ROLE_OPTIONS,
  parseWorkspacesSemanticInput,
} from '../../utils/tableSemantics';
import type { Workspace } from '../../types';

interface WorkspacesTabProps {
  teamId: string;
  isMember: boolean;
  isTeamOpen?: boolean;
  onAgentPaneOpenChange?: (open: boolean) => void;
}

export function WorkspacesTab({
  teamId,
  isMember,
  isTeamOpen = true,
  onAgentPaneOpenChange,
}: WorkspacesTabProps) {
  const { workspaces } = useWorkspacesStore();
  const { teams } = useTeamsStore();
  const { addToast } = useToastStore();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [tableState, setTableState] = useState<DatabaseTableState>({});
  const [tableStateVersion, setTableStateVersion] = useState(0);
  const [showAgentPane, setShowAgentPane] = useState(false);
  const [agentInput, setAgentInput] = useState('');

  useEffect(() => {
    onAgentPaneOpenChange?.(showAgentPane);
    return () => onAgentPaneOpenChange?.(false);
  }, [onAgentPaneOpenChange, showAgentPane]);

  useEffect(() => {
    const root = document.querySelector('[data-workspaces-tab-root]') as HTMLElement | null;
    const table = document.querySelector('[data-workspaces-table-wrap]') as HTMLElement | null;
    const headerCount = table?.querySelectorAll('thead th').length ?? null;
    // #region agent log
    fetch('http://127.0.0.1:7870/ingest/3980ba0b-2c70-4db9-9b3e-8d661282845b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'752e2f'},body:JSON.stringify({sessionId:'752e2f',runId:'pre-fix',hypothesisId:'H2-H3-H4',location:'WorkspacesTab.tsx:53',message:'workspaces tab layout state',data:{teamId,view,showAgentPane,windowWidth:window.innerWidth,rootWidth:root?.getBoundingClientRect().width ?? null,tableWrapWidth:table?.getBoundingClientRect().width ?? null,headerCount,visibleColumns:tableState.visibleColumnIds ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [showAgentPane, tableState.visibleColumnIds, teamId, view]);

  const baseTeamWorkspaces = useMemo(() => {
    return getAccessibleTeamWorkspaces({
      workspaces,
      teamId,
      isTeamMember: isMember,
      isTeamOpen,
    });
  }, [workspaces, teamId, isMember, isTeamOpen]);

  function applyAgentPrompt(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    const interpreted = parseWorkspacesSemanticInput(trimmed);
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

  const tableRows = useMemo(
    () =>
      baseTeamWorkspaces.map((workspace) => {
        const ownerTeam = teams.find((team) => team.id === workspace.teamId);
        const accessLabel =
          workspace.type === 'internal'
            ? 'Internal'
            : workspace.type === 'partner'
              ? 'Partner'
              : 'Public';
        const roleLabel = workspace.yourRole.charAt(0).toUpperCase() + workspace.yourRole.slice(1);
        const gitConnected = workspace.gitRepo ? 'Connected' : 'Not connected';
        const activityHours = Math.round(
          (Date.now() - new Date(workspace.lastActivityTimestamp).getTime()) / (1000 * 60 * 60)
        );
        return {
          ...workspace,
          ownerTeamName: ownerTeam?.name ?? 'Team',
          accessLabel,
          roleLabel,
          gitConnected,
          activityHours,
        };
      }),
    [baseTeamWorkspaces, teams]
  );
  const creatorOptions = useMemo(() => {
    const seen = new Map<string, { value: string; label: string; initials: string; avatarColor: string }>();
    tableRows.forEach((row) => {
      if (row.creator && !seen.has(row.creator.name)) {
        seen.set(row.creator.name, {
          value: row.creator.name,
          label: row.creator.name,
          initials: row.creator.initials,
          avatarColor: row.creator.avatarColor,
        });
      }
    });
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [tableRows]);

  const gridRows = useMemo(() => {
    const search = tableState.search?.trim().toLowerCase() ?? '';
    const creatorFilter = Array.isArray(tableState.filters?.creator) ? tableState.filters?.creator : [];
    const accessFilter = Array.isArray(tableState.filters?.access) ? tableState.filters?.access : [];
    const roleFilter = Array.isArray(tableState.filters?.role) ? tableState.filters?.role : [];
    const gitFilter = Array.isArray(tableState.filters?.gitConnected)
      ? tableState.filters?.gitConnected
      : [];
    const starredFilter = Array.isArray(tableState.filters?.actions) ? tableState.filters?.actions : [];
    return tableRows.filter((row) => {
      if (search && !`${row.name} ${row.accessLabel} ${row.roleLabel}`.toLowerCase().includes(search)) {
        return false;
      }
      if (creatorFilter.length > 0 && !creatorFilter.includes(row.creator?.name ?? '')) return false;
      if (accessFilter.length > 0 && !accessFilter.includes(row.accessLabel)) return false;
      if (roleFilter.length > 0 && !roleFilter.includes(row.roleLabel)) return false;
      if (gitFilter.length > 0 && !gitFilter.includes(row.gitConnected)) return false;
      if (starredFilter.length > 0 && !starredFilter.includes(String(row.isStarred))) return false;
      return true;
    });
  }, [tableRows, tableState.filters, tableState.search]);

  const columns: DatabaseTableColumn<(typeof tableRows)[number]>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => <WorkspaceNameCell workspace={row} />,
      getValue: (row) => row.name,
      width: '25%',
    },
    {
      id: 'creator',
      header: 'Creator',
      accessor: (row) =>
        row.creator ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white text-2xs font-medium"
              style={{ backgroundColor: row.creator.avatarColor }}
            >
              {row.creator.initials}
            </span>
            <span className="truncate text-xs text-gray-700">{row.creator.name}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
      getValue: (row) => row.creator?.name ?? '',
      width: '13%',
    },
    {
      id: 'contributorsCount',
      header: 'Contributors',
      accessor: (row) => {
        return (
          <ContributorsPopover
            contributors={row.contributors}
            total={row.contributorsCount}
            triggerClassName="inline-flex items-center gap-0.5 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer min-w-0"
          />
        );
      },
      getValue: (row) => row.contributorsCount,
      width: '13%',
    },
    {
      id: 'collectionsCount',
      header: 'Collections',
      accessor: (row) => {
        return (
          <CollectionsPopover
            collections={row.collections}
            total={row.collectionsCount}
            triggerClassName="inline-flex items-center gap-0.5 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer min-w-0"
          />
        );
      },
      getValue: (row) => row.collectionsCount,
      width: '13%',
    },
    {
      id: 'activity',
      header: 'Activity',
      accessor: (row) => (
        <span className="whitespace-nowrap">
          {formatDistanceToNow(new Date(row.lastActivityTimestamp), { addSuffix: true }).replace(/^about /, '')}
        </span>
      ),
      getValue: (row) => row.activityHours,
      width: '9%',
    },
    { id: 'access', header: 'Access', accessor: (row) => row.accessLabel, getValue: (row) => row.accessLabel, width: '8%' },
    { id: 'role', header: 'Your role', accessor: (row) => row.roleLabel, getValue: (row) => row.roleLabel, width: '8%' },
    {
      id: 'gitConnected',
      header: 'Git',
      accessor: (row) =>
        row.gitRepo ? (
          <span className="group/git relative inline-flex items-center min-w-0 cursor-default">
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-px bg-gray-100 text-gray-500 min-h-[18px] min-w-0 max-w-[150px]">
              <GitBranch size={10} className="flex-shrink-0" />
              <span className="truncate text-xs">{row.gitRepo}</span>
            </span>
            <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 w-max max-w-[240px] rounded bg-gray-900 px-2 py-1 text-2xs text-white opacity-0 group-hover/git:opacity-100 transition-opacity z-50 whitespace-normal break-all">
              {row.gitRepo}
            </span>
          </span>
        ) : (
          '-'
        ),
      getValue: (row) => row.gitConnected,
      width: '12%',
      cellClassName: 'max-w-0',
    },
    {
      id: 'actions',
      header: '',
      accessor: (row) => <WorkspaceActionsCell workspace={row} />,
      getValue: (row) => row.isStarred,
      align: 'right',
      width: '6%',
      isHideable: false,
    },
  ];

  const viewToggleControl = (
    <div className="inline-flex h-8 w-16 overflow-hidden rounded border border-gray-200">
      <button
        onClick={() => setView('list')}
        className={`inline-flex h-full w-1/2 items-center justify-center border-r border-gray-200 ${
          view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
        }`}
        title="List view"
      >
        <List size={12} />
      </button>
      <button
        onClick={() => setView('grid')}
        className={`inline-flex h-full w-1/2 items-center justify-center ${
          view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
        }`}
        title="Grid view"
      >
        <LayoutGrid size={12} />
      </button>
    </div>
  );
  const askAiControl = (
    <button
      onClick={() => setShowAgentPane(true)}
      className="inline-flex h-8 items-center gap-1 rounded border border-gray-200 px-2 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
    >
      <Sparkles size={12} />
      Ask AI
    </button>
  );

  return (
    <div data-workspaces-tab-root>
      <div data-workspaces-table-wrap>
        {!isMember ? (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
            You are seeing the workspaces you can access in this team.
          </div>
        ) : null}

        {view === 'list' ? (
          <DatabaseTable
            rows={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            defaultVisibleColumnIds={columns.map((column) => column.id)}
            searchableColumnIds={['name', 'access', 'role', 'gitConnected']}
            filterableColumnIds={['creator', 'access', 'role', 'gitConnected', 'actions']}
            filterSelectionModeByColumnId={{ creator: 'multi', access: 'multi', role: 'multi', gitConnected: 'single', actions: 'single' }}
            filterOptionsByColumnId={{
              creator: creatorOptions,
              access: WORKSPACES_ACCESS_OPTIONS,
              role: WORKSPACES_ROLE_OPTIONS,
              gitConnected: WORKSPACES_GIT_OPTIONS,
              actions: STARRED_OPTIONS,
            }}
            filterSectionLabelByColumnId={{
              creator: 'Created by',
              access: 'Type',
              role: 'Role',
              gitConnected: 'Connected with Git',
              actions: 'Starred',
            }}
            filterRendererByColumnId={{
              creator: ({ selectedValues, onChange }) => (
                <CreatorFilterCombobox
                  options={creatorOptions}
                  selectedValues={selectedValues}
                  onChange={onChange}
                />
              ),
            }}
            initialState={tableState}
            stateVersion={tableStateVersion}
            onStateChange={(state) => setTableState(state)}
            emptyStateText="No accessible workspaces found."
            enableRowSelection
            bulkActions={[
              { id: 'star', label: 'Star selected' },
              { id: 'unstar', label: 'Unstar selected' },
              { id: 'export', label: 'Export' },
            ]}
            aiControl={askAiControl}
            rightControls={
              <div className="ml-auto flex items-center gap-2">
                {isMember ? (
                  <button
                    onClick={() => addToast('Create workspace flow coming soon', 'info')}
                    className="btn-primary inline-flex h-8 items-center px-3 text-xs"
                  >
                    Create workspace
                  </button>
                ) : null}
                {viewToggleControl}
              </div>
            }
          />
        ) : gridRows.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No accessible workspaces found</div>
        ) : (
          <>
            <TableGridControls
              search={tableState.search ?? ''}
              onSearchChange={(value) => setTableState((current) => ({ ...current, search: value }))}
              filterableColumnIds={['creator', 'access', 'role', 'gitConnected', 'actions']}
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
                creator: creatorOptions,
                access: WORKSPACES_ACCESS_OPTIONS,
                role: WORKSPACES_ROLE_OPTIONS,
                gitConnected: WORKSPACES_GIT_OPTIONS,
                actions: STARRED_OPTIONS,
              }}
              filterSectionLabelByColumnId={{
                creator: 'Created by',
                access: 'Type',
                role: 'Role',
                gitConnected: 'Connected with Git',
                actions: 'Starred',
              }}
              filterRendererByColumnId={{
                creator: ({ selectedValues, onChange }) => (
                  <CreatorFilterCombobox
                    options={creatorOptions}
                    selectedValues={selectedValues}
                    onChange={onChange}
                  />
                ),
              }}
              columns={columns}
              aiControl={askAiControl}
              rightControls={
                <div className="ml-auto flex items-center gap-2">
                  {isMember ? (
                    <button
                      onClick={() => addToast('Create workspace flow coming soon', 'info')}
                      className="btn-primary inline-flex h-8 items-center px-3 text-xs"
                    >
                      Create workspace
                    </button>
                  ) : null}
                  {viewToggleControl}
                </div>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gridRows.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ))}
            </div>
          </>
        )}
      </div>

      {showAgentPane ? (
        <TableAgentPane
          suggestions={['Show internal and public workspaces', 'Show starred workspaces', 'Show git connected workspaces']}
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

function WorkspaceNameCell({ workspace }: { workspace: Workspace & { ownerTeamName: string } }) {
  const icon =
    workspace.type === 'public'
      ? { Icon: Globe, iconClass: 'text-green-700', bg: 'bg-green-100' }
      : workspace.type === 'partner'
        ? { Icon: Handshake, iconClass: 'text-purple-700', bg: 'bg-purple-100' }
        : workspace.internalAccess === 'org-wide'
          ? { Icon: Building2, iconClass: 'text-blue-700', bg: 'bg-blue-100' }
          : workspace.internalAccess === 'team-wide'
            ? { Icon: Users, iconClass: 'text-indigo-700', bg: 'bg-indigo-100' }
            : { Icon: Lock, iconClass: 'text-slate-700', bg: 'bg-slate-200' };
  const metaLabel =
    workspace.type !== 'internal'
      ? workspace.type === 'public'
        ? 'Public'
        : 'Partner'
      : workspace.internalAccess === 'org-wide'
        ? 'Internal • Postman'
        : workspace.internalAccess === 'team-wide'
          ? `Internal • ${workspace.ownerTeamName}`
          : 'Internal • Invite only';
  const { Icon } = icon;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${icon.bg}`}>
        <Icon size={13} className={icon.iconClass} />
      </div>
      <div className="min-w-0 relative z-10 group/peek hover:z-30">
        <p className="text-xs font-medium text-gray-900 truncate">{workspace.name}</p>
        <WorkspacePeekCard workspace={workspace} ownerTeamName={workspace.ownerTeamName} align="right" />
        <p className="text-2xs text-gray-400 truncate">{metaLabel}</p>
      </div>
    </div>
  );
}

function WorkspaceActionsCell({ workspace }: { workspace: Workspace }) {
  const { toggleStar } = useWorkspacesStore();
  return (
    <div className="flex justify-end">
      <button
        onClick={() => toggleStar(workspace.id)}
        className={`p-1 rounded transition-colors ${workspace.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
      >
        <Star size={12} fill={workspace.isStarred ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

type CreatorOption = { value: string; label: string; initials: string; avatarColor: string };

function CreatorFilterCombobox({
  options,
  selectedValues,
  onChange,
}: {
  options: CreatorOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const displayValue =
    selectedValues.length === 0
      ? ''
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} creators`;

  function toggle(value: string) {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
    );
  }

  return (
    <div ref={ref} className="relative px-1.5 pb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
          open ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
        } ${selectedValues.length > 0 ? 'bg-white text-gray-800' : 'bg-white text-gray-400'}`}
      >
        <Search size={11} className="flex-shrink-0 text-gray-400" />
        <span className="flex-1 truncate text-left">{displayValue || 'Search creators…'}</span>
        <ChevronDown
          size={10}
          className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-1.5 right-1.5 top-full z-30 mt-0.5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-1.5">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-gray-200 py-1 pl-6 pr-2 text-xs focus:border-blue-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto py-0.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No creators found</p>
            ) : (
              filtered.map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={`flex w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-gray-50 ${
                      checked ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={checked}
                      tabIndex={-1}
                      className="h-3 w-3 flex-shrink-0 rounded border-gray-300 pointer-events-none"
                    />
                    <span
                      className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-2xs font-medium text-white"
                      style={{ backgroundColor: option.avatarColor }}
                    >
                      {option.initials}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
          {selectedValues.length > 0 && (
            <div className="border-t border-gray-100 px-2 py-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-2xs text-gray-500 hover:text-gray-700"
              >
                Clear selected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

