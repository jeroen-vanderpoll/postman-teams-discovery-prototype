import { useNavigate } from 'react-router-dom';
import { Star, Lock, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { BubbleheadStack } from '../ui/BubbleheadStack';
import { JoinRequestModal } from './JoinRequestModal';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { useTeamActions } from './useTeamActions';
import type { Team } from '../../types';

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const navigate = useNavigate();
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

  const overflowItems = [
    ...(team.isMember
      ? [{ label: 'Leave team', onClick: () => setShowLeaveDialog(true), danger: true }]
      : []),
  ];

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className="card p-3 cursor-pointer hover:border-gray-300 hover:shadow-md transition-all group relative flex flex-col gap-2"
      >
        {/* Row 1: avatar + name + top-right actions */}
        <div className="flex items-start gap-2">
          <Avatar initials={team.initials} color={team.avatarColor} size="sm" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{team.name}</p>
              {!team.isOpen && <Lock size={9} className="text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-2xs text-gray-400 leading-tight">{team.workspacesCount} workspaces</p>
          </div>

          {/* Top-right: star + kebab (member) or CTA (non-member) */}
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {team.isMember ? (
              <>
                <button
                  onClick={handleToggleStar}
                  className={`p-1 rounded transition-colors ${
                    team.isStarred
                      ? 'text-yellow-400'
                      : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
                  }`}
                >
                  <Star size={11} fill={team.isStarred ? 'currentColor' : 'none'} />
                </button>
                {overflowItems.length > 0 && (
                  <KebabMenu items={overflowItems} />
                )}
              </>
            ) : isPending ? (
              <span className="text-2xs text-gray-400 italic">Requested</span>
            ) : team.isOpen ? (
              <button
                className="btn-secondary text-2xs px-2 py-0.5"
                onClick={handleJoin}
              >
                Join
              </button>
            ) : (
              <button
                className="btn-secondary text-2xs px-2 py-0.5"
                onClick={() => setShowJoinModal(true)}
              >
                Ask to join
              </button>
            )}
          </div>
        </div>

        {/* Row 2: bubbleheads */}
        <BubbleheadStack members={team.memberPreview} total={team.membersCount} />
      </div>

      {showJoinModal && (
        <JoinRequestModal
          team={team}
          onSubmit={handleRequestSubmit}
          onClose={() => setShowJoinModal(false)}
        />
      )}
      {showLeaveDialog && (
        <LeaveConfirmDialog
          team={team}
          onConfirm={handleLeaveConfirm}
          onClose={() => setShowLeaveDialog(false)}
        />
      )}
    </>
  );
}

// Inline kebab to avoid importing OverflowMenu (same logic, smaller trigger)
import { useEffect, useRef, useState } from 'react';

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
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
