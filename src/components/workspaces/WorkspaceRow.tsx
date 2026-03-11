import { formatDistanceToNow } from 'date-fns';
import { Star, MoreHorizontal, Building2, Globe, Handshake, Users, Lock } from 'lucide-react';
import { useWorkspacesStore } from '../../store/workspacesStore';
import { useTeamsStore } from '../../store/teamsStore';
import { WorkspacePeekCard } from './WorkspacePeekCard';
import { CollectionsPopover, ContributorsPopover } from './WorkspacePopovers';
import type { Workspace, WorkspaceType } from '../../types';

interface WorkspaceRowProps {
  workspace: Workspace;
}

const TYPE_LABELS: Record<WorkspaceType, string> = {
  internal: 'Internal',
  partner: 'Partner',
  public: 'Public',
};

export function WorkspaceRow({ workspace }: WorkspaceRowProps) {
  const { toggleStar } = useWorkspacesStore();
  const { teams } = useTeamsStore();

  const activityLabel = formatDistanceToNow(new Date(workspace.lastActivityTimestamp), {
    addSuffix: true,
  }).replace(/^about /, '');

  const ownerTeam = teams.find((t) => t.id === workspace.teamId);
  const typeLabel = TYPE_LABELS[workspace.type];
  const internalMetaLabel =
    workspace.internalAccess === 'org-wide'
      ? 'Internal • Postman'
      : workspace.internalAccess === 'team-wide'
        ? `Internal • ${ownerTeam?.name ?? 'Team'}`
        : 'Internal • Invite only';
  const metaLabel = workspace.type === 'internal' ? internalMetaLabel : typeLabel;
  const accessData =
    workspace.type === 'public'
      ? {
          icon: Globe,
          label: 'Anyone on the internet',
          iconClass: 'text-green-700',
          iconBg: 'bg-green-100',
        }
      : workspace.type === 'partner'
        ? {
            icon: Handshake,
            label: 'Selected partners',
            iconClass: 'text-purple-700',
            iconBg: 'bg-purple-100',
          }
        : workspace.internalAccess === 'org-wide'
          ? {
              icon: Building2,
              label: 'Everyone in Postman',
              iconClass: 'text-blue-700',
              iconBg: 'bg-blue-100',
            }
          : workspace.internalAccess === 'team-wide'
            ? {
                icon: Users,
                label: `Everyone in ${ownerTeam?.name ?? 'team'}`,
                iconClass: 'text-indigo-700',
                iconBg: 'bg-indigo-100',
              }
            : {
                icon: Lock,
                label: 'Only invited people',
                iconClass: 'text-slate-700',
                iconBg: 'bg-slate-200',
              };
  const AccessIcon = accessData.icon;

  return (
    <div className="flex items-center px-4 py-2 hover:bg-gray-50 group cursor-pointer">
      {/* Name + meta */}
      <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${accessData.iconBg}`}>
          <AccessIcon size={13} className={accessData.iconClass} />
        </div>
        <div className="min-w-0 relative group/peek">
          <p className="text-xs font-medium text-gray-900 truncate">{workspace.name}</p>
          <WorkspacePeekCard
            workspace={workspace}
            ownerTeamName={ownerTeam?.name ?? 'Unknown team'}
            align="right"
          />
          <p className="text-2xs text-gray-400 truncate">{metaLabel}</p>
        </div>
      </div>

      {/* Contributors */}
      <div className="w-32 flex-shrink-0">
        <ContributorsPopover
          contributors={workspace.contributors}
          total={workspace.contributorsCount}
          triggerClassName="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        />
      </div>

      {/* Collections */}
      <div className="w-24 flex-shrink-0">
        <CollectionsPopover
          collections={workspace.collections}
          total={workspace.collectionsCount}
          triggerClassName="flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        />
      </div>

      {/* Activity */}
      <div className="w-36 flex-shrink-0 text-xs text-gray-700">
        {activityLabel}
      </div>

      {/* Your role */}
      <div className="w-28 flex-shrink-0 text-xs text-gray-700 capitalize">
        {workspace.yourRole}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 w-14 flex-shrink-0 justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => toggleStar(workspace.id)}
          className={`p-1 rounded transition-colors ${workspace.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
        >
          <Star size={12} fill={workspace.isStarred ? 'currentColor' : 'none'} />
        </button>
        <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
