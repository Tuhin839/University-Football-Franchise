import React from 'react';
import { useSystemState } from '../context/SystemStateContext';
import { SetupView } from './phases/SetupView';
import { RegistrationView } from './phases/RegistrationView';
import { AuctionPodiumView } from './phases/AuctionPodiumView';
import { TournamentDashboardView } from './phases/TournamentDashboardView';

export const Home: React.FC = () => {
  const { currentPhase } = useSystemState();

  // Dynamic conditional SPA rendering based on Global System State
  switch (currentPhase) {
    case 'SETUP':
      return <SetupView />;
    case 'REGISTRATION':
      return <RegistrationView />;
    case 'AUCTION':
      return <AuctionPodiumView />;
    case 'TOURNAMENT':
      return <TournamentDashboardView />;
    default:
      return <SetupView />;
  }
};
