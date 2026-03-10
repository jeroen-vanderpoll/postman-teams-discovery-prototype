import { create } from 'zustand';
import { MOCK_WORKSPACES } from '../data/mockWorkspaces';
import type { Workspace } from '../types';

interface WorkspacesState {
  workspaces: Workspace[];
  toggleStar: (workspaceId: string) => void;
}

export const useWorkspacesStore = create<WorkspacesState>((set) => ({
  workspaces: MOCK_WORKSPACES,

  toggleStar: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, isStarred: !w.isStarred } : w
      ),
    })),
}));
