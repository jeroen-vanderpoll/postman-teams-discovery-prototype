import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, LayoutGrid, List, SlidersHorizontal, Check } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { buildTeamMemberPreviewList } from '../../utils/teamMembers';
import type { MemberPreview } from '../../types';

type Membership = 'Member' | 'Collaborator';
type Role = 'Developer' | 'Manager';
type Member = MemberPreview & {
  handle: string;
  membership: Membership;
  role: Role;
  isCurrentUser?: boolean;
};
type SortCol = 'name' | 'membership' | 'role';
type SortDir = 'asc' | 'desc';

const MEMBERSHIP_RANK: Record<Membership, number> = { Collaborator: 0, Member: 1 };
const ROLE_RANK: Record<Role, number> = { Manager: 0, Developer: 1 };
const VIEW_STORAGE_KEY = 'team-members-view-mode';
const DEFAULT_ROLE_FILTER: Role | 'all' = 'all';
const DEFAULT_MEMBERSHIP_FILTER: Membership | 'all' = 'all';

function SortIcon({ col, active, dir }: { col: SortCol; active: SortCol; dir: SortDir }) {
  if (active !== col) return <ChevronsUpDown size={11} className="text-gray-400 ml-0.5" />;
  return dir === 'asc'
    ? <ChevronUp size={11} className="text-gray-700 ml-0.5" />
    : <ChevronDown size={11} className="text-gray-700 ml-0.5" />;
}

function sortMembers(members: Member[], col: SortCol, dir: SortDir): Member[] {
  return [...members].sort((a, b) => {
    let v = 0;
    if (col === 'name') v = a.name.localeCompare(b.name);
    else if (col === 'membership') v = MEMBERSHIP_RANK[a.membership] - MEMBERSHIP_RANK[b.membership];
    else if (col === 'role') v = ROLE_RANK[a.role] - ROLE_RANK[b.role];
    return dir === 'asc' ? v : -v;
  });
}

