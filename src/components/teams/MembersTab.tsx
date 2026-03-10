import { useState } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import type { MemberPreview } from '../../types';

// Extended mock members for the members tab
const ALL_MEMBERS: (MemberPreview & { role: string; handle: string })[] = [
  { id: 'm1', name: 'Alice Chen', initials: 'AC', avatarColor: '#3498DB', role: 'Manager', handle: '@alice.chen' },
  { id: 'm2', name: 'Bob Rivera', initials: 'BR', avatarColor: '#2ECC71', role: 'Collaborator', handle: '@bob.rivera' },
  { id: 'm3', name: 'Carol Kim', initials: 'CK', avatarColor: '#9B59B6', role: 'Collaborator', handle: '@carol.kim' },
  { id: 'm4', name: 'David Park', initials: 'DP', avatarColor: '#E74C3C', role: 'Member', handle: '@david.park' },
  { id: 'm5', name: 'Elena Moss', initials: 'EM', avatarColor: '#F1C40F', role: 'Member', handle: '@elena.moss' },
  { id: 'm6', name: 'Frank Ng', initials: 'FN', avatarColor: '#1ABC9C', role: 'Member', handle: '@frank.ng' },
  { id: 'm7', name: 'Grace Liu', initials: 'GL', avatarColor: '#E67E22', role: 'Collaborator', handle: '@grace.liu' },
  { id: 'm8', name: 'Henry Walsh', initials: 'HW', avatarColor: '#607D8B', role: 'Member', handle: '@henry.walsh' },
];

const ROLE_COLORS: Record<string, string> = {
  Manager: 'bg-purple-50 text-purple-700 border border-purple-200',
  Collaborator: 'bg-blue-50 text-blue-700 border border-blue-200',
  Member: 'bg-gray-100 text-gray-600 border border-gray-200',
};

interface MembersTabProps {
  isMember: boolean;
}

export function MembersTab({ isMember }: MembersTabProps) {
  const [search, setSearch] = useState('');

  const shown = ALL_MEMBERS.filter(
    (m) =>
      !search.trim() ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="input-base pl-7 w-48"
          />
        </div>
      </div>

      {!isMember && (
        <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
          Join this team to see all members.
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-4 py-1.5 border-b border-gray-200 bg-gray-50">
          <span className="flex-1 text-2xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
          <span className="w-24 text-2xs font-medium text-gray-500 uppercase tracking-wide">Role</span>
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No members found</div>
        ) : (
          shown.map((m) => (
            <div
              key={m.id}
              className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <Avatar initials={m.initials} color={m.avatarColor} size="sm" />
                <div>
                  <p className="text-xs font-medium text-gray-900">{m.name}</p>
                  <p className="text-2xs text-gray-400">{m.handle}</p>
                </div>
              </div>
              <div className="w-24">
                <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${ROLE_COLORS[m.role] ?? ''}`}>
                  {m.role}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
