import type { Workspace } from '../types';

export const DEFAULT_CURRENT_USER_ID = 'current-user';

interface AccessParams {
  workspace: Workspace;
  isTeamMember: boolean;
  isTeamOpen?: boolean;
  currentUserId?: string;
}

interface TeamAccessParams {
  workspaces: Workspace[];
  teamId: string;
  isTeamMember: boolean;
  isTeamOpen?: boolean;
  currentUserId?: string;
}

export function canAccessWorkspace({
  workspace,
  isTeamMember,
  isTeamOpen = true,
  currentUserId = DEFAULT_CURRENT_USER_ID,
}: AccessParams): boolean {
  // Closed team content is hidden for non-members.
  if (!isTeamMember && !isTeamOpen) return false;

  // Personal workspaces are only visible to their owner.
  if (workspace.visibility === 'personal') {
    return workspace.ownerUserId === currentUserId;
  }

  if (isTeamMember) return true;

  // Non-members only see org-wide internal workspaces.
  return workspace.type === 'internal' && workspace.internalAccess === 'org-wide';
}

export function getAccessibleTeamWorkspaces({
  workspaces,
  teamId,
  isTeamMember,
  isTeamOpen = true,
  currentUserId = DEFAULT_CURRENT_USER_ID,
}: TeamAccessParams): Workspace[] {
  return workspaces.filter(
    (workspace) =>
      workspace.teamId === teamId &&
      canAccessWorkspace({ workspace, isTeamMember, isTeamOpen, currentUserId })
  );
}
