import React, { useState, useEffect } from 'react';
import { useSystemState } from '../../context/SystemStateContext';
import { api } from '../../services/api';
import { SystemPhase, Team } from '../../types';
import { Shield, Settings, Users, Calendar, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react';
import NukeConfirmModal from '../../components/Modals/NukeConfirmModal';

export const SuperAdminDashboard: React.FC = () => {
  const { currentPhase, updatePhase, rules, tiers, fetchSystemConfig } = useSystemState();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedNukeLevel, setSelectedNukeLevel] = useState<1 | 2 | 3 | null>(null);
  const [notification, setNotification] = useState<string>('');

  // Team Creation Form State
  const [teamName, setTeamName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');

  // Rules Form State
  const [totalBudget, setTotalBudget] = useState(rules?.totalTeamBudget || 100000);
  const [minRoster, setMinRoster] = useState(rules?.minRosterSize || 15);

  // Fixtures Form State
  const [isTwoLegged, setIsTwoLegged] = useState(false);
  const [roundName, setRoundName] = useState('League Stage');

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data.teams);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handlePhaseTransition = async (phase: SystemPhase) => {
    try {
      await updatePhase(phase);
      setNotification(`System state successfully changed to ${phase}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Phase update failed');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/teams', {
        teamName,
        managerName,
        managerEmail,
        managerPassword,
      });
      setNotification(`Team "${teamName}" created with Manager ${managerName}!`);
      setTeamName('');
      setManagerName('');
      setManagerEmail('');
      setManagerPassword('');
      fetchTeams();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Team creation failed');
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/config/rules', {
        totalTeamBudget: totalBudget,
        minRosterSize: minRoster,
      });
      fetchSystemConfig();
      setNotification('Event rules successfully saved!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rules update failed');
    }
  };

  const handleGenerateFixtures = async () => {
    try {
      await api.post('/tournament/fixtures/generate', {
        isTwoLegged,
        roundName,
      });
      setNotification('Fixtures generated successfully for all teams!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fixture generation failed');
    }
  };

  const phases: SystemPhase[] = ['SETUP', 'REGISTRATION', 'AUCTION', 'TOURNAMENT'];

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-3xl gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Super Administrator Control Deck
          </span>
          <h2 className="text-3xl font-black text-white mt-2">League Master Console</h2>
          <p className="text-xs text-slate-400">Control global state machine, event rules, team managers, and nuke protocols.</p>
        </div>

        {/* Global Nuke Button */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedNukeLevel(1)}
            className="px-3 py-2 bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold"
          >
            Level 1 Wipe
          </button>
          <button
            onClick={() => setSelectedNukeLevel(2)}
            className="px-3 py-2 bg-slate-800 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold"
          >
            Level 2 Wipe
          </button>
          <button
            onClick={() => setSelectedNukeLevel(3)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/40 flex items-center gap-1.5"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Nuke Reset</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Global State Machine Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-400" />
          <span>Global Event Lifecycle States</span>
        </h3>
        <p className="text-xs text-slate-400">
          Switching phases conditionally unlocks routes, starts WebSockets, and alters public landing views:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {phases.map((p, idx) => {
            const isActive = currentPhase === p;
            return (
              <button
                key={p}
                onClick={() => handlePhaseTransition(p)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isActive
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-xl glow-purple'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">
                  Phase {idx + 1}
                </span>
                <span className="text-base font-black block mt-1">{p}</span>
                {isActive && (
                  <span className="mt-2 inline-block px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Franchise Team Creation & Rule Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team & Manager Creation */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Create Franchise & Assign Manager</span>
          </h3>

          <form onSubmit={handleCreateTeam} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Franchise Team Name</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Phoenix Strikers FC"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Manager Full Name</label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="e.g. David Beckham"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Manager Email</label>
                <input
                  type="email"
                  required
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="manager@franchise.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Manager Password</label>
              <input
                type="password"
                required
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
            >
              Add Team & Create Manager Account
            </button>
          </form>

          {/* Existing Teams list */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400">Registered Franchises ({teams.length})</span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {teams.map((t) => (
                <div key={t.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-white">{t.name}</span>
                  <span className="text-[11px] text-slate-400">Mgr: {t.manager?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Rules & Fixture Generator */}
        <div className="space-y-8">
          {/* Rules Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Dynamic League Rules</span>
            </h3>

            <form onSubmit={handleSaveRules} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Budget Allowance ($)</label>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Min Roster Size</label>
                <input
                  type="number"
                  value={minRoster}
                  onChange={(e) => setMinRoster(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="col-span-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Save Event Configuration
              </button>
            </form>
          </div>

          {/* Fixtures Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Tournament Fixture Generator</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Round / Tournament Stage</label>
                <input
                  type="text"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="twoLeggedToggle"
                  checked={isTwoLegged}
                  onChange={(e) => setIsTwoLegged(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-0"
                />
                <label htmlFor="twoLeggedToggle" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Two-Legged Ties (Home & Away Aggregate Score)
                </label>
              </div>

              <button
                type="button"
                onClick={handleGenerateFixtures}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
              >
                Auto-Generate Round-Robin Fixtures
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nuke Modal */}
      {selectedNukeLevel && (
        <NukeConfirmModal
          level={selectedNukeLevel}
          onClose={() => setSelectedNukeLevel(null)}
          onSuccess={(msg) => {
            setNotification(msg);
            fetchTeams();
            fetchSystemConfig();
          }}
        />
      )}
    </div>
  );
};
