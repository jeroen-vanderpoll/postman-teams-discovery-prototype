import { create } from 'zustand';
import { MOCK_TEAMS } from '../data/mockTeams';
import { MOCK_WORKSPACES } from '../data/mockWorkspaces';
import type { Team } from '../types';

interface TeamsState {
  teams: Team[];
  pendingRequests: Set<string>;
  joinTeam: (id: string) => void;
  requestToJoin: (id: string) => void;
  withdrawRequest: (id: string) => void;
  leaveTeam: (id: string) => void;
  toggleStar: (id: string) => void;
}

const WORKSPACE_COUNT_BY_TEAM = MOCK_WORKSPACES.reduce<Record<string, number>>((acc, ws) => {
  acc[ws.teamId] = (acc[ws.teamId] ?? 0) + 1;
  return acc;
}, {});

const INITIAL_TEAMS: Team[] = MOCK_TEAMS.map((team) => ({
  ...team,
  // Keep team pages and list counters always in sync with workspace data.
  workspacesCount: WORKSPACE_COUNT_BY_TEAM[team.id] ?? 0,
}));

export const useTeamsStore = create<TeamsState>((set) => ({
  teams: INITIAL_TEAMS,
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

  withdrawRequest: (id) =>
    set((state) => {
      const next = new Set(state.pendingRequests);
      next.delete(id);
      return { pendingRequests: next };
    }),

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
