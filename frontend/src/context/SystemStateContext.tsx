import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemPhase, RuleConfig, PlayerTier, BidRaiseTier } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';

interface SystemStateContextType {
  currentPhase: SystemPhase;
  rules: RuleConfig | null;
  tiers: PlayerTier[];
  raiseTiers: BidRaiseTier[];
  fetchSystemConfig: () => Promise<void>;
  updatePhase: (phase: SystemPhase) => Promise<void>;
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export const SystemStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPhase, setCurrentPhase] = useState<SystemPhase>('SETUP');
  const [rules, setRules] = useState<RuleConfig | null>(null);
  const [tiers, setTiers] = useState<PlayerTier[]>([]);
  const [raiseTiers, setRaiseTiers] = useState<BidRaiseTier[]>([]);

  const fetchSystemConfig = async () => {
    try {
      const res = await api.get('/config/state');
      setCurrentPhase(res.data.currentPhase);
      setRules(res.data.rules);
      setTiers(res.data.tiers);
      setRaiseTiers(res.data.raiseTiers);
    } catch (err) {
      console.error('Error fetching system config:', err);
    }
  };

  useEffect(() => {
    fetchSystemConfig();

    socket.on('system:phase_changed', (data: { phase: SystemPhase }) => {
      setCurrentPhase(data.phase);
    });

    return () => {
      socket.off('system:phase_changed');
    };
  }, []);

  const updatePhase = async (phase: SystemPhase) => {
    const res = await api.post('/config/phase', { phase });
    setCurrentPhase(res.data.currentPhase);
  };

  return (
    <SystemStateContext.Provider
      value={{
        currentPhase,
        rules,
        tiers,
        raiseTiers,
        fetchSystemConfig,
        updatePhase,
      }}
    >
      {children}
    </SystemStateContext.Provider>
  );
};

export const useSystemState = () => {
  const context = useContext(SystemStateContext);
  if (!context) throw new Error('useSystemState must be used within a SystemStateProvider');
  return context;
};
