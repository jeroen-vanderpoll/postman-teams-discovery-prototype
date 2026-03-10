import type { WorkspaceType } from '../../types';

interface TypeBadgeProps {
  type: WorkspaceType;
}

const TYPE_CONFIG: Record<WorkspaceType, { label: string; classes: string }> = {
  internal: { label: 'Internal', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  partner: { label: 'Partner', classes: 'bg-purple-50 text-purple-700 border border-purple-200' },
  public: { label: 'Public', classes: 'bg-green-50 text-green-700 border border-green-200' },
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${config.classes}`}>
      {config.label}
    </span>
  );
}
