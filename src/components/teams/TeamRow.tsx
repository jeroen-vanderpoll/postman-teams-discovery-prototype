import { useNavigate } from 'react-router-dom';
import { Star, Lock, LayoutGrid, Users } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { BubbleheadStack } from '../ui/BubbleheadStack';
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

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className="flex items-center px-4 py-2 cursor-pointer group hover:bg-gray-50 transition-colors"
      >
        {/* Name col */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Avatar initials={team.initials} color={team.avatarColor} size="sm" />
          <div className="min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-gray-900 truncate">{team.name}</span>
              {!team.isOpen && <Lock size={10} className="text-gray-400 flex-shrink-0" />}
            </div>
            <span className="text-2xs text-gray-400 leading-tight">{team.handle}</span>
          </div>
        </div>

        {/* Members col: fixed-width count slot + fixed-width avatar slot */}
        <div className="w-56 flex items-center flex-shrink-0">
          <div className="relative group/members flex items-center gap-1 w-20 flex-shrink-0">
            <Users size={11} className="text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-500 whitespace-nowrap cursor-default">
              {team.membersCount.toLocaleString()}
            </span>
            {team.groupsCount > 0 && (
              <div className="absolute bottom-full left-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover/members:opacity-100 transition-opacity z-20">
                {team.membersCount.toLocaleString()} users · {team.groupsCount} groups
              </div>
            )}
          </div>
          <div className="w-14 flex-shrink-0 hidden">
            <BubbleheadStack members={team.memberPreview} total={team.membersCount} showOverflow={true} />
          </div>
        </div>

        {/* Workspaces col: icon + number */}
        <div className="w-28 flex items-center gap-1 flex-shrink-0 text-xs text-gray-500">
          <LayoutGrid size={11} className="text-gray-500" />
          <span>{team.workspacesCount}</span>
        </div>

        {/* Membership col */}
        <div className="w-36 flex-shrink-0">
          {team.memberRole && (
            <span className="text-xs text-gray-500 capitalize">
              {team.memberRole}
            </span>
          )}
        </div>

        {/* Actions col */}
        <div className="flex items-center gap-1.5 w-24 flex-shrink-0 justify-end" onClick={(e) => e.stopPropagation()}>
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
                <Star size={12} fill={team.isStarred ? 'currentColor' : 'none'} />
              </button>
              <OverflowMenu items={overflowItems} />
            </>
          ) : isPending ? (
            <span className="text-2xs text-gray-400 italic px-1">Requested</span>
          ) : (
            <button
              className="btn-secondary text-2xs px-2.5 py-1"
              onClick={team.isOpen ? handleJoin : () => setShowJoinModal(true)}
            >
              Join
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
