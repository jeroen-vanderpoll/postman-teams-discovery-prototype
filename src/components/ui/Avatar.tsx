interface AvatarProps {
  initials: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-2xs',
  sm: 'w-6 h-6 text-2xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-base',
  '2xl': 'w-20 h-20 text-xl',
};

export function Avatar({ initials, color, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
