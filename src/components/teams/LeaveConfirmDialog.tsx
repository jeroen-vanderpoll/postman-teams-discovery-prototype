import { Dialog } from '../ui/Dialog';
import type { Team } from '../../types';

interface LeaveConfirmDialogProps {
  team: Team;
  onConfirm: () => void;
  onClose: () => void;
}

export function LeaveConfirmDialog({ team, onConfirm, onClose }: LeaveConfirmDialogProps) {
  return (
    <Dialog title="Leave team?" onClose={onClose} width="w-80">
      <div className="p-4">
        <p className="text-xs text-gray-600">
          You'll lose access to <span className="font-medium text-gray-900">{team.name}</span>'s workspaces and resources. You can request to rejoin later.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
          onClick={onConfirm}
        >
          Leave team
        </button>
      </div>
    </Dialog>
  );
}
