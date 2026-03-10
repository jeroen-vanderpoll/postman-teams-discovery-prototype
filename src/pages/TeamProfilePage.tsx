import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Lock, ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { Avatar } from '../components/ui/Avatar';
import { WorkspacesTab } from '../components/workspaces/WorkspacesTab';
import { MembersTab } from '../components/teams/MembersTab';
import { JoinRequestModal } from '../components/teams/JoinRequestModal';
import { LeaveConfirmDialog } from '../components/teams/LeaveConfirmDialog';
import { useTeamsStore } from '../store/teamsStore';
import { useToastStore } from '../store/toastStore';

type Tab = 'workspaces' | 'members';

export function TeamProfilePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { teams, joinTeam, requestToJoin, leaveTeam, toggleStar, pendingRequests } = useTeamsStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<Tab>('workspaces');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    return (
      <div className="px-8 pt-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={13} />
          Back to Teams
        </button>
        <p className="text-sm text-gray-500">Team not found.</p>
      </div>
    );
  }

  const isPending = pendingRequests.has(team.id);
  const totalCount = team.membersCount + team.groupsCount;

  function handleJoin() {
    joinTeam(team!.id);
    addToast(`You joined ${team!.name}`);
  }

  function handleRequestSubmit(note: string) {
    requestToJoin(team!.id);
    setShowJoinModal(false);
    addToast(`Request sent to ${team!.name}`, 'info');
    void note;
  }

  function handleLeaveConfirm() {
    leaveTeam(team!.id);
    setShowLeaveDialog(false);
    addToast(`You left ${team!.name}`, 'info');
  }

  return (
    <div className="px-8 pt-5 pb-10 max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Postman', to: '/' },
          { label: 'Teams', to: '/teams' },
          { label: team.name },
        ]}
      />

      {/* Profile header */}
      <div className="flex items-start gap-4 mb-5 pt-1">
        <Avatar initials={team.initials} color={team.avatarColor} size="xl" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-semibold text-gray-900">{team.name}</h1>
            {!team.isOpen && (
              <span className="flex items-center gap-1 text-2xs text-gray-500 border border-gray-200 rounded px-1.5 py-0.5">
                <Lock size={9} />
                Closed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">{team.handle}</p>
          <p className="text-xs text-gray-500">
            {totalCount.toLocaleString()} members · {team.workspacesCount} workspaces
          </p>
          {team.description && (
            <p className="text-xs text-gray-500 mt-1.5 max-w-lg">{team.description}</p>
          )}
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          {team.isMember ? (
            <>
              <button
                onClick={() => toggleStar(team.id)}
                className={`p-1.5 rounded border transition-colors ${
                  team.isStarred
                    ? 'border-yellow-300 bg-yellow-50 text-yellow-500'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-yellow-500'
                }`}
              >
                <Star size={13} fill={team.isStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => setShowLeaveDialog(true)}
                className="btn-secondary"
              >
                Leave team
              </button>
            </>
          ) : isPending ? (
            <button className="btn-secondary opacity-60" disabled>
              Request sent
            </button>
          ) : team.isOpen ? (
            <button className="btn-primary" onClick={handleJoin}>
              Join team
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setShowJoinModal(true)}>
              Ask to join
            </button>
          )}
        </div>
      </div>

      {/* Closed team non-member gate */}
      {!team.isOpen && !team.isMember && !isPending && (
        <div className="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
          <Lock size={18} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">This team requires approval</p>
          <p className="text-xs text-gray-500 mb-3">
            Send a request to join and a team admin will review it.
          </p>
          <button className="btn-primary" onClick={() => setShowJoinModal(true)}>
            Ask to join
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-0">
          {(['workspaces', 'members'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'workspaces' ? (
        (!team.isOpen && !team.isMember && !isPending) ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Join this team to view workspaces.
          </div>
        ) : (
          <WorkspacesTab teamId={team.id} isMember={team.isMember} />
        )
      ) : (
        <MembersTab membersCount={team.membersCount} isMember={team.isMember} />
      )}

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
    </div>
  );
}
