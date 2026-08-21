import React, { useState, useEffect } from 'react';
import { socket } from '../../services/socket';
import { api } from '../../services/api';
import { StageState, Team } from '../../types';
import { Gavel, Clock, Flame, Shield, DollarSign, Users, Award, Radio } from 'lucide-react';

export const AuctionPodiumView: React.FC = () => {
  const [stageState, setStageState] = useState<StageState | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('Live auction podium is active.');

  const fetchInitialData = async () => {
    try {
      const [stageRes, teamsRes] = await Promise.all([
        api.get('/auction/stage'),
        api.get('/teams'),
      ]);
      setStageState(stageRes.data);
      setTeams(teamsRes.data.teams);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    socket.emit('join:auction');

    socket.on('auction:state_update', (newState: StageState) => {
      setStageState(newState);
    });

    socket.on('auction:timer_tick', ({ timerSeconds }: { timerSeconds: number }) => {
      setStageState((prev) => (prev ? { ...prev, timerSeconds } : null));
    });

    socket.on('auction:bid_placed', (data: { stageState: StageState }) => {
      setStageState(data.stageState);
      setLiveAnnouncement(`🔥 NEW BID: $${data.stageState.currentBid.toLocaleString()} by ${data.stageState.currentWinningTeam?.name}`);
    });

    socket.on('auction:player_introduced', (data: { stageState: StageState }) => {
      setStageState(data.stageState);
      setLiveAnnouncement(`⚡ On Stage: ${data.stageState.player?.name} (${data.stageState.player?.tier?.name} Tier)`);
    });

    socket.on('auction:player_sold', (data: { soldTo: { name: string }; price: number }) => {
      setLiveAnnouncement(`🔨 HAMMER DOWN: SOLD to ${data.soldTo.name} for $${data.price.toLocaleString()}!`);
      // Refresh teams to update remaining budgets
      api.get('/teams').then((res) => setTeams(res.data.teams));
    });

    return () => {
      socket.off('auction:state_update');
      socket.off('auction:timer_tick');
      socket.off('auction:bid_placed');
      socket.off('auction:player_introduced');
      socket.off('auction:player_sold');
    };
  }, []);

  const player = stageState?.player;
  const isBlind = stageState?.mode === 'BLIND';

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      {/* Live Stream Banner */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
            <Radio className="w-4 h-4" /> Live Broadcast
          </span>
          <span className="text-xs text-slate-300 font-medium pl-4 border-l border-slate-800">
            {liveAnnouncement}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold">
            {isBlind ? '🔒 Blind Sealed Envelope' : '⚡ Open Incremental Bidding'}
          </span>
        </div>
      </div>

      {/* Main Auction Podium Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Player Stage & Live Bid Hammer (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {player ? (
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Player Photo Card */}
                <div className="md:col-span-5 flex flex-col items-center text-center">
                  <div className="relative group">
                    <img
                      src={player.imageUrl}
                      alt={player.name}
                      className="w-52 h-52 rounded-3xl object-cover border-4 border-emerald-500/40 shadow-2xl glow-green bg-slate-950"
                    />
                    <span className="absolute top-3 right-3 px-3 py-1 bg-purple-600 text-white font-black text-xs rounded-full shadow-lg">
                      {player.tier?.name}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white mt-4">{player.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">#{player.jerseyName} • {player.studentId}</p>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30">
                      {player.primaryPosition} (Primary)
                    </span>
                    {player.secondaryPositions?.map((sp) => (
                      <span key={sp} className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Hammer Price & Dynamic Timer */}
                <div className="md:col-span-7 space-y-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
                  {/* Countdown Timer */}
                  <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                      <span className="text-xs font-bold text-slate-300 uppercase">Hammer Timer</span>
                    </div>
                    <span
                      className={`text-3xl font-black font-mono ${
                        (stageState?.timerSeconds || 0) <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-400'
                      }`}
                    >
                      00:{String(stageState?.timerSeconds || 0).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Current Winning Bid */}
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Highest Bid</span>
                    <div className="text-5xl font-black text-emerald-400 tracking-tight flex items-baseline gap-2">
                      ${stageState?.currentBid?.toLocaleString()}
                    </div>
                  </div>

                  {/* Holding Franchise */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Leader / Winning Franchise</span>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <span className="text-lg font-extrabold text-white">
                        {stageState?.currentWinningTeam?.name || 'No Bids Placed Yet (At Base Price)'}
                      </span>
                    </div>
                  </div>

                  {/* Next Step Info */}
                  {!isBlind && (
                    <div className="text-xs text-slate-400 flex justify-between pt-2 border-t border-slate-800">
                      <span>Next Min Increment: <b className="text-white">+${stageState?.minimumRaise?.toLocaleString()}</b></span>
                      <span>Next Required Bid: <b className="text-emerald-400">${stageState?.nextMinimumBid?.toLocaleString()}</b></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-4">
              <Gavel className="w-16 h-16 text-slate-600 mx-auto animate-bounce" />
              <h3 className="text-xl font-black text-white">Podium Stage is Empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Waiting for the Podium Auctioneer to pull the next candidate from the Unsold Draft Pool.
              </p>
            </div>
          )}

          {/* Real-time Bid Ledger Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Real-Time Auction Ledger</span>
            </h4>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {stageState?.bidHistory?.length ? (
                stageState.bidHistory.map((b, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{b.teamName}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(b.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-400">${b.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">No live bids in current ledger</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Franchise Standing Ledger & Budgets (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Franchise Cap Tracker</span>
            </h4>

            <div className="space-y-3">
              {teams.map((t) => (
                <div key={t.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    <span className="text-xs font-black text-emerald-400">
                      ${t.remainingBudget.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Progress Bar for Budget */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${(t.remainingBudget / t.allocatedBudget) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Squad: {t.players?.length || 0} Players</span>
                    <span>Cap Used: {((1 - t.remainingBudget / t.allocatedBudget) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
