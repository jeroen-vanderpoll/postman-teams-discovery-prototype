import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Avatar } from '../ui/Avatar';
import type { Team } from '../../types';

interface JoinRequestModalProps {
  team: Team;
  onSubmit: (note: string) => void;
  onClose: () => void;
}

export function JoinRequestModal({ team, onSubmit, onClose }: JoinRequestModalProps) {
  const [note, setNote] = useState('');

  return (
    <Dialog title="Request to join" onClose={onClose}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar initials={team.initials} color={team.avatarColor} size="md" />
          <div>
            <p className="text-sm font-medium text-gray-900">{team.name}</p>
            <p className="text-xs text-gray-500">{team.handle}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Add a note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell the team why you'd like to join…"
            rows={3}
            className="w-full input-base resize-none text-xs"
          />
        </div>
        <p className="text-2xs text-gray-400">
          The team admin will review your request. You'll be notified when it's approved or declined.
        </p>
      </div>
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(note)}
        >
          Send request
        </button>
      </div>
    </Dialog>
  );
}
