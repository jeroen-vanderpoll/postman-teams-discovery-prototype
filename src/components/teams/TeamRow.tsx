import { useNavigate } from 'react-router-dom';
import { Star, Lock, Info } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { OverflowMenu } from '../ui/OverflowMenu';
import { JoinRequestModal } from './JoinRequestModal';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { useTeamActions } from './useTeamActions';
import type { Team } from '../../types';

interface TeamRowProps {
  team: Team;
}

export function TeamRow({ team }: TeamRowProps) {
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

  const totalCount = team.membersCount + team.groupsCount;

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer group border-b border-gray-100 last:border-b-0"
      >
        {/* Name col */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Avatar initials={team.initials} color={team.avatarColor} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-900 truncate">{team.name}</span>
              {!team.isOpen && <Lock size={10} className="text-gray-400 flex-shrink-0" />}
            </div>
            <span className="text-2xs text-gray-400">{team.handle}</span>
          </div>
        </div>

        {/* Users & Groups count */}
        <div className="w-32 flex items-center gap-1 text-xs text-gray-600">
          <span>{totalCount.toLocaleString()}</span>
          <div className="relative group/tooltip">
            <Info size={11} className="text-gray-400 cursor-default" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
              Users ({team.membersCount.toLocaleString()}) and Groups ({team.groupsCount})
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 ml-4" onClick={(e) => e.stopPropagation()}>
          {team.isMember ? (
            <>
              {/* Star */}
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
              <OverflowMenu items={overflowItems} />
            </>
          ) : isPending ? (
            <button className="btn-secondary opacity-60 text-2xs px-2 py-1" disabled>
              Requested
            </button>
          ) : team.isOpen ? (
            <button className="btn-primary text-2xs px-2.5 py-1" onClick={handleJoin}>
              Join
            </button>
          ) : (
            <button
              className="btn-primary text-2xs px-2.5 py-1"
              onClick={() => setShowJoinModal(true)}
            >
              Request to join
            </button>
          )}
        </div>
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
