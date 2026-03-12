import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Lock, ArrowLeft, Camera, Pencil, Link2, LibraryBig, ArrowRightLeft, Clock, Wrench, Bug, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Breadcrumb } from '../components/shell/Breadcrumb';
import { Avatar } from '../components/ui/Avatar';
import { OverflowMenu } from '../components/ui/OverflowMenu';
import { WorkspacesTab } from '../components/workspaces/WorkspacesTab';
import { WorkspaceCard } from '../components/workspaces/WorkspaceCard';
import { MembersTab } from '../components/teams/MembersTab';
import { JoinRequestModal } from '../components/teams/JoinRequestModal';
import { LeaveConfirmDialog } from '../components/teams/LeaveConfirmDialog';
import { useTeamsStore } from '../store/teamsStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useToastStore } from '../store/toastStore';
import { getAccessibleTeamWorkspaces } from '../utils/workspaceAccess';
import { buildTeamMemberPreviewList } from '../utils/teamMembers';

type Tab = 'about' | 'workspaces' | 'members';

const COLLECTION_NAME_TEMPLATES = [
  'Auth flows',
  'Error handling',
  'Onboarding requests',
  'Webhook contracts',
  'Billing endpoints',
  'User lifecycle',
  'Rate limit patterns',
  'Testing scenarios',
  'Monitoring checks',
  'Release smoke tests',
];

function getRealisticCollectionName(collectionId: string, rawName: string): string {
  if (!/collection\s+\d+/i.test(rawName)) return rawName;
  const seed = collectionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLLECTION_NAME_TEMPLATES[seed % COLLECTION_NAME_TEMPLATES.length];
}

