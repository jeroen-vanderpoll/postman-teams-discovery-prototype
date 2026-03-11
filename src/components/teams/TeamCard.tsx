import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Lock, MoreHorizontal, Users, LayoutGrid, Building2, Handshake, Globe, ChevronRight, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { JoinRequestModal } from './JoinRequestModal';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { useTeamActions } from './useTeamActions';
import { useWorkspacesStore } from '../../store/workspacesStore';
import type { Team, MemberPreview, WorkspaceType } from '../../types';

interface TeamCardProps {
  team: Team;
}

const WORKSPACE_TYPE_ICONS: Record<WorkspaceType, { icon: React.ElementType; color: string }> = {
  internal: { icon: Building2, color: 'text-blue-500' },
  partner:  { icon: Handshake,  color: 'text-purple-500' },
  public:   { icon: Globe,      color: 'text-green-500' },
};

const PAGE_SIZE = 8;

export function TeamCard({ team }: TeamCardProps) {
  const navigate = useNavigate();
  const { workspaces } = useWorkspacesStore();
  const {
    isPending,
    showJoinModal,
    showLeaveDialog,
    setShowJoinModal,
    setShowLeaveDialog,
    handleJoin,
    handleRequestSubmit,
    handleLeaveConfirm,
    handleToggleStar,
  } = useTeamActions(team);

  const overflowItems = team.isMember
    ? [
        { label: 'Add members', onClick: () => {} },
        { label: 'Leave team', onClick: () => setShowLeaveDialog(true), danger: true },
      ]
    : [];

  const teamWorkspaces = workspaces.filter((w) => w.teamId === team.id);

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className={`card px-3 pt-3 pb-3 cursor-pointer hover:border-gray-300 hover:shadow transition-all group relative flex flex-col gap-2 ${!team.isMember ? 'bg-gray-50' : ''}`}
      >
        {/* ── Top-right chrome ── */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {team.isMember ? (
            /* Member: star (always if starred) + kebab on hover */
            <>
              {/* Starred state: always visible, fades when hover controls appear */}
              {team.isStarred && (
                <button
                  onClick={handleToggleStar}
                  className="p-1 text-yellow-400 group-hover:opacity-0 transition-opacity absolute right-0 top-0 pointer-events-none group-hover:pointer-events-none"
                >
                  <Star size={12} fill="currentColor" />
                </button>
              )}
              {/* Hover controls */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {overflowItems.length > 0 && <KebabMenu items={overflowItems} />}
                <button
                  onClick={handleToggleStar}
                  className={`p-1 rounded transition-colors ${team.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                >
                  <Star size={12} fill={team.isStarred ? 'currentColor' : 'none'} />
                </button>
              </div>
            </>
          ) : isPending ? (
            <span className="text-2xs text-gray-400 italic">Requested</span>
          ) : (
            /* Non-member: always show "Join" — modal handles closed teams */
            <button
              className="btn-secondary text-2xs px-2 py-0.5"
              onClick={team.isOpen ? handleJoin : () => setShowJoinModal(true)}
            >
              Join
            </button>
          )}
        </div>

        {/* ── Avatar + name (truncated) + handle ── */}
        <div className="flex items-center gap-2 min-w-0 pr-14">
          <Avatar initials={team.initials} color={team.avatarColor} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{team.name}</p>
              {!team.isOpen && <Lock size={9} className="text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-2xs text-gray-400 leading-tight truncate">{team.handle}</p>
          </div>
        </div>

        {/* ── Metadata chips — indent to align with name/handle ── */}
        <div className="flex items-center gap-3 pl-8" onClick={(e) => e.stopPropagation()}>
          <MembersPopover
            members={team.memberPreview}
            total={team.membersCount}
            groups={team.groupsCount}
            onViewAll={() => navigate(`/teams/${team.id}?tab=members`)}
          />
          <WorkspacesPopover
            workspaces={teamWorkspaces}
            total={team.workspacesCount}
            onViewAll={() => navigate(`/teams/${team.id}?tab=workspaces`)}
          />
        </div>
      </div>

      {showJoinModal && (
        <JoinRequestModal team={team} onSubmit={handleRequestSubmit} onClose={() => setShowJoinModal(false)} />
      )}
      {showLeaveDialog && (
        <LeaveConfirmDialog team={team} onConfirm={handleLeaveConfirm} onClose={() => setShowLeaveDialog(false)} />
      )}
    </>
  );
}

// ── Members popover ──────────────────────────────────────────────────────────
function MembersPopover({
  members,
  total,
  groups,
  onViewAll,
}: {
  members: MemberPreview[];
  total: number;
  groups: number;
  onViewAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); setShown(PAGE_SIZE); }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : members;
  const visible = filtered.slice(0, shown);
  const hasMore = filtered.length > shown;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); if (!open) { setSearch(''); setShown(PAGE_SIZE); } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Users size={11} className="text-gray-500" />
        <span className="font-medium">{total.toLocaleString()}</span>
      </button>

      {hovered && !open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none z-20">
          {total.toLocaleString()} users{groups > 0 ? ` · ${groups} groups` : ''}
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          {/* Search */}
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }}
                placeholder="Search members…"
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : (
              visible.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.initials[0]}
                  </div>
                  <span className="text-xs text-gray-700 truncate">{m.name}</span>
                </div>
              ))
            )}
            {hasMore && (
              <button
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - shown)} more…
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); onViewAll(); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
            >
              <span>View all {total.toLocaleString()} members</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workspaces popover ───────────────────────────────────────────────────────
function WorkspacesPopover({
  workspaces,
  total,
  onViewAll,
}: {
  workspaces: { id: string; name: string; type: WorkspaceType }[];
  total: number;
  onViewAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch(''); setShown(PAGE_SIZE); }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search.trim()
    ? workspaces.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    : workspaces;
  const visible = filtered.slice(0, shown);
  const hasMore = filtered.length > shown;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); if (!open) { setSearch(''); setShown(PAGE_SIZE); } }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors"
      >
        <LayoutGrid size={11} className="text-gray-500" />
        <span className="font-medium">{total}</span>
      </button>

      {hovered && !open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none z-20">
          {total} workspaces
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50" onClick={(e) => e.stopPropagation()}>
          {/* Search */}
          <div className="px-2.5 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShown(PAGE_SIZE); }}
                placeholder="Search workspaces…"
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded bg-gray-50 outline-none focus:border-gray-400 focus:bg-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No results</p>
            ) : (
              visible.map((ws) => {
                const { icon: TypeIcon, color } = WORKSPACE_TYPE_ICONS[ws.type];
                return (
                  <div key={ws.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                    <TypeIcon size={11} className={`${color} flex-shrink-0`} />
                    <span className="text-xs text-gray-700 truncate">{ws.name}</span>
                  </div>
                );
              })
            )}
            {hasMore && (
              <button
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-left"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - shown)} more…
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100">
            <button
              onClick={() => { setOpen(false); onViewAll(); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
            >
              <span>View all {total} workspaces</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Kebab menu ───────────────────────────────────────────────────────────────
function KebabMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreHorizontal size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); item.onClick(); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${item.danger ? 'text-red-600' : 'text-gray-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
