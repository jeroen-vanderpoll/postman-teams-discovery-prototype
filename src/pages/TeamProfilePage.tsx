import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Lock, ArrowLeft, Camera, Pencil, Link2, Hash, LibraryBig, ArrowRightLeft, Clock, Wrench, Bug, Megaphone, X, Settings, Sparkles } from 'lucide-react';
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

function CardIdentity({
  icon,
  iconBgClass,
  iconClassName,
  title,
  meta,
}: {
  icon: ReactNode;
  iconBgClass: string;
  iconClassName?: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
        <span className={iconClassName}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{title}</p>
        <p className="mt-0.5 text-2xs text-gray-400 leading-tight truncate">{meta}</p>
      </div>
    </div>
  );
}

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
  const [isEmpty, setIsEmpty] = useState(false);
  const [showAgentPane, setShowAgentPane] = useState(false);
  const [tabAgentPaneOpen, setTabAgentPaneOpen] = useState(false);

  // Honour ?tab= query param (e.g. from popover "View all" links)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'about' || tab === 'members' || tab === 'workspaces') setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const root = document.querySelector('[data-team-profile-root]') as HTMLElement | null;
    // #region agent log
    fetch('http://127.0.0.1:7870/ingest/3980ba0b-2c70-4db9-9b3e-8d661282845b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'752e2f'},body:JSON.stringify({sessionId:'752e2f',runId:'pre-fix',hypothesisId:'H1-H4',location:'TeamProfilePage.tsx:104',message:'team profile layout state',data:{activeTab,isEmpty,showAgentPane,tabAgentPaneOpen,isAssistantPaneOpen:isEmpty && showAgentPane,isAnyAssistantPaneOpen:(isEmpty && showAgentPane) || tabAgentPaneOpen,windowWidth:window.innerWidth,rootWidth:root?.getBoundingClientRect().width ?? null,rootClass:root?.className ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [activeTab, isEmpty, showAgentPane, tabAgentPaneOpen]);

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
  const baseTeamMembers = buildTeamMemberPreviewList({
    teamId: team.id,
    total: team.membersCount,
    memberPreview: team.memberPreview,
  });
  const fallbackMember = baseTeamMembers[0] ?? {
    id: `${team.id}-manager`,
    name: 'Team manager',
    initials: team.initials,
    avatarColor: team.avatarColor,
  };
  const effectiveMembersCount = isEmpty ? 1 : team.membersCount;
  const effectiveMemberPreview = isEmpty ? [fallbackMember] : team.memberPreview;
  const generatedSummary = isEmpty ? null : (team.aiSummary?.trim() || null);
  const teamMembers = buildTeamMemberPreviewList({
    teamId: team.id,
    total: effectiveMembersCount,
    memberPreview: effectiveMemberPreview,
  });
  const accessibleTeamWorkspaces = isEmpty
    ? []
    : getAccessibleTeamWorkspaces({
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
  const aboutText = isEmpty ? '' : (team.about?.trim() || team.description?.trim() || '');
  const aboutMissing = aboutText.length === 0;
  const teamSlug = team.handle.replace(/^@/, '');
  const slackChannel = team.slackChannel;
  const quickLinks = isEmpty ? [] : [
    ...(slackChannel
      ? [{ label: `Slack #${slackChannel}`, href: `https://slack.com/app_redirect?channel=${encodeURIComponent(slackChannel)}` }]
      : []),
    { label: 'Jira board', href: `https://example.atlassian.net/jira/software/c/projects/${teamSlug.toUpperCase()}/boards/1` },
    { label: 'Confluence', href: `https://example.atlassian.net/wiki/spaces/${teamSlug.toUpperCase()}` },
    { label: 'Team docs', href: `https://docs.example.com/teams/${teamSlug}` },
  ];
  const focusAreas = isEmpty ? [] : ['Platform reliability', 'Internal tooling', 'Developer collaboration'];
  const contributorPeople = teamMembers.slice(0, isEmpty ? 1 : 3).map((member, idx) => ({
    ...member,
    role: idx === 0 ? 'Manager' : null,
  }));
  const profileCompletionItems = [
    { label: 'About us', done: !aboutMissing },
    { label: 'Contact method', done: true },
    { label: 'Links', done: quickLinks.length >= 2 },
    { label: 'Contributors', done: effectiveMembersCount > 0 },
    { label: 'Top workspaces', done: topWorkspaces.length >= 3 },
    { label: 'Top collections', done: topCollections.length > 0 },
    { label: 'What’s new', done: latestUpdates.length > 0 },
  ];
  const completedItems = profileCompletionItems.filter((item) => item.done).length;
  const profileCompletion = isEmpty ? 10 : Math.round((completedItems / profileCompletionItems.length) * 100);
  const nextActions = isEmpty
    ? [{ label: 'Add about us' }, { label: 'Add links' }]
    : profileCompletionItems.filter((item) => !item.done).slice(0, 2);
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
  const assistantFocusActions = [
    { id: 'about', label: 'Write a team about section', onClick: () => addToast('About editor coming soon', 'info') },
    { id: 'invite', label: 'Invite people to this team', onClick: () => setActiveTab('members') },
    { id: 'move-workspaces', label: 'Move workspaces to this team', onClick: () => setActiveTab('workspaces') },
  ];
  const primaryMember = teamMembers[0] ?? fallbackMember;
  const isAssistantPaneOpen = showAgentPane;
  const isAnyAssistantPaneOpen = isAssistantPaneOpen || tabAgentPaneOpen;

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
    <div
      data-team-profile-root
      className={`pt-5 pb-10 transition-[padding,max-width,margin] duration-200 ${
        isAnyAssistantPaneOpen
          ? 'mx-0 max-w-none px-4 sm:px-6 lg:px-8 lg:pr-[392px]'
          : 'mx-auto max-w-5xl px-8'
      }`}
    >
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
          Members ({effectiveMembersCount.toLocaleString()})
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'about' ? (
        isEmpty ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-gray-700">Complete your team profile</p>
                </div>
                <button
                  onClick={() => setShowAgentPane(true)}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Sparkles size={12} />
                  Build with AI
                </button>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Invite your crow, bring in your workspaces and tell us a bit more about the team.</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                <h2 className="text-sm font-semibold text-gray-900">About us</h2>
                <p className="mt-2 text-sm text-gray-400">
                  No team description yet.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => addToast('AI writer coming soon', 'info')}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Sparkles size={12} />
                    Write with AI
                  </button>
                </div>
              </section>

              <aside className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xs text-gray-400">People</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar initials={primaryMember.initials} color={primaryMember.avatarColor} size="xs" />
                      <p className="text-xs text-gray-600">
                        {effectiveMembersCount} {effectiveMembersCount === 1 ? 'manager' : 'members'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('members')}
                      className="mt-2 inline-flex h-6 items-center rounded border border-gray-200 px-2 text-2xs text-gray-600 hover:border-gray-300 hover:text-gray-800"
                    >
                      Invite people
                    </button>
                  </div>

                  <div>
                    <p className="text-2xs text-gray-400">Links</p>
                    {quickLinks.length === 0 ? (
                      <button
                        onClick={() => addToast('Link editor coming soon', 'info')}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Link2 size={12} />
                        Add links...
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-2xs text-gray-400">Tags</p>
                    {focusAreas.length === 0 ? (
                      <button
                        onClick={() => addToast('Tag editor coming soon', 'info')}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Hash size={12} />
                        Add tags...
                      </button>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
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
              {aboutMissing ? (
                <p className="text-sm text-gray-400 leading-6">
                  No team description yet. Add a short overview so others know what this team owns.
                </p>
              ) : (
                <p className="text-sm text-gray-700 leading-6">{aboutText}</p>
              )}
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
                    View all ({effectiveMembersCount.toLocaleString()})
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
                  {quickLinks.length === 0 ? (
                    <p className="text-xs text-gray-400">No links yet. Add team links.</p>
                  ) : (
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
                  )}
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
                  {focusAreas.length === 0 ? (
                    <p className="text-xs text-gray-400">No tags yet. Add tags for discoverability.</p>
                  ) : (
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
                  )}
                </div>

                {profileCompletion < 100 && (
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
                )}
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
                <p className="text-xs text-gray-400">No workspaces yet. Create the first one.</p>
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

                      <CardIdentity
                        icon={<LibraryBig size={13} />}
                        iconBgClass="bg-indigo-100"
                        iconClassName="text-indigo-700"
                        title={getRealisticCollectionName(collection.id, collection.name)}
                        meta={collection.workspaceName}
                      />
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
                <p className="text-xs text-gray-400">No collections yet. Publish your first collection.</p>
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
                      <CardIdentity
                        icon={
                          type === 'Improvement' ? (
                            <Wrench size={13} />
                          ) : type === 'Bug fix' ? (
                            <Bug size={13} />
                          ) : (
                            <Megaphone size={13} />
                          )
                        }
                        iconBgClass={
                          type === 'Improvement'
                            ? 'bg-blue-100'
                            : type === 'Bug fix'
                              ? 'bg-red-100'
                              : 'bg-violet-100'
                        }
                        iconClassName={
                          type === 'Improvement'
                            ? 'text-blue-700'
                            : type === 'Bug fix'
                              ? 'text-red-700'
                              : 'text-violet-700'
                        }
                        title={workspace.name}
                        meta={type}
                      />
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
                <p className="text-xs text-gray-400">No updates yet. Post your first update.</p>
              )}
            </section>
          </div>
        </div>
        )
      ) : activeTab === 'members' ? (
        <MembersTab
          teamId={team.id}
          membersCount={effectiveMembersCount}
          memberPreview={effectiveMemberPreview}
          isMember={team.isMember}
          isTeamOpen={team.isOpen}
          isPending={isPending}
          currentUserMembership={team.memberRole}
          onJoin={handleJoin}
          onRequestToJoin={() => setShowJoinModal(true)}
          onInvitePeople={() => addToast('Invite flow coming soon', 'info')}
          onAgentPaneOpenChange={setTabAgentPaneOpen}
        />
      ) : (
        (!team.isOpen && !team.isMember && !isPending) ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Join this team to view workspaces.
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-6">
            <p className="text-sm font-semibold text-gray-900">No workspaces yet</p>
            <p className="mt-1 text-xs text-gray-500">Move existing workspaces to this team to get started.</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => addToast('Move workspaces flow coming soon', 'info')}
                className="inline-flex h-7 items-center rounded border border-gray-200 px-2.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-800"
              >
                Move workspaces
              </button>
              <button
                onClick={() => addToast('Create workspace flow coming soon', 'info')}
                className="inline-flex h-7 items-center rounded bg-orange-500 px-2.5 text-xs text-white hover:bg-orange-600"
              >
                Create workspace
              </button>
            </div>
          </div>
        ) : (
          <WorkspacesTab
            teamId={team.id}
            isMember={team.isMember}
            isTeamOpen={team.isOpen}
            onAgentPaneOpenChange={setTabAgentPaneOpen}
          />
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

      {isAssistantPaneOpen && (
        <aside className="fixed right-0 top-12 bottom-0 z-40 w-full sm:w-[360px] border-l border-gray-200 bg-white shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-gray-900">New Chat</p>
              </div>
              <button
                onClick={() => setShowAgentPane(false)}
                className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close assistant"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-auto space-y-1.5 px-3 pb-3">
              {assistantFocusActions.map((step) => (
                <button
                  key={`assistant-${step.id}`}
                  onClick={step.onClick}
                  className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-left text-xs font-normal text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                >
                  {step.label}
                </button>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="rounded-lg border border-gray-300 bg-white px-3 py-2">
                <div className="mb-2 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full border border-gray-300" />
                  tetsing
                </div>
                <textarea
                  className="w-full resize-none border-0 p-0 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
                  rows={2}
                  placeholder="Describe what you need. Press @ for context, / for Skills."
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <button className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                    <Settings size={13} />
                    Auto
                  </button>
                  <button
                    onClick={() => addToast('Agent prompt sent', 'info')}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-600"
                    aria-label="Send"
                  >
                    ↵
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      <div className="fixed bottom-4 left-4 z-30">
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm text-xs text-gray-700">
          <span>IsEmpty?</span>
          <button
            type="button"
            onClick={() => setIsEmpty((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isEmpty ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEmpty ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {!showAgentPane && (
        <button
          onClick={() => setShowAgentPane(true)}
          className="fixed bottom-4 right-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-gray-300 hover:text-gray-700"
          aria-label="Open assistant"
        >
          <Sparkles size={14} />
        </button>
      )}
    </div>
  );
}
