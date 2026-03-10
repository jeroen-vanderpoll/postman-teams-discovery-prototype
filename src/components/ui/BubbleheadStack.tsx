import type { MemberPreview } from '../../types';

interface BubbleheadStackProps {
  members: MemberPreview[];
  total: number;
  size?: 'sm' | 'md';
}

export function BubbleheadStack({ members, total, size = 'sm' }: BubbleheadStackProps) {
  const shown = members.slice(0, 3);
  const extra = total - shown.length;
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-2xs' : 'w-6 h-6 text-xs';

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((m) => (
          <div
            key={m.id}
            title={m.name}
            className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white border border-white flex-shrink-0`}
            style={{ backgroundColor: m.avatarColor }}
          >
            {m.initials[0]}
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 text-2xs text-gray-500">+{extra}</span>
      )}
    </div>
  );
}
