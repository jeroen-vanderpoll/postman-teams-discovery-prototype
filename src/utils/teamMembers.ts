import type { MemberPreview } from '../types';

const SYNTHETIC_FIRST_NAMES = [
  'Ava', 'Noah', 'Mia', 'Liam', 'Emma', 'Ethan', 'Olivia', 'Lucas', 'Sophia', 'Mason',
  'Isla', 'Aiden', 'Aria', 'Leo', 'Nora', 'Ezra', 'Luna', 'Owen', 'Ivy', 'Kai',
  'Amelia', 'Elijah', 'Zoe', 'Caleb', 'Ruby',
];

const SYNTHETIC_LAST_NAMES = [
  'Patel', 'Nguyen', 'Garcia', 'Kim', 'Rivera', 'Singh', 'Brown', 'Lopez', 'Wright', 'Khan',
  'Davis', 'Ali', 'Sato', 'Martin', 'Silva', 'Clark', 'Young', 'Hall', 'Moore', 'Flores',
  'Scott', 'Ward', 'Diaz', 'Reed', 'Shah',
];

const FALLBACK_COLORS = [
  '#3498DB', '#2ECC71', '#9B59B6', '#E74C3C', '#F1C40F',
  '#1ABC9C', '#E67E22', '#607D8B', '#E91E63', '#673AB7',
];

function initialsFromName(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function buildTeamMemberPreviewList({
  teamId,
  total,
  memberPreview,
}: {
  teamId: string;
  total: number;
  memberPreview: MemberPreview[];
}): MemberPreview[] {
  const seed = teamId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const usedNames = new Set<string>();
  const members: MemberPreview[] = [];
  const palette = memberPreview.length > 0
    ? [...new Set(memberPreview.map((m) => m.avatarColor))]
    : FALLBACK_COLORS;

  const syntheticNames: string[] = [];
  for (const first of SYNTHETIC_FIRST_NAMES) {
    for (const last of SYNTHETIC_LAST_NAMES) {
      syntheticNames.push(`${first} ${last}`);
    }
  }

  memberPreview.forEach((m) => {
    if (members.length >= total || usedNames.has(m.name)) return;
    usedNames.add(m.name);
    members.push(m);
  });

  let i = 0;
  while (members.length < total) {
    const baseName = syntheticNames[(seed + i) % syntheticNames.length];
    let name = baseName;
    let suffix = 2;
    while (usedNames.has(name)) {
      name = `${baseName} ${suffix}`;
      suffix += 1;
    }
    usedNames.add(name);
    members.push({
      id: `${teamId}-member-${i}`,
      name,
      initials: initialsFromName(name),
      avatarColor: palette[(seed + i) % palette.length],
    });
    i += 1;
  }

  return members;
}
