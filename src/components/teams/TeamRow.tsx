import { useState } from 'react';
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

const ROLE_STYLES: Record<'member' | 'collaborator', string> = {
  member: 'bg-gray-100 text-gray-600',
  collaborator: 'bg-blue-50 text-blue-600',
};

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

  const isDiscovery = team.memberRole === null;

  return (
    <>
      <div
        onClick={() => navigate(`/teams/${team.id}`)}
        className={`flex items-center px-4 py-2 cursor-pointer group border-b border-gray-100 last:border-b-0 transition-colors ${
          isDiscovery ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
        }`}
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

        {/* Members col: bubbleheads + inline "X users · Y groups" */}
        <div className="w-52 flex items-center gap-2 flex-shrink-0">
          <BubbleheadStack members={team.memberPreview} total={team.membersCount} />
          <span className="text-2xs text-gray-500 whitespace-nowrap">
            <span className="inline-flex items-center gap-0.5">
              <Users size={10} className="text-gray-400" />
              <span>{team.membersCount.toLocaleString()}</span>
            </span>
            {team.groupsCount > 0 && (
              <span className="text-gray-400"> · {team.groupsCount} groups</span>
            )}
          </span>
        </div>

        {/* Workspaces col: icon + number */}
        <div className="w-16 flex items-center gap-1 flex-shrink-0 text-xs text-gray-500">
          <LayoutGrid size={11} className="text-gray-400" />
          <span>{team.workspacesCount}</span>
        </div>

        {/* Role col */}
        <div className="w-28 flex-shrink-0">
          {team.memberRole && (
            <span className={`inline-block px-1.5 py-0.5 rounded text-2xs font-medium capitalize ${ROLE_STYLES[team.memberRole]}`}>
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
