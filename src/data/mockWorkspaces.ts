import type { Workspace, MemberPreview } from '../types';

const CONTRIBUTORS: MemberPreview[] = [
  { id: 'm1', name: 'Alice Chen', initials: 'AC', avatarColor: '#3498DB' },
  { id: 'm2', name: 'Bob Rivera', initials: 'BR', avatarColor: '#2ECC71' },
  { id: 'm3', name: 'Carol Kim', initials: 'CK', avatarColor: '#9B59B6' },
  { id: 'm4', name: 'David Park', initials: 'DP', avatarColor: '#E74C3C' },
  { id: 'm5', name: 'Elena Moss', initials: 'EM', avatarColor: '#F1C40F' },
  { id: 'm6', name: 'Frank Ng', initials: 'FN', avatarColor: '#1ABC9C' },
  { id: 'm7', name: 'Grace Liu', initials: 'GL', avatarColor: '#E67E22' },
  { id: 'm8', name: 'Henry Walsh', initials: 'HW', avatarColor: '#607D8B' },
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}
function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}
function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60 * 1000).toISOString();
}

export const MOCK_WORKSPACES: Workspace[] = [
  // postman-migrated
  { id: 'ws-pm-1', teamId: 'postman-migrated', name: 'Migration Staging', collectionsCount: 42, apisCount: 8, contributorPreview: CONTRIBUTORS.slice(0, 4), type: 'internal', lastActivityTimestamp: hoursAgo(1), isStarred: true },
  { id: 'ws-pm-2', teamId: 'postman-migrated', name: 'Legacy API Catalogue', collectionsCount: 120, apisCount: 34, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(3), isStarred: false },
  { id: 'ws-pm-3', teamId: 'postman-migrated', name: 'Public Integration Hub', collectionsCount: 18, apisCount: 5, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'public', lastActivityTimestamp: daysAgo(1), isStarred: false },
  { id: 'ws-pm-4', teamId: 'postman-migrated', name: 'Partner Sandbox', collectionsCount: 9, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'partner', lastActivityTimestamp: daysAgo(3), isStarred: false },

  // workspaces team
  { id: 'ws-wk-1', teamId: 'workspaces', name: 'Core Platform', collectionsCount: 15, apisCount: 4, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: minutesAgo(45), isStarred: true },
  { id: 'ws-wk-2', teamId: 'workspaces', name: 'Dev Tooling', collectionsCount: 8, apisCount: 1, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(5), isStarred: false },
  { id: 'ws-wk-3', teamId: 'workspaces', name: 'Public Docs', collectionsCount: 6, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(0, 2), type: 'public', lastActivityTimestamp: daysAgo(2), isStarred: false },

  // customer-engineering
  { id: 'ws-ce-1', teamId: 'customer-engineering', name: 'Customer Integrations', collectionsCount: 22, apisCount: 6, contributorPreview: CONTRIBUTORS.slice(1, 5), type: 'partner', lastActivityTimestamp: hoursAgo(2), isStarred: true },
  { id: 'ws-ce-2', teamId: 'customer-engineering', name: 'Onboarding Templates', collectionsCount: 11, apisCount: 3, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'public', lastActivityTimestamp: daysAgo(1), isStarred: false },
  { id: 'ws-ce-3', teamId: 'customer-engineering', name: 'Internal Runbooks', collectionsCount: 5, apisCount: 0, contributorPreview: CONTRIBUTORS.slice(2, 4), type: 'internal', lastActivityTimestamp: daysAgo(5), isStarred: false },

  // product-support
  { id: 'ws-ps-1', teamId: 'product-support', name: 'Support Playbooks', collectionsCount: 14, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(6), isStarred: false },
  { id: 'ws-ps-2', teamId: 'product-support', name: 'Escalation APIs', collectionsCount: 7, apisCount: 3, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(2), isStarred: false },

  // field-operations
  { id: 'ws-fo-1', teamId: 'field-operations', name: 'Field Tools', collectionsCount: 9, apisCount: 1, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(4), isStarred: true },
  { id: 'ws-fo-2', teamId: 'field-operations', name: 'Regional APIs', collectionsCount: 4, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner', lastActivityTimestamp: daysAgo(4), isStarred: false },

  // partner-workspaces
  { id: 'ws-pw-1', teamId: 'partner-workspaces', name: 'Salesforce Integration', collectionsCount: 16, apisCount: 5, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'partner', lastActivityTimestamp: hoursAgo(1), isStarred: true },
  { id: 'ws-pw-2', teamId: 'partner-workspaces', name: 'AWS Connector', collectionsCount: 12, apisCount: 4, contributorPreview: CONTRIBUTORS.slice(0, 4), type: 'partner', lastActivityTimestamp: hoursAgo(8), isStarred: false },
  { id: 'ws-pw-3', teamId: 'partner-workspaces', name: 'Public Partner Docs', collectionsCount: 8, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(1, 3), type: 'public', lastActivityTimestamp: daysAgo(1), isStarred: false },

  // cloud-platform
  { id: 'ws-cp-1', teamId: 'cloud-platform', name: 'Infrastructure APIs', collectionsCount: 28, apisCount: 9, contributorPreview: CONTRIBUTORS.slice(2, 6), type: 'internal', lastActivityTimestamp: minutesAgo(20), isStarred: true },
  { id: 'ws-cp-2', teamId: 'cloud-platform', name: 'Deployment Pipelines', collectionsCount: 14, apisCount: 3, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(2), isStarred: false },
  { id: 'ws-cp-3', teamId: 'cloud-platform', name: 'Status & Monitoring', collectionsCount: 6, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public', lastActivityTimestamp: daysAgo(1), isStarred: false },

  // iamz (not member but open)
  { id: 'ws-iz-1', teamId: 'iamz', name: 'Identity APIs', collectionsCount: 19, apisCount: 7, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(3), isStarred: false },
  { id: 'ws-iz-2', teamId: 'iamz', name: 'Auth Flows', collectionsCount: 11, apisCount: 4, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(2), isStarred: false },
  { id: 'ws-iz-3', teamId: 'iamz', name: 'SSO Integrations', collectionsCount: 7, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'partner', lastActivityTimestamp: daysAgo(3), isStarred: false },

  // ecosystem (not member but open)
  { id: 'ws-ec-1', teamId: 'ecosystem', name: 'Developer Portal APIs', collectionsCount: 14, apisCount: 5, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public', lastActivityTimestamp: hoursAgo(5), isStarred: false },
  { id: 'ws-ec-2', teamId: 'ecosystem', name: 'Partner Connect', collectionsCount: 9, apisCount: 3, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner', lastActivityTimestamp: daysAgo(1), isStarred: false },

  // publisher-success (not member but open)
  { id: 'ws-pb-1', teamId: 'publisher-success', name: 'Publisher Tools', collectionsCount: 8, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'public', lastActivityTimestamp: daysAgo(4), isStarred: false },

  // ide-platform (closed, not member)
  { id: 'ws-ip-1', teamId: 'ide-platform', name: 'IDE Core', collectionsCount: 32, apisCount: 11, contributorPreview: CONTRIBUTORS.slice(3, 7), type: 'internal', lastActivityTimestamp: hoursAgo(1), isStarred: false },
  { id: 'ws-ip-2', teamId: 'ide-platform', name: 'Plugin Registry', collectionsCount: 18, apisCount: 6, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: daysAgo(1), isStarred: false },

  // product-security (not member but open)
  { id: 'ws-se-1', teamId: 'product-security', name: 'Vulnerability Tracking', collectionsCount: 6, apisCount: 3, contributorPreview: CONTRIBUTORS.slice(0, 2), type: 'internal', lastActivityTimestamp: daysAgo(2), isStarred: false },

  // it-security-testing (closed, not member)
  { id: 'ws-it-1', teamId: 'it-security-testing', name: 'Pen Test Suites', collectionsCount: 12, apisCount: 5, contributorPreview: CONTRIBUTORS.slice(5, 8), type: 'internal', lastActivityTimestamp: daysAgo(3), isStarred: false },
  { id: 'ws-it-2', teamId: 'it-security-testing', name: 'Compliance APIs', collectionsCount: 7, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(6, 8), type: 'internal', lastActivityTimestamp: daysAgo(7), isStarred: false },

  // customer-journey
  { id: 'ws-cj-1', teamId: 'customer-journey', name: 'Journey Analytics', collectionsCount: 10, apisCount: 3, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(2), isStarred: false },
  { id: 'ws-cj-2', teamId: 'customer-journey', name: 'Touchpoint APIs', collectionsCount: 8, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner', lastActivityTimestamp: daysAgo(1), isStarred: false },

  // product-operations
  { id: 'ws-po-1', teamId: 'product-operations', name: 'Ops Dashboard', collectionsCount: 7, apisCount: 2, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'internal', lastActivityTimestamp: hoursAgo(7), isStarred: false },
];
