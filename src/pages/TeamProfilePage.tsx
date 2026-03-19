import { useState, useEffect, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Lock, ArrowLeft, Camera, Pencil, Link2, LibraryBig, ArrowRightLeft, Clock, X, Settings, Sparkles, MessageSquare, Users } from 'lucide-react';
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
      <div className="px-8 pt-8 max-w-6xl mx-auto">
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
  const contributorPeople = teamMembers.slice(0, isEmpty ? 1 : 5).map((member, idx) => ({
    ...member,
    role: idx === 0 ? 'Manager' : null,
  }));
  const updateTypes = ['Improvement', 'Bug fix', 'Announcement'] as const;
  const updateCadenceWeeks = [2, 4, 7] as const;
  const whatsNewEngagement = [
    { comments: 1, reactions: [{ emoji: '👍', count: 10 }, { emoji: '👏', count: 4 }, { emoji: '😍', count: 2 }] },
    { comments: 3, reactions: [{ emoji: '👍', count: 5 }, { emoji: '😢', count: 1 }] },
    { comments: 0, reactions: [{ emoji: '👍', count: 2 }, { emoji: '🎉', count: 7 }] },
  ];
  const whatsNewContents = [
    {
      title: `${latestUpdates[0]?.name ?? 'Migration Staging'} v2.4 release`,
      body: 'This release improves the collaboration flow to reduce setup friction and speed up handoffs between team members.',
      sections: [
        {
          heading: 'New endpoints',
          items: [
            { method: 'POST', path: '/workspaces/{id}/handoffs', description: '— Initiates a workspace handoff to another team.' },
            { method: 'GET', path: '/workspaces/{id}/handoffs', description: '— Returns a list of all active handoffs.' },
          ],
        },
        {
          heading: 'Updated behavior',
          items: [
            { method: 'PATCH', path: '/workspaces/{id}', description: '— Now supports partial updates to workspace metadata.' },
          ],
        },
      ],
    },
    {
      title: `${latestUpdates[1]?.name ?? 'Legacy API Catalogue'} — regression fix`,
      body: 'Addressed reliability issues and resolved a regression reported by workspace contributors affecting collection sync.',
      sections: [
        {
          heading: 'Fixed issues',
          items: [
            { method: 'GET', path: '/collections/{id}/sync', description: '— No longer returns 500 on large collections.' },
            { method: 'PUT', path: '/collections/{id}', description: '— Fixed race condition when updating simultaneously.' },
          ],
        },
      ],
    },
    {
      title: `${latestUpdates[2]?.name ?? 'Enterprise Collections'} announcement`,
      body: 'Shared a fresh update with the team, including rollout details and what to expect in the next quarter.',
      sections: [
        {
          heading: 'What\'s coming',
          items: [
            { method: 'POST', path: '/collections/{id}/publish', description: '— New publishing flow with approval gates.' },
            { method: 'GET', path: '/collections/featured', description: '— Returns org-featured collections for the dashboard.' },
            { method: 'DELETE', path: '/collections/{id}/drafts', description: '— Clean up unpublished drafts in bulk.' },
          ],
        },
      ],
    },
  ];
  const whatsNewItems = latestUpdates.slice(0, 3).map((workspace, index) => ({
    workspace,
    type: updateTypes[index % updateTypes.length],
    timestampLabel: `${updateCadenceWeeks[index % updateCadenceWeeks.length]} weeks ago`,
    content: whatsNewContents[index % whatsNewContents.length],
    engagement: whatsNewEngagement[index % whatsNewEngagement.length],
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
          : 'mx-auto max-w-6xl px-8'
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

              {/* Meta rows */}
              <div className="mb-1 flex flex-col gap-1.5">
                {/* Row 1: Members */}
                <div className="flex items-center gap-2">
                  <div className="flex w-4 justify-center flex-shrink-0">
                    <Users size={12} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center">
                      {contributorPeople.map((person, i) => (
                        <div key={person.id} className={i > 0 ? '-ml-1.5' : ''} style={{ zIndex: 5 - i }}>
                          <Avatar initials={person.initials} color={person.avatarColor} size="xs" />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab('members')}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {effectiveMembersCount > 5
                        ? `+${(effectiveMembersCount - 5).toLocaleString()} more`
                        : null}
                    </button>
                    {team.isMember && (
                      <button
                        onClick={() => addToast('Invite flow coming soon', 'info')}
                        className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-2xs text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      >
                        Invite teammates
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Links */}
                <div className="flex items-center gap-2">
                  <div className="flex w-4 justify-center flex-shrink-0">
                    <Link2 size={12} className="text-gray-400" />
                  </div>
                  {quickLinks.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {quickLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => addToast('Link editor coming soon', 'info')}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Add links...
                    </button>
                  )}
                </div>

              </div>

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
            {/* AI companion box — full width */}
            <section className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 min-h-[320px] flex flex-col">
              <div className="flex-1 px-5 pt-5 pb-4 flex flex-col">
                <div className="flex items-start gap-3 mb-5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                    <Sparkles size={13} className="text-orange-500" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-white border border-gray-200 px-3.5 py-2.5 max-w-sm shadow-sm">
                    <p className="text-xs text-gray-700 leading-relaxed">👋 Hi! I can help you set up <strong>{team.name}</strong> — write your description, suggest links, and make your team easy to find.</p>
                  </div>
                </div>
                <div className="flex-1 mb-3 mt-24">
                  <p className="text-2xs font-medium text-gray-400 mb-2">Suggestions to get started with:</p>
                  <div className="divide-y divide-gray-200">
                    {[
                      'Write a team description',
                      'Invite my teammates',
                      'Move workspaces to this team',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setShowAgentPane(true)}
                        className="flex w-full items-center py-2.5 text-left text-xs text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <input
                    type="text"
                    placeholder="Tell us how we can help build your team..."
                    className="flex-1 text-xs text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                    onKeyDown={(e) => { if (e.key === 'Enter') setShowAgentPane(true); }}
                  />
                  <button
                    onClick={() => setShowAgentPane(true)}
                    className="flex-shrink-0 rounded bg-orange-400 px-2.5 py-1 text-xs font-medium text-white hover:bg-orange-500 transition-colors"
                  >
                    Let&apos;s Go
                  </button>
                </div>
              </div>
            </section>

            {/* Row 2: About (2/3) + Workspaces (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">About us</h2>
                </div>
                <p className="text-sm text-gray-400 leading-6 mb-3">No team description yet. Add a short overview so others know what this team owns.</p>
                <button
                  onClick={() => addToast('AI writer coming soon', 'info')}
                  className="inline-flex items-center gap-1.5 rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
                >
                  <Sparkles size={11} className="text-violet-400" />
                  Write with AI
                </button>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Top workspaces</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">No workspaces yet. Move or create workspaces to get started.</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToast('Move workspaces flow coming soon', 'info')}
                    className="inline-flex items-center rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
                  >
                    Move workspaces
                  </button>
                  <button
                    onClick={() => addToast('Create workspace flow coming soon', 'info')}
                    className="inline-flex items-center rounded border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
                  >
                    Create workspace
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : (
        <div className="space-y-4">
          <div>
            <section className="group/about rounded-xl border border-gray-200 bg-white px-4 py-3.5">
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
                <div className="space-y-3 text-sm text-gray-700 leading-6">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-gray-700 leading-6">{children}</p>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {aboutText}
                  </ReactMarkdown>
                </div>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left column: Top workspaces + Top collections stacked */}
            <div className="flex flex-col gap-4">
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
                  <div className="divide-y divide-gray-100">
                    {topWorkspaces.slice(0, 3).map((workspace) => (
                      <div key={workspace.id} className="-mx-4 px-4">
                        <WorkspaceCard workspace={workspace} className="py-3 hover:bg-gray-50 transition-colors group relative cursor-pointer flex flex-col gap-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No workspaces yet. Create the first one.</p>
                )}
              </section>

              <section className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Top collections</h3>
                {topCollections.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {topCollections.slice(0, 3).map((collection) => (
                      <div
                        key={collection.id}
                        onClick={() => addToast('Collection details coming soon', 'info')}
                        className="py-3 group relative cursor-pointer flex flex-col gap-1.5 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                      >
                        <div
                          className="absolute top-3 right-4 flex items-center"
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
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No collections yet. Publish your first collection.</p>
                )}
              </section>
            </div>

            {/* Right column (2/3): What's new — expanded cards */}
            <section className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">What&apos;s new</h3>
              {whatsNewItems.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {whatsNewItems.map(({ workspace, type, content, timestampLabel, engagement }) => (
                    <div
                      key={`${workspace.id}-update`}
                      onClick={() => addToast('Update details coming soon', 'info')}
                      className="py-4 group relative cursor-pointer hover:bg-gray-50 -mx-4 px-4 transition-colors"
                    >
                      {/* Header: author + timestamp + type badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={primaryMember.initials} color={primaryMember.avatarColor} size="xs" />
                          <span className="text-xs font-medium text-gray-700">{primaryMember.name}</span>
                          <span className="text-2xs text-gray-400">{timestampLabel}</span>
                        </div>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide ${
                          type === 'Improvement' ? 'bg-blue-50 text-blue-600' :
                          type === 'Bug fix' ? 'bg-red-50 text-red-600' :
                          'bg-violet-50 text-violet-600'
                        }`}>
                          {type}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-semibold text-gray-900 mb-1">{content.title}</p>

                      {/* Intro body */}
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{content.body}</p>

                      {/* Sections with endpoint bullets */}
                      {content.sections.map((section) => (
                        <div key={section.heading} className="mb-3">
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">{section.heading}</p>
                          <ul className="space-y-1.5">
                            {section.items.map((item) => (
                              <li key={item.path} className="flex items-start gap-1.5 text-xs text-gray-600 leading-relaxed">
                                <span className={`mt-px inline-flex shrink-0 items-center rounded px-1 py-px text-2xs font-semibold ${
                                  item.method === 'GET' ? 'bg-green-50 text-green-700' :
                                  item.method === 'POST' ? 'bg-blue-50 text-blue-700' :
                                  item.method === 'PUT' || item.method === 'PATCH' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                                }`}>{item.method}</span>
                                <span>
                                  <code className="rounded bg-gray-100 px-1 py-px text-2xs text-gray-700 font-mono">{item.path}</code>
                                  {' '}<span className="text-gray-500">{item.description}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {/* Footer: comments + reactions */}
                      <div className="flex items-center gap-3 text-2xs text-gray-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} />
                          {engagement.comments} {engagement.comments === 1 ? 'comment' : 'comments'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {engagement.reactions.map(({ emoji, count }) => (
                            <span key={emoji} className="flex items-center gap-0.5">
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  ))}
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
          currentUserMembership={team.memberRole}
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
