import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { StageState, Team } from '../../types';
import { Shield, DollarSign, Gavel, Users, AlertCircle, CheckCircle } from 'lucide-react';

export const TeamManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [stageState, setStageState] = useState<StageState | null>(null);
  const [blindBidAmount, setBlindBidAmount] = useState<number>(0);
  const [bidError, setBidError] = useState<string>('');
  const [bidSuccess, setBidSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchMyTeam = async () => {
    try {
      const res = await api.get('/teams');
      const myTeam = res.data.teams.find((t: any) => t.id === user?.team?.id);
      if (myTeam) setTeam(myTeam);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStage = async () => {
    try {
      const res = await api.get('/auction/stage');
      setStageState(res.data);
      if (res.data.player?.tier?.basePrice) {
        setBlindBidAmount(res.data.player.tier.basePrice);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyTeam();
    fetchStage();
    socket.emit('join:auction');

    socket.on('auction:state_update', (newState: StageState) => {
      setStageState(newState);
    });

    socket.on('auction:bid_placed', () => {
      fetchStage();
    });

    socket.on('auction:player_sold', () => {
      fetchMyTeam();
      fetchStage();
    });

    return () => {
      socket.off('auction:state_update');
      socket.off('auction:bid_placed');
      socket.off('auction:player_sold');
    };
  }, []);

  const handlePlaceNormalBid = async () => {
    setBidError('');
    setBidSuccess('');
    setLoading(true);
    try {
      await api.post('/auction/bid/normal', {});
      setBidSuccess('Bid placed successfully!');
    } catch (err: any) {
      setBidError(err.response?.data?.error || 'Bid rejected');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBlindBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    setBidSuccess('');
    setLoading(true);
    try {
      await api.post('/auction/bid/blind', { amount: blindBidAmount });
      setBidSuccess('Sealed envelope submitted securely!');
    } catch (err: any) {
      setBidError(err.response?.data?.error || 'Blind bid rejected');
    } finally {
      setLoading(false);
    }
  };

  const isLeading = stageState?.currentWinningTeam?.id === team?.id;
  const isBlind = stageState?.mode === 'BLIND';

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Franchise Desk
          </span>
          <h2 className="text-3xl font-black text-white mt-2">{team?.name || 'My Franchise'}</h2>
          <p className="text-xs text-slate-400">Live auction bidding portal with automated budget guardrail verification.</p>
        </div>

        {/* Budget Summary Card */}
        <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Remaining Cap</span>
            <span className="text-2xl font-black text-emerald-400">${team?.remainingBudget.toLocaleString()}</span>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Roster Count</span>
            <span className="text-2xl font-black text-white">{team?.players?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Bidding Pad (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Gavel className="w-4 h-4 text-amber-400" />
              <span>Real-Time Bidding Pad</span>
            </h3>

            {bidError && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bidError}</span>
              </div>
            )}

            {bidSuccess && (
              <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bidSuccess}</span>
              </div>
            )}

            {stageState?.player ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <img
                    src={stageState.player.imageUrl}
                    alt={stageState.player.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-white">{stageState.player.name}</h4>
                    <p className="text-xs text-slate-400">
                      Tier: <b className="text-purple-400">{stageState.player.tier?.name}</b> • Base: ${stageState.player.tier?.basePrice}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Bid</span>
                    <span className="text-2xl font-black text-emerald-400">${stageState.currentBid.toLocaleString()}</span>
                  </div>
                </div>

                {isLeading && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center">
                    👑 Your franchise currently holds the highest bid!
                  </div>
                )}

                {/* Normal Mode Incremental Raise Button */}
                {!isBlind ? (
                  <div className="space-y-3">
                    <button
                      onClick={handlePlaceNormalBid}
                      disabled={loading || isLeading || !stageState.timerActive}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>
                        BID ${stageState.nextMinimumBid.toLocaleString()} (+${stageState.minimumRaise.toLocaleString()})
                      </span>
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Auto-calculates next minimum increment based on league rules and team budget guardrail.
                    </p>
                  </div>
                ) : (
                  /* Blind Mode Sealed Envelope Submission */
                  <form onSubmit={handlePlaceBlindBid} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Submit Sealed Envelope Monetary Bid ($)
                      </label>
                      <input
                        type="number"
                        required
                        min={stageState.player.tier?.basePrice || 0}
                        value={blindBidAmount}
                        onChange={(e) => setBlindBidAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !stageState.timerActive}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-900/30"
                    >
                      Submit Sealed Envelope Bid
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-8">
                No active player on podium stage. Wait for the auctioneer.
              </p>
            )}
          </div>
        </div>

        {/* Right: My Franchise Roster (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Acquired Squad ({team?.players?.length || 0})</span>
            </h3>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {team?.players?.length ? (
                team.players.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">#{p.jerseyName} • {p.primaryPosition}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-400">${p.soldPrice?.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-6">No players acquired yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
