import { useNavigate } from 'react-router-dom';
import { Star, Lock } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { OverflowMenu } from '../ui/OverflowMenu';
import { JoinRequestModal } from './JoinRequestModal';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';
import { MembersPopover, WorkspacesPopover } from './TeamPopovers';
import { PendingButton } from './PendingButton';
import { useTeamActions } from './useTeamActions';
import { useWorkspacesStore } from '../../store/workspacesStore';
import type { Team } from '../../types';

interface TeamRowProps {
  team: Team;
}

export function TeamRow({ team }: TeamRowProps) {
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
        className="flex items-center px-4 py-2 cursor-pointer group hover:bg-gray-50 transition-colors"
      >
        {/* Name col — flex-1 */}
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

        {/* Members col — w-44, popover on click, tooltip on hover */}
        <div className="w-44 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <MembersPopover
            members={team.memberPreview}
            total={team.membersCount}
            groups={team.groupsCount}
            onViewAll={() => navigate(`/teams/${team.id}?tab=members`)}
            triggerClassName="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          />
        </div>

        {/* Workspaces col — w-36, popover on click, tooltip on hover */}
        <div className="w-36 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <WorkspacesPopover
            workspaces={teamWorkspaces}
            total={team.workspacesCount}
            onViewAll={() => navigate(`/teams/${team.id}?tab=workspaces`)}
            triggerClassName="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          />
        </div>

        {/* Membership col — w-36 */}
        <div className="w-36 flex-shrink-0">
          {team.memberRole && (
            <span className="text-xs text-gray-700 capitalize">
              {team.memberRole}
            </span>
          )}
        </div>

        {/* Actions col — w-24 */}
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
            <PendingButton onWithdraw={handleWithdrawRequest} size="sm" />
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
