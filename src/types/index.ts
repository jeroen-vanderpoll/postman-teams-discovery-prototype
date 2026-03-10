export type WorkspaceType = 'internal' | 'partner' | 'public';

export interface MemberPreview {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface Team {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarColor: string;
  isOpen: boolean;
  isMember: boolean;
  isStarred: boolean;
  membersCount: number;
  groupsCount: number;
  workspacesCount: number;
  memberPreview: MemberPreview[];
  description?: string;
}

export interface Workspace {
  id: string;
  teamId: string;
  name: string;
  collectionsCount: number;
  apisCount: number;
  contributorPreview: MemberPreview[];
  type: WorkspaceType;
  lastActivityTimestamp: string;
  isStarred: boolean;
}

export type JoinStatus = 'none' | 'pending' | 'member';
