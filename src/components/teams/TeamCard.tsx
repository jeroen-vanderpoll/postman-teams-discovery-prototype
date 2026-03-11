import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Lock, MoreHorizontal, Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { JoinRequestModal } from './JoinRequestModal';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { useTeamActions } from './useTeamActions';
import { useWorkspacesStore } from '../../store/workspacesStore';
import { MembersPopover, WorkspacesPopover, WORKSPACE_TYPE_ICONS } from './TeamPopovers';
import { PendingButton } from './PendingButton';
import type { Team } from '../../types';

interface TeamCardProps {
  team: Team;
}

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
    handleWithdrawRequest,
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
            <PendingButton onWithdraw={handleWithdrawRequest} size="xs" />
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
