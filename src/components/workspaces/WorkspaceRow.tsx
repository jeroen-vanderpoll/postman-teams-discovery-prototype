import { formatDistanceToNow } from 'date-fns';
import { Star, MoreHorizontal, Building2, Globe, Handshake } from 'lucide-react';
import { BubbleheadStack } from '../ui/BubbleheadStack';
import { TypeBadge } from '../ui/TypeBadge';
import { useWorkspacesStore } from '../../store/workspacesStore';
import type { Workspace, WorkspaceType } from '../../types';

interface WorkspaceRowProps {
  workspace: Workspace;
}

const TYPE_ICONS: Record<WorkspaceType, { icon: React.ElementType; color: string }> = {
  internal: { icon: Building2, color: 'text-blue-500' },
  partner:  { icon: Handshake,  color: 'text-purple-500' },
  public:   { icon: Globe,      color: 'text-green-500' },
};

export function WorkspaceRow({ workspace }: WorkspaceRowProps) {
  const { toggleStar } = useWorkspacesStore();

  const activityLabel = formatDistanceToNow(new Date(workspace.lastActivityTimestamp), {
    addSuffix: false,
  });

  const { icon: TypeIcon, color: typeColor } = TYPE_ICONS[workspace.type];

  return (
    <div className="flex items-center px-4 py-2 hover:bg-gray-50 group border-b border-gray-100 last:border-b-0 cursor-pointer">
      {/* Name + meta */}
      <div className="flex items-start gap-2 flex-1 min-w-0 mr-4">
        <TypeIcon size={14} className={`${typeColor} flex-shrink-0 mt-0.5`} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">{workspace.name}</p>
          <p className="text-2xs text-gray-400">
            {workspace.collectionsCount} collections · {workspace.apisCount} APIs
          </p>
        </div>
      </div>

      {/* Contributors */}
      <div className="w-28 flex-shrink-0">
        <BubbleheadStack
          members={workspace.contributorPreview}
          total={workspace.contributorPreview.length + 2}
        />
      </div>

      {/* Type badge */}
      <div className="w-24 flex-shrink-0">
        <TypeBadge type={workspace.type} />
      </div>

      {/* Activity */}
      <div className="w-32 flex-shrink-0 text-2xs text-gray-400">
        Active {activityLabel} ago
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 w-14 flex-shrink-0 justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => toggleStar(workspace.id)}
          className={`p-1 rounded transition-colors ${
            workspace.isStarred
              ? 'text-yellow-400'
              : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
          }`}
        >
          <Star size={12} fill={workspace.isStarred ? 'currentColor' : 'none'} />
        </button>
        <button className="p-1 rounded hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
