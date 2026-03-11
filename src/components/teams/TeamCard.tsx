import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Lock, MoreHorizontal, Users, LayoutGrid, Building2, Handshake, Globe, ChevronRight } from 'lucide-react';
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

  const teamWorkspaces = workspaces.filter((w) => w.teamId === team.id).slice(0, 8);

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className="card px-3 pt-3 pb-3 cursor-pointer hover:border-gray-300 hover:shadow transition-all group relative flex flex-col gap-2.5"
      >
        {/* ── Top-right actions (hidden until hover) ── */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {team.isMember ? (
            <>
              {overflowItems.length > 0 && <KebabMenu items={overflowItems} />}
              <button
                onClick={handleToggleStar}
                className={`p-1 rounded transition-colors ${
                  team.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
                }`}
              >
                <Star size={12} fill={team.isStarred ? 'currentColor' : 'none'} />
              </button>
            </>
          ) : isPending ? (
            <span className="text-2xs text-gray-400 italic pr-0.5">Requested</span>
          ) : team.isOpen ? (
            <button className="btn-secondary text-2xs px-2 py-0.5" onClick={handleJoin}>
              Join
            </button>
          ) : (
            <button className="btn-secondary text-2xs px-2 py-0.5" onClick={() => setShowJoinModal(true)}>
              Ask to join
            </button>
          )}
        </div>

        {/* Also keep star always visible if starred (outside the hover group so it persists) */}
        {team.isMember && team.isStarred && (
          <div
            className="absolute top-2.5 right-2.5 flex items-center gap-0.5 group-hover:opacity-0 transition-opacity pointer-events-none"
          >
            <button
              className="p-1 rounded text-yellow-400 pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); handleToggleStar(e); }}
            >
              <Star size={12} fill="currentColor" />
            </button>
          </div>
        )}

        {/* ── Avatar + name + handle ── */}
        <div className="flex items-center gap-2 pr-10">
          <Avatar initials={team.initials} color={team.avatarColor} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{team.name}</p>
              {!team.isOpen && <Lock size={9} className="text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-2xs text-gray-400 leading-tight truncate">{team.handle}</p>
          </div>
        </div>

        {/* ── Metadata chips ── */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <MembersPopover members={team.memberPreview} total={team.membersCount} />
          <WorkspacesPopover teamId={team.id} workspaces={teamWorkspaces} total={team.workspacesCount} onNavigate={() => navigate(`/teams/${team.id}`)} />
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
function MembersPopover({ members, total }: { members: MemberPreview[]; total: number }) {
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
        className="flex items-center gap-1 text-2xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 hover:border-gray-300 transition-colors bg-white"
      >
        <Users size={10} className="text-gray-400" />
        <span>{total.toLocaleString()}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <p className="px-3 py-1.5 text-2xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
            Members ({total.toLocaleString()})
          </p>
          <div className="max-h-48 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.initials[0]}
                </div>
                <span className="text-xs text-gray-700 truncate">{m.name}</span>
              </div>
            ))}
          </div>
          {total > members.length && (
            <p className="px-3 py-1.5 text-2xs text-gray-400 border-t border-gray-100">
              +{total - members.length} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workspaces popover ───────────────────────────────────────────────────────
function WorkspacesPopover({
  teamId,
  workspaces,
  total,
  onNavigate,
}: {
  teamId: string;
  workspaces: { id: string; name: string; type: WorkspaceType }[];
  total: number;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  void teamId;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 text-2xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-1.5 py-0.5 hover:border-gray-300 transition-colors bg-white"
      >
        <LayoutGrid size={10} className="text-gray-400" />
        <span>{total}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <p className="px-3 py-1.5 text-2xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
            Workspaces ({total})
          </p>
          <div className="max-h-48 overflow-y-auto">
            {workspaces.map((ws) => {
              const { icon: TypeIcon, color } = WORKSPACE_TYPE_ICONS[ws.type];
              return (
                <div key={ws.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50">
                  <TypeIcon size={11} className={`${color} flex-shrink-0`} />
                  <span className="text-xs text-gray-700 truncate">{ws.name}</span>
                </div>
              );
            })}
          </div>
          {total > workspaces.length && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onNavigate(); }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-2xs text-gray-500 hover:text-gray-800 border-t border-gray-100 hover:bg-gray-50"
            >
              <span>View all {total} workspaces</span>
              <ChevronRight size={11} />
            </button>
          )}
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
