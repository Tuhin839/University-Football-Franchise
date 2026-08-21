import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { socket } from '../../services/socket';
import { Fixture, TeamStanding } from '../../types';
import { Trophy, Calendar, Award, Shield, Flame, Radio } from 'lucide-react';

export const TournamentDashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'stats'>('matches');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [leaderboards, setLeaderboards] = useState<any>(null);

  const fetchTournamentData = async () => {
    try {
      const [fixRes, standRes, statRes] = await Promise.all([
        api.get('/tournament/fixtures'),
        api.get('/tournament/standings'),
        api.get('/tournament/stats'),
      ]);
      setFixtures(fixRes.data.fixtures);
      setStandings(standRes.data.standings);
      setLeaderboards(statRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTournamentData();
    socket.emit('join:tournament');

    socket.on('tournament:match_score_update', () => {
      fetchTournamentData();
    });

    socket.on('tournament:standings_updated', (newStandings: TeamStanding[]) => {
      setStandings(newStandings);
    });

    return () => {
      socket.off('tournament:match_score_update');
      socket.off('tournament:standings_updated');
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6">
      {/* Tournament Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-3xl gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Phase 4: Live Tournament Active
          </span>
          <h2 className="text-3xl font-black text-white mt-2">The Championship Arena</h2>
          <p className="text-xs text-slate-400">Live fixtures, automated standings, and player stat tracking</p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matches'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Matches & Fixtures
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'standings'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Points Table
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Player Statistics
          </button>
        </div>
      </div>

      {/* Tab 1: Matches & Fixtures (Including Single & Two-Legged Aggregate Math) */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fixtures.map((f) => (
              <div key={f.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-extrabold text-purple-400 uppercase">{f.round}</span>
                  {f.isTwoLegged && (
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-black">
                      Two-Legged Tie
                    </span>
                  )}
                </div>

                {/* Matches inside Fixture */}
                <div className="space-y-3">
                  {f.matches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex-1 text-right pr-4 font-bold text-white text-sm">
                        {m.homeTeam.name}
                      </div>

                      <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-center min-w-[70px]">
                        <span className="text-lg font-black text-emerald-400">
                          {m.homeScore} - {m.awayScore}
                        </span>
                        {m.isLive && (
                          <span className="block text-[9px] font-extrabold text-rose-400 animate-pulse">
                            ● LIVE
                          </span>
                        )}
                      </div>

                      <div className="flex-1 text-left pl-4 font-bold text-white text-sm">
                        {m.awayTeam.name}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two-Legged Aggregate Summary */}
                {f.isTwoLegged && f.aggregateResult && (
                  <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-center text-xs font-bold text-purple-200">
                    Aggregate Result: Team A ({f.aggregateResult.teamA.totalGoals}) - (
                    {f.aggregateResult.teamB.totalGoals}) Team B
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Automated Points Table */}
      {activeTab === 'standings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Automated Standings Table (W=3, D=1, L=0)</span>
            </h3>
            <span className="text-xs text-slate-400">Tie-breakers: Points &gt; GD &gt; GF</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Pos</th>
                  <th className="py-3.5 px-6">Club / Franchise</th>
                  <th className="py-3.5 px-4 text-center">MP</th>
                  <th className="py-3.5 px-4 text-center">W</th>
                  <th className="py-3.5 px-4 text-center">D</th>
                  <th className="py-3.5 px-4 text-center">L</th>
                  <th className="py-3.5 px-4 text-center">GF</th>
                  <th className="py-3.5 px-4 text-center">GA</th>
                  <th className="py-3.5 px-4 text-center">GD</th>
                  <th className="py-3.5 px-6 text-center text-emerald-400 font-black">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {standings.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-6 font-extrabold text-white flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                        {s.team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{s.team.name}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-slate-300">{s.played}</td>
                    <td className="py-4 px-4 text-center font-bold text-emerald-400">{s.won}</td>
                    <td className="py-4 px-4 text-center font-medium text-amber-400">{s.drawn}</td>
                    <td className="py-4 px-4 text-center font-medium text-rose-400">{s.lost}</td>
                    <td className="py-4 px-4 text-center font-medium text-slate-300">{s.goalsFor}</td>
                    <td className="py-4 px-4 text-center font-medium text-slate-300">{s.goalsAgainst}</td>
                    <td className="py-4 px-4 text-center font-bold text-slate-200">{s.goalDiff}</td>
                    <td className="py-4 px-6 text-center text-base font-black text-emerald-400 bg-emerald-500/5">
                      {s.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Player Statistics & Golden Boot */}
      {activeTab === 'stats' && leaderboards && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Scorers (Golden Boot) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Top Goal Scorers</span>
            </h4>
            <div className="space-y-3">
              {leaderboards.topScorers?.map((s: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={s.player?.imageUrl} alt={s.player?.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{s.player?.name}</p>
                      <p className="text-[10px] text-slate-400">{s.player?.team?.name}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-400">{s.totalGoals} Goals</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Assists */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-blue-400" />
              <span>Playmakers (Top Assists)</span>
            </h4>
            <div className="space-y-3">
              {leaderboards.topAssists?.map((a: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={a.player?.imageUrl} alt={a.player?.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{a.player?.name}</p>
                      <p className="text-[10px] text-slate-400">{a.player?.team?.name}</p>
                    </div>
                  </div>
                  <span className="text-base font-black text-blue-400">{a.totalAssists} Assists</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clean Sheets & Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Clean Sheets (Golden Glove)</span>
            </h4>
            <div className="space-y-3">
              {leaderboards.cleanSheets?.map((c: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={c.player?.imageUrl} alt={c.player?.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{c.player?.name}</p>
                      <p className="text-[10px] text-slate-400">{c.player?.team?.name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Clean Sheet</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
