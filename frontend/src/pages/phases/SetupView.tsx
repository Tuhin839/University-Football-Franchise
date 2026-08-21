import React from 'react';
import { useSystemState } from '../../context/SystemStateContext';
import { Trophy, Shield, DollarSign, Users, Award, CheckCircle2 } from 'lucide-react';

export const SetupView: React.FC = () => {
  const { rules, tiers, raiseTiers } = useSystemState();

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8">
      {/* Hero Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-8 md:p-12 overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            Phase 1: Event Configuration Active
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            The Premier University Football Franchise League
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            The league is currently in the Setup Phase. Administrators are configuring franchise budgets, dynamic bidding tiers, and player registration guidelines.
          </p>
        </div>
      </div>

      {/* Rules & Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Franchise Budget Allowance</h3>
          <p className="text-xs text-slate-400">Fixed allowance uniformly allocated across all teams:</p>
          <div className="text-3xl font-black text-emerald-400">
            ${rules?.totalTeamBudget?.toLocaleString() || '100,000'}
          </div>
          <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
            <span>Min Roster Requirement:</span>
            <span className="font-bold text-white">{rules?.minRosterSize || 15} Players</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Player Tiers & Base Prices</h3>
          <div className="space-y-2">
            {tiers.map((tier) => (
              <div key={tier.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200">{tier.name}</span>
                <span className="font-bold text-emerald-400">${tier.basePrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Bidding Math Tiers</h3>
          <p className="text-xs text-slate-400">Dynamic raise percentages based on total budget:</p>
          <div className="space-y-2">
            {raiseTiers.map((r, i) => (
              <div key={r.id || i} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">
                  {(r.minBudgetPercent * 100).toFixed(0)}% - {(r.maxBudgetPercent * 100).toFixed(0)}%
                </span>
                <span className="font-bold text-amber-400">+{(r.raisePercentage * 100).toFixed(2)}% Raise</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
