import { useNavigate } from 'react-router-dom';
import { Star, Lock } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { BubbleheadStack } from '../ui/BubbleheadStack';
import { OverflowMenu } from '../ui/OverflowMenu';
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

  function handleCardClick() {
    navigate(`/teams/${team.id}`);
  }

  const overflowItems = team.isMember
    ? [{ label: 'Leave team', onClick: () => setShowLeaveDialog(true), danger: true }]
    : [];

  return (
    <>
      <div
        onClick={handleCardClick}
        className="card p-3 cursor-pointer hover:border-gray-300 hover:shadow transition-all group relative"
      >
        {/* Star */}
        {team.isMember && (
          <button
            onClick={handleToggleStar}
            className={`absolute top-2 right-2 p-0.5 rounded transition-colors ${
              team.isStarred ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
            }`}
          >
            <Star size={12} fill={team.isStarred ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-2 mb-2.5">
          <Avatar initials={team.initials} color={team.avatarColor} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{team.name}</p>
              {!team.isOpen && <Lock size={10} className="text-gray-400 flex-shrink-0" />}
            </div>
            <p className="text-2xs text-gray-500">{team.workspacesCount} workspaces</p>
          </div>
        </div>

        {/* Contributors */}
        <div className="mb-3">
          <BubbleheadStack
            members={team.memberPreview}
            total={team.membersCount}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {team.isMember ? (
            <>
              <button
                className="btn-secondary flex-1"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                Open
              </button>
              {overflowItems.length > 0 && <OverflowMenu items={overflowItems} />}
            </>
          ) : isPending ? (
            <button className="btn-secondary flex-1 opacity-60" disabled>
              Request sent
            </button>
          ) : team.isOpen ? (
            <button className="btn-primary flex-1" onClick={handleJoin}>
              Join
            </button>
          ) : (
            <button className="btn-primary flex-1" onClick={() => setShowJoinModal(true)}>
              Ask to join
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
