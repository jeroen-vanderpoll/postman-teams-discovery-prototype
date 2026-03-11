import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Lock, ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { Avatar } from '../components/ui/Avatar';
import { WorkspacesTab } from '../components/workspaces/WorkspacesTab';
import { MembersTab } from '../components/teams/MembersTab';
import { JoinRequestModal } from '../components/teams/JoinRequestModal';
import { LeaveConfirmDialog } from '../components/teams/LeaveConfirmDialog';
import { useTeamsStore } from '../store/teamsStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useToastStore } from '../store/toastStore';
import { getAccessibleTeamWorkspaces } from '../utils/workspaceAccess';
import { buildTeamMemberPreviewList } from '../utils/teamMembers';
import type { MemberPreview } from '../types';

type Tab = 'workspaces' | 'members';

// ── Inline sub-component ──────────────────────────────────────────────────────
function MemberBubbleheads({
  members,
  total,
  onClick,
}: {
  members: MemberPreview[];
  total: number;
  onClick: () => void;
}) {
  const MAX_SHOWN = 10;
  const showOverflow = total > MAX_SHOWN;
  // Show 9 avatars + overflow circle when > 10, otherwise show up to 10
  const visible = showOverflow ? members.slice(0, 9) : members.slice(0, MAX_SHOWN);
  const overflow = total - 9;

  return (
    <button
      onClick={onClick}
      className="flex items-center -space-x-1 hover:opacity-80 transition-opacity"
    >
      {visible.map((m) => (
        <span
          key={m.id}
          className="relative group/avatar w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold ring-1 ring-white"
          style={{ backgroundColor: m.avatarColor }}
        >
          {m.initials.slice(0, 2)}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover/avatar:opacity-100 transition-opacity z-20">
            {m.name}
          </span>
        </span>
      ))}
      {showOverflow && (
        <span
          className="relative group/overflow w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[9px] font-medium ring-1 ring-white"
        >
          +{overflow > 99 ? '99' : overflow}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover/overflow:opacity-100 transition-opacity z-20">
            {total.toLocaleString()} members total
          </span>
        </span>
      )}
    </button>
  );
}


export function TeamProfilePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { teams, joinTeam, requestToJoin, leaveTeam, toggleStar, pendingRequests } = useTeamsStore();
  const { workspaces } = useWorkspacesStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<Tab>('workspaces');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Honour ?tab= query param (e.g. from popover "View all" links)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'members' || tab === 'workspaces') setActiveTab(tab);
  }, [searchParams]);

  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    return (
      <div className="px-8 pt-8 max-w-5xl mx-auto">
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
  const teamMembers = buildTeamMemberPreviewList({
    teamId: team.id,
    total: team.membersCount,
    memberPreview: team.memberPreview,
  });
  const slackChannel = team.slackChannel;
  const slackUrl = slackChannel
    ? `https://slack.com/app_redirect?channel=${encodeURIComponent(slackChannel)}`
    : null;
  const accessibleWorkspacesCount = getAccessibleTeamWorkspaces({
    workspaces,
    teamId: team.id,
    isTeamMember: team.isMember,
    isTeamOpen: team.isOpen,
  }).length;

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
    <div className="px-8 pt-5 pb-10 max-w-5xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Postman', to: '/' },
          { label: 'Teams', to: '/teams' },
          { label: team.name },
        ]}
      />

      {/* Profile header */}
      <div className="flex items-start gap-4 mb-7 pt-4">
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
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-gray-500">{team.handle}</p>
            {slackChannel && slackUrl && (
              <>
                <span className="text-gray-300 text-xs">•</span>
                <a
                  href={slackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 min-w-0"
                >
                  <span className="w-3 h-3 inline-flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 127 127" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
                      <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0"/>
                      <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D"/>
                      <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
                    </svg>
                  </span>
                  <span className="truncate">#{slackChannel}</span>
                </a>
              </>
            )}
          </div>

          {/* Member bubbleheads — click to go to Members tab */}
          <MemberBubbleheads
            members={teamMembers}
            total={team.membersCount}
            onClick={() => setActiveTab('members')}
          />
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
              <div className="relative group/leave">
                <button
                  onClick={() => setShowLeaveDialog(true)}
                  className="btn-destructive"
                >
                  Leave
                </button>
                <div className="absolute right-0 top-full mt-1.5 px-2 py-1 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover/leave:opacity-100 transition-opacity z-10">
                  Leave team
                </div>
              </div>
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
              Request to join
            </button>
          )}
        </div>
      </div>

      {/* Tabs — grey pill style */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'workspaces'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Workspaces ({accessibleWorkspacesCount})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'members'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Members ({team.membersCount.toLocaleString()})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'members' ? (
        <MembersTab
          teamId={team.id}
          membersCount={team.membersCount}
          memberPreview={team.memberPreview}
          isMember={team.isMember}
          isTeamOpen={team.isOpen}
          isPending={isPending}
          currentUserMembership={team.memberRole}
          onJoin={handleJoin}
          onRequestToJoin={() => setShowJoinModal(true)}
        />
      ) : (
        (!team.isOpen && !team.isMember && !isPending) ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Join this team to view workspaces.
          </div>
        ) : (
          <WorkspacesTab teamId={team.id} isMember={team.isMember} isTeamOpen={team.isOpen} />
        )
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
