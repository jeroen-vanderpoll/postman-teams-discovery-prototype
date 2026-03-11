import type { MemberPreview } from '../../types';

interface BubbleheadStackProps {
  members: MemberPreview[];
  total: number;
  size?: 'sm' | 'md';
  showOverflow?: boolean;
}

export function BubbleheadStack({ members, total, size = 'sm', showOverflow = true }: BubbleheadStackProps) {
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-2xs' : 'w-6 h-6 text-xs';

  // 1–3 members: show exact count of avatars
  // 4+ members: show 2 avatars + grey "…" circle
  const showTruncated = total >= 4;
  const shown = showTruncated ? members.slice(0, 2) : members.slice(0, Math.min(total, 3));

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
        {showTruncated && showOverflow && (
          <div
            className={`${sizeClass} rounded-full flex items-center justify-center border border-white flex-shrink-0 bg-gray-200 text-gray-500 font-bold`}
            title={`${total} members total`}
          >
            ···
          </div>
        )}
      </div>
    </div>
  );
}
