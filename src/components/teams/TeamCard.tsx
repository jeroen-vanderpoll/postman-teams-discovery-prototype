import { useEffect, useRef, useState } from 'react';
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

  const overflowItems = team.isMember
    ? [
        { label: 'Add members', onClick: () => {} },
        { label: 'Leave team', onClick: () => setShowLeaveDialog(true), danger: true },
      ]
    : [];

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className="card px-3 pt-3 pb-2.5 cursor-pointer hover:border-gray-300 hover:shadow transition-all group relative flex flex-col"
      >
        {/* ── Top-right chrome: star + kebab ── */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {team.isMember && (
            <>
              {/* Kebab — visible on hover only */}
              {overflowItems.length > 0 && (
                <KebabMenu items={overflowItems} />
              )}
              {/* Star — always visible if starred, otherwise on hover */}
              <button
                onClick={handleToggleStar}
                className={`p-1 rounded transition-colors ${
                  team.isStarred
                    ? 'text-yellow-400'
                    : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
                }`}
              >
                <Star size={12} fill={team.isStarred ? 'currentColor' : 'none'} />
              </button>
            </>
          )}
        </div>

        {/* ── Row 1: avatar + name + handle ── */}
        <div className="flex items-center gap-2 mb-1 pr-12">
          <Avatar initials={team.initials} color={team.avatarColor} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{team.name}</p>
              {!team.isOpen && <Lock size={9} className="text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-2xs text-gray-400 leading-tight truncate">{team.handle}</p>
          </div>
        </div>

        {/* ── Row 2: metadata ── */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xs text-gray-500">{team.membersCount.toLocaleString()} members</span>
          <span className="text-2xs text-gray-300">·</span>
          <span className="text-2xs text-gray-500">{team.workspacesCount} workspaces</span>
        </div>

        {/* ── Row 3: bubbleheads ── */}
        <div className="mb-2.5">
          <BubbleheadStack members={team.memberPreview} total={team.membersCount} size="md" />
        </div>

        {/* ── Row 4: bottom-right CTA (non-member only) ── */}
        {!team.isMember && (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {isPending ? (
              <span className="text-2xs text-gray-400 italic py-1">Requested</span>
            ) : team.isOpen ? (
              <button className="btn-secondary text-2xs px-2.5 py-1" onClick={handleJoin}>
                Join
              </button>
            ) : (
              <button className="btn-secondary text-2xs px-2.5 py-1" onClick={() => setShowJoinModal(true)}>
                Ask to join
              </button>
            )}
          </div>
        )}
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
