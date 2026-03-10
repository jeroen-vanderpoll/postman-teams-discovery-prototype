import { create } from 'zustand';
import { MOCK_TEAMS } from '../data/mockTeams';
import type { Team } from '../types';

interface TeamsState {
  teams: Team[];
  pendingRequests: Set<string>;
  joinTeam: (id: string) => void;
  requestToJoin: (id: string) => void;
  leaveTeam: (id: string) => void;
  toggleStar: (id: string) => void;
}

export const useTeamsStore = create<TeamsState>((set) => ({
  teams: MOCK_TEAMS,
  pendingRequests: new Set(),

  joinTeam: (id) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === id ? { ...t, isMember: true, membersCount: t.membersCount + 1 } : t
      ),
    })),

  requestToJoin: (id) =>
    set((state) => ({
      pendingRequests: new Set([...state.pendingRequests, id]),
    })),

  leaveTeam: (id) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === id
          ? { ...t, isMember: false, isStarred: false, membersCount: Math.max(0, t.membersCount - 1) }
          : t
      ),
    })),

  toggleStar: (id) =>
    set((state) => ({
      teams: state.teams.map((t) =>
        t.id === id ? { ...t, isStarred: !t.isStarred } : t
      ),
    })),
}));
