import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Player, StageState } from '../../types';
import { Gavel, Clock, Check, X, RotateCcw, AlertTriangle, Play, Flame } from 'lucide-react';

export const PodiumAdminDashboard: React.FC = () => {
  const [unsoldPool, setUnsoldPool] = useState<Player[]>([]);
  const [stageState, setStageState] = useState<StageState | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [auctionMode, setAuctionMode] = useState<'NORMAL' | 'BLIND'>('NORMAL');
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUnsold = async () => {
    try {
      const res = await api.get('/auction/unsold-pool');
      setUnsoldPool(res.data.players);
      if (res.data.players.length && !selectedPlayerId) {
        setSelectedPlayerId(res.data.players[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStage = async () => {
    try {
      const res = await api.get('/auction/stage');
      setStageState(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnsold();
    fetchStage();

    socket.on('auction:state_update', (newState: StageState) => {
      setStageState(newState);
    });

    socket.on('auction:player_sold', () => {
      fetchUnsold();
      fetchStage();
    });

    socket.on('auction:player_unsold', () => {
      fetchUnsold();
      fetchStage();
    });

    return () => {
      socket.off('auction:state_update');
      socket.off('auction:player_sold');
      socket.off('auction:player_unsold');
    };
  }, []);

  const handleIntroducePlayer = async () => {
    if (!selectedPlayerId) return;
    setActionLoading(true);
    try {
      await api.post('/auction/stage/introduce', {
        playerId: selectedPlayerId,
        mode: auctionMode,
        duration: timerDuration,
      });
      fetchUnsold();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to introduce player');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHammer = async (decision: 'SOLD' | 'UNSOLD') => {
    setActionLoading(true);
    try {
      await api.post('/auction/stage/hammer', { decision });
      fetchUnsold();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Hammer decision failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async () => {
    try {
      await api.post('/auction/stage/rollback');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Rollback failed');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel the current stage auction?')) return;
    try {
      await api.post('/auction/stage/cancel');
      fetchUnsold();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Cancel failed');
    }
  };

  const playerOnStage = stageState?.player;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Podium Admin Console (The Auctioneer)
          </span>
          <h2 className="text-3xl font-black text-white mt-2">Live Bidding Stage Controller</h2>
          <p className="text-xs text-slate-400">Operate the gavel, trigger countdowns, resolve offline disputes, and seal contracts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Player Intro Deck (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Draft Candidates ({unsoldPool.length})</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Candidate</label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {unsoldPool.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tier?.name} - ${p.tier?.basePrice}) [{p.primaryPosition}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Auction Mode</label>
                <select
                  value={auctionMode}
                  onChange={(e) => setAuctionMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="NORMAL">Normal (Incremental)</option>
                  <option value="BLIND">Blind (Sealed Envelopes)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Timer (Seconds)</label>
                <input
                  type="number"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleIntroducePlayer}
              disabled={actionLoading || !selectedPlayerId}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              <span>Bring Player To Stage</span>
            </button>
          </div>
        </div>

        {/* Right: Active Stage Hammer & Dispute Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {playerOnStage ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img src={playerOnStage.imageUrl} alt={playerOnStage.name} className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <h4 className="text-lg font-black text-white">{playerOnStage.name}</h4>
                    <p className="text-xs text-slate-400">
                      Tier: <b className="text-purple-400">{playerOnStage.tier?.name}</b> • Base: ${playerOnStage.tier?.basePrice}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Hammer Price</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ${stageState?.currentBid?.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-300 block font-semibold">
                    Leader: {stageState?.currentWinningTeam?.name || 'Base Price'}
                  </span>
                </div>
              </div>

              {/* Hammer Controls */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleHammer('SOLD')}
                  disabled={actionLoading || !stageState?.currentWinningTeam}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>HAMMER SOLD (${stageState?.currentBid.toLocaleString()})</span>
                </button>

                <button
                  onClick={() => handleHammer('UNSOLD')}
                  disabled={actionLoading}
                  className="py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  <span>PASS (MARK UNSOLD)</span>
                </button>
              </div>

              {/* Dispute & Rollback Controls */}
              <div className="flex space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleRollback}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Rollback Last Bid (Dispute)</span>
                </button>

                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cancel Stage Auction</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-500 text-sm font-semibold">
              No player currently on the live podium stage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
