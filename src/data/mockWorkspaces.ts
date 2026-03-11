import type {
  Workspace,
  MemberPreview,
  WorkspaceCollection,
  WorkspaceContributor,
  WorkspaceContributorRole,
  WorkspaceInternalAccess,
} from '../types';

const CONTRIBUTORS: MemberPreview[] = [
  { id: 'm1', name: 'Alice Chen',   initials: 'AC', avatarColor: '#3498DB' },
  { id: 'm2', name: 'Bob Rivera',   initials: 'BR', avatarColor: '#2ECC71' },
  { id: 'm3', name: 'Carol Kim',    initials: 'CK', avatarColor: '#9B59B6' },
  { id: 'm4', name: 'David Park',   initials: 'DP', avatarColor: '#E74C3C' },
  { id: 'm5', name: 'Elena Moss',   initials: 'EM', avatarColor: '#F1C40F' },
  { id: 'm6', name: 'Frank Ng',     initials: 'FN', avatarColor: '#1ABC9C' },
  { id: 'm7', name: 'Grace Liu',    initials: 'GL', avatarColor: '#E67E22' },
  { id: 'm8', name: 'Henry Walsh',  initials: 'HW', avatarColor: '#607D8B' },
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

const ROLE_ORDER: WorkspaceContributorRole[] = ['admin', 'editor', 'viewer'];
const YOUR_ROLE_CYCLE: WorkspaceContributorRole[] = ['admin', 'editor', 'viewer'];

function roleForIndex(i: number, total: number): WorkspaceContributorRole {
  if (i < Math.min(3, Math.max(1, Math.ceil(total * 0.2)))) return 'admin';
  if (i < Math.max(2, Math.ceil(total * 0.6))) return 'editor';
  return 'viewer';
}

function buildContributors(total: number, seed: number): WorkspaceContributor[] {
  const list: WorkspaceContributor[] = [];
  for (let i = 0; i < total; i += 1) {
    const base = CONTRIBUTORS[(seed + i) % CONTRIBUTORS.length];
    const role = roleForIndex(i, total);
    list.push({
      id: `${base.id}-${seed}-${i}`,
      name: base.name,
      initials: base.initials,
      avatarColor: base.avatarColor,
      role,
    });
  }
  return list.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
}

function buildCollections(total: number, workspaceName: string): WorkspaceCollection[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `${workspaceName.toLowerCase().replace(/\s+/g, '-')}-col-${i + 1}`,
    name: `${workspaceName} Collection ${i + 1}`,
  }));
}

function getInternalAccessByOrdinal(ordinal: number, total: number): WorkspaceInternalAccess {
  const orgWideCount = Math.max(1, Math.floor(total * 0.2)); // <20% target
  const teamWideCount = Math.max(1, Math.floor(total * 0.4)); // ~40% target
  if (ordinal < orgWideCount) return 'org-wide';
  if (ordinal < orgWideCount + teamWideCount) return 'team-wide';
  return 'private';
}

