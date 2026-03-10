import { formatDistanceToNow } from 'date-fns';
import { Star, MoreHorizontal } from 'lucide-react';
import { BubbleheadStack } from '../ui/BubbleheadStack';
import { TypeBadge } from '../ui/TypeBadge';
import { useWorkspacesStore } from '../../store/workspacesStore';
import type { Workspace } from '../../types';

interface WorkspaceCardProps {
  workspace: Workspace;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const { toggleStar } = useWorkspacesStore();

  const activityLabel = formatDistanceToNow(new Date(workspace.lastActivityTimestamp), {
    addSuffix: false,
  });

  return (
    <div className="card p-3 hover:border-gray-300 hover:shadow transition-all group relative cursor-pointer">
      {/* Star */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleStar(workspace.id); }}
        className={`absolute top-2 right-2 p-0.5 rounded transition-colors ${
          workspace.isStarred
            ? 'text-yellow-400'
            : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
        }`}
      >
        <Star size={12} fill={workspace.isStarred ? 'currentColor' : 'none'} />
      </button>

      <p className="text-xs font-semibold text-gray-900 mb-0.5 pr-4 truncate">{workspace.name}</p>
      <p className="text-2xs text-gray-400 mb-2.5">
        {workspace.collectionsCount} collections · {workspace.apisCount} APIs
      </p>

      <div className="flex items-center justify-between mb-2">
        <BubbleheadStack members={workspace.contributorPreview} total={workspace.contributorPreview.length + 2} />
        <TypeBadge type={workspace.type} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-2xs text-gray-400">Active {activityLabel} ago</span>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 rounded hover:bg-gray-100 text-gray-300 opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>
    </div>
  );
}
