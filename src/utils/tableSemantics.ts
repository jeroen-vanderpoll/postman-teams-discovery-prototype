import type { DatabaseTableFilterOption } from '../components/ui/DatabaseTable';

export type TableSemanticResult = {
  search?: string;
  filters?: Record<string, string | string[]>;
};

export const STARRED_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'true', label: 'Starred' },
  { value: 'false', label: 'Not starred' },
];

export const TEAMS_MEMBERSHIP_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Member', label: 'Full access' },
  { value: 'Collaborator', label: 'Limited access' },
  { value: '-', label: 'No access' },
];

export const TEAMS_ROLE_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Manager', label: 'Manager' },
  { value: 'Developer', label: 'Developer' },
];

export const WORKSPACES_ACCESS_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Internal', label: 'Internal' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Public', label: 'Public' },
];

export const WORKSPACES_ROLE_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Editor', label: 'Editor' },
  { value: 'Viewer', label: 'Viewer' },
];

export const WORKSPACES_GIT_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Connected', label: 'Git connected' },
  { value: 'Not connected', label: 'Not connected' },
];

export const MEMBERS_ROLE_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Manager', label: 'Manager' },
  { value: 'Developer', label: 'Developer' },
];

export const MEMBERS_MEMBERSHIP_OPTIONS: DatabaseTableFilterOption[] = [
  { value: 'Member', label: 'Member' },
  { value: 'Collaborator', label: 'Collaborator' },
];

export function parseTeamsSemanticInput(input: string): TableSemanticResult {
  const query = input.toLowerCase();
  const filters: Record<string, string | string[]> = {};

  if (query.includes('teams to join') || query.includes('join team')) {
    filters.membership = ['-'];
  }
  if (query.includes("i'm in") || query.includes('my teams') || query.includes('teams i am in')) {
    filters.membership = ['Member', 'Collaborator'];
  }
  if (query.includes('starred')) filters.actions = ['true'];
  if (query.includes('not starred') || query.includes('unstarred')) filters.actions = ['false'];

  return Object.keys(filters).length > 0 ? { filters } : { search: input };
}

export function parseWorkspacesSemanticInput(input: string): TableSemanticResult {
  const query = input.toLowerCase();
  const filters: Record<string, string | string[]> = {};

  const types: string[] = [];
  if (query.includes('internal')) types.push('Internal');
  if (query.includes('partner')) types.push('Partner');
  if (query.includes('public')) types.push('Public');
  if (types.length > 0) filters.access = types;

  const roles: string[] = [];
  if (query.includes('admin')) roles.push('Admin');
  if (query.includes('editor')) roles.push('Editor');
  if (query.includes('viewer')) roles.push('Viewer');
  if (roles.length > 0) filters.role = roles;

  if (query.includes('starred')) filters.actions = ['true'];
  if (query.includes('not starred') || query.includes('unstarred')) filters.actions = ['false'];

  if (query.includes('git connected') || query.includes('connected with git')) {
    filters.gitConnected = ['Connected'];
  }
  if (query.includes('not connected')) {
    filters.gitConnected = ['Not connected'];
  }

  return Object.keys(filters).length > 0 ? { filters } : { search: input };
}

export function parseMembersSemanticInput(input: string): TableSemanticResult {
  const query = input.toLowerCase();
  const filters: Record<string, string | string[]> = {};

  const roles: string[] = [];
  if (query.includes('manager')) roles.push('Manager');
  if (query.includes('developer')) roles.push('Developer');
  if (roles.length > 0) filters.role = roles;

  const membership: string[] = [];
  if (query.includes('member')) membership.push('Member');
  if (query.includes('collaborator')) membership.push('Collaborator');
  if (membership.length > 0) filters.membership = membership;

  return Object.keys(filters).length > 0 ? { filters } : { search: input };
}
