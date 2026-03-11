import { formatDistanceToNow } from 'date-fns';
import { Users, Link, Star, UserCircle2, Copy, Building2, Globe, Handshake, Lock } from 'lucide-react';
import type { Workspace } from '../../types';

interface WorkspacePeekCardProps {
  workspace: Workspace;
  ownerTeamName: string;
  align?: 'left' | 'right';
}

export function WorkspacePeekCard({ workspace, ownerTeamName, align = 'left' }: WorkspacePeekCardProps) {
  const activityLabel = formatDistanceToNow(new Date(workspace.lastActivityTimestamp), {
    addSuffix: true,
  }).replace(/^about /, '');

  const placement = align === 'right'
    ? 'left-full ml-2'
    : 'left-0';
  const iconData =
    workspace.type === 'public'
      ? { icon: Globe, className: 'text-green-700' }
      : workspace.type === 'partner'
        ? { icon: Handshake, className: 'text-purple-700' }
        : workspace.internalAccess === 'org-wide'
          ? { icon: Building2, className: 'text-blue-700' }
          : workspace.internalAccess === 'team-wide'
            ? { icon: Users, className: 'text-indigo-700' }
            : { icon: Lock, className: 'text-slate-700' };
  const AccessIcon = iconData.icon;

  return (
    <div
      className={`absolute top-full mt-1.5 ${placement} w-[270px] bg-white border border-gray-300 rounded-lg shadow-lg z-50
      opacity-0 translate-y-1 pointer-events-none transition-all duration-150 group-hover/peek:opacity-100
      group-hover/peek:translate-y-0 group-hover/peek:pointer-events-auto`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <AccessIcon size={12} className={`${iconData.className} flex-shrink-0`} />
              <p className="text-sm font-semibold text-gray-900 truncate">{workspace.name}</p>
            </div>
            <p className="text-xs leading-snug text-gray-700 mt-2 max-w-[225px]">
              This workspace helps our team maintain a high quality bar for our APIs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-gray-500 flex-shrink-0 pt-0.5">
            <Link size={13} />
            <Star size={13} />
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-[88px_1fr] gap-x-2.5 gap-y-1 text-xs leading-none">
          <span className="text-gray-500">Created by</span>
          <span className="inline-flex items-center gap-2 text-gray-900 min-w-0">
              <UserCircle2 size={12} className="text-gray-400" />
              Private user
          </span>

          <span className="text-gray-500">Owned by</span>
          <span className="text-gray-900 min-w-0 truncate">{ownerTeamName}</span>

          <span className="text-gray-500">Last activity</span>
          <span className="text-gray-900">{activityLabel}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-500 truncate pr-2">
          Workspace ID: {workspace.id}
        </span>
        <button className="text-gray-500 hover:text-gray-700">
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}