function getHeroStyle(teamId: string, heroImageUrl?: string) {
  if (heroImageUrl) {
    return {
      backgroundImage: `linear-gradient(0deg, rgba(15,23,42,0.06), rgba(15,23,42,0.06)), url(${heroImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  const hue = [...teamId].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
  return {
    backgroundImage: `radial-gradient(circle at 16px 16px, hsla(${hue}, 65%, 68%, 0.22) 0, hsla(${hue}, 65%, 68%, 0.22) 6px, transparent 7px), linear-gradient(90deg, hsla(${hue}, 85%, 96%, 1), hsla(${(hue + 22) % 360}, 80%, 97%, 1))`,
    backgroundSize: '38px 38px, 100% 100%',
  };
}


export function TeamProfilePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { teams, joinTeam, requestToJoin, leaveTeam, toggleStar, pendingRequests } = useTeamsStore();
  const { workspaces } = useWorkspacesStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [starredCollectionIds, setStarredCollectionIds] = useState<Set<string>>(new Set());

  // Honour ?tab= query param (e.g. from popover "View all" links)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'about' || tab === 'members' || tab === 'workspaces') setActiveTab(tab);
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
  const generatedSummary = team.aiSummary?.trim() || null;
  const teamMembers = buildTeamMemberPreviewList({
    teamId: team.id,
    total: team.membersCount,
    memberPreview: team.memberPreview,
  });
  const accessibleTeamWorkspaces = getAccessibleTeamWorkspaces({
    workspaces,
    teamId: team.id,
    isTeamMember: team.isMember,
    isTeamOpen: team.isOpen,
  });
  const accessibleWorkspacesCount = accessibleTeamWorkspaces.length;
  const topWorkspaces = [...accessibleTeamWorkspaces]
    .sort((a, b) => +new Date(b.lastActivityTimestamp) - +new Date(a.lastActivityTimestamp))
    .slice(0, 5);
  const latestUpdates = [...accessibleTeamWorkspaces]
    .sort((a, b) => +new Date(b.lastActivityTimestamp) - +new Date(a.lastActivityTimestamp))
    .slice(0, 4);
  const topCollections = Array.from(
    new Map(
      accessibleTeamWorkspaces
        .flatMap((workspace) =>
          workspace.collections.map((collection) => {
            const seed = collection.id
              .split('')
              .reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return {
              ...collection,
              workspaceName: workspace.name,
              workspaceActivityTimestamp: workspace.lastActivityTimestamp,
              requestsCount: 12 + (seed % 190),
            };
          })
        )
        .map((collection) => [collection.id, collection])
    ).values()
  ).slice(0, 5);
  const aboutText = team.about?.trim() || team.description?.trim()
    || 'Add a short team overview so others know what this team owns and how to work with it.';
  const teamSlug = team.handle.replace(/^@/, '');
  const slackChannel = team.slackChannel;
  const quickLinks = [
    ...(slackChannel
      ? [{ label: `Slack #${slackChannel}`, href: `https://slack.com/app_redirect?channel=${encodeURIComponent(slackChannel)}` }]
      : []),
    { label: 'Jira board', href: `https://example.atlassian.net/jira/software/c/projects/${teamSlug.toUpperCase()}/boards/1` },
    { label: 'Confluence', href: `https://example.atlassian.net/wiki/spaces/${teamSlug.toUpperCase()}` },
    { label: 'Team docs', href: `https://docs.example.com/teams/${teamSlug}` },
  ];
  const focusAreas = ['Platform reliability', 'Internal tooling', 'Developer collaboration'];
  const contributorPeople = teamMembers.slice(0, 3).map((member, idx) => ({
    ...member,
    role: idx === 0 ? 'Manager' : null,
  }));
  const profileCompletionItems = [
    { label: 'About us', done: Boolean(team.about?.trim() || team.description?.trim()) },
    { label: 'Contact method', done: true },
    { label: 'Links', done: quickLinks.length >= 2 },
    { label: 'Contributors', done: team.membersCount > 0 },
    { label: 'Top workspaces', done: topWorkspaces.length >= 3 },
    { label: 'Top collections', done: topCollections.length > 0 },
    { label: 'What’s new', done: latestUpdates.length > 0 },
  ];
  const completedItems = profileCompletionItems.filter((item) => item.done).length;
  const profileCompletion = Math.round((completedItems / profileCompletionItems.length) * 100);
  const nextActions = profileCompletionItems.filter((item) => !item.done).slice(0, 2);
  const updateTypes = ['Improvement', 'Bug fix', 'Announcement'] as const;
  const updateCadenceWeeks = [2, 4, 7] as const;
  const whatsNewItems = latestUpdates.slice(0, 3).map((workspace, index) => ({
    workspace,
    type: updateTypes[index % updateTypes.length],
    timestampLabel: `${updateCadenceWeeks[index % updateCadenceWeeks.length]} weeks ago`,
    snippet:
      index % 3 === 0
        ? `Improved collaboration flow in ${workspace.name} to reduce setup friction and speed up handoffs.`
        : index % 3 === 1
          ? `Addressed reliability issues and resolved a regression reported by workspace contributors.`
          : `Shared a fresh update with the team, including rollout details and what to expect next.`,
  }));

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

  function toggleCollectionStar(collectionId: string) {
    setStarredCollectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
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
      <section className="mt-2 mb-7 overflow-hidden rounded-[12px] border border-gray-200 bg-white">
        <div className="group/hero relative h-28 w-full rounded-t-[12px]" style={getHeroStyle(team.id, team.heroImageUrl)}>
          <button
            aria-label="Edit hero image"
            onClick={() => {}}
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-white/80 text-gray-500 opacity-0 shadow-sm transition-opacity hover:text-gray-700 group-hover/hero:opacity-100"
          >
            <Camera size={12} />
          </button>
        </div>
        <div className="px-5 pb-4 pt-0">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="-mt-[70px] mb-2">
                <div className="group/avatar-edit relative inline-flex">
                  <Avatar initials={team.initials} color={team.avatarColor} size="2xl" />
                  <button
                    aria-label="Edit avatar"
                    onClick={() => {}}
                    className="absolute -right-0.5 -bottom-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-gray-900 text-white opacity-0 transition-opacity group-hover/avatar-edit:opacity-100"
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              </div>
              <div className="-mb-0.5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900">{team.name}</h1>
                  {!team.isOpen && (
                    <span className="flex items-center gap-1 rounded border border-gray-200 px-1.5 py-0.5 text-2xs text-gray-500">
                      <Lock size={9} />
                      Closed
                    </span>
                  )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {team.isMember ? (
                    <>
                      <button
                        onClick={() => toggleStar(team.id)}
                        className={`rounded border p-1.5 transition-colors ${
                          team.isStarred
                            ? 'border-yellow-300 bg-yellow-50 text-yellow-500'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-yellow-500'
                        }`}
                      >
                        <Star size={13} fill={team.isStarred ? 'currentColor' : 'none'} />
                      </button>
                      <OverflowMenu
                        items={[
                          { label: 'Manage team', onClick: () => addToast('Manage team coming soon', 'info') },
                          { label: 'Leave', onClick: () => setShowLeaveDialog(true), danger: true },
                        ]}
                      />
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

              <div className="mb-3 flex items-center gap-2">
                <p className="text-xs text-gray-400">{team.handle}</p>
              </div>

              {generatedSummary && (
                <div className="group/summary relative mb-1.5 pr-7">
                  <p className="truncate text-xs text-gray-500">{generatedSummary}</p>
                  <button
                    aria-label="Edit summary"
                    onClick={() => {}}
                    className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover/summary:opacity-100"
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>

      {/* Tabs — grey pill style */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'about'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          About
        </button>
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
      {activeTab === 'about' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="group/about lg:col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">About us</h2>
                <button
                  aria-label="Edit about"
                  onClick={() => {}}
                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover/about:opacity-100"
                >
                  <Pencil size={10} />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-6">{aboutText}</p>
            </section>

            <aside className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Information</h2>
              <div className="space-y-3">
                <div className="space-y-2.5">
                  <p className="text-2xs text-gray-400 mb-1">Contributors</p>
                  <div className="space-y-1.5">
                    {contributorPeople.map((person) => (
                      <div key={person.id} className="flex items-center gap-2">
                        <Avatar initials={person.initials} color={person.avatarColor} size="xs" />
                        <p className="text-xs text-gray-700">
                          {person.name}
                          {person.role ? <span className="text-gray-400"> • {person.role}</span> : null}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTab('members')}
                    className="pt-0.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    View all ({team.membersCount.toLocaleString()})
                  </button>
                </div>

                <div className="group/links relative pt-1 pr-7">
                  <p className="text-2xs text-gray-400 mb-1">Links</p>
                  <button
                    aria-label="Edit links"
                    onClick={() => {}}
                    className="absolute right-0 top-1 inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover/links:opacity-100"
                  >
                    <Pencil size={10} />
                  </button>
                  <ul className="flex flex-wrap gap-1.5">
                    {quickLinks.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900"
                        >
                          <Link2 size={11} />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="group/tags relative pt-1 pr-7">
                  <p className="text-2xs text-gray-400 mb-1">Tags</p>
                  <button
                    aria-label="Edit tags"
                    onClick={() => {}}
                    className="absolute right-0 top-1 inline-flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover/tags:opacity-100"
                  >
                    <Pencil size={10} />
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {focusAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700">Profile completion</p>
                    <span className="text-2xs text-gray-500">{profileCompletion}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  {nextActions.length > 0 && (
                    <p className="mt-1.5 text-2xs text-gray-500">
                      Next: {nextActions.map((item) => item.label).join(' • ')}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Top workspaces</h3>
                <button
                  onClick={() => setActiveTab('workspaces')}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  View all ({accessibleWorkspacesCount.toLocaleString()})
                </button>
              </div>
              {topWorkspaces.length > 0 ? (
                <div className="space-y-2">
                  {topWorkspaces.slice(0, 3).map((workspace) => (
                    <WorkspaceCard key={workspace.id} workspace={workspace} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No visible workspaces yet.</p>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Top collections</h3>
              {topCollections.length > 0 ? (
                <div className="space-y-2">
                  {topCollections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => addToast('Collection details coming soon', 'info')}
                      className="card px-3 pt-3 pb-3 hover:border-gray-300 hover:shadow transition-all group relative cursor-pointer flex flex-col gap-1.5"
                    >
                      <div
                        className="absolute top-2 right-2 flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {starredCollectionIds.has(collection.id) && (
                          <button
                            onClick={() => toggleCollectionStar(collection.id)}
                            className="p-1 text-yellow-400 group-hover:opacity-0 transition-opacity absolute right-0 top-0 pointer-events-none group-hover:pointer-events-none"
                          >
                            <Star size={12} fill="currentColor" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleCollectionStar(collection.id)}
                          className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                            starredCollectionIds.has(collection.id)
                              ? 'text-yellow-400'
                              : 'text-gray-400 hover:text-yellow-400'
                          }`}
                        >
                          <Star size={12} fill={starredCollectionIds.has(collection.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-indigo-100">
                          <LibraryBig size={13} className="text-indigo-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                            {getRealisticCollectionName(collection.id, collection.name)}
                          </p>
                          <p className="mt-0.5 text-2xs text-gray-400 leading-tight truncate">{collection.workspaceName}</p>
                        </div>
                      </div>
                      <p className="mt-0.5 flex items-center gap-3 pl-8 text-2xs text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <ArrowRightLeft size={11} className="text-gray-500" />
                          {collection.requestsCount} requests
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} className="text-gray-500" />
                          {formatDistanceToNow(new Date(collection.workspaceActivityTimestamp), {
                            addSuffix: true,
                          }).replace(/^about /, '')}
                        </span>
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => addToast('More collections coming soon', 'info')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Load more
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No collections yet.</p>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">What&apos;s new</h3>
              {whatsNewItems.length > 0 ? (
                <div className="space-y-2">
                  {whatsNewItems.map(({ workspace, type, snippet, timestampLabel }) => (
                    <div
                      key={`${workspace.id}-update`}
                      onClick={() => addToast('Update details coming soon', 'info')}
                      className="card px-3 pt-3 pb-3 hover:border-gray-300 hover:shadow transition-all group relative cursor-pointer flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                            type === 'Improvement'
                              ? 'bg-blue-100'
                              : type === 'Bug fix'
                                ? 'bg-red-100'
                                : 'bg-violet-100'
                          }`}
                        >
                          {type === 'Improvement' ? (
                            <Wrench size={13} className="text-blue-700" />
                          ) : type === 'Bug fix' ? (
                            <Bug size={13} className="text-red-700" />
                          ) : (
                            <Megaphone size={13} className="text-violet-700" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{workspace.name}</p>
                          <p className="mt-0.5 text-2xs text-gray-400 leading-tight truncate">
                            {type}
                          </p>
                        </div>
                      </div>
                      <p className="mt-0.5 pl-8 text-2xs text-gray-500 leading-snug line-clamp-2">{snippet}</p>
                      <p className="mt-0.5 pl-8 flex items-center gap-1 text-2xs text-gray-700">
                        <Clock size={11} className="text-gray-500" />
                        {timestampLabel}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => addToast('More updates coming soon', 'info')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Load more
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">No recent updates yet.</p>
              )}
            </section>
          </div>
        </div>
      ) : activeTab === 'members' ? (
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
          onInvitePeople={() => addToast('Invite flow coming soon', 'info')}
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