interface MembersTabProps {
  teamId: string;
  membersCount: number;
  memberPreview: MemberPreview[];
  isMember: boolean;
  isTeamOpen: boolean;
  isPending: boolean;
  currentUserMembership: 'member' | 'collaborator' | null;
  onJoin: () => void;
  onRequestToJoin: () => void;
  onInvitePeople: () => void;
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
  isTeamOpen,
  isPending,
  currentUserMembership,
  onJoin,
  onRequestToJoin,
  onInvitePeople,
}: MembersTabProps) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('membership');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>(DEFAULT_ROLE_FILTER);
  const [membershipFilter, setMembershipFilter] = useState<Membership | 'all'>(DEFAULT_MEMBERSHIP_FILTER);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>(
    () => (sessionStorage.getItem(VIEW_STORAGE_KEY) as 'list' | 'grid' | null) ?? 'list'
  );
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isCustomized =
    roleFilter !== DEFAULT_ROLE_FILTER || membershipFilter !== DEFAULT_MEMBERSHIP_FILTER;

  function setViewAndPersist(next: 'list' | 'grid') {
    setView(next);
    sessionStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const allTeamMembers = buildTeamMembers(
    teamId,
    membersCount,
    memberPreview,
    isMember,
    currentUserMembership
  );
  const visibleMembers = allTeamMembers;

  const filtered = visibleMembers.filter(
    (m) =>
      (
        !search.trim() ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.handle.toLowerCase().includes(search.toLowerCase())
      ) &&
      (roleFilter === 'all' || m.role === roleFilter) &&
      (membershipFilter === 'all' || m.membership === membershipFilter)
  );

  const shown = sortMembers(filtered, sortCol, sortDir);
  const currentUser = shown.find((m) => m.isCurrentUser);
  const others = shown.filter((m) => !m.isCurrentUser);
  const ordered = currentUser ? [currentUser, ...others] : shown;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="input-base pl-7 w-48"
          />
        </div>
        <div ref={filtersRef} className="relative">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            title="Filter members"
            className={`relative flex items-center justify-center p-1.5 rounded transition-colors ${
              filtersOpen
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <SlidersHorizontal size={13} />
            {isCustomized && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />}
          </button>
          {filtersOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <p className="px-3 pt-1.5 pb-0.5 text-2xs font-semibold text-gray-400">Role</p>
              {(['all', 'Manager', 'Developer'] as const).map((value) => (
                <button
                  key={`role-${value}`}
                  onClick={() => setRoleFilter(value)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                    roleFilter === value ? 'font-medium text-gray-900' : 'text-gray-600'
                  }`}
                >
                  <span className="w-3 flex-shrink-0">
                    {roleFilter === value && <Check size={11} className="text-gray-700" />}
                  </span>
                  {value === 'all' ? 'All roles' : value}
                </button>
              ))}

              <div className="border-t border-gray-100 my-1" />
              <p className="px-3 pt-1 pb-0.5 text-2xs font-semibold text-gray-400">Membership</p>
              {(['all', 'Collaborator', 'Member'] as const).map((value) => (
                <button
                  key={`membership-${value}`}
                  onClick={() => setMembershipFilter(value)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 ${
                    membershipFilter === value ? 'font-medium text-gray-900' : 'text-gray-600'
                  }`}
                >
                  <span className="w-3 flex-shrink-0">
                    {membershipFilter === value && <Check size={11} className="text-gray-700" />}
                  </span>
                  {value === 'all' ? 'All memberships' : value}
                </button>
              ))}

              {isCustomized && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setRoleFilter(DEFAULT_ROLE_FILTER);
                      setMembershipFilter(DEFAULT_MEMBERSHIP_FILTER);
                      setFiltersOpen(false);
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
        <div className="flex items-center border border-gray-200 rounded overflow-hidden ml-auto">
          <button
            onClick={() => setViewAndPersist('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List view"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setViewAndPersist('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Card view"
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>

      {view === 'list' ? (
      <div className="divide-y divide-gray-100">
        {/* Header */}
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center flex-1 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Name <SortIcon col="name" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleSort('role')}
            className="flex items-center w-28 pl-3 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Role <SortIcon col="role" active={sortCol} dir={sortDir} />
          </button>
          <button
            onClick={() => handleSort('membership')}
            className="flex items-center w-36 pl-3 text-2xs font-medium text-gray-500 hover:text-gray-700"
          >
            Membership <SortIcon col="membership" active={sortCol} dir={sortDir} />
          </button>
          <div className="w-24" />
        </div>

        {ordered.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No members found</div>
        ) : (
          ordered.map((m) => (
            <div key={m.id} className="flex items-center px-4 py-2 hover:bg-gray-50">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar initials={m.initials} color={m.avatarColor} size="sm" />
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {m.name}
                    {m.isCurrentUser && <span className="text-gray-500 font-normal"> (You)</span>}
                  </p>
                  <p className="text-2xs text-gray-400">{m.handle}</p>
                </div>
              </div>
              <div className="w-28 pl-3">
                <span className="text-xs text-gray-700">{m.role}</span>
              </div>
              <div className="w-36 pl-3">
                <span className="text-xs text-gray-700">{m.membership}</span>
              </div>
              <div className="w-24" />
            </div>
          ))
        )}
      </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ordered.map((m) => (
            <div key={m.id} className="card px-3 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar initials={m.initials} color={m.avatarColor} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {m.name}
                    {m.isCurrentUser && <span className="text-gray-500 font-normal"> (You)</span>}
                  </p>
                  <p className="text-2xs text-gray-400 truncate">{m.handle}</p>
                  <p className="text-2xs text-gray-500 truncate">{m.role}</p>
                </div>
              </div>
            </div>
          ))}
          {isMember ? (
            <div className="card px-3 py-3 flex flex-col justify-between gap-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-xs text-gray-600">Grow the crew?</p>
              <button className="btn-secondary text-2xs px-2 py-1" onClick={onInvitePeople}>
                Invite people
              </button>
            </div>
          ) : (
            <div className="card px-3 py-3 flex flex-col justify-between gap-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-xs text-gray-600">Want in on the fun?</p>
              {isPending ? (
                <button className="btn-secondary text-2xs px-2 py-1 opacity-60" disabled>
                  Request sent
                </button>
              ) : isTeamOpen ? (
                <button className="btn-secondary text-2xs px-2 py-1" onClick={onJoin}>
                  Join team
                </button>
              ) : (
                <button className="btn-secondary text-2xs px-2 py-1" onClick={onRequestToJoin}>
                  Request to join team
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
