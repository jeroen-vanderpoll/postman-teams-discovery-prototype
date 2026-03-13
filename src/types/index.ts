export type WorkspaceType = 'internal' | 'partner' | 'public';
export type WorkspaceContributorRole = 'admin' | 'editor' | 'viewer';
export type WorkspaceInternalAccess = 'org-wide' | 'team-wide' | 'private';

export interface MemberPreview {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

export interface WorkspaceContributor extends MemberPreview {
  role: WorkspaceContributorRole;
}

export interface WorkspaceCollection {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  handle: string;
  slackChannel?: string;
  heroImageUrl?: string;
  about?: string;
  aiSummary?: string;
  initials: string;
  avatarColor: string;
  isOpen: boolean;
  isMember: boolean;
  isStarred: boolean;
  memberRole: 'member' | 'collaborator' | null;
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
  visibility?: 'shared' | 'personal';
  ownerUserId?: string;
  collectionsCount: number;
  apisCount: number;
  contributorsCount: number;
  yourRole: WorkspaceContributorRole;
  contributorPreview: MemberPreview[];
  contributors: WorkspaceContributor[];
  collections: WorkspaceCollection[];
  type: WorkspaceType;
  internalAccess?: WorkspaceInternalAccess;
  gitRepo?: string;
  lastActivityTimestamp: string;
  isStarred: boolean;
}

export type JoinStatus = 'none' | 'pending' | 'member';
