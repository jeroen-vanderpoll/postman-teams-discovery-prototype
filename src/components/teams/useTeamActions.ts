import { useState } from 'react';
import { useTeamsStore } from '../../store/teamsStore';
import { useToastStore } from '../../store/toastStore';
import type { Team } from '../../types';

export function useTeamActions(team: Team) {
  const { joinTeam, requestToJoin, leaveTeam, toggleStar, pendingRequests } = useTeamsStore();
  const { addToast } = useToastStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const isPending = pendingRequests.has(team.id);

  function handleJoin() {
    joinTeam(team.id);
    addToast(`You joined ${team.name}`);
  }

  function handleRequestSubmit(note: string) {
    requestToJoin(team.id);
    setShowJoinModal(false);
    addToast(`Request sent to ${team.name}`, 'info');
    void note;
  }

  function handleLeaveConfirm() {
    leaveTeam(team.id);
    setShowLeaveDialog(false);
    addToast(`You left ${team.name}`, 'info');
  }

  function handleToggleStar(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    toggleStar(team.id);
  }

  return {
    isPending,
    showJoinModal,
    showLeaveDialog,
    setShowJoinModal,
    setShowLeaveDialog,
    handleJoin,
    handleRequestSubmit,
    handleLeaveConfirm,
    handleToggleStar,
  };
}
