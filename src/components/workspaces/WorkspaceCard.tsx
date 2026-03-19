import { formatDistanceToNow } from 'date-fns';
import { Star, Building2, Globe, Handshake, Users, Lock, Clock } from 'lucide-react';
import { useWorkspacesStore } from '../../store/workspacesStore';
import { useTeamsStore } from '../../store/teamsStore';
import { WorkspacePeekCard } from './WorkspacePeekCard';
import { CollectionsPopover, ContributorsPopover } from './WorkspacePopovers';
import type { Workspace } from '../../types';

interface WorkspaceCardProps {
  workspace: Workspace;
  className?: string;
}

export function WorkspaceCard({ workspace, className }: WorkspaceCardProps) {
  const { toggleStar } = useWorkspacesStore();
  const { teams } = useTeamsStore();

  const activityLabel = formatDistanceToNow(
    new Date(workspace.lastActivityTimestamp),
    { addSuffix: true }
  ).replace(/^about /, '');

  const ownerTeam = teams.find((t) => t.id === workspace.teamId);
  const typeLabel = workspace.type === 'internal' ? 'Internal' : workspace.type === 'partner' ? 'Partner' : 'Public';
  const accessVisual =
    workspace.type === 'public'
      ? { icon: Globe, iconClass: 'text-green-700', iconBg: 'bg-green-100' }
      : workspace.type === 'partner'
        ? { icon: Handshake, iconClass: 'text-purple-700', iconBg: 'bg-purple-100' }
        : workspace.internalAccess === 'org-wide'
          ? { icon: Building2, iconClass: 'text-blue-700', iconBg: 'bg-blue-100' }
          : workspace.internalAccess === 'team-wide'
            ? { icon: Users, iconClass: 'text-indigo-700', iconBg: 'bg-indigo-100' }
            : { icon: Lock, iconClass: 'text-slate-700', iconBg: 'bg-slate-200' };
  const AccessIcon = accessVisual.icon;

  return (
    <div className={className ?? "card px-3 pt-3 pb-3 hover:border-gray-300 hover:shadow transition-all group relative cursor-pointer flex flex-col gap-2"}>
      {/* Top-right: star — same placement as TeamCard */}
      <div
        className="absolute top-2.5 right-2.5 flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        {workspace.isStarred && (
          <button
            onClick={() => toggleStar(workspace.id)}
            className="p-1 text-yellow-400 group-hover:opacity-0 transition-opacity absolute right-0 top-0 pointer-events-none group-hover:pointer-events-none"
          >
            <Star size={12} fill="currentColor" />
          </button>
        )}
        <button
          onClick={() => toggleStar(workspace.id)}
          className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${workspace.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
        >
          <Star size={12} fill={workspace.isStarred ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Identity block — reserve only the space needed for star */}
      <div className="flex items-center gap-2 min-w-0 pr-7">
        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${accessVisual.iconBg}`}>
          <AccessIcon size={13} className={accessVisual.iconClass} />
        </div>
        <div className="min-w-0 flex-1 relative z-10 group/peek hover:z-30">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{workspace.name}</p>
          <WorkspacePeekCard
            workspace={workspace}
            ownerTeamName={ownerTeam?.name ?? 'Unknown team'}
            align="left"
          />
          <p className="text-2xs text-gray-400 leading-tight truncate">{typeLabel}</p>
        </div>
      </div>

      {/* Metadata row — pl-8 = 24px icon + 8px gap, aligns under name, same as TeamCard */}
      <div className="flex items-center gap-3 pl-8">
        <ContributorsPopover
          contributors={workspace.contributors}
          total={workspace.contributorsCount}
          triggerClassName="flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        />

        <CollectionsPopover
          collections={workspace.collections}
          total={workspace.collectionsCount}
          triggerClassName="flex items-center gap-1 text-2xs text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
        />

        <div className="relative group/tip">
          <span className="flex items-center gap-1 text-2xs text-gray-700 cursor-default">
            <Clock size={11} className="text-gray-500" />
            {activityLabel}
          </span>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 bg-gray-900 text-white text-2xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity z-10">
            Last activity {activityLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