const WORKSPACES_RAW: Omit<Workspace, 'contributors' | 'collections' | 'yourRole' | 'internalAccess'>[] = [
  // postman-migrated
  { id: 'ws-pm-1', teamId: 'postman-migrated', name: 'Migration Staging',     collectionsCount: 42,  apisCount: 8,  contributorsCount: 26, contributorPreview: CONTRIBUTORS.slice(0, 4), type: 'internal', lastActivityTimestamp: hoursAgo(1),    isStarred: true  },
  { id: 'ws-pm-2', teamId: 'postman-migrated', name: 'Legacy API Catalogue',  collectionsCount: 120, apisCount: 34, contributorsCount: 41, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(3),    isStarred: false },
  { id: 'ws-pm-3', teamId: 'postman-migrated', name: 'Public Integration Hub',collectionsCount: 18,  apisCount: 5,  contributorsCount: 14, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'public',   lastActivityTimestamp: daysAgo(1),     isStarred: false },
  { id: 'ws-pm-4', teamId: 'postman-migrated', name: 'Partner Sandbox',       collectionsCount: 9,   apisCount: 2,  contributorsCount: 8,  contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'partner',  lastActivityTimestamp: daysAgo(3),     isStarred: false },
  { id: 'ws-pm-5', teamId: 'postman-migrated', name: 'Consumer API Network',  collectionsCount: 26,  apisCount: 9,  contributorsCount: 30, contributorPreview: CONTRIBUTORS.slice(0, 4), type: 'internal', lastActivityTimestamp: daysAgo(2),     isStarred: false },
  { id: 'ws-pm-6', teamId: 'postman-migrated', name: 'Enterprise Collections',collectionsCount: 34,  apisCount: 12, contributorsCount: 22, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(6),    isStarred: false },
  { id: 'ws-pm-7', teamId: 'postman-migrated', name: 'Auth Gateway',          collectionsCount: 11,  apisCount: 4,  contributorsCount: 13, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: hoursAgo(9),    isStarred: false },
  { id: 'ws-pm-8', teamId: 'postman-migrated', name: 'Developer Onboarding',  collectionsCount: 19,  apisCount: 6,  contributorsCount: 17, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'public',   lastActivityTimestamp: daysAgo(4),     isStarred: false },
  { id: 'ws-pm-9', teamId: 'postman-migrated', name: 'Partner Integrations',  collectionsCount: 24,  apisCount: 7,  contributorsCount: 20, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner',  lastActivityTimestamp: daysAgo(5),     isStarred: false },
  { id: 'ws-pm-10',teamId: 'postman-migrated', name: 'Rate Limiting Rules',   collectionsCount: 8,   apisCount: 3,  contributorsCount: 9,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'internal', lastActivityTimestamp: daysAgo(1),     isStarred: false },
  { id: 'ws-pm-11',teamId: 'postman-migrated', name: 'Billing APIs',          collectionsCount: 16,  apisCount: 5,  contributorsCount: 12, contributorPreview: CONTRIBUTORS.slice(5, 8), type: 'internal', lastActivityTimestamp: hoursAgo(12),   isStarred: false },
  { id: 'ws-pm-12',teamId: 'postman-migrated', name: 'Incident Runbooks',     collectionsCount: 14,  apisCount: 2,  contributorsCount: 11, contributorPreview: CONTRIBUTORS.slice(0, 2), type: 'internal', lastActivityTimestamp: daysAgo(6),     isStarred: false },
  { id: 'ws-pm-13',teamId: 'postman-migrated', name: 'SDK Validation',        collectionsCount: 21,  apisCount: 8,  contributorsCount: 19, contributorPreview: CONTRIBUTORS.slice(1, 3), type: 'public',   lastActivityTimestamp: daysAgo(2),     isStarred: false },
  { id: 'ws-pm-14',teamId: 'postman-migrated', name: 'Edge Proxy',            collectionsCount: 10,  apisCount: 3,  contributorsCount: 8,  contributorPreview: CONTRIBUTORS.slice(2, 4), type: 'internal', lastActivityTimestamp: hoursAgo(15),   isStarred: false },
  { id: 'ws-pm-15',teamId: 'postman-migrated', name: 'Schema Registry',       collectionsCount: 28,  apisCount: 10, contributorsCount: 24, contributorPreview: CONTRIBUTORS.slice(3, 5), type: 'internal', lastActivityTimestamp: daysAgo(7),     isStarred: false },
  { id: 'ws-pm-16',teamId: 'postman-migrated', name: 'Public Changelog',      collectionsCount: 7,   apisCount: 1,  contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(4, 6), type: 'public',   lastActivityTimestamp: daysAgo(3),     isStarred: false },
  { id: 'ws-pm-17',teamId: 'postman-migrated', name: 'OAuth Templates',       collectionsCount: 13,  apisCount: 4,  contributorsCount: 10, contributorPreview: CONTRIBUTORS.slice(5, 7), type: 'partner',  lastActivityTimestamp: daysAgo(8),     isStarred: false },
  { id: 'ws-pm-18',teamId: 'postman-migrated', name: 'Monitoring Dashboards', collectionsCount: 22,  apisCount: 6,  contributorsCount: 18, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(20),   isStarred: false },
  { id: 'ws-pm-19',teamId: 'postman-migrated', name: 'Governance Policies',   collectionsCount: 12,  apisCount: 2,  contributorsCount: 9,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: daysAgo(10),    isStarred: false },
  { id: 'ws-pm-20',teamId: 'postman-migrated', name: 'Webhook Samples',       collectionsCount: 17,  apisCount: 5,  contributorsCount: 15, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'public',   lastActivityTimestamp: daysAgo(11),    isStarred: false },
  { id: 'ws-pm-21',teamId: 'postman-migrated', name: 'Access Audits',         collectionsCount: 6,   apisCount: 1,  contributorsCount: 5,  contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'internal', lastActivityTimestamp: daysAgo(12),    isStarred: false },
  { id: 'ws-pm-22',teamId: 'postman-migrated', name: 'Latency Experiments',   collectionsCount: 9,   apisCount: 2,  contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'internal', lastActivityTimestamp: daysAgo(13),    isStarred: false },
  { id: 'ws-pm-23',teamId: 'postman-migrated', name: 'Partner QA Suite',      collectionsCount: 15,  apisCount: 4,  contributorsCount: 12, contributorPreview: CONTRIBUTORS.slice(5, 8), type: 'partner',  lastActivityTimestamp: daysAgo(14),    isStarred: false },
  { id: 'ws-pm-24',teamId: 'postman-migrated', name: 'API Migration Archive', collectionsCount: 31,  apisCount: 11, contributorsCount: 27, contributorPreview: CONTRIBUTORS.slice(0, 4), type: 'internal', lastActivityTimestamp: daysAgo(15),    isStarred: false },

  // workspaces team
  { id: 'ws-wk-1', teamId: 'workspaces', name: 'Core Platform', collectionsCount: 15, apisCount: 4, contributorsCount: 9,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: minutesAgo(45), isStarred: true  },
  { id: 'ws-wk-2', teamId: 'workspaces', name: 'Dev Tooling',   collectionsCount: 8,  apisCount: 1, contributorsCount: 5,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(5),    isStarred: false },
  { id: 'ws-wk-3', teamId: 'workspaces', name: 'Public Docs',   collectionsCount: 6,  apisCount: 2, contributorsCount: 3,  contributorPreview: CONTRIBUTORS.slice(0, 2), type: 'public',   lastActivityTimestamp: daysAgo(2),     isStarred: false },
  { id: 'ws-wk-4', teamId: 'workspaces', name: 'CLI Templates', collectionsCount: 11, apisCount: 3, contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(4),     isStarred: false },
  { id: 'ws-wk-5', teamId: 'workspaces', name: 'Release Notes', collectionsCount: 9,  apisCount: 1, contributorsCount: 4,  contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'public',   lastActivityTimestamp: daysAgo(6),     isStarred: false },

  // customer-engineering
  { id: 'ws-ce-1', teamId: 'customer-engineering', name: 'Customer Integrations', collectionsCount: 22, apisCount: 6, contributorsCount: 12, contributorPreview: CONTRIBUTORS.slice(1, 5), type: 'partner',  lastActivityTimestamp: hoursAgo(2),  isStarred: true  },
  { id: 'ws-ce-2', teamId: 'customer-engineering', name: 'Onboarding Templates',  collectionsCount: 11, apisCount: 3, contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'public',   lastActivityTimestamp: daysAgo(1),   isStarred: false },
  { id: 'ws-ce-3', teamId: 'customer-engineering', name: 'Internal Runbooks',     collectionsCount: 5,  apisCount: 0, contributorsCount: 4,  contributorPreview: CONTRIBUTORS.slice(2, 4), type: 'internal', lastActivityTimestamp: daysAgo(5),   isStarred: false },
  { id: 'ws-ce-4', teamId: 'customer-engineering', name: 'Success Plans',         collectionsCount: 14, apisCount: 2, contributorsCount: 8,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'partner',  lastActivityTimestamp: daysAgo(3),   isStarred: false },
  { id: 'ws-ce-5', teamId: 'customer-engineering', name: 'Implementation Guides', collectionsCount: 10, apisCount: 2, contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public',   lastActivityTimestamp: daysAgo(7),   isStarred: false },

  // product-support
  { id: 'ws-ps-1', teamId: 'product-support', name: 'Support Playbooks', collectionsCount: 14, apisCount: 2, contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(6),  isStarred: false },
  { id: 'ws-ps-2', teamId: 'product-support', name: 'Escalation APIs',   collectionsCount: 7,  apisCount: 3, contributorsCount: 4,  contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(2),   isStarred: false },
  { id: 'ws-ps-3', teamId: 'product-support', name: 'Case Triage',       collectionsCount: 9,  apisCount: 1, contributorsCount: 5,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'internal', lastActivityTimestamp: daysAgo(4),   isStarred: false },
  { id: 'ws-ps-4', teamId: 'product-support', name: 'Self-serve Docs',   collectionsCount: 13, apisCount: 2, contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public',   lastActivityTimestamp: daysAgo(8),   isStarred: false },

  // field-operations
  { id: 'ws-fo-1', teamId: 'field-operations', name: 'Field Tools',    collectionsCount: 9, apisCount: 1, contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(4),  isStarred: true  },
  { id: 'ws-fo-2', teamId: 'field-operations', name: 'Regional APIs',  collectionsCount: 4, apisCount: 2, contributorsCount: 3,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner',  lastActivityTimestamp: daysAgo(4),   isStarred: false },
  { id: 'ws-fo-3', teamId: 'field-operations', name: 'Ops Playbooks',   collectionsCount: 12, apisCount: 3, contributorsCount: 8, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(2), isStarred: false },
  { id: 'ws-fo-4', teamId: 'field-operations', name: 'Coverage Reports',collectionsCount: 7,  apisCount: 1, contributorsCount: 4, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'public',   lastActivityTimestamp: daysAgo(6), isStarred: false },

  // partner-workspaces
  { id: 'ws-pw-1', teamId: 'partner-workspaces', name: 'Salesforce Integration', collectionsCount: 16, apisCount: 5, contributorsCount: 9,  contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'partner', lastActivityTimestamp: hoursAgo(1),  isStarred: true  },
  { id: 'ws-pw-2', teamId: 'partner-workspaces', name: 'AWS Connector',          collectionsCount: 12, apisCount: 4, contributorsCount: 11, contributorPreview: CONTRIBUTORS.slice(0, 4), type: 'partner', lastActivityTimestamp: hoursAgo(8),  isStarred: false },
  { id: 'ws-pw-3', teamId: 'partner-workspaces', name: 'Public Partner Docs',    collectionsCount: 8,  apisCount: 2, contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(1, 3), type: 'public',  lastActivityTimestamp: daysAgo(1),   isStarred: false },
  { id: 'ws-pw-4', teamId: 'partner-workspaces', name: 'Partner Sandbox II',     collectionsCount: 10, apisCount: 3, contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'partner', lastActivityTimestamp: daysAgo(3),   isStarred: false },
  { id: 'ws-pw-5', teamId: 'partner-workspaces', name: 'Marketplace APIs',       collectionsCount: 14, apisCount: 5, contributorsCount: 10, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'partner', lastActivityTimestamp: daysAgo(9),   isStarred: false },

  // cloud-platform
  { id: 'ws-cp-1', teamId: 'cloud-platform', name: 'Infrastructure APIs',   collectionsCount: 28, apisCount: 9, contributorsCount: 18, contributorPreview: CONTRIBUTORS.slice(2, 6), type: 'internal', lastActivityTimestamp: minutesAgo(20), isStarred: true  },
  { id: 'ws-cp-2', teamId: 'cloud-platform', name: 'Deployment Pipelines',  collectionsCount: 14, apisCount: 3, contributorsCount: 8,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(2),    isStarred: false },
  { id: 'ws-cp-3', teamId: 'cloud-platform', name: 'Status & Monitoring',   collectionsCount: 6,  apisCount: 2, contributorsCount: 5,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public',   lastActivityTimestamp: daysAgo(1),     isStarred: false },
  { id: 'ws-cp-4', teamId: 'cloud-platform', name: 'Cluster Provisioning',  collectionsCount: 19, apisCount: 6, contributorsCount: 12, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'internal', lastActivityTimestamp: daysAgo(2),    isStarred: false },
  { id: 'ws-cp-5', teamId: 'cloud-platform', name: 'Runtime Security',       collectionsCount: 11, apisCount: 4, contributorsCount: 9,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'internal', lastActivityTimestamp: daysAgo(6),    isStarred: false },

  // iamz
  { id: 'ws-iz-1', teamId: 'iamz', name: 'Identity APIs',    collectionsCount: 19, apisCount: 7, contributorsCount: 8,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: hoursAgo(3),  isStarred: false },
  { id: 'ws-iz-2', teamId: 'iamz', name: 'Auth Flows',       collectionsCount: 11, apisCount: 4, contributorsCount: 5,  contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(2),   isStarred: false },
  { id: 'ws-iz-3', teamId: 'iamz', name: 'SSO Integrations', collectionsCount: 7,  apisCount: 2, contributorsCount: 4,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'partner',  lastActivityTimestamp: daysAgo(3),   isStarred: false },
  { id: 'ws-iz-4', teamId: 'iamz', name: 'Token Audits',     collectionsCount: 9,  apisCount: 2, contributorsCount: 5,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: daysAgo(5),   isStarred: false },
  { id: 'ws-iz-5', teamId: 'iamz', name: 'Access Policies',  collectionsCount: 13, apisCount: 4, contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'internal', lastActivityTimestamp: daysAgo(9),   isStarred: false },

  // ecosystem
  { id: 'ws-ec-1', teamId: 'ecosystem', name: 'Developer Portal APIs', collectionsCount: 14, apisCount: 5, contributorsCount: 9,  contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public',  lastActivityTimestamp: hoursAgo(5),  isStarred: false },
  { id: 'ws-ec-2', teamId: 'ecosystem', name: 'Partner Connect',       collectionsCount: 9,  apisCount: 3, contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner', lastActivityTimestamp: daysAgo(1),   isStarred: false },
  { id: 'ws-ec-3', teamId: 'ecosystem', name: 'Ecosystem Templates',   collectionsCount: 12, apisCount: 4, contributorsCount: 8,  contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'public',  lastActivityTimestamp: daysAgo(4),   isStarred: false },
  { id: 'ws-ec-4', teamId: 'ecosystem', name: 'Community Sandbox',     collectionsCount: 10, apisCount: 2, contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'partner', lastActivityTimestamp: daysAgo(8),   isStarred: false },

  // publisher-success
  { id: 'ws-pb-1', teamId: 'publisher-success', name: 'Publisher Tools', collectionsCount: 8, apisCount: 2, contributorsCount: 5, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'public', lastActivityTimestamp: daysAgo(4), isStarred: false },
  { id: 'ws-pb-2', teamId: 'publisher-success', name: 'Publisher Onboarding', collectionsCount: 9, apisCount: 3, contributorsCount: 6, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'public', lastActivityTimestamp: daysAgo(10), isStarred: false },
  { id: 'ws-pb-3', teamId: 'publisher-success', name: 'Certification Hub', collectionsCount: 11, apisCount: 2, contributorsCount: 7, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'public', lastActivityTimestamp: daysAgo(14), isStarred: false },

  // ide-platform
  { id: 'ws-ip-1', teamId: 'ide-platform', name: 'IDE Core',        collectionsCount: 32, apisCount: 11, contributorsCount: 14, contributorPreview: CONTRIBUTORS.slice(3, 7), type: 'internal', lastActivityTimestamp: hoursAgo(1),  isStarred: false },
  { id: 'ws-ip-2', teamId: 'ide-platform', name: 'Plugin Registry', collectionsCount: 18, apisCount: 6,  contributorsCount: 7,  contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: daysAgo(1),   isStarred: false },
  { id: 'ws-ip-3', teamId: 'ide-platform', name: 'Workspace Runtime', collectionsCount: 15, apisCount: 5, contributorsCount: 10, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(3), isStarred: false },
  { id: 'ws-ip-4', teamId: 'ide-platform', name: 'Extensions QA',    collectionsCount: 9,  apisCount: 3, contributorsCount: 6,  contributorPreview: CONTRIBUTORS.slice(4, 7), type: 'internal', lastActivityTimestamp: daysAgo(7), isStarred: false },

  // product-security
  { id: 'ws-se-1', teamId: 'product-security', name: 'Vulnerability Tracking', collectionsCount: 6, apisCount: 3, contributorsCount: 3, contributorPreview: CONTRIBUTORS.slice(0, 2), type: 'internal', lastActivityTimestamp: daysAgo(2), isStarred: false },
  { id: 'ws-se-2', teamId: 'product-security', name: 'Threat Models',           collectionsCount: 10, apisCount: 3, contributorsCount: 5, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(5), isStarred: false },
  { id: 'ws-se-3', teamId: 'product-security', name: 'Security Checks',         collectionsCount: 8, apisCount: 2, contributorsCount: 4, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'internal', lastActivityTimestamp: daysAgo(9), isStarred: false },

  // it-security-testing
  { id: 'ws-it-1', teamId: 'it-security-testing', name: 'Pen Test Suites',  collectionsCount: 12, apisCount: 5, contributorsCount: 6, contributorPreview: CONTRIBUTORS.slice(5, 8), type: 'internal', lastActivityTimestamp: daysAgo(3),  isStarred: false },
  { id: 'ws-it-2', teamId: 'it-security-testing', name: 'Compliance APIs',  collectionsCount: 7,  apisCount: 2, contributorsCount: 4, contributorPreview: CONTRIBUTORS.slice(6, 8), type: 'internal', lastActivityTimestamp: daysAgo(7),  isStarred: false },
  { id: 'ws-it-3', teamId: 'it-security-testing', name: 'Infrastructure Checks', collectionsCount: 10, apisCount: 3, contributorsCount: 5, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: daysAgo(10), isStarred: false },
  { id: 'ws-it-4', teamId: 'it-security-testing', name: 'Risk Assessments',      collectionsCount: 9,  apisCount: 2, contributorsCount: 4, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(13), isStarred: false },

  // customer-journey
  { id: 'ws-cj-1', teamId: 'customer-journey', name: 'Journey Analytics', collectionsCount: 10, apisCount: 3, contributorsCount: 6, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: hoursAgo(2),  isStarred: false },
  { id: 'ws-cj-2', teamId: 'customer-journey', name: 'Touchpoint APIs',   collectionsCount: 8,  apisCount: 2, contributorsCount: 5, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'partner',  lastActivityTimestamp: daysAgo(1),   isStarred: false },
  { id: 'ws-cj-3', teamId: 'customer-journey', name: 'Lifecycle Events',  collectionsCount: 12, apisCount: 4, contributorsCount: 7, contributorPreview: CONTRIBUTORS.slice(2, 5), type: 'internal', lastActivityTimestamp: daysAgo(3), isStarred: false },
  { id: 'ws-cj-4', teamId: 'customer-journey', name: 'Feedback Signals',  collectionsCount: 9,  apisCount: 3, contributorsCount: 6, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'public',   lastActivityTimestamp: daysAgo(8), isStarred: false },

  // product-operations
  { id: 'ws-po-1', teamId: 'product-operations', name: 'Ops Dashboard', collectionsCount: 7, apisCount: 2, contributorsCount: 4, contributorPreview: CONTRIBUTORS.slice(3, 6), type: 'internal', lastActivityTimestamp: hoursAgo(7), isStarred: false },
  { id: 'ws-po-2', teamId: 'product-operations', name: 'Release Tracker', collectionsCount: 11, apisCount: 3, contributorsCount: 6, contributorPreview: CONTRIBUTORS.slice(1, 4), type: 'internal', lastActivityTimestamp: daysAgo(2), isStarred: false },
  { id: 'ws-po-3', teamId: 'product-operations', name: 'Roadmap Signals', collectionsCount: 10, apisCount: 2, contributorsCount: 5, contributorPreview: CONTRIBUTORS.slice(0, 3), type: 'internal', lastActivityTimestamp: daysAgo(6), isStarred: false },
];

const INTERNAL_TOTAL_BY_TEAM = WORKSPACES_RAW.reduce<Record<string, number>>((acc, w) => {
  if (w.type === 'internal') acc[w.teamId] = (acc[w.teamId] ?? 0) + 1;
  return acc;
}, {});
const internalSeenByTeam: Record<string, number> = {};

export const MOCK_WORKSPACES: Workspace[] = WORKSPACES_RAW.map((workspace, index) => {
  const internalAccess =
    workspace.type === 'internal'
      ? getInternalAccessByOrdinal(
          (internalSeenByTeam[workspace.teamId] ?? 0),
          INTERNAL_TOTAL_BY_TEAM[workspace.teamId] ?? 0
        )
      : undefined;
  if (workspace.type === 'internal') {
    internalSeenByTeam[workspace.teamId] = (internalSeenByTeam[workspace.teamId] ?? 0) + 1;
  }

  return {
    ...workspace,
    yourRole: YOUR_ROLE_CYCLE[index % YOUR_ROLE_CYCLE.length],
    contributors: buildContributors(workspace.contributorsCount, index + 1),
    collections: buildCollections(workspace.collectionsCount, workspace.name),
    internalAccess,
  };
});
